/**
 * Theophilus - Main JavaScript
 * Interactive functionality for the portfolio website
 */

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  initCursorEffects();
  initMobileMenu();
  initHeaderScroll();
  initScrollAnimations();
  initThemeToggle();
  initProjectFilters();
  initSearch();
  initTerminalTyping();
  initNewsletter();
  initSmoothScroll();
  initTypingAnimation();
});
// ============================================
// THEME SYSTEM - Color Themes + Dark/Light Mode
// ============================================

const themes = {
  golden: {
    light: {
      primary: "oklch(0.75 0.15 80)",
      accent: "oklch(0.75 0.15 80)",
      ring: "oklch(0.75 0.15 80)",
      "glow-color": "oklch(0.75 0.15 80 / 0.15)",
      "glow-color-strong": "oklch(0.75 0.15 80 / 0.25)"
    },
    dark: {
      primary: "oklch(0.78 0.14 85)",
      accent: "oklch(0.78 0.14 85)",
      ring: "oklch(0.78 0.14 85)",
      "glow-color": "oklch(0.78 0.14 85 / 0.12)",
      "glow-color-strong": "oklch(0.78 0.14 85 / 0.22)"
    }
  },
  cyan: {
    light: {
      primary: "oklch(0.72 0.15 195)",
      accent: "oklch(0.72 0.15 195)",
      ring: "oklch(0.72 0.15 195)",
      "glow-color": "oklch(0.72 0.15 195 / 0.15)",
      "glow-color-strong": "oklch(0.72 0.15 195 / 0.25)"
    },
    dark: {
      primary: "oklch(0.75 0.14 200)",
      accent: "oklch(0.75 0.14 200)",
      ring: "oklch(0.75 0.14 200)",
      "glow-color": "oklch(0.75 0.14 200 / 0.12)",
      "glow-color-strong": "oklch(0.75 0.14 200 / 0.22)"
    }
  },
  purple: {
    light: {
      primary: "oklch(0.65 0.22 290)",
      accent: "oklch(0.65 0.22 290)",
      ring: "oklch(0.65 0.22 290)",
      "glow-color": "oklch(0.65 0.22 290 / 0.15)",
      "glow-color-strong": "oklch(0.65 0.22 290 / 0.25)"
    },
    dark: {
      primary: "oklch(0.70 0.20 295)",
      accent: "oklch(0.70 0.20 295)",
      ring: "oklch(0.70 0.20 295)",
      "glow-color": "oklch(0.70 0.20 295 / 0.12)",
      "glow-color-strong": "oklch(0.70 0.20 295 / 0.22)"
    }
  },
  emerald: {
    light: {
      primary: "oklch(0.68 0.17 160)",
      accent: "oklch(0.68 0.17 160)",
      ring: "oklch(0.68 0.17 160)",
      "glow-color": "oklch(0.68 0.17 160 / 0.15)",
      "glow-color-strong": "oklch(0.68 0.17 160 / 0.25)"
    },
    dark: {
      primary: "oklch(0.72 0.16 165)",
      accent: "oklch(0.72 0.16 165)",
      ring: "oklch(0.72 0.16 165)",
      "glow-color": "oklch(0.72 0.16 165 / 0.12)",
      "glow-color-strong": "oklch(0.72 0.16 165 / 0.22)"
    }
  },
  rose: {
    light: {
      primary: "oklch(0.65 0.20 15)",
      accent: "oklch(0.65 0.20 15)",
      ring: "oklch(0.65 0.20 15)",
      "glow-color": "oklch(0.65 0.20 15 / 0.15)",
      "glow-color-strong": "oklch(0.65 0.20 15 / 0.25)"
    },
    dark: {
      primary: "oklch(0.70 0.18 20)",
      accent: "oklch(0.70 0.18 20)",
      ring: "oklch(0.70 0.18 20)",
      "glow-color": "oklch(0.70 0.18 20 / 0.12)",
      "glow-color-strong": "oklch(0.70 0.18 20 / 0.22)"
    }
  }
};

