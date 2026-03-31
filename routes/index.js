const express = require('express');
const router = express.Router();
const { Project, BlogPost, LabNote, WorkbenchItem, Settings } = require('../models');
const chatbotRoutes = require('./chatbot');

// Home page
router.get('/', async (req, res) => {
  try {
    const [featuredProjects, recentPosts, labNotes, workbenchItems, settings] = await Promise.all([
      Project.getAll({ limit: 5 }),
      BlogPost.getAll({ published: true, limit: 4 }),
      LabNote.getAll({ limit: 4 }),
      WorkbenchItem.getAll({ limit: 4 }),
      Settings.getPublicSettings()
    ]);

    res.render('index', {
      title: settings.site_title || 'Theophilus Digital Lab',
      description: settings.site_description || 'A digital laboratory exploring code, design, and experimentation.',
      featuredProjects,
      recentPosts,
      labNotes,
      workbenchItems,
      settings
    });
  } catch (error) {
    console.error('Error loading home page:', error);
    res.status(500).render('error', { error: 'Failed to load home page' });
  }
});

// Projects page
router.get('/projects', async (req, res) => {
  try {
    const { status, tag, search } = req.query;
    let projects;

    if (search) {
      projects = await Project.search(search);
    } else {
      projects = await Project.getAll({ status });
    }

    const allTags = await Project.getAllTags();
    const stats = await Project.getStats();
    const settings = await Settings.getPublicSettings();

    res.render('projects', {
      title: 'Projects - Theophilus',
      description: 'Explore open source projects, experiments, and tools.',
      projects,
      allTags,
      stats,
      settings,
      filter: { status, tag, search }
    });
  } catch (error) {
    console.error('Error loading projects page:', error);
    res.status(500).render('error', { error: 'Failed to load projects' });
  }
});

// Single project page
router.get('/projects/:slug', async (req, res) => {
  try {
    const project = await Project.getBySlug(req.params.slug);
    if (!project) {
      return res.status(404).render('error', { error: 'Project not found' });
    }

    const settings = await Settings.getPublicSettings();

    res.render('project-detail', {
      title: `${project.title} - Theophilus`,
      description: project.description,
      project,
      settings
    });
  } catch (error) {
    console.error('Error loading project:', error);
    res.status(500).render('error', { error: 'Failed to load project' });
  }
});

// Blog page
router.get('/blog', async (req, res) => {
  try {
    const { category, tag, search } = req.query;
    let posts;

    if (search) {
      posts = await BlogPost.search(search);
    } else {
      posts = await BlogPost.getAll({ category, tag, published: true });
    }

    const categories = await BlogPost.getCategories();
    const allTags = await BlogPost.getAllTags();
    const settings = await Settings.getPublicSettings();

    res.render('blog', {
      title: 'Blog - Theophilus',
      description: 'Technical articles, experiments, and insights from the digital laboratory.',
      posts,
      categories,
      allTags,
      settings,
      filter: { category, tag, search }
    });
  } catch (error) {
    console.error('Error loading blog page:', error);
    res.status(500).render('error', { error: 'Failed to load blog posts' });
  }
});

// Single blog post page
router.get('/blog/:slug', async (req, res) => {
  try {
    const post = await BlogPost.getBySlug(req.params.slug);
    if (!post || !post.published) {
      return res.status(404).render('error', { error: 'Blog post not found' });
    }

    const relatedPosts = await BlogPost.getAll({
      category: post.category_slug,
      published: true,
      limit: 3
    });

    const settings = await Settings.getPublicSettings();

    res.render('blog-post', {
      title: `${post.title} - Theophilus Blog`,
      description: post.excerpt,
      post,
      relatedPosts: relatedPosts.filter(p => p.id !== post.id),
      settings
    });
  } catch (error) {
    console.error('Error loading blog post:', error);
    res.status(500).render('error', { error: 'Failed to load blog post' });
  }
});

