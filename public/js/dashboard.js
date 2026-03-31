/**
 * Theophilus Dashboard - Full CRUD Functionality
 */

// Global state
let currentSection = 'dashboard';
let editingId = null;
let editingType = null;

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initMobileMenu();
  initDarkMode();
  initProjectForm();
  initBlogPostForm();
  initLabNoteForm();
  initWorkbenchForm();
  initSettingsForm();
  initImportExport();
});

// ============================================
// NAVIGATION
// ============================================
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const section = item.dataset.section;

      // Update nav active state
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');

      // Update page title
      const titles = {
        dashboard: 'Dashboard',
        blog: 'Blog Posts',
        projects: 'Projects',
        notes: 'Lab Notes',
        workbench: 'Workbench',
        settings: 'Settings',
        export: 'Import / Export'
      };
      document.getElementById('pageTitle').textContent = titles[section] || section;

      // Show section content
      document.querySelectorAll('.section-content').forEach(content => {
        content.classList.toggle('active', content.id === `section-${section}`);
      });

      // Load section data
      if (section === 'projects') loadProjectsTable();
      if (section === 'blog') loadBlogPostsTable();
      if (section === 'notes') loadLabNotesTable();
      if (section === 'workbench') loadWorkbenchTable();
      if (section === 'settings') loadSettings();

      currentSection = section;

      // Close mobile menu
      document.getElementById('sidebar')?.classList.remove('open');
    });
  });
}

function initMobileMenu() {
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
      document.getElementById('sidebar')?.classList.toggle('open');
    });
  }
}

