/* ============================================================
   FARMSPHERICA — app.js
   Shared across all pages
   ============================================================ */

(function () {
  'use strict';

  /* ─── DOM refs ─── */
  const html          = document.documentElement;
  const header        = document.getElementById('site-header');
  const themeToggle   = document.getElementById('themeToggle');
  const hamburger     = document.getElementById('navHamburger');
  const mobileNav     = document.getElementById('navMobile');

  /* ══════════════════════════════════════
     1. DARK MODE
  ══════════════════════════════════════ */
  const THEME_KEY = 'farmspherica-theme';

  function getStoredTheme() {
    return localStorage.getItem(THEME_KEY) || 'light';
  }

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }

  // Apply on page load
  applyTheme(getStoredTheme());

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = html.getAttribute('data-theme');
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  /* ══════════════════════════════════════
     2. HEADER SCROLL SHADOW
  ══════════════════════════════════════ */
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
  }

  /* ══════════════════════════════════════
     3. HAMBURGER / MOBILE NAV
  ══════════════════════════════════════ */
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('open');
      hamburger.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen);
    });

    // Close on nav link click
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        hamburger.classList.remove('open');
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!hamburger.contains(e.target) && !mobileNav.contains(e.target)) {
        mobileNav.classList.remove('open');
        hamburger.classList.remove('open');
      }
    });
  }

  /* ══════════════════════════════════════
     4. ACTIVE NAV LINK
  ══════════════════════════════════════ */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .nav-mobile a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  /* ══════════════════════════════════════
     5. SCROLL REVEAL (IntersectionObserver)
  ══════════════════════════════════════ */
  const revealSelectors = '.reveal, .reveal-left, .reveal-right, .reveal-scale';

  function initReveal() {
    const elements = document.querySelectorAll(revealSelectors);
    if (!elements.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -48px 0px'
    });

    elements.forEach(el => observer.observe(el));
  }

  initReveal();

  /* ══════════════════════════════════════
     6. COUNT-UP NUMBERS
     Usage: <span data-count="95">0</span>
  ══════════════════════════════════════ */
  function animateCount(el) {
    const target  = parseInt(el.getAttribute('data-count'), 10);
    const suffix  = el.getAttribute('data-suffix') || '';
    const duration = 1800;
    const start   = performance.now();

    function tick(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased    = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function initCountUps() {
    const countEls = document.querySelectorAll('[data-count]');
    if (!countEls.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    countEls.forEach(el => observer.observe(el));
  }

  initCountUps();

  /* ══════════════════════════════════════
     7. HERO PROGRESS BARS ANIMATE IN
     Bars start at width:0% in HTML;
     data-width holds the real value
  ══════════════════════════════════════ */
  function initProgressBars() {
    const bars = document.querySelectorAll('.plant-fill[data-width]');
    if (!bars.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Small delay so CSS transition fires after paint
          setTimeout(() => {
            entry.target.style.width = entry.target.getAttribute('data-width');
          }, 300);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    bars.forEach(bar => observer.observe(bar));
  }

  initProgressBars();

  /* ══════════════════════════════════════
     8. DASHBOARD — live clock & refresh
     (Only runs on dashboard.html)
  ══════════════════════════════════════ */
  const clockEl = document.getElementById('live-clock');
  const refreshEl = document.getElementById('last-refreshed');

  if (clockEl) {
    function updateClock() {
      const now = new Date();
      clockEl.textContent = now.toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
    }
    updateClock();
    setInterval(updateClock, 1000);
  }

  if (refreshEl) {
    function setRefreshed() {
      const now = new Date();
      refreshEl.textContent = 'Last updated: ' + now.toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit'
      });
    }
    setRefreshed();
    // Simulate data refresh every 30s
    setInterval(setRefreshed, 30000);
  }

  /* ══════════════════════════════════════
     9. DASHBOARD — stat card tick
     Randomly nudges sensor values slightly
     every 8s to simulate live data
  ══════════════════════════════════════ */
  function initLiveSensorTick() {
    const sensors = document.querySelectorAll('[data-sensor]');
    if (!sensors.length) return;

    // Base values
    const base = {
      ph:   { val: 6.2,  min: 5.8,  max: 6.8,  step: 0.05, decimals: 1 },
      ec:   { val: 1.8,  min: 1.4,  max: 2.4,  step: 0.04, decimals: 1 },
      temp: { val: 22,   min: 18,   max: 28,   step: 0.2,  decimals: 1 },
      hum:  { val: 68,   min: 55,   max: 80,   step: 1,    decimals: 0 },
    };

    function nudge(key) {
      const s = base[key];
      const delta = (Math.random() - 0.5) * 2 * s.step;
      s.val = Math.min(s.max, Math.max(s.min, +(s.val + delta).toFixed(s.decimals)));
      return s.val.toFixed(s.decimals);
    }

    function tick() {
      sensors.forEach(el => {
        const key = el.getAttribute('data-sensor');
        if (base[key] !== undefined) {
          el.textContent = nudge(key);
        }
      });
    }

    setInterval(tick, 8000);
  }

  initLiveSensorTick();

  /* ══════════════════════════════════════
     10. DASHBOARD — progress bar widths
  ══════════════════════════════════════ */
  function initDashProgressBars() {
    const bars = document.querySelectorAll('.dash-bar-fill[data-width]');
    if (!bars.length) return;
    setTimeout(() => {
      bars.forEach(bar => {
        bar.style.width = bar.getAttribute('data-width');
      });
    }, 400);
  }

  initDashProgressBars();

  /* ══════════════════════════════════════
     11. CROPS — filter tabs
  ══════════════════════════════════════ */
  function initCropFilter() {
    const tabs  = document.querySelectorAll('.filter-tab');
    const cards = document.querySelectorAll('.crop-card[data-category]');
    if (!tabs.length || !cards.length) return;

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const filter = tab.getAttribute('data-filter');

        cards.forEach(card => {
          const match = filter === 'all' || card.getAttribute('data-category') === filter;
          card.style.display = match ? '' : 'none';
          // Re-trigger reveal
          if (match) {
            card.classList.remove('visible');
            requestAnimationFrame(() => card.classList.add('visible'));
          }
        });
      });
    });
  }

  initCropFilter();

  /* ══════════════════════════════════════
     12. ABOUT — FAQ accordion
  ══════════════════════════════════════ */
  function initFAQ() {
    const items = document.querySelectorAll('.faq-item');
    if (!items.length) return;

    items.forEach(item => {
      const btn = item.querySelector('.faq-question');
      const ans = item.querySelector('.faq-answer');
      if (!btn || !ans) return;

      btn.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');

        // Close all
        items.forEach(i => {
          i.classList.remove('open');
          const a = i.querySelector('.faq-answer');
          if (a) a.style.maxHeight = null;
        });

        // Open clicked if it was closed
        if (!isOpen) {
          item.classList.add('open');
          ans.style.maxHeight = ans.scrollHeight + 'px';
        }
      });
    });
  }

  initFAQ();

  /* ══════════════════════════════════════
     13. FAQ SEARCH (About page)
  ══════════════════════════════════════ */
  function initFAQSearch() {
    const searchInput = document.getElementById('faq-search');
    const faqItems    = document.querySelectorAll('.faq-item');
    if (!searchInput || !faqItems.length) return;

    searchInput.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase().trim();
      faqItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = (!q || text.includes(q)) ? '' : 'none';
      });
    });
  }

  initFAQSearch();

  /* ══════════════════════════════════════
     14. STATS PAGE — animated bar chart
  ══════════════════════════════════════ */
  function initStatsBars() {
    const bars = document.querySelectorAll('.chart-bar-fill[data-height]');
    if (!bars.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.style.height = entry.target.getAttribute('data-height');
          }, 200);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    bars.forEach(bar => observer.observe(bar));
  }

  initStatsBars();

  /* ══════════════════════════════════════
     15. SMOOTH SCROLL for anchor links
  ══════════════════════════════════════ */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

})();