// Dashboard (admin) page
router.get('/dashboard', async (req, res) => {
  try {
    const [projectStats, blogStats, noteStats, workbenchStats, projects, blogPosts, labNotes, workbenchItems] = await Promise.all([
      Project.getStats(),
      BlogPost.getStats(),
      LabNote.getStats(),
      WorkbenchItem.getStats(),
      Project.getAll(),
      BlogPost.getAll(),
      LabNote.getAll(),
      WorkbenchItem.getAll()
    ]);

    const settings = await Settings.getPublicSettings();

    res.render('dashboard', {
      title: 'Dashboard - Theophilus',
      description: 'Content Management Dashboard',
      stats: {
        projects: projectStats,
        blog: blogStats,
        notes: noteStats,
        workbench: workbenchStats
      },
      projects,
      blogPosts,
      labNotes,
      workbenchItems,
      settings
    });
  } catch (error) {
    console.error('Error loading dashboard:', error);
    res.status(500).render('error', { error: 'Failed to load dashboard' });
  }
});

// API Routes

// Projects API
router.get('/api/projects', async (req, res) => {
  try {
    const { status, featured } = req.query;
    const projects = await Project.getAll({ status, featured });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/api/projects', async (req, res) => {
  try {
    const project = await Project.create(req.body);
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/api/projects/:id', async (req, res) => {
  try {
    const project = await Project.update(req.params.id, req.body);
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/api/projects/:id', async (req, res) => {
  try {
    await Project.delete(req.params.id);
    res.json({ message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Blog Posts API
router.get('/api/blog-posts', async (req, res) => {
  try {
    const { category, featured, published } = req.query;
    const posts = await BlogPost.getAll({ category, featured, published });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/api/blog-posts', async (req, res) => {
  try {
    const post = await BlogPost.create(req.body);
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/api/blog-posts/:id', async (req, res) => {
  try {
    const post = await BlogPost.update(req.params.id, req.body);
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/api/blog-posts/:id', async (req, res) => {
  try {
    await BlogPost.delete(req.params.id);
    res.json({ message: 'Blog post deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lab Notes API
router.get('/api/lab-notes', async (req, res) => {
  try {
    const notes = await LabNote.getAll();
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/api/lab-notes', async (req, res) => {
  try {
    const note = await LabNote.create(req.body);
    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/api/lab-notes/:id', async (req, res) => {
  try {
    const note = await LabNote.update(req.params.id, req.body);
    res.json(note);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/api/lab-notes/:id', async (req, res) => {
  try {
    await LabNote.delete(req.params.id);
    res.json({ message: 'Lab note deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Workbench Items API
router.get('/api/workbench-items', async (req, res) => {
  try {
    const items = await WorkbenchItem.getAll();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/api/workbench-items', async (req, res) => {
  try {
    const item = await WorkbenchItem.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/api/workbench-items/:id', async (req, res) => {
  try {
    const item = await WorkbenchItem.update(req.params.id, req.body);
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/api/workbench-items/:id', async (req, res) => {
  try {
    await WorkbenchItem.delete(req.params.id);
    res.json({ message: 'Workbench item deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Settings API
router.get('/api/settings', async (req, res) => {
  try {
    const settings = await Settings.getPublicSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/api/settings', async (req, res) => {
  try {
    const settings = await Settings.setMultiple(req.body);
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stats API
router.get('/api/stats', async (req, res) => {
  try {
    const [projectStats, blogStats, noteStats, workbenchStats] = await Promise.all([
      Project.getStats(),
      BlogPost.getStats(),
      LabNote.getStats(),
      WorkbenchItem.getStats()
    ]);

    res.json({
      projects: projectStats,
      blog: blogStats,
      notes: noteStats,
      workbench: workbenchStats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Chatbot routes
router.use('/', chatbotRoutes);

// Chatbot dashboard
router.get('/dashboard/chatbot', async (req, res) => {
  try {
    const [documentStats, chatAnalytics] = await Promise.all([
      require('../models/Document').getStats(),
      require('../models/Chat').getAnalytics(7)
    ]);

    const settings = await Settings.getPublicSettings();

    res.render('dashboard-chatbot', {
      title: 'Chatbot Management - Theophilus',
      description: 'Manage AI knowledge base and chat analytics',
      documentStats,
      chatAnalytics,
      settings
    });
  } catch (error) {
    console.error('Error loading chatbot dashboard:', error);
    res.status(500).render('error', { error: 'Failed to load chatbot dashboard' });
  }
});


module.exports = router;