function initThemeToggle() {
  const darkModeToggle = document.getElementById('darkModeToggle');
  const themePickerBtn = document.getElementById('themePickerBtn');
  const themeDropdown = document.getElementById('themeDropdown');
  const themeDropdownBackdrop = document.getElementById('themeDropdownBackdrop');
  
  // Initialize state
  let currentColorTheme = localStorage.getItem('color-theme') || 'emerald';
  let isDarkMode = localStorage.getItem('theme-mode') === 'dark' || 
                   (!localStorage.getItem('theme-mode') && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Apply initial theme
  if (isDarkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  applyColorTheme(currentColorTheme);
  updateThemeIcons(isDarkMode);

  // Dark/Light toggle
  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
      isDarkMode = !isDarkMode;
      document.documentElement.classList.toggle('dark', isDarkMode);
      localStorage.setItem('theme-mode', isDarkMode ? 'dark' : 'light');
      updateThemeIcons(isDarkMode);
      applyColorTheme(currentColorTheme);
    });
  }

  // Color theme picker toggle
  if (themePickerBtn && themeDropdown) {
    themePickerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      themeDropdown.classList.toggle('open');
      if (themeDropdownBackdrop) themeDropdownBackdrop.classList.toggle('open');
    });

    // Close dropdown when clicking outside
    if (themeDropdownBackdrop) {
      themeDropdownBackdrop.addEventListener('click', () => {
        themeDropdown.classList.remove('open');
        themeDropdownBackdrop.classList.remove('open');
      });
    }

    // Theme option selection
    document.querySelectorAll('.theme-option').forEach(option => {
      option.addEventListener('click', () => {
        const themeName = option.dataset.theme;
        currentColorTheme = themeName;
        localStorage.setItem('color-theme', themeName);
        applyColorTheme(themeName);
        
        // Update active state in dropdown
        document.querySelectorAll('.theme-option').forEach(opt => opt.classList.remove('active'));
        option.classList.add('active');
        
        // Close dropdown
        themeDropdown.classList.remove('open');
        if (themeDropdownBackdrop) themeDropdownBackdrop.classList.remove('open');
      });
    });
  }
}

function applyColorTheme(themeName) {
  const isDark = document.documentElement.classList.contains('dark');
  const mode = isDark ? 'dark' : 'light';
  const colors = themes[themeName][mode];

  Object.entries(colors).forEach(([key, value]) => {
    document.documentElement.style.setProperty(`--${key}`, value);
  });
}

function updateThemeIcons(isDark) {
  const sunIcon = document.querySelector('.sun-icon');
  const moonIcon = document.querySelector('.moon-icon');
  
  if (sunIcon && moonIcon) {
    sunIcon.style.display = isDark ? 'none' : 'block';
    moonIcon.style.display = isDark ? 'block' : 'none';
  }
}
// ============================================
// TYPING ANIMATION
// ============================================
function initTypingAnimation() {
  const roles = ["solutions that ship", "intelligent systems", "while breaking barriers"];
  const typingElement = document.getElementById('typingText');
  
  if (!typingElement) return;

  let currentRole = 0;
  let displayText = "";
  let isDeleting = false;

  function typeWriter() {
    const targetText = roles[currentRole];
    
    if (!isDeleting) {
      if (displayText.length < targetText.length) {
        displayText = targetText.slice(0, displayText.length + 1);
        typingElement.textContent = displayText;
        setTimeout(typeWriter, 100);
      } else {
        setTimeout(() => {
          isDeleting = true;
          typeWriter();
        }, 2000);
      }
    } else {
      if (displayText.length > 0) {
        displayText = displayText.slice(0, -1);
        typingElement.textContent = displayText;
        setTimeout(typeWriter, 50);
      } else {
        isDeleting = false;
        currentRole = (currentRole + 1) % roles.length;
        setTimeout(typeWriter, 100);
      }
    }
  }

  // Start typing after delay
  setTimeout(typeWriter, 1000);
}