function initDarkMode() {
  const darkModeToggle = document.getElementById('darkModeToggle');
  if (darkModeToggle) {
    // Check saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    }

    darkModeToggle.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================
// PROJECTS CRUD
// ============================================
async function loadProjectsTable() {
  try {
    const response = await fetch('/api/projects');
    const projects = await response.json();

    const tbody = document.getElementById('projectsTableBody');
    if (!tbody) return;

    tbody.innerHTML = projects.map(project => `
      <tr>
        <td>
          <div class="table-title">${escapeHtml(project.title)}</div>
          <div class="table-subtitle">${escapeHtml(project.description?.substring(0, 60) || '')}...</div>
        </td>
        <td>
          <span class="badge badge-${project.status === 'shipped' ? 'shipped' : project.status === 'in-progress' ? 'progress' : 'archived'}">
            <span class="badge-dot"></span>
            ${project.status}
          </span>
        </td>
        <td>${project.year}</td>
        <td>${project.stars}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-ghost" onclick="editProject(${project.id})" title="Edit" style="color: #ffbf00;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn btn-ghost" onclick="deleteProject(${project.id})" title="Delete" style="color: #ff0000;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Failed to load projects:', error);
    showToast('Failed to load projects', 'error');
  }
}

function initProjectForm() {
  const form = document.getElementById('projectForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
      title: document.getElementById('projectTitle').value,
      slug: document.getElementById('projectSlug').value,
      description: document.getElementById('projectDescription').value,
      long_description: document.getElementById('projectLongDescription').value,
      status: document.getElementById('projectStatus').value,
      year: parseInt(document.getElementById('projectYear').value),
      featured: document.getElementById('projectFeatured').checked,
      highlight: document.getElementById('projectHighlight').checked,
      github_url: document.getElementById('projectGithub').value,
      live_url: document.getElementById('projectLive').value,
      stars: parseInt(document.getElementById('projectStars').value) || 0,
      forks: parseInt(document.getElementById('projectForks').value) || 0,
      tags: document.getElementById('projectTags').value.split(',').map(t => t.trim()).filter(t => t)
    };

    try {
      const url = editingId ? `/api/projects/${editingId}` : '/api/projects';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        showToast(editingId ? 'Project updated!' : 'Project created!', 'success');
        closeModal('projectModal');
        loadProjectsTable();
        editingId = null;
        form.reset();
      } else {
        throw new Error('Failed to save project');
      }
    } catch (error) {
      showToast(error.message, 'error');
    }
  });

  // Auto-generate slug from title
  const titleInput = document.getElementById('projectTitle');
  const slugInput = document.getElementById('projectSlug');
  if (titleInput && slugInput) {
    titleInput.addEventListener('blur', () => {
      if (!slugInput.value && titleInput.value) {
        slugInput.value = titleInput.value.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
      }
    });
  }
}

function openProjectModal(project = null) {
  editingId = project?.id || null;
  const title = document.getElementById('projectModalTitle');

  title.textContent = project ? 'Edit Project' : 'Add New Project';

  if (project) {
    document.getElementById('projectTitle').value = project.title || '';
    document.getElementById('projectSlug').value = project.slug || '';
    document.getElementById('projectDescription').value = project.description || '';
    document.getElementById('projectLongDescription').value = project.long_description || '';
    document.getElementById('projectStatus').value = project.status || 'in-progress';
    document.getElementById('projectYear').value = project.year || new Date().getFullYear();
    document.getElementById('projectFeatured').checked = project.featured || false;
    document.getElementById('projectHighlight').checked = project.highlight || false;
    document.getElementById('projectGithub').value = project.github_url || '';
    document.getElementById('projectLive').value = project.live_url || '';
    document.getElementById('projectStars').value = project.stars || 0;
    document.getElementById('projectForks').value = project.forks || 0;
    document.getElementById('projectTags').value = (project.tags || []).join(', ');
  } else {
    document.getElementById('projectForm').reset();
    document.getElementById('projectYear').value = new Date().getFullYear();
  }

  openModal('projectModal');
}

async function editProject(id) {
  try {
    const response = await fetch('/api/projects');
    const projects = await response.json();
    const project = projects.find(p => p.id === parseInt(id));
    if (project) {
      openProjectModal(project);
    }
  } catch (error) {
    showToast('Failed to load project', 'error');
  }
}

async function deleteProject(id) {
  if (!confirm('Are you sure you want to delete this project?')) return;

  try {
    const response = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    if (response.ok) {
      showToast('Project deleted!', 'success');
      loadProjectsTable();
    } else {
      throw new Error('Failed to delete');
    }
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// ============================================
// BLOG POSTS CRUD
// ============================================
async function loadBlogPostsTable() {
  try {
    const response = await fetch('/api/blog-posts');
    const posts = await response.json();

    const tbody = document.getElementById('blogTableBody');
    if (!tbody) return;

    tbody.innerHTML = posts.map(post => `
      <tr>
        <td>
          <div class="table-title">${escapeHtml(post.title)}</div>
          <div class="table-subtitle">${escapeHtml(post.excerpt?.substring(0, 60) || '')}...</div>
        </td>
        <td>${post.category_name || 'General'}</td>
        <td>
          <span class="badge ${post.published ? 'badge-shipped' : 'badge-progress'}">
            <span class="badge-dot"></span>
            ${post.published ? 'Published' : 'Draft'}
          </span>
        </td>
        <td>${new Date(post.published_at || post.created_at).toLocaleDateString()}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-ghost" onclick="editBlogPost(${post.id})" title="Edit">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn btn-ghost" onclick="deleteBlogPost(${post.id})" title="Delete" style="color: #ef4444;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Failed to load blog posts:', error);
    showToast('Failed to load blog posts', 'error');
  }
}

function initBlogPostForm() {
  const form = document.getElementById('blogPostForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
      title: document.getElementById('blogTitle').value,
      slug: document.getElementById('blogSlug').value,
      excerpt: document.getElementById('blogExcerpt').value,
      content: document.getElementById('blogContent').value,
      category_id: document.getElementById('blogCategory').value || null,
      tags: document.getElementById('blogTags').value.split(',').map(t => t.trim()).filter(t => t),
      featured: document.getElementById('blogFeatured').checked,
      author_name: document.getElementById('blogAuthor').value,
      author_role: document.getElementById('blogAuthorRole').value,
      read_time: document.getElementById('blogReadTime').value,
      published: document.getElementById('blogPublished').checked,
      published_at: document.getElementById('blogPublished').checked ? new Date().toISOString() : null
    };

    try {
      const url = editingId ? `/api/blog-posts/${editingId}` : '/api/blog-posts';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        showToast(editingId ? 'Blog post updated!' : 'Blog post created!', 'success');
        closeModal('blogPostModal');
        loadBlogPostsTable();
        editingId = null;
        form.reset();
      } else {
        throw new Error('Failed to save blog post');
      }
    } catch (error) {
      showToast(error.message, 'error');
    }
  });

  // Auto-generate slug from title
  const titleInput = document.getElementById('blogTitle');
  const slugInput = document.getElementById('blogSlug');
  if (titleInput && slugInput) {
    titleInput.addEventListener('blur', () => {
      if (!slugInput.value && titleInput.value) {
        slugInput.value = titleInput.value.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
      }
    });
  }
}

