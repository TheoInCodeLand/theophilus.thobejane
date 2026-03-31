const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { Document, Chat, Settings } = require('../models');
const axios = require('axios');

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/documents');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `doc-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.txt', '.md', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, TXT, MD, DOC, DOCX files allowed'));
    }
  }
});

const CHATBOT_SERVICE_URL = process.env.CHATBOT_SERVICE_URL || 'http://localhost:8000';

// Middleware to check if chatbot is enabled
const checkEnabled = async (req, res, next) => {
  const enabled = await Settings.get('chatbot_enabled');
  if (enabled !== 'true') {
    return res.status(503).json({ error: 'Chatbot temporarily disabled' });
  }
  next();
};

// PUBLIC API: Chat streaming endpoint
router.post('/api/chat', checkEnabled, async (req, res) => {
  try {
    const { message, session_id, history = [] } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message required' });
    }

    // Get or create session
    let session;
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

    // Check if query needs project data
    const needsProjects = /project|built|portfolio|github|experience|work/i.test(message);

    // Stream from Python service
    const response = await axios.post(`${CHATBOT_SERVICE_URL}/chat`, {
      message,
      session_id: session.session_id,
      history,
      fetch_projects: needsProjects
    }, {
      responseType: 'stream'
    });

    let fullResponse = '';
    let sources = [];

    response.data.on('data', (chunk) => {
      const lines = chunk.toString().split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
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
                timestamp: new Date().toISOString()
              });
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    });

    response.data.on('end', () => {
      res.write(`data: ${JSON.stringify({ session_id: session.session_id, done: true })}\n\n`);
      res.end();
    });

    response.data.on('error', (err) => {
      console.error('Stream error:', err);
      res.write(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`);
      res.end();
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.write(`data: ${JSON.stringify({ error: 'Failed to process message' })}\n\n`);
    res.end();
  }
});

// ADMIN API: Upload document
router.post('/api/admin/documents', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { category = 'general', description = '' } = req.body;
    
    // Validate category
    const validCategories = ['resume', 'certification', 'project', 'general'];
    if (!validCategories.includes(category)) {
      await fs.unlink(req.file.path);
      return res.status(400).json({ error: 'Invalid category' });
    }

    // Save to database
    const doc = await Document.create({
      filename: req.file.filename,
      original_name: req.file.originalname,
      file_path: req.file.path,
      file_size: req.file.size,
      mime_type: req.file.mimetype,
      category,
      description,
      vector_namespace: 'portfolio-knowledge'
    });

    // Trigger indexing in Python service (async)
    setTimeout(async () => {
      try {
        await axios.post(`${CHATBOT_SERVICE_URL}/index-document`, {
          document_id: doc.id,
          file_path: doc.file_path,
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
        category: doc.category,
        index_status: doc.index_status
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
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

    // Delete file
    try {
      await fs.unlink(doc.file_path);
    } catch (e) {
      console.log('File already deleted or not found');
    }

    // Delete vectors from Pinecone
    try {
      await axios.delete(`${CHATBOT_SERVICE_URL}/delete-document/${doc.id}`);
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