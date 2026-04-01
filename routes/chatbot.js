let pythonServiceHealthy = true;
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 30000;

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const { Document, Chat, Settings } = require('../models');
const axios = require('axios');
const rateLimit = require('express-rate-limit');

const chatRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: { error: 'Too many messages. Please slow down.' },
});

async function checkPythonHealth() {
  const now = Date.now();
  if (now - lastHealthCheck < HEALTH_CHECK_INTERVAL) {
    return pythonServiceHealthy;
  }
  
  try {
    await axios.get(`${CHATBOT_SERVICE_URL}/health`, { timeout: 5000 });
    pythonServiceHealthy = true;
    lastHealthCheck = now;
    return true;
  } catch (error) {
    pythonServiceHealthy = false;
    lastHealthCheck = now;
    console.error('Python service health check failed:', error.message);
    return false;
  }
}

const checkEnabled = async (req, res, next) => {
  const enabled = await Settings.get('chatbot_enabled');
  if (enabled !== 'true') {
    return res.status(503).json({ error: 'Chatbot temporarily disabled' });
  }
  
  // Check if Python service is up
  const healthy = await checkPythonHealth();
  if (!healthy) {
    return res.status(503).json({ 
      error: 'AI service temporarily unavailable. Please try again in a moment.' 
    });
  }
  
  next();
};

const CHATBOT_SERVICE_URL = process.env.CHATBOT_SERVICE_URL || 'http://localhost:8000';

