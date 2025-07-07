/**
 * Portfolio Website – Enhanced Main JavaScript
 * Includes active state management, smooth scrolling, responsive mobile nav, header scroll effect, dark mode toggle, and other features.
 */

// List of scripts to load dynamically
const scripts = [
  'js/darkmode-toggler.js',
  'js/smooth-scrolling.js',
  'js/portfolio-filter.js',
  'js/portfolio-dynamic.js',
  'js/about-sketch.js',
  'js/testimonials.js',
  'js/footergame.js',
  'js/skills-touch.js'
];

scripts.forEach(src => {
  const s = document.createElement('script');
  s.src = src;
  s.defer = true;
  document.head.appendChild(s);
});

window.addEventListener('load', () => {
  initDarkModeToggle();
  initMobileNav();
  initSmoothScrolling();
  initPortfolioFilter();
  initHeaderScroll();
  initContactForm();
  initScrollAnimations();
  initSkillsAnimation();
  initScrollToTop();
  updateFooterYear();
});

// Generic component loader
function loadComponent(id, path, cb) {
  fetch(path)
    .then(r => r.text())
    .then(html => {
      document.getElementById(id).innerHTML = html;
      if (cb) cb();
    })
    .catch(err => console.error('Component load error:', err));
}

// Load all sections
loadComponent('hero-container', 'components/hero-section.html');
loadComponent('about-container', 'components/about.html');
loadComponent('skills-container', 'components/skills.html');
loadComponent('portfolio-container', 'components/portfolio.html', () => {
  function tryInitParticleBg() {
    const bg = document.getElementById('particle-bg');
    if (bg && window.particleBgSketch) {
      new p5(window.particleBgSketch, 'particle-bg');
    } else {
      setTimeout(tryInitParticleBg, 100);
    }
  }
  setTimeout(tryInitParticleBg, 0);
});
loadComponent('experience-container', 'components/experience.html');
loadComponent('testimonials-container', 'components/testimonials.html');
loadComponent('contact-container', 'components/contact.html');

// ========== MOBILE NAVIGATION ==========
function initMobileNav() {
  // Support both Bootstrap-style and custom mobile nav markup
  const toggle = document.querySelector('.navbar-toggler, .menu-toggle');
  const collapse = document.getElementById('navbarNavDropdown') || document.querySelector('.nav-menu');
  if (!toggle || !collapse) return;

  // Hamburger icon/close icon support (if present)
  const menuIcon = toggle.querySelector('.menu-icon');
  const closeIcon = toggle.querySelector('.close-icon');

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', !expanded);
    // Toggle Bootstrap or custom nav class
    if (collapse.id === 'navbarNavDropdown' || collapse.classList.contains('collapse')) {
      collapse.classList.toggle('show');
    } else {
      collapse.classList.toggle('active');
    }
    document.body.classList.toggle('nav-open');
    // Toggle icons if present
    if (menuIcon && closeIcon) {
      menuIcon.classList.toggle('hidden');
      closeIcon.classList.toggle('hidden');
    }
  });

  // Close on outside click
  document.addEventListener('click', e => {
    const isOpen = (collapse.id === 'navbarNavDropdown' || collapse.classList.contains('collapse'))
      ? collapse.classList.contains('show')
      : collapse.classList.contains('active');
    if (isOpen && !collapse.contains(e.target) && !toggle.contains(e.target)) {
      toggle.setAttribute('aria-expanded', 'false');
      if (collapse.id === 'navbarNavDropdown' || collapse.classList.contains('collapse')) {
        collapse.classList.remove('show');
      } else {
        collapse.classList.remove('active');
      }
      document.body.classList.remove('nav-open');
      if (menuIcon && closeIcon) {
        menuIcon.classList.remove('hidden');
        closeIcon.classList.add('hidden');
      }
    }
  });

  // Close on resize to desktop
  window.addEventListener('resize', () => {
    const isOpen = (collapse.id === 'navbarNavDropdown' || collapse.classList.contains('collapse'))
      ? collapse.classList.contains('show')
      : collapse.classList.contains('active');
    if (window.innerWidth > 992 && isOpen) {
      toggle.setAttribute('aria-expanded', 'false');
      if (collapse.id === 'navbarNavDropdown' || collapse.classList.contains('collapse')) {
        collapse.classList.remove('show');
      } else {
        collapse.classList.remove('active');
      }
      document.body.classList.remove('nav-open');
      if (menuIcon && closeIcon) {
        menuIcon.classList.remove('hidden');
        closeIcon.classList.add('hidden');
      }
    }
  });
}