function openBlogPostModal(post = null) {
  editingId = post?.id || null;
  const title = document.getElementById('blogPostModalTitle');

  title.textContent = post ? 'Edit Blog Post' : 'Add New Blog Post';

  if (post) {
    document.getElementById('blogTitle').value = post.title || '';
    document.getElementById('blogSlug').value = post.slug || '';
    document.getElementById('blogExcerpt').value = post.excerpt || '';
    document.getElementById('blogContent').value = post.content || '';
    document.getElementById('blogCategory').value = post.category_id || '';
    document.getElementById('blogTags').value = (post.tags || []).join(', ');
    document.getElementById('blogFeatured').checked = post.featured || false;
    document.getElementById('blogAuthor').value = post.author_name || 'Theophilus';
    document.getElementById('blogAuthorRole').value = post.author_role || 'Software Engineer';
    document.getElementById('blogReadTime').value = post.read_time || '5 min read';
    document.getElementById('blogPublished').checked = post.published || false;
  } else {
    document.getElementById('blogPostForm').reset();
    document.getElementById('blogAuthor').value = 'Theophilus';
    document.getElementById('blogAuthorRole').value = 'Software Engineer';
    document.getElementById('blogReadTime').value = '5 min read';
  }

  openModal('blogPostModal');
}

async function editBlogPost(id) {
  try {
    const response = await fetch('/api/blog-posts');
    const posts = await response.json();
    const post = posts.find(p => p.id === parseInt(id));
    if (post) {
      openBlogPostModal(post);
    }
  } catch (error) {
    showToast('Failed to load blog post', 'error');
  }
}