// PUBLIC API: Chat streaming endpoint
router.post('/api/chat', chatRateLimit,checkEnabled, async (req, res) => {
  let session;
  
  try {
    const { message, session_id, history = [] } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message required' });
    }

    // Get or create session
    if (session_id) {
      session = await Chat.getSession(session_id);
    }
    if (!session) {
      session = await Chat.createSession(
        req.cookies?.visitorId || null,
        req.headers['user-agent'],
        req.ip
      );
    }

    // Store user message
    await Chat.addMessage(session.session_id, 'user', message);

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Check if query needs project data
    const needsProjects = /project|built|portfolio|github|experience|work|axiora|app|what.*built|showcase/i.test(message);

    // Stream from Python service with timeout
    const response = await axios.post(`${CHATBOT_SERVICE_URL}/chat`, {
      message,
      session_id: session.session_id,
      history,
      fetch_projects: needsProjects
    }, {
      responseType: 'stream',
      timeout: 30000, // 30 second timeout
      headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache'
      }
    });

    let fullResponse = '';
    let sources = [];
    let hasReceivedData = false;

    // Handle stream with proper error boundaries
    response.data.on('data', (chunk) => {
      try {
        hasReceivedData = true;
        const lines = chunk.toString().split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;
            
            try {
              const data = JSON.parse(jsonStr);
              
              if (data.content) {
                fullResponse += data.content;
                res.write(`data: ${JSON.stringify(data)}\n\n`);
              }
              
              if (data.sources) {
                sources = data.sources;
              }
              
              if (data.done) {
                // Store complete response
                Chat.addMessage(session.session_id, 'assistant', fullResponse, {
                  sources,
                  timestamp: new Date().toISOString(),
                  metadata: data.meta || {}
                }).catch(err => console.error('Failed to store message:', err));
              }
              
              if (data.error) {
                console.error('Stream error from Python:', data.error);
                res.write(`data: ${JSON.stringify({ error: data.error })}\n\n`);
              }
            } catch (parseError) {
              // Ignore malformed JSON lines
              console.debug('Parse error for line:', jsonStr.substring(0, 100));
            }
          }
        }
      } catch (error) {
        console.error('Stream processing error:', error);
      }
    });

    response.data.on('end', () => {
      if (!hasReceivedData) {
        // No data received - Python service issue
        res.write(`data: ${JSON.stringify({ 
          error: 'No response from AI service',
          content: "I'm having trouble connecting to my knowledge base. Please try again or email me at thobejanetheo@gmail.com"
        })}\n\n`);
      }
      
      res.write(`data: ${JSON.stringify({ session_id: session.session_id, done: true })}\n\n`);
      res.end();
    });

    response.data.on('error', (err) => {
      console.error('Stream error:', err.message);
      res.write(`data: ${JSON.stringify({ 
        error: 'Stream interrupted',
        content: "Connection interrupted. Please try again."
      })}\n\n`);
      res.end();
    });

    // Handle client disconnect
    req.on('close', () => {
      console.log('Client disconnected, closing stream');
      response.data.destroy();
    });

  } catch (error) {
    console.error('Chat error:', error.message);
    
    // If headers already sent, we can't send JSON error
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ 
        error: 'Failed to process message',
        content: "Sorry, I'm having technical difficulties. Please try again or contact me directly."
      })}\n\n`);
      res.end();
      return;
    }
    
    // Send proper error response
    const status = error.response?.status || 500;
    const message = error.response?.data?.detail || error.message || 'Chat service unavailable';
    
    res.status(status).json({ 
      error: message,
      session_id: session?.session_id
    });
  }
});

// ADMIN API: Upload document
router.post('/api/admin/documents', async (req, res) => {
  try {
    const { file_url, original_name, category, description, file_size, mime_type } = req.body;
    
    if (!file_url) {
      return res.status(400).json({ error: 'file_url is required' });
    }

    // Validate category
    const validCategories = ['resume', 'certification', 'project', 'general'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    // Save to database with URL instead of local path
    const doc = await Document.create({
      filename: original_name, // Store original name
      original_name: original_name,
      file_path: file_url,     // Store Cloudinary URL here
      file_size: file_size || 0,
      mime_type: mime_type || 'application/pdf',
      category,
      description,
      vector_namespace: 'portfolio-knowledge'
    });

    // Trigger indexing in Python service (async)
    // Now passing file_url instead of file_path
    setTimeout(async () => {
      try {
        await axios.post(`${process.env.CHATBOT_SERVICE_URL || 'http://localhost:8000'}/index-document`, {
          document_id: doc.id,
          file_url: doc.file_path,  // Python will download from this URL
          category: doc.category
        });
      } catch (err) {
        console.error('Indexing error:', err);
        await Document.updateIndexStatus(doc.id, 'error');
      }
    }, 100);

    res.status(201).json({
      success: true,
      document: {
        id: doc.id,
        original_name: doc.original_name,
        file_url: doc.file_path,
        category: doc.category,
        index_status: doc.index_status
      }
    });

  } catch (error) {
    console.error('Document creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ADMIN API: Get all documents
router.get('/api/admin/documents', async (req, res) => {
  try {
    const { category, status } = req.query;
    const documents = await Document.getAll({ category, status });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ADMIN API: Delete document
router.delete('/api/admin/documents/:id', async (req, res) => {
  try {
    const doc = await Document.getById(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete from Cloudinary if it's a Cloudinary URL
    if (doc.file_path && doc.file_path.includes('cloudinary.com')) {
      try {
        // Extract public_id from URL
        // URL format: https://res.cloudinary.com/cloud_name/image/upload/v1234/folder/filename.pdf
        const urlParts = doc.file_path.split('/');
        const filenameWithExt = urlParts[urlParts.length - 1];
        const folder = urlParts[urlParts.length - 2];
        const publicId = `${folder}/${filenameWithExt.split('.')[0]}`;
        
        await req.app.locals.cloudinary.uploader.destroy(publicId);
      } catch (cloudErr) {
        console.log('Cloudinary deletion error (non-critical):', cloudErr.message);
      }
    }

    // Delete vectors from Pinecone
    try {
      await axios.delete(`${process.env.CHATBOT_SERVICE_URL || 'http://localhost:8000'}/delete-document/${doc.id}`);
    } catch (e) {
      console.log('Vector deletion error:', e.message);
    }

    // Delete from database
    await Document.delete(req.params.id);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ADMIN API: Get chat analytics
router.get('/api/admin/chat-analytics', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const [analytics, recentSessions, stats] = await Promise.all([
      Chat.getAnalytics(days),
      Chat.getRecentSessions(20),
      Document.getStats()
    ]);

    res.json({
      analytics,
      recent_sessions: recentSessions,
      document_stats: stats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ADMIN API: Get chat settings
router.get('/api/admin/chat-settings', async (req, res) => {
  try {
    const settings = await Settings.getAll();
    const chatSettings = {
      enabled: settings.chatbot_enabled === 'true',
      welcome_message: settings.chatbot_welcome_message,
      model: settings.chatbot_model,
      temperature: parseFloat(settings.chatbot_temperature),
      max_tokens: parseInt(settings.chatbot_max_tokens)
    };
    res.json(chatSettings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ADMIN API: Update chat settings
router.put('/api/admin/chat-settings', async (req, res) => {
  try {
    const updates = {};
    if (req.body.enabled !== undefined) updates.chatbot_enabled = String(req.body.enabled);
    if (req.body.welcome_message) updates.chatbot_welcome_message = req.body.welcome_message;
    if (req.body.model) updates.chatbot_model = req.body.model;
    if (req.body.temperature !== undefined) updates.chatbot_temperature = String(req.body.temperature);
    if (req.body.max_tokens !== undefined) updates.chatbot_max_tokens = String(req.body.max_tokens);

    await Settings.setMultiple(updates);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/api/admin/upload-signature', async (req, res) => {
  try {
    const timestamp = Math.round((new Date).getTime() / 1000);
    
    // Generate signature for unsigned upload preset or specific folder
    const signature = req.app.locals.cloudinary.utils.api_sign_request({
      timestamp: timestamp,
      folder: 'portfolio-knowledge',
      resource_type: 'auto'
    }, process.env.CLOUDINARY_API_SECRET);

    res.json({
      signature,
      timestamp,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      folder: 'portfolio-knowledge'
    });
  } catch (error) {
    console.error('Signature generation error:', error);
    res.status(500).json({ error: 'Failed to generate upload signature' });
  }
});

// Simple non-streaming chat for testing
router.post('/api/chat-simple', checkEnabled, async (req, res) => {
  try {
    const { message } = req.body;
    
    const response = await axios.post(`${CHATBOT_SERVICE_URL}/chat`, {
      message,
      session_id: 'test-session',
      history: [],
      fetch_projects: true
    }, {
      timeout: 30000,
      responseType: 'json' // Note: your Python returns SSE, so this won't work directly
    });
    
    // Actually, better to just proxy or use a different approach
    res.json({ status: 'Use the streaming endpoint /api/chat' });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUBLIC API: Get chatbot config (for frontend)
router.get('/api/chat-config', async (req, res) => {
  try {
    const enabled = await Settings.get('chatbot_enabled');
    const welcomeMessage = await Settings.get('chatbot_welcome_message');
    
    res.json({
      enabled: enabled === 'true',
      welcome_message: welcomeMessage || 'Hi! Ask me anything about Theophilus.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;