// ============================================
// CURSOR GLOW EFFECT
// ============================================
function initCursorEffects() {
  const cursorGlow = document.getElementById('cursorGlow');
  const cursorDot = document.getElementById('cursorDot');

  if (!cursorGlow || !cursorDot) return;

  // Check for touch device
  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
  if (isTouchDevice) {
    cursorGlow.style.display = 'none';
    cursorDot.style.display = 'none';
    return;
  }

  let mouseX = 0, mouseY = 0;
  let glowX = 0, glowY = 0;
  let dotX = 0, dotY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function animateCursor() {
    glowX += (mouseX - glowX) * 0.08;
    glowY += (mouseY - glowY) * 0.08;
    dotX += (mouseX - dotX) * 0.15;
    dotY += (mouseY - dotY) * 0.15;

    cursorGlow.style.left = `${glowX}px`;
    cursorGlow.style.top = `${glowY}px`;
    cursorDot.style.left = `${dotX}px`;
    cursorDot.style.top = `${dotY}px`;

    requestAnimationFrame(animateCursor);
  }

  animateCursor();

  // Show cursor on page load
  setTimeout(() => {
    cursorGlow.classList.add('visible');
    cursorDot.classList.add('visible');
  }, 100);

  // Hover effects on interactive elements
  const interactiveElements = document.querySelectorAll('a, button, .project-card, .note-card, .blog-card');
  interactiveElements.forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursorGlow.classList.add('hovering');
    });
    el.addEventListener('mouseleave', () => {
      cursorGlow.classList.remove('hovering');
    });
  });

  // Hide cursor when leaving window
  document.addEventListener('mouseleave', () => {
    cursorGlow.classList.remove('visible');
    cursorDot.classList.remove('visible');
  });

  document.addEventListener('mouseenter', () => {
    cursorGlow.classList.add('visible');
    cursorDot.classList.add('visible');
  });
}

// ============================================
// MOBILE MENU
// ============================================
function initMobileMenu() {
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');

  if (!mobileMenuBtn || !mobileMenu) return;

  mobileMenuBtn.addEventListener('click', () => {
    mobileMenuBtn.classList.toggle('open');
    mobileMenu.classList.toggle('open');
  });

  // Close menu when clicking a link
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenuBtn.classList.remove('open');
      mobileMenu.classList.remove('open');
    });
  });
}

// ============================================
// HEADER SCROLL EFFECT
// ============================================
function initHeaderScroll() {
  const header = document.getElementById('header');
  if (!header) return;

  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 10) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
  }, { passive: true });
}