async function deleteBlogPost(id) {
  if (!confirm('Are you sure you want to delete this blog post?')) return;

  try {
    const response = await fetch(`/api/blog-posts/${id}`, { method: 'DELETE' });
    if (response.ok) {
      showToast('Blog post deleted!', 'success');
      loadBlogPostsTable();
    } else {
      throw new Error('Failed to delete');
    }
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// ============================================
// LAB NOTES CRUD
// ============================================
async function loadLabNotesTable() {
  try {
    const response = await fetch('/api/lab-notes');
    const notes = await response.json();

    const tbody = document.getElementById('labNotesTableBody');
    if (!tbody) return;

    tbody.innerHTML = notes.map(note => `
      <tr>
        <td>
          <div class="table-title">${escapeHtml(note.title)}</div>
          <div class="table-subtitle">${escapeHtml(note.description?.substring(0, 60) || '')}...</div>
        </td>
        <td><span class="tag">${note.icon}</span></td>
        <td>${new Date(note.created_at).toLocaleDateString()}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-ghost" onclick="editLabNote(${note.id})" title="Edit">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn btn-ghost" onclick="deleteLabNote(${note.id})" title="Delete" style="color: #ef4444;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Failed to load lab notes:', error);
    showToast('Failed to load lab notes', 'error');
  }
}

function initLabNoteForm() {
  const form = document.getElementById('labNoteForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
      title: document.getElementById('labNoteTitle').value,
      description: document.getElementById('labNoteDescription').value,
      content: document.getElementById('labNoteContent').value,
      link: document.getElementById('labNoteLink').value,
      icon: document.getElementById('labNoteIcon').value
    };

    try {
      const url = editingId ? `/api/lab-notes/${editingId}` : '/api/lab-notes';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        showToast(editingId ? 'Lab note updated!' : 'Lab note created!', 'success');
        closeModal('labNoteModal');
        loadLabNotesTable();
        editingId = null;
        form.reset();
      } else {
        throw new Error('Failed to save lab note');
      }
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
}

function openLabNoteModal(note = null) {
  editingId = note?.id || null;
  const title = document.getElementById('labNoteModalTitle');

  title.textContent = note ? 'Edit Lab Note' : 'Add New Lab Note';

  if (note) {
    document.getElementById('labNoteTitle').value = note.title || '';
    document.getElementById('labNoteDescription').value = note.description || '';
    document.getElementById('labNoteContent').value = note.content || '';
    document.getElementById('labNoteLink').value = note.link || '';
    document.getElementById('labNoteIcon').value = note.icon || 'code';
  } else {
    document.getElementById('labNoteForm').reset();
    document.getElementById('labNoteIcon').value = 'code';
  }

  openModal('labNoteModal');
}

async function editLabNote(id) {
  try {
    const response = await fetch('/api/lab-notes');
    const notes = await response.json();
    const note = notes.find(n => n.id === parseInt(id));
    if (note) {
      openLabNoteModal(note);
    }
  } catch (error) {
    showToast('Failed to load lab note', 'error');
  }
}

async function deleteLabNote(id) {
  if (!confirm('Are you sure you want to delete this lab note?')) return;

  try {
    const response = await fetch(`/api/lab-notes/${id}`, { method: 'DELETE' });
    if (response.ok) {
      showToast('Lab note deleted!', 'success');
      loadLabNotesTable();
    } else {
      throw new Error('Failed to delete');
    }
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// ============================================
// WORKBENCH CRUD
// ============================================
async function loadWorkbenchTable() {
  try {
    const response = await fetch('/api/workbench-items');
    const items = await response.json();

    const tbody = document.getElementById('workbenchTableBody');
    if (!tbody) return;

    tbody.innerHTML = items.map(item => `
      <tr>
        <td>
          <div class="table-title">${escapeHtml(item.title)}</div>
          <div class="table-subtitle">${escapeHtml(item.description?.substring(0, 60) || '')}...</div>
        </td>
        <td>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <div style="flex: 1; height: 4px; background: var(--border); border-radius: 2px; overflow: hidden;">
              <div style="width: ${item.progress}%; height: 100%; background: var(--primary); border-radius: 2px;"></div>
            </div>
            <span style="font-size: 0.75rem; color: var(--muted-foreground);">${item.progress}%</span>
          </div>
        </td>
        <td>
          <span class="badge badge-${item.status === 'active' ? 'shipped' : item.status === 'paused' ? 'progress' : 'archived'}">
            <span class="badge-dot"></span>
            ${item.status}
          </span>
        </td>
        <td>
          <span class="tag">${item.priority}</span>
        </td>
        <td>
          <div class="table-actions">
            <button class="btn btn-ghost" onclick="editWorkbenchItem(${item.id})" title="Edit">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn btn-ghost" onclick="deleteWorkbenchItem(${item.id})" title="Delete" style="color: #ef4444;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Failed to load workbench items:', error);
    showToast('Failed to load workbench items', 'error');
  }
}

function initWorkbenchForm() {
  const form = document.getElementById('workbenchForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
      title: document.getElementById('workbenchTitle').value,
      description: document.getElementById('workbenchDescription').value,
      progress: parseInt(document.getElementById('workbenchProgress').value) || 0,
      status: document.getElementById('workbenchStatus').value,
      priority: document.getElementById('workbenchPriority').value
    };

    try {
      const url = editingId ? `/api/workbench-items/${editingId}` : '/api/workbench-items';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        showToast(editingId ? 'Workbench item updated!' : 'Workbench item created!', 'success');
        closeModal('workbenchModal');
        loadWorkbenchTable();
        editingId = null;
        form.reset();
      } else {
        throw new Error('Failed to save workbench item');
      }
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
}

function openWorkbenchModal(item = null) {
  editingId = item?.id || null;
  const title = document.getElementById('workbenchModalTitle');

  title.textContent = item ? 'Edit Workbench Item' : 'Add New Workbench Item';

  if (item) {
    document.getElementById('workbenchTitle').value = item.title || '';
    document.getElementById('workbenchDescription').value = item.description || '';
    document.getElementById('workbenchProgress').value = item.progress || 0;
    document.getElementById('workbenchStatus').value = item.status || 'active';
    document.getElementById('workbenchPriority').value = item.priority || 'medium';
  } else {
    document.getElementById('workbenchForm').reset();
    document.getElementById('workbenchProgress').value = 0;
    document.getElementById('workbenchStatus').value = 'active';
    document.getElementById('workbenchPriority').value = 'medium';
  }

  openModal('workbenchModal');
}

async function editWorkbenchItem(id) {
  try {
    const response = await fetch('/api/workbench-items');
    const items = await response.json();
    const item = items.find(i => i.id === parseInt(id));
    if (item) {
      openWorkbenchModal(item);
    }
  } catch (error) {
    showToast('Failed to load workbench item', 'error');
  }
}

async function deleteWorkbenchItem(id) {
  if (!confirm('Are you sure you want to delete this workbench item?')) return;

  try {
    const response = await fetch(`/api/workbench-items/${id}`, { method: 'DELETE' });
    if (response.ok) {
      showToast('Workbench item deleted!', 'success');
      loadWorkbenchTable();
    } else {
      throw new Error('Failed to delete');
    }
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// ============================================
// SETTINGS
// ============================================
async function loadSettings() {
  try {
    const response = await fetch('/api/settings');
    const settings = await response.json();

    document.getElementById('settingSiteTitle').value = settings.site_title || '';
    document.getElementById('settingSiteDescription').value = settings.site_description || '';
    document.getElementById('settingAuthorName').value = settings.author_name || '';
    document.getElementById('settingAuthorRole').value = settings.author_role || '';
    document.getElementById('settingGithub').value = settings.github_url || '';
    document.getElementById('settingTwitter').value = settings.twitter_url || '';
    document.getElementById('settingLinkedin').value = settings.linkedin_url || '';
    document.getElementById('settingEmail').value = settings.contact_email || '';
  } catch (error) {
    console.error('Failed to load settings:', error);
    showToast('Failed to load settings', 'error');
  }
}

function initSettingsForm() {
  const form = document.getElementById('settingsForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const settings = {
      site_title: document.getElementById('settingSiteTitle').value,
      site_description: document.getElementById('settingSiteDescription').value,
      author_name: document.getElementById('settingAuthorName').value,
      author_role: document.getElementById('settingAuthorRole').value,
      github_url: document.getElementById('settingGithub').value,
      twitter_url: document.getElementById('settingTwitter').value,
      linkedin_url: document.getElementById('settingLinkedin').value,
      contact_email: document.getElementById('settingEmail').value
    };

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        showToast('Settings saved!', 'success');
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
}

// ============================================
// IMPORT/EXPORT
// ============================================
function initImportExport() {
  const exportBtn = document.getElementById('exportDataBtn');
  const importBtn = document.getElementById('importDataBtn');
  const importFile = document.getElementById('importFile');

  if (exportBtn) {
    exportBtn.addEventListener('click', exportData);
  }

  if (importBtn && importFile) {
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', importData);
  }
}

async function exportData() {
  try {
    const [projects, blogPosts, labNotes, workbenchItems, settings] = await Promise.all([
      fetch('/api/projects').then(r => r.json()),
      fetch('/api/blog-posts').then(r => r.json()),
      fetch('/api/lab-notes').then(r => r.json()),
      fetch('/api/workbench-items').then(r => r.json()),
      fetch('/api/settings').then(r => r.json())
    ]);

    const data = {
      exported_at: new Date().toISOString(),
      projects,
      blog_posts: blogPosts,
      lab_notes: labNotes,
      workbench_items: workbenchItems,
      settings
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Theophilus-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Data exported successfully!', 'success');
  } catch (error) {
    showToast('Failed to export data', 'error');
  }
}

async function importData(e) {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);

    if (!confirm(`This will import ${data.projects?.length || 0} projects, ${data.blog_posts?.length || 0} blog posts, ${data.lab_notes?.length || 0} lab notes, and ${data.workbench_items?.length || 0} workbench items. Continue?`)) {
      return;
    }

    // Import projects
    if (data.projects) {
      for (const project of data.projects) {
        await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(project)
        });
      }
    }

    // Import blog posts
    if (data.blog_posts) {
      for (const post of data.blog_posts) {
        await fetch('/api/blog-posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(post)
        });
      }
    }

    // Import lab notes
    if (data.lab_notes) {
      for (const note of data.lab_notes) {
        await fetch('/api/lab-notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(note)
        });
      }
    }

    // Import workbench items
    if (data.workbench_items) {
      for (const item of data.workbench_items) {
        await fetch('/api/workbench-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });
      }
    }

    showToast('Data imported successfully!', 'success');

    // Reload current section
    if (currentSection === 'projects') loadProjectsTable();
    if (currentSection === 'blog') loadBlogPostsTable();
    if (currentSection === 'notes') loadLabNotesTable();
    if (currentSection === 'workbench') loadWorkbenchTable();
  } catch (error) {
    showToast('Failed to import data: ' + error.message, 'error');
  }

  e.target.value = '';
}

// ============================================
// MODAL UTILITIES
// ============================================
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
    document.body.style.overflow = '';
  }
});

// Close modal on escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.active').forEach(modal => {
      modal.classList.remove('active');
    });
    document.body.style.overflow = '';
  }
});

// ============================================
// TOAST NOTIFICATIONS
// ============================================
function showToast(message, type = 'success') {
  const container = document.querySelector('.toast-container') || createToastContainer();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      ${type === 'success'
        ? '<path d="M20 6L9 17l-5-5"/>'
        : type === 'error'
        ? '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>'
        : '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'
      }
    </svg>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.className = 'toast-container';
  container.style.cssText = `
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  `;
  document.body.appendChild(container);
  return container;
}