// ========== SMOOTH SCROLL & ACTIVE STATE ==========
function initSmoothScrolling() {
  const links = document.querySelectorAll('.navbar-nav .nav-link[href^="#"]');

  function setActive(link) {
    links.forEach(l => l.classList.remove('active'));
    link.classList.add('active');
  }

  links.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const targetId = link.getAttribute('href');
      const section = document.querySelector(targetId);
      if (!section) return;

      // close mobile nav if open
      const collapse = document.getElementById('navbarNavDropdown');
      const toggle = document.querySelector('.navbar-toggler');
      if (collapse.classList.contains('show')) {
        collapse.classList.remove('show');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-open');
      }

      const headerH = document.querySelector('header').offsetHeight;
      const pos = section.getBoundingClientRect().top + window.pageYOffset - headerH;

      window.scrollTo({ top: pos, behavior: 'smooth' });
      history.pushState(null, null, targetId);
      setActive(link);
    });
  });

  // On scroll, update active link
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const headerH = document.querySelector('header').offsetHeight;
    document.querySelectorAll('section[id]').forEach(sec => {
      const top = sec.offsetTop - headerH - 100;
      if (scrollY >= top && scrollY < top + sec.offsetHeight) {
        const id = sec.getAttribute('id');
        const activeLink = document.querySelector(`.nav-link[href="#${id}"]`);
        if (activeLink) setActive(activeLink);
      }
    });
  });
}

// ========== HEADER SCROLL EFFECT ==========
function initHeaderScroll() {
  const header = document.querySelector('header');
  if (!header) return;

  function onScroll() {
    header.classList.toggle('scrolled', window.scrollY > 50);
  }

  window.addEventListener('scroll', onScroll);
  onScroll();
}

// ========== CONTACT FORM ==========
function initContactForm() {
  const form = document.querySelector('.contact-form');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    let valid = true;

    // remove old errors
    form.querySelectorAll('.error-message').forEach(el => el.remove());

    const fields = [
      { el: form.querySelector('input[name="name"]'), msg: 'Please enter your name' },
      { el: form.querySelector('input[name="email"]'), msg: 'Please enter a valid email', check: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) },
      { el: form.querySelector('textarea[name="message"]'), msg: 'Please enter your message' }
    ];

    fields.forEach(f => {
      const val = f.el.value.trim();
      const ok = f.check ? f.check(val) : !!val;
      if (!ok) {
        valid = false;
        const err = document.createElement('div');
        err.className = 'error-message';
        err.textContent = f.msg;
        f.el.parentNode.appendChild(err);
        f.el.classList.add('error');
        f.el.addEventListener('input', () => {
          f.el.classList.remove('error');
          const e = f.el.parentNode.querySelector('.error-message');
          if (e) e.remove();
        }, { once: true });
      }
    });

    if (!valid) return;

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Sending...';

    setTimeout(() => {
      form.innerHTML = `
        <div class="success-message">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <h3>Message Sent Successfully!</h3>
          <p>Thank you for reaching out. I'll get back to you ASAP.</p>
          <button class="btn" id="send-another">Send Another Message</button>
        </div>
      `;
      document.getElementById('send-another').addEventListener('click', () => window.location.reload());
    }, 1500);
  });
}

// ========== SCROLL ANIMATIONS ==========
function initScrollAnimations() {
  const elems = document.querySelectorAll('.fade-in, .slide-in, .zoom-in');
  if (!elems.length) return;

  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

  elems.forEach(el => io.observe(el));
}

// ========== SKILLS ANIMATION ==========
function initSkillsAnimation() {
  const bars = document.querySelectorAll('.skill-progress-bar');
  if (!bars.length) return;

  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const w = e.target.getAttribute('data-progress') || '0';
        e.target.style.width = w + '%';
        e.target.classList.add('animated');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  bars.forEach(bar => io.observe(bar));
}

// ========== SCROLL TO TOP BUTTON ==========
function initScrollToTop() {
  const btn = document.createElement('button');
  btn.className = 'scroll-top-btn';
  btn.setAttribute('aria-label', 'Scroll to top');
  btn.innerHTML = '&uarr;';
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.pageYOffset > 300);
  });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ========== FOOTER YEAR UPDATE ==========
function updateFooterYear() {
  const yearEl = document.getElementById('current-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

// Dynamically load and initialize about-sketch
function initializeAboutSketch() {
  const c = document.getElementById('about-sketch');
  if (c && window.aboutSketch) {
    new p5(aboutSketch, 'about-sketch');
  } else {
    setTimeout(initializeAboutSketch, 100);
  }
}
function loadAboutSketch() {
  const s = document.createElement('script');
  s.src = '../js/about-sketch.js';
  s.defer = true;
  s.onload = initializeAboutSketch;
  document.head.appendChild(s);
}
loadAboutSketch();