// ============================================
// SCROLL ANIMATIONS
// ============================================
function initScrollAnimations() {
  const animatedElements = document.querySelectorAll('.animate-fade-in-up, .animate-fade-in, .animate-scale-in');

  if (animatedElements.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animationPlayState = 'running';
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  animatedElements.forEach(el => {
    el.style.animationPlayState = 'paused';
    observer.observe(el);
  });
}

// ============================================
// PROJECT FILTERS
// ============================================
function initProjectFilters() {
  const filterBtns = document.querySelectorAll('.filters .filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  if (filterBtns.length === 0 || projectCards.length === 0) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      // Update active state
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Filter projects
      projectCards.forEach(card => {
        const isFeatured = card.classList.contains('featured');
        const statusEl = card.querySelector('.project-status span:last-child');
        const status = statusEl ? statusEl.textContent.toLowerCase().replace(/\s+/g, '-') : '';

        let shouldShow = true;

        if (filter === 'featured') {
          shouldShow = isFeatured;
        } else if (filter === 'shipped') {
          shouldShow = status === 'shipped';
        } else if (filter === 'in-progress') {
          shouldShow = status === 'in-progress';
        } else if (filter === 'archived') {
          shouldShow = status === 'archived';
        }

        if (shouldShow) {
          card.style.display = 'block';
          card.style.animation = 'fade-in-up 0.4s ease forwards';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // Tag filters
  const tagBtns = document.querySelectorAll('.tag-filters .tag-btn');
  tagBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tag = btn.dataset.tag;
      if (!tag) return;

      // Toggle active state
      tagBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Filter by tag
      projectCards.forEach(card => {
        const tags = Array.from(card.querySelectorAll('.project-tag')).map(t => t.textContent);
        const shouldShow = tags.includes(tag);

        if (shouldShow) {
          card.style.display = 'block';
          card.style.animation = 'fade-in-up 0.4s ease forwards';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

// ============================================
// SEARCH FUNCTIONALITY
// ============================================
function initSearch() {
  const searchInputs = document.querySelectorAll('.search-input, #searchInput');

  searchInputs.forEach(input => {
    let debounceTimer;

    input.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);

      debounceTimer = setTimeout(() => {
        const query = e.target.value.trim().toLowerCase();

        if (query.length > 0) {
          // Client-side search for projects
          const projectCards = document.querySelectorAll('.project-card');
          projectCards.forEach(card => {
            const title = card.querySelector('.project-title')?.textContent.toLowerCase() || '';
            const desc = card.querySelector('.project-description')?.textContent.toLowerCase() || '';
            const tags = Array.from(card.querySelectorAll('.project-tag')).map(t => t.textContent.toLowerCase());

            const shouldShow = title.includes(query) || desc.includes(query) || tags.some(t => t.includes(query));
            card.style.display = shouldShow ? 'block' : 'none';
          });

          // Client-side search for blog posts
          const blogCards = document.querySelectorAll('.blog-card');
          blogCards.forEach(card => {
            const title = card.querySelector('.blog-card-title')?.textContent.toLowerCase() || '';
            const excerpt = card.querySelector('.blog-card-excerpt')?.textContent.toLowerCase() || '';

            const shouldShow = title.includes(query) || excerpt.includes(query);
            card.style.display = shouldShow ? 'block' : 'none';
          });
        } else {
          // Show all if search is empty
          document.querySelectorAll('.project-card, .blog-card').forEach(card => {
            card.style.display = 'block';
          });
        }
      }, 300);
    });
  });
}

// ============================================
// TERMINAL TYPING EFFECT
// ============================================
function initTerminalTyping() {
  const terminalContent = document.querySelector('.terminal-content');
  if (!terminalContent) return;

  const desktopContent = terminalContent.querySelector('.terminal-desktop');
  const mobileContent = terminalContent.querySelector('.terminal-mobile');

  if (!desktopContent && !mobileContent) return;

  const content = window.innerWidth >= 640 ? desktopContent : mobileContent;
  if (!content) return;

  const originalText = content.textContent;
  content.textContent = '';

  let charIndex = 0;
  const typingSpeed = 15;

  function typeChar() {
    if (charIndex < originalText.length) {
      content.textContent += originalText.charAt(charIndex);
      charIndex++;
      setTimeout(typeChar, typingSpeed);
    }
  }

  // Start typing after a short delay
  setTimeout(typeChar, 500);
}

// ============================================
// NEWSLETTER FORM
// ============================================
function initNewsletter() {
  const newsletterForm = document.getElementById('newsletterForm');

  if (!newsletterForm) return;

  newsletterForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = newsletterForm.querySelector('input[type="email"]').value;
    const btn = newsletterForm.querySelector('button');
    const originalText = btn.textContent;

    // Show loading state
    btn.textContent = 'Subscribing...';
    btn.disabled = true;

    try {
      // In production, send to your backend
      // const response = await fetch('/api/newsletter', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email })
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      btn.textContent = 'Subscribed!';
      btn.style.background = 'var(--success)';
      newsletterForm.reset();

      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
        btn.disabled = false;
      }, 2000);
    } catch (error) {
      btn.textContent = 'Error!';
      btn.style.background = 'var(--destructive)';

      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
        btn.disabled = false;
      }, 2000);
    }
  });
}

// ============================================
// SMOOTH SCROLL
// ============================================
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');

      if (targetId === '#') return;

      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        e.preventDefault();

        const headerOffset = 80;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// ============================================
