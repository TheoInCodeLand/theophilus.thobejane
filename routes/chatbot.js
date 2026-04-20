/**
 * Chatbot Routes - Now using local Node.js service
 * No more Python service proxy - everything runs in Node.js
 */

const express = require('express');
const router = express.Router();
const { Document, Chat, Settings } = require('../models');
const axios = require('axios');
const rateLimit = require('express-rate-limit');

// Import the local chatbot service
const chatbotService = require('../services/chatbot');

// Rate limiting
const chatRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: { error: 'Too many messages. Please slow down.' },
});

// Check if chatbot is enabled
const checkEnabled = async (req, res, next) => {
  try {
    const enabled = await Settings.get('chatbot_enabled');
    if (enabled !== 'true') {
      return res.status(503).json({ error: 'Chatbot temporarily disabled' });
    }
    next();
  } catch (error) {
    console.error('Settings check error:', error);
    next(); // Continue anyway if settings fail
  }
};

// PUBLIC API: Chat streaming endpoint
router.post('/api/chat', chatRateLimit, checkEnabled, async (req, res) => {
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
    res.setHeader('X-Accel-Buffering', 'no');

    // Check if query needs project data
    const needsProjects = /project|built|portfolio|github|experience|work|axiora|app|what.*built|showcase/i.test(message);

    // Stream from local service
    let fullResponse = '';
    let sources = [];

    const stream = chatbotService.streamChat(message, history, needsProjects);

    for await (const data of stream) {
      if (data.content) {
        fullResponse += data.content;
        res.write(`data: ${JSON.stringify({ content: data.content })}\n\n`);
      }
      if (data.sources) {
        sources = data.sources;
      }
      if (data.done) {
        // Store complete response
        await Chat.addMessage(session.session_id, 'assistant', fullResponse, {
          sources,
          timestamp: new Date().toISOString(),
          metadata: data.meta || {}
        });

        res.write(`data: ${JSON.stringify({
          session_id: session.session_id,
          done: true,
          sources,
          meta: data.meta
        })}\n\n`);
      }
      if (data.error) {
        res.write(`data: ${JSON.stringify({ error: data.error })}\n\n`);
      }
    }

    res.end();

  } catch (error) {
    console.error('Chat error:', error.message);

    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({
        error: 'Failed to process message',
        content: "Sorry, I'm having technical difficulties. Please try again or contact me directly."
      })}\n\n`);
      res.end();
      return;
    }

    res.status(500).json({
      error: error.message || 'Chat service unavailable',
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

    // Save to database
    const doc = await Document.create({
      filename: original_name,
      original_name: original_name,
      file_path: file_url,
      file_size: file_size || 0,
      mime_type: mime_type || 'application/pdf',
      category,
      description,
      vector_namespace: 'portfolio-knowledge'
    });

    // Trigger indexing asynchronously
    setTimeout(async () => {
      try {
        await chatbotService.indexDocument(doc.id, doc.file_path, doc.category);
        await Document.updateIndexStatus(doc.id, 'indexed');
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
        index_status: 'pending'
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
      await chatbotService.deleteDocumentVectors(doc.id);
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

// ADMIN API: Get Cloudinary upload signature
router.get('/api/admin/upload-signature', async (req, res) => {
  console.log('DEBUG ENV:', {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'EXISTS' : 'MISSING',
    api_key: process.env.CLOUDINARY_API_KEY ? 'EXISTS' : 'MISSING',
    node_env: process.env.NODE_ENV ? 'EXISTS' : 'MISSING'
  });
  try {
    const timestamp = Math.round((new Date).getTime() / 1000);

    const signature = req.app.locals.cloudinary.utils.api_sign_request({
      timestamp: timestamp,
      folder: 'portfolio-knowledge'
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

// Health check endpoint
router.get('/api/health', async (req, res) => {
  try {
    const status = await chatbotService.healthCheck();
    res.json(status);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

module.exports = router;
