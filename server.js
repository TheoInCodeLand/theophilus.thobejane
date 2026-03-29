const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const methodOverride = require('method-override');
require('dotenv').config();

const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Global middleware for settings
app.use(async (req, res, next) => {
  try {
    const Settings = require('./models/Settings');
    const settings = await Settings.getPublicSettings();
    res.locals.settings = settings;
    res.locals.currentPath = req.path;
    next();
  } catch (error) {
    res.locals.settings = {};
    res.locals.currentPath = req.path;
    next();
  }
});

// Routes
app.use('/', routes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', { error: 'Page not found' });
});

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});

module.exports = app;