// PREFERS REDUCED MOTION
// ============================================
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (prefersReducedMotion.matches) {
  document.querySelectorAll('.animate-fade-in-up, .animate-fade-in, .animate-scale-in').forEach(el => {
    el.style.opacity = '1';
    el.style.animation = 'none';
  });
}

// ============================================
// DASHBOARD FUNCTIONALITY
// ============================================
if (document.querySelector('.dashboard-container')) {
  initDashboard();
}

function initDashboard() {
  // Navigation
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.section-content');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const sectionName = item.dataset.section;

      // Update nav active state
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');

      // Show section
      sections.forEach(section => {
        section.classList.toggle('active', section.id === `section-${sectionName}`);
      });

      // Update page title
      const pageTitle = document.getElementById('pageTitle');
      if (pageTitle) {
        pageTitle.textContent = item.textContent.trim();
      }

      // Close mobile sidebar
      document.getElementById('sidebar')?.classList.remove('open');
    });
  });

  // Mobile menu toggle
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
      document.getElementById('sidebar')?.classList.toggle('open');
    });
  }

  // Dark mode toggle in dashboard
  const darkModeToggle = document.getElementById('darkModeToggle');
  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
  }

  // Load data
  loadDashboardData();
}

async function loadDashboardData() {
  try {
    const response = await fetch('/api/stats');
    const stats = await response.json();

    // Update stat cards
    document.getElementById('statBlog').textContent = stats.blog.total;
    document.getElementById('statProjects').textContent = stats.projects.total;
    document.getElementById('statNotes').textContent = stats.notes.total;
    document.getElementById('statWorkbench').textContent = stats.workbench.total;

    // Update sidebar badges
    document.getElementById('blogCount').textContent = stats.blog.total;
    document.getElementById('projectsCount').textContent = stats.projects.total;
    document.getElementById('notesCount').textContent = stats.notes.total;
    document.getElementById('workbenchCount').textContent = stats.workbench.total;
  } catch (error) {
    console.error('Failed to load dashboard stats:', error);
  }
}

// ============================================
// MODAL FUNCTIONALITY
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
  document.body.appendChild(container);
  return container;
}

// ============================================
// API HELPERS
// ============================================
async function apiRequest(url, options = {}) {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const response = await fetch(url, { ...defaultOptions, ...options });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// CRUD Operations
const api = {
  // Projects
  getProjects: () => apiRequest('/api/projects'),
  createProject: (data) => apiRequest('/api/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id, data) => apiRequest(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProject: (id) => apiRequest(`/api/projects/${id}`, { method: 'DELETE' }),

  // Blog Posts
  getBlogPosts: () => apiRequest('/api/blog-posts'),
  createBlogPost: (data) => apiRequest('/api/blog-posts', { method: 'POST', body: JSON.stringify(data) }),
  updateBlogPost: (id, data) => apiRequest(`/api/blog-posts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBlogPost: (id) => apiRequest(`/api/blog-posts/${id}`, { method: 'DELETE' }),

  // Lab Notes
  getLabNotes: () => apiRequest('/api/lab-notes'),
  createLabNote: (data) => apiRequest('/api/lab-notes', { method: 'POST', body: JSON.stringify(data) }),
  updateLabNote: (id, data) => apiRequest(`/api/lab-notes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLabNote: (id) => apiRequest(`/api/lab-notes/${id}`, { method: 'DELETE' }),

  // Workbench Items
  getWorkbenchItems: () => apiRequest('/api/workbench-items'),
  createWorkbenchItem: (data) => apiRequest('/api/workbench-items', { method: 'POST', body: JSON.stringify(data) }),
  updateWorkbenchItem: (id, data) => apiRequest(`/api/workbench-items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteWorkbenchItem: (id) => apiRequest(`/api/workbench-items/${id}`, { method: 'DELETE' }),

  // Settings
  getSettings: () => apiRequest('/api/settings'),
  updateSettings: (data) => apiRequest('/api/settings', { method: 'PUT', body: JSON.stringify(data) }),

  // Stats
  getStats: () => apiRequest('/api/stats')
};

// Export for use in other scripts
window.Theophilus = { api, showToast, openModal, closeModal };