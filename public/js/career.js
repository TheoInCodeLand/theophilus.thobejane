// ============================================
// NEW SECTION INITIALIZATIONS
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // Existing initializations...
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
  
  // New initializations
  initSkillBars();
  initMetricsCounter();
  initContactForm();
  initTimelineAnimation();
});

// ============================================
// SKILL BARS ANIMATION
// ============================================
function initSkillBars() {
  const skillItems = document.querySelectorAll('.skill-item');
  
  if (skillItems.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const level = entry.target.dataset.level;
        const fill = entry.target.querySelector('.skill-fill');
        if (fill && level) {
          setTimeout(() => {
            fill.style.width = `${level}%`;
          }, 200);
        }
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.5,
    rootMargin: '0px 0px -50px 0px'
  });

  skillItems.forEach(item => observer.observe(item));
}

// ============================================
// METRICS COUNTER ANIMATION
// ============================================
function initMetricsCounter() {
  const metricCards = document.querySelectorAll('.metric-card');
  
  if (metricCards.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const valueEl = entry.target.querySelector('.metric-value');
        const target = parseInt(valueEl.dataset.target);
        
        if (target && !entry.target.classList.contains('counted')) {
          animateCounter(valueEl, target);
          entry.target.classList.add('counted');
        }
        
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.5
  });

  metricCards.forEach(card => observer.observe(card));
}

function animateCounter(element, target) {
  const duration = 2000;
  const start = 0;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing function (ease-out-expo)
    const easeOut = 1 - Math.pow(2, -10 * progress);
    const current = Math.floor(start + (target - start) * easeOut);
    
    element.textContent = current;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = target;
    }
  }

  requestAnimationFrame(update);
}

// ============================================
// CONTACT FORM HANDLING
// ============================================
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = form.querySelector('.terminal-submit');
    const originalText = submitBtn.innerHTML;
    
    // Show loading state
    submitBtn.innerHTML = '<span>Sending...</span>';
    submitBtn.disabled = true;

    // Simulate form submission (replace with actual endpoint)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Success state
      form.classList.add('success');
      submitBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
        <span>Message Sent!</span>
      `;
      
      // Reset form
      setTimeout(() => {
        form.reset();
        form.classList.remove('success');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }, 3000);
      
    } catch (error) {
      submitBtn.innerHTML = '<span>Error!</span>';
      setTimeout(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }, 2000);
    }
  });

  // Add typing effect to terminal inputs
  const inputs = form.querySelectorAll('.terminal-input-field');
  inputs.forEach(input => {
    input.addEventListener('focus', () => {
      input.style.borderColor = 'var(--primary)';
    });
    input.addEventListener('blur', () => {
      input.style.borderColor = '';
    });
  });
}

// ============================================
// TIMELINE ANIMATION
// ============================================
function initTimelineAnimation() {
  const timelineItems = document.querySelectorAll('.timeline-item');
  
  if (timelineItems.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateX(0)';
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.2,
    rootMargin: '0px 0px -50px 0px'
  });

  timelineItems.forEach((item, index) => {
    item.style.opacity = '0';
    item.style.transform = 'translateX(-20px)';
    item.style.transition = `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s`;
    observer.observe(item);
  });
}

// ============================================
// SMOOTH SCROLL FOR ANCHOR LINKS (ENHANCED)
// ============================================
// Override existing smooth scroll to handle new sections
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
        
        // Update URL without jumping
        history.pushState(null, null, targetId);
      }
    });
  });
}

// ============================================
// NAVIGATION HIGHLIGHT ON SCROLL
// ============================================
function initHeaderScroll() {
  const header = document.getElementById('header');
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
  
  if (!header) return;

  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    // Header background
    if (currentScroll > 10) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    // Section highlighting
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 100;
      const sectionHeight = section.offsetHeight;
      if (currentScroll >= sectionTop && currentScroll < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });

    lastScroll = currentScroll;
  }, { passive: true });
}