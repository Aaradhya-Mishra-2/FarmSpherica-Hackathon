/* ============================================================
  FARMSPHERICA — app.js
  Shared across all pages
  ============================================================ */

(function () {
  'use strict';

  /* ─── DOM refs ─── */
  const html = document.documentElement;
  const header = document.getElementById('site-header');
  const themeToggle = document.getElementById('themeToggle');
  const hamburger = document.getElementById('navHamburger');
  const mobileNav = document.getElementById('navMobile');

  /* ══════════════════════════════════════
    1. MULTI-THEME SELECTOR
  ══════════════════════════════════════ */
  const THEME_KEY = 'farmspherica-theme';
  const THEMES = [
    { id: 'light', name: 'Light', emoji: '☀️' },
    { id: 'dark', name: 'Dark', emoji: '🌙' },
    { id: 'glassmorphic', name: 'Glassmorphic', emoji: '💎' },
    { id: 'cyber', name: 'Cyber', emoji: '👾' },
    { id: 'tech', name: 'Tech', emoji: '💻' },
    { id: 'low-contrast', name: 'Low Contrast', emoji: '👁️' },
    { id: 'high-contrast', name: 'High Contrast', emoji: '🌗' },
    { id: 'sunset', name: 'Sunset', emoji: '🌇' },
    { id: 'nexus', name: 'Nexus', emoji: '📟' }
  ];

  function getStoredTheme() {
    return localStorage.getItem(THEME_KEY) || 'light';
  }

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    updateThemeSelectorUI(theme);
  }

  function updateThemeSelectorUI(theme) {
    const themeBtn = document.querySelector('.theme-toggle-btn');
    if (themeBtn) {
      const activeTheme = THEMES.find(t => t.id === theme) || THEMES[0];
      themeBtn.textContent = activeTheme.emoji;
      themeBtn.setAttribute('aria-label', `Theme: ${activeTheme.name}`);
    }
    document.querySelectorAll('.theme-option').forEach(opt => {
      if (opt.getAttribute('data-theme-id') === theme) {
        opt.classList.add('active');
      } else {
        opt.classList.remove('active');
      }
    });
  }

  function initThemeSelector() {
    if (!themeToggle) return;

    const container = document.createElement('div');
    container.className = 'theme-select-container';

    const triggerBtn = document.createElement('button');
    triggerBtn.className = 'theme-toggle-btn';
    triggerBtn.setAttribute('aria-haspopup', 'listbox');
    triggerBtn.setAttribute('aria-expanded', 'false');

    const dropdown = document.createElement('div');
    dropdown.className = 'theme-dropdown';
    dropdown.setAttribute('role', 'listbox');

    THEMES.forEach(t => {
      const option = document.createElement('button');
      option.className = 'theme-option';
      option.setAttribute('role', 'option');
      option.setAttribute('data-theme-id', t.id);
      option.innerHTML = `<span>${t.emoji}</span> <span>${t.name}</span>`;
      
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        applyTheme(t.id);
        dropdown.classList.remove('show');
        triggerBtn.setAttribute('aria-expanded', 'false');
      });

      dropdown.appendChild(option);
    });

    themeToggle.parentNode.replaceChild(container, themeToggle);
    container.appendChild(triggerBtn);
    container.appendChild(dropdown);

    triggerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded = dropdown.classList.toggle('show');
      triggerBtn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    });

    document.addEventListener('click', () => {
      dropdown.classList.remove('show');
      triggerBtn.setAttribute('aria-expanded', 'false');
    });

    updateThemeSelectorUI(getStoredTheme());
  }

  // Initial theme application
  applyTheme(getStoredTheme());

  // Set up theme selector replacement
  initThemeSelector();

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
    const target = parseInt(el.getAttribute('data-count'), 10);
    const suffix = el.getAttribute('data-suffix') || '';
    const duration = 1800;
    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
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
      ph: { val: 6.2, min: 5.8, max: 6.8, step: 0.05, decimals: 1 },
      ec: { val: 1.8, min: 1.4, max: 2.4, step: 0.04, decimals: 1 },
      temp: { val: 22, min: 18, max: 28, step: 0.2, decimals: 1 },
      hum: { val: 68, min: 55, max: 80, step: 1, decimals: 0 },
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
    const tabs = document.querySelectorAll('.filter-tab');
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
    const faqItems = document.querySelectorAll('.faq-item');
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

  /* ══════════════════════════════════════
    16. AI CHATBOT INTEGRATION
  ══════════════════════════════════════ */
  /* ══════════════════════════════════════
    16. AI CHATBOT INTEGRATION
  ══════════════════════════════════════ */
  function initAIChat() {
    // API Key State
    let geminiApiKey = localStorage.getItem('farmspherica_gemini_key') || '';

    // Taught Knowledge State
    let userTaughtData = {};
    try {
      userTaughtData = JSON.parse(localStorage.getItem('farmspherica_taught_data') || '{}');
    } catch (e) {
      userTaughtData = {};
    }

    let learningState = {
      active: false,
      step: 0, // 1: waiting for keywords, 2: waiting for response content
      keywords: ''
    };

    // Fuzzy String Utilities for Typo Tolerance and Slang matching
    function levenshteinDistance(s1, s2) {
      const len1 = s1.length;
      const len2 = s2.length;
      const matrix = Array.from({ length: len1 + 1 }, () => Array(len2 + 1).fill(0));
      for (let i = 0; i <= len1; i++) matrix[i][0] = i;
      for (let j = 0; j <= len2; j++) matrix[0][j] = j;
      for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
          const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j - 1] + cost
          );
        }
      }
      return matrix[len1][len2];
    }

    function getConsonants(str) {
      return str.replace(/[aeiouy]/g, '');
    }

    function isFuzzyMatch(queryText, keywordText) {
      const q = queryText.toLowerCase().trim();
      const kw = keywordText.toLowerCase().trim();

      // 1. Direct exact or substring match
      if (q === kw || q.includes(kw) || kw.includes(q)) return true;

      // 2. Levenshtein check on the whole string
      const editDist = levenshteinDistance(q, kw);
      const maxLen = Math.max(q.length, kw.length);
      if (maxLen > 0 && (1 - editDist / maxLen) >= 0.75) {
        return true;
      }

      // 3. Token-based matching (checking individual words)
      const qWords = q.split(/[^a-z0-9]+/);
      const kwWords = kw.split(/[^a-z0-9]+/);

      for (const qw of qWords) {
        if (qw.length < 2) continue;
        for (const kww of kwWords) {
          if (kww.length < 2) continue;

          // Direct word containment
          if (qw.includes(kww) || kww.includes(qw)) return true;

          // Levenshtein similarity on words
          const wordDist = levenshteinDistance(qw, kww);
          const wordMaxLen = Math.max(qw.length, kww.length);
          if (wordMaxLen > 0 && (1 - wordDist / wordMaxLen) >= 0.7) {
            return true;
          }

          // Jaccard char overlap (for typos/abbreviations like hlo vs hello)
          const set1 = new Set(qw);
          const set2 = new Set(kww);
          const intersect = new Set([...set1].filter(x => set2.has(x)));
          const union = new Set([...set1, ...set2]);
          const jaccard = intersect.size / union.size;
          if (jaccard >= 0.75) {
            return true;
          }

          // Consonant-only comparison (for wtr vs water)
          if (qw.length > 2 && kww.length > 2 && getConsonants(qw) === getConsonants(kww)) {
            return true;
          }
        }
      }
      return false;
    }

    // 1. Create HTML elements
    const trigger = document.createElement('div');
    trigger.className = 'ai-chat-trigger';
    trigger.id = 'aiChatTrigger';
    trigger.title = 'Chat with Spherica AI';
    trigger.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 13.9 2.5 15.6 3.4 17.1L2 22L7.1 20.6C8.5 21.5 10.2 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C10.5 20 9.1 19.6 7.9 18.8L7.6 18.6L4.5 19.5L5.4 16.4L5.2 16.1C4.4 14.9 4 13.5 4 12C4 7.6 7.6 4 12 4C16.4 4 20 7.6 20 12C20 16.4 16.4 20 12 20Z" fill="currentColor"/>
          <path d="M8 11C8.55228 11 9 10.5523 9 10C9 9.44772 8.55228 9 8 9C7.44772 9 7 9.44772 7 10C7 10.5523 7.44772 11 8 11Z" fill="currentColor"/>
          <path d="M12 11C12.5523 11 13 10.5523 13 10C13 9.44772 12.5523 9 12 9C11.4477 9 11 9.44772 11 10C11 10.5523 11.4477 11 12 11Z" fill="currentColor"/>
          <path d="M16 11C16.5523 11 17 10.5523 17 10C17 9.44772 16.5523 9 16 9C15.4477 9 15 9.44772 15 10C15 10.5523 15.4477 11 16 11Z" fill="currentColor"/>
          <path d="M12 16C14 16 15.5 14.5 15.5 14H8.5C8.5 14.5 10 16 12 16Z" fill="currentColor"/>
        </svg>
      `;

    const chatWindow = document.createElement('div');
    chatWindow.className = 'ai-chat-window glass-card';
    chatWindow.id = 'aiChatWindow';
    chatWindow.innerHTML = `
        <div class="ai-chat-header">
          <div class="ai-chat-avatar">🌱</div>
          <div class="ai-chat-info">
            <div class="ai-chat-title">Spherica AI</div>
            <div class="ai-chat-status">Smart Hydroponics Expert</div>
          </div>
          <div style="display:flex; align-items:center; gap: 0.25rem; margin-left: auto;">
            <button class="ai-chat-settings-btn" id="aiChatSettingsBtn" title="AI Chat Settings">⚙️</button>
            <button class="ai-chat-close" id="aiChatClose" aria-label="Close Chat" style="position: static; transform: none; margin-left: 0.25rem;">&times;</button>
          </div>
        </div>
        
        <div class="ai-chat-settings-panel" id="aiChatSettingsPanel">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem;">
            <strong style="font-size: 0.9rem;">Gemini AI Settings</strong>
            <button id="aiChatSettingsClose" style="font-size: 1.2rem; cursor: pointer; border: none; background: none; color: var(--text-secondary);">&times;</button>
          </div>
          <p style="font-size: 0.75rem; margin-bottom: 0.8rem; line-height: 1.4; color: var(--text-secondary);">
            Paste your Google Gemini API Key below to unlock live, generative responses for Spherica AI. Get a free key at <a href="https://aistudio.google.com/" target="_blank" style="color: var(--accent); text-decoration: underline; font-weight: 500;">Google AI Studio</a>.
          </p>
          <input type="password" id="aiChatApiKeyInput" placeholder="Enter API Key (AIzaSy...)" style="width: 100%; padding: 0.6rem 0.8rem; font-size: 0.8rem; border: 1.5px solid var(--border); border-radius: var(--radius-sm); margin-bottom: 0.8rem; background: var(--bg); color: var(--text-primary); font-family: inherit;">
          <div style="display: flex; gap: 0.5rem;">
            <button id="aiChatSaveKey" style="flex: 1; padding: 0.6rem; background: var(--accent); color: #fff; border-radius: var(--radius-sm); font-size: 0.8rem; font-weight: 600; cursor: pointer; border: none; text-align: center;">Save Key</button>
            <button id="aiChatRemoveKey" style="padding: 0.6rem 0.8rem; background: var(--bg-tertiary); color: var(--text-primary); border-radius: var(--radius-sm); font-size: 0.8rem; cursor: pointer; border: 1px solid var(--border); text-align: center;">Clear</button>
          </div>
        </div>

        <div class="ai-chat-messages" id="aiChatMessages"></div>
        <div class="ai-chat-suggestions" id="aiChatSuggestions"></div>
        <div class="ai-chat-input-area">
          <input type="text" class="ai-chat-input" id="aiChatInput" placeholder="Ask a question..." autocomplete="off">
          <button class="ai-chat-send" id="aiChatSend" aria-label="Send message">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      `;

    document.body.appendChild(trigger);
    document.body.appendChild(chatWindow);

    const closeBtn = document.getElementById('aiChatClose');
    const messagesContainer = document.getElementById('aiChatMessages');
    const suggestionsContainer = document.getElementById('aiChatSuggestions');
    const inputField = document.getElementById('aiChatInput');
    const sendBtn = document.getElementById('aiChatSend');

    // Settings DOM Refs
    const settingsBtn = document.getElementById('aiChatSettingsBtn');
    const settingsPanel = document.getElementById('aiChatSettingsPanel');
    const settingsClose = document.getElementById('aiChatSettingsClose');
    const apiKeyInput = document.getElementById('aiChatApiKeyInput');
    const saveKeyBtn = document.getElementById('aiChatSaveKey');
    const removeKeyBtn = document.getElementById('aiChatRemoveKey');

    // Set input initial value
    apiKeyInput.value = geminiApiKey;

    function updateBotStatus() {
      const statusText = document.querySelector('.ai-chat-status');
      if (statusText) {
        statusText.textContent = geminiApiKey ? "Live AI Mode" : "Smart Expert Mode";
        statusText.style.color = geminiApiKey ? "var(--accent)" : "";
      }
    }
    updateBotStatus();

    // Knowledge Base
    const hydroponicsKnowledge = {
      greetings: {
        keywords: ['hello', 'hi', 'hey', 'greetings', 'who are you', 'help', 'start'],
        response: "Hello! 🌿 I am **Spherica AI**, your personal hydroponics specialist. I can help you with parameters (pH, EC, temp), crop advice, troubleshooting, or understanding Farmspherica's metrics. What would you like to know?"
      },
      hydroponics: {
        keywords: ['how it works', 'hydroponics', 'what is', 'soil-free', 'no soil'],
        response: "Hydroponics is a method of growing plants without soil, using water solvent enriched with mineral nutrients. Plants grow up to **3x faster** because nutrients are delivered directly to their roots, using **95% less water** through recirculation!"
      },
      ph: {
        keywords: ['ph', 'ph level', 'acidity', 'alkalinity', 'ph scale', 'adjust ph', 'ideal ph'],
        response: "For most hydroponic crops, the ideal pH range is **5.5 to 6.5**. If pH is outside this range, plants cannot absorb nutrients effectively.\n\n• **If pH is too high:** Add small amounts of 'pH Down' (usually phosphoric acid).\n• **If pH is too low:** Add 'pH Up' (potassium hydroxide).\n• Always adjust in small increments and re-test after 15 minutes."
      },
      ec: {
        keywords: ['ec', 'electrical conductivity', 'ppm', 'nutrient', 'nutrients', 'tds', 'ec level', 'target ec'],
        response: "Electrical Conductivity (EC) measures the concentration of dissolved salts (nutrients) in your water.\n\n• **Ideal Range:** Usually **1.2 to 2.4 mS/cm** depending on the crop.\n• **If EC is too high:** Dilute the reservoir with fresh water to prevent nutrient burn.\n• **If EC is too low:** Add more concentrated nutrient solution.\n• Lettuce prefers low EC (1.2-1.8), while Tomatoes prefer high EC (2.0-3.5)."
      },
      lettuce: {
        keywords: ['lettuce', 'grow lettuce', 'ph for lettuce', 'lettuce parameter'],
        response: "🥬 **Lettuce** is one of the easiest crops to grow in hydroponics!\n\n• **pH Range:** 5.5 - 6.0\n• **EC Range:** 1.2 - 1.8 mS/cm\n• **Temperature:** 15°C - 20°C (prefers cooler climates)\n• **Harvest Time:** 30-45 days\n• **Tip:** High heat can cause lettuce to bolt (go to seed) and taste bitter."
      },
      basil: {
        keywords: ['basil', 'grow basil', 'ph for basil', 'basil parameter'],
        response: "🌿 **Basil** grows exceptionally well in hydroponics and produces highly aromatic leaves!\n\n• **pH Range:** 5.6 - 6.2\n• **EC Range:** 1.6 - 2.2 mS/cm\n• **Temperature:** 20°C - 25°C (loves warmth and plenty of light)\n• **Harvest Time:** 28-35 days\n• **Tip:** Pinch off the top center shoot to encourage bushy growth."
      },
      tomatoes: {
        keywords: ['tomato', 'tomatoes', 'grow tomato', 'ph for tomato', 'tomato parameter'],
        response: "🍅 **Tomatoes** are heavy feeders and require support structures (trellises).\n\n• **pH Range:** 6.0 - 6.5\n• **EC Range:** 2.0 - 3.5 mS/cm\n• **Temperature:** 21°C - 27°C (warm temperature is essential)\n• **Light:** Requires 12-16 hours of strong light per day.\n• **Tip:** Transition from grow nutrients (high Nitrogen) to bloom nutrients (high Potassium/Phosphorus) when flowers appear."
      },
      mint: {
        keywords: ['mint', 'grow mint', 'ph for mint', 'mint parameter'],
        response: "🍀 **Mint** is incredibly vigorous and thrives in water-based setups!\n\n• **pH Range:** 5.5 - 6.0\n• **EC Range:** 1.0 - 1.6 mS/cm\n• **Temperature:** 18°C - 24°C\n• **Tip:** Mint spreads quickly via runners, so keep it in its own net pot to avoid clogging drains."
      },
      temp: {
        keywords: ['temp', 'temperature', 'heat', 'hot', 'cold', 'weather', 'climate', 'water temp', 'ideal temp'],
        response: "🌡️ **Ideal Water Temperature** is **18°C to 22°C (64°F to 72°F)**.\n\n• If water goes above 24°C, it holds less dissolved oxygen, increasing the risk of **root rot**.\n• If water goes below 15°C, plant growth slows down significantly.\n• Keep your reservoir shaded and use water chillers/heaters if necessary."
      },
      water_savings: {
        keywords: ['saving', 'water savings', '95%', 'consumption', 'water saving stats'],
        response: "💧 Farmspherica saves up to **95% of water** compared to traditional soil farming!\n\nThis is because water is recycled in a closed-loop system, losing almost nothing to soil seepage or evaporation. The only water consumed is what the plants drink!"
      },
      growth: {
        keywords: ['growth', 'cycle', '3x', 'faster', 'how fast', 'growth cycles'],
        response: "🚀 Crops grow up to **3x faster** because they have ideal conditions 24/7:\n\n1. Roots don't have to 'search' for food; nutrients are dissolved directly in the water.\n2. Perfect moisture, pH, and aeration eliminate root stress.\n3. Indoor environments keep temperatures and lighting at peak performance."
      },
      root_rot: {
        keywords: ['root rot', 'brown roots', 'slimy', 'roots dying', 'disease', 'fungus', 'root rot prevention'],
        response: "⚠️ **Root Rot** is a common issue caused by Pythium fungus in warm, oxygen-deprived water.\n\n• **Symptoms:** Slimy, brown, or smelly roots; wilted leaves.\n• **Remedies:**\n  1. Add an air stone to increase dissolved oxygen.\n  2. Lower reservoir temperature below 22°C.\n  3. Flush the system and sterilize with dilute hydrogen peroxide (3%).\n  4. Trim off dead brown roots."
      },
      algae: {
        keywords: ['algae', 'green stuff', 'moss', 'slime', 'clean tank'],
        response: "🦠 **Algae growth** happens when light hits your nutrient solution.\n\n• **Prevention:** Cover your reservoir, grow net pots, and water channels completely to block light.\n• **Action:** Clean your setup thoroughly. Algae competes with plants for nutrients and lowers oxygen levels."
      },
      ph_alarms: {
        keywords: ['ph alarm', 'fix ph', 'high ph', 'low ph', 'adjust ph', 'ph alarms'],
        response: "⚠️ **pH Alarm Troubleshooting:**\n\n1. **High pH:** Add a tiny splash of 'pH Down' (phosphoric acid) to the reservoir. Mix well and re-test after 15 minutes.\n2. **Low pH:** Add 'pH Up' (potassium hydroxide).\n3. **Sensor Drift:** If pH changes wildly, calibrate your pH probe using standard buffer solutions (4.0 and 7.0)."
      },
      crops_list: {
        keywords: ['crops list', 'what crops', 'supported crops', 'crops can i grow', 'crops'],
        response: "Farmspherica supports over 40 crops, including:\n\n• **Lettuce** (easy, cool temp, 5.5-6.0 pH)\n• **Basil** (herb, warm temp, 5.6-6.2 pH)\n• **Tomatoes** (vine, heavy feeder, 6.0-6.5 pH)\n• **Mint** (prolific, cool temp, 5.5-6.0 pH)\n\nAsk me about a specific crop to see its detailed growth settings!"
      },
      metrics_help: {
        keywords: ['dashboard', 'metrics', 'reading', 'panels', 'charts', 'data', 'how to read', 'how to read metrics'],
        response: "📊 On your **Dashboard**, you can track the status of your hydroponic setup:\n\n• **Live Indicators:** Show real-time Temperature, Humidity, pH, and EC.\n• **Optimal Targets:** pH is set at **6.2** and EC at **1.8 mS**.\n• **System Status:** Indicates if values are stable or need adjustment. Green blinking dots indicate active streaming."
      },
      nutrients: {
        keywords: ['nutrient', 'nutrients', 'npk', 'fertilizer', 'mix nutrients', 'feeding'],
        response: "🧪 Hydroponic nutrients typically consist of a **three-part liquid mix** (Grow, Bloom, and Micro) containing nitrogen, phosphorus, potassium (NPK), calcium, magnesium, and trace minerals.\n\n• **Mixing Rule:** Always add nutrients to water one by one. Mix thoroughly before adding the next to prevent minerals from binding and forming precipitates.\n• **Target EC:** Keep EC between **1.2 and 2.4 mS/cm** depending on crops."
      },
      lighting: {
        keywords: ['light', 'lighting', 'grow light', 'led', 'sunlight', 'sun', 'hours of light', 'grow lights'],
        response: "💡 **Lighting is critical** for indoor setups. Use Full-Spectrum LED grow lights:\n\n• **Duration:** Give leafy greens (Lettuce, Mint) **12-14 hours** of light. Fruiting plants (Tomatoes) need **14-18 hours**.\n• **Distance:** Keep LED panels **30cm - 45cm (12-18 inches)** away from the canopy to prevent leaf burn.\n• **Darkness:** Plants need rest! Use an automatic timer to ensure a regular day/night cycle."
      },
      yellow_leaves: {
        keywords: ['yellow leaves', 'yellowing', 'leaves yellow', 'deficient', 'yellow leaf', 'nutrients deficiency'],
        response: "⚠️ **Yellow leaves** usually signal a nutrient deficiency or environmental stress:\n\n1. **Nitrogen Deficiency:** Older bottom leaves yellow first and stems turn reddish.\n2. **Iron/Magnesium Deficiency:** Veins stay green while leaf margins yellow.\n3. **Incorrect pH:** If reservoir pH is outside 5.5-6.5, nutrients lock out and cannot be absorbed even if present.\n4. **High Temp/Root rot:** Damaged roots cannot uptake minerals."
      },
      pests: {
        keywords: ['pests', 'bugs', 'mites', 'aphids', 'whiteflies', 'insects', 'thrips'],
        response: "🐜 **Pest Management:** Controlled indoor systems reduce pests, but they can still occur:\n\n• **Spider Mites:** Tiny reddish dots under leaves and fine webbing.\n• **Aphids & Whiteflies:** Small bugs clustered on new shoots.\n• **Solutions:** Spray with organic **Neem oil** or insecticidal soap. Introduce beneficial insects (ladybugs) or use yellow sticky traps."
      },
      systems: {
        keywords: ['system type', 'nft', 'dwc', 'kratky', 'aeroponics', 'ebb and flow', 'hydroponic systems', 'systems'],
        response: "📐 Common Hydroponic Systems:\n\n1. **DWC (Deep Water Culture):** Roots sit directly in aerated water. Great for beginners.\n2. **NFT (Nutrient Film Technique):** A thin stream of water flows continuously over roots in sloped channels.\n3. **Kratky:** Passive system using stagnant water with an air gap. Needs zero electricity!\n4. **Ebb & Flow:** Periodically floods and drains grow trays."
      },
      cost: {
        keywords: ['cost', 'price', 'expensive', 'starting budget', 'budget', 'electricity'],
        response: "💰 **Starting Cost & Budget:**\n\n• **DIY setups** (Kratky/DWC) can cost as low as **₹1,000 - ₹3,000** using buckets and plastic cups.\n• **Home commercial kits** range between **₹8,000 - ₹25,000**.\n• **Operating cost:** LED lighting and air pumps draw very little power, making operating expenses extremely minimal compared to crop yields!"
      },
      testimonials: {
        keywords: ['testimonial', 'growers say', 'bipin', 'sneha', 'trivandra', 'reviews', 'stories', 'bipin gupta', 'sneha assam'],
        response: "Here is what our growers say:\n\n• **Bipin Gupta** (Urban grower, Bikaner): Went from zero knowledge to harvesting 8kg of lettuce weekly in under two months!\n• **Sneha** (Rooftop farmer, Assam): pH and EC alerts saved her first tomato crop by catching a nutrient imbalance 3 days early.\n• **Trivandra** (Commercial grower, Chennai): Uses Farmspherica to scale and monitor all systems from a single screen."
      },
      process_steps: {
        keywords: ['process', 'how it works', 'steps', 'step 1', 'step 2', 'step 3', 'plant your crops', 'monitor', 'harvest', 'procedure'],
        response: "Farmspherica operates in three easy steps:\n\n1. **Step 01: Plant your crops** - Choose from 40+ supported crops to build a personalized grow profile.\n2. **Step 02: Monitor in real time** - Sensors stream pH, EC, temperature, and humidity data every 30 seconds.\n3. **Step 03: Harvest with confidence** - Follow real-time growth progress bars and yield predictions."
      },
      benefits: {
        keywords: ['benefit', 'why farmspherica', 'advantages', 'features', 'nominal', 'pesticides', 'less water'],
        response: "Key benefits of Farmspherica:\n\n• **95% Less Water:** Uses recirculating nutrient delivery.\n• **3x Faster Growth:** Perfect nutrition and zero root stress.\n• **Zero Pesticides:** Controlled environments keep pests away.\n• **Anywhere, Anytime:** Grow in rooftops, basements, or warehouses across seasons."
      },
      chitchat_status: {
        keywords: ['how are you', 'how is it going', 'how do you do', 'sup', 'whats up', 'how are u', 'how u doing'],
        response: "I'm doing fantastic, thank you! 🌿 I'm busy checking the hydroponic systems and reading sensor feeds. How is your grow setup going today?"
      },
      chitchat_gratitude: {
        keywords: ['thank you', 'thanks', 'thx', 'appreciate', 'great help', 'awesome', 'lovely', 'cool', 'perfect', 'nice'],
        response: "You are very welcome! 😊 I'm always happy to help you grow smarter. Let me know if you need any more tips on pH, crops, or metrics!"
      },
      chitchat_farewell: {
        keywords: ['bye', 'goodbye', 'see you', 'cya', 'talk later', 'exit', 'quit', 'night'],
        response: "Goodbye! 👋 Happy growing, and may your reservoirs always stay balanced! Drop back in if you have more questions."
      },
      chitchat_jokes: {
        keywords: ['joke', 'funny', 'tell me a joke', 'laugh'],
        response: "Why did the tomato blush? 🍅\n\nBecause it saw the salad dressing!\n\n(Hydroponic jokes are the best, aren't they? 🌿)"
      },
      chitchat_compliment: {
        keywords: ['good job', 'you are smart', 'smart bot', 'genius', 'love you', 'amazing', 'lovly', 'lovely'],
        response: "Aw, thank you! 😊 I try my best to keep up with the latest urban agriculture research. Together, we make a great growing team!"
      }
    };

    const fallbackResponse = "I'm not sure I understand that completely. I'm trained on hydroponic farming guidelines! 🌿\n\nTry asking me about:\n• **pH levels** or **EC values**\n• Specific crops like **Lettuce, Basil, or Tomatoes**\n• How to prevent **root rot** or **algae**\n• FarmSpherica **water savings**\n\n💡 *Tip: Click the gear icon at the top to add a Google Gemini API Key and unlock fully live, generative responses!*";

    // Suggestions database
    const suggestionsByPage = {
      'index.html': [
        "🌿 How does hydroponics work?",
        "💧 Water saving stats",
        "🚀 Why grow 3x faster?",
        "📋 Supported crops list"
      ],
      'dashboard.html': [
        "📊 How to read metrics?",
        "⚠️ How to fix pH alarms?",
        "⚡ Target EC level?",
        "🌡️ Ideal water temp?"
      ],
      'crops.html': [
        "🥬 Growing Lettuce",
        "🌿 Growing Basil",
        "🍅 Growing Tomatoes",
        "🍀 Growing Mint"
      ],
      'stats.html': [
        "💧 Water saving stats",
        "📈 Why crops grow faster",
        "🥬 Supported crops list"
      ]
    };

    const defaultSuggestions = [
      "🌿 How does hydroponics work?",
      "📊 Ideal pH & EC?",
      "🥬 Tell me about crops",
      "⚠️ Root rot prevention"
    ];

    // Page specific welcome message
    let welcomeMessage = "Hi there! I'm Spherica AI, your smart hydroponics specialist. How can I help you optimize your setup today? 🌿";
    if (currentPage === 'dashboard.html') {
      welcomeMessage = "Welcome to your Live Dashboard! 📊 I can help you interpret the sensor readings (pH, EC, Temp, Humidity) or troubleshoot any alarms. Ask me anything!";
    } else if (currentPage === 'crops.html') {
      welcomeMessage = "Ready to plan your next grow cycle? 🥬 I can give you detailed pH, EC, and temperature profiles for Lettuce, Basil, Tomatoes, or Mint. Which crop are you interested in?";
    } else if (currentPage === 'stats.html') {
      welcomeMessage = "Farmspherica is built for maximum efficiency! 💧 Ask me about our 95% water savings or how we achieve 3x faster crop growth cycles.";
    }

    // Event handlers for trigger
    trigger.addEventListener('click', () => {
      const isOpen = chatWindow.classList.toggle('open');
      trigger.classList.toggle('active', isOpen);
      trigger.classList.add('read');
      if (isOpen) {
        inputField.focus();
      }
    });

    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      chatWindow.classList.remove('open');
      trigger.classList.remove('active');
      settingsPanel.classList.remove('open');
    });

    // Settings toggles
    settingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      settingsPanel.classList.toggle('open');
    });

    settingsClose.addEventListener('click', (e) => {
      e.stopPropagation();
      settingsPanel.classList.remove('open');
    });

    saveKeyBtn.addEventListener('click', () => {
      const key = apiKeyInput.value.trim();
      if (key) {
        geminiApiKey = key;
        localStorage.setItem('farmspherica_gemini_key', key);
        updateBotStatus();
        settingsPanel.classList.remove('open');
        appendMessage('bot', "✅ **Gemini API Key saved successfully!** I am now running in **Live AI Mode** and can answer any general query. Ask me anything!");
      } else {
        alert("Please enter a valid API key.");
      }
    });

    removeKeyBtn.addEventListener('click', () => {
      geminiApiKey = '';
      localStorage.removeItem('farmspherica_gemini_key');
      apiKeyInput.value = '';
      updateBotStatus();
      settingsPanel.classList.remove('open');
      appendMessage('bot', "🧹 **Gemini API Key cleared.** I have returned to **Smart Expert Mode** using my local hydroponics knowledge base.");
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        chatWindow.classList.remove('open');
        trigger.classList.remove('active');
        settingsPanel.classList.remove('open');
      }
    });

    // Render Messages
    function appendMessage(sender, text) {
      const messageDiv = document.createElement('div');
      messageDiv.className = `ai-message ${sender}`;

      const now = new Date();
      const timeString = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

      // Parse formatting
      let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      formattedText = formattedText.replace(/• (.*?)(?=\n|$)/g, '• $1');
      formattedText = formattedText.split('\n').join('<br>');

      messageDiv.innerHTML = `
          <div>${formattedText}</div>
          <span class="ai-message-time">${timeString}</span>
        `;
      messagesContainer.appendChild(messageDiv);
      scrollToBottom();
    }

    function scrollToBottom() {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Typing Indicator
    let typingIndicatorEl = null;

    function showTypingIndicator() {
      if (typingIndicatorEl) return;

      typingIndicatorEl = document.createElement('div');
      typingIndicatorEl.className = 'ai-message bot';
      typingIndicatorEl.style.padding = '0.5rem 0.8rem';
      typingIndicatorEl.innerHTML = `
          <div class="ai-typing-indicator">
            <span class="ai-typing-dot"></span>
            <span class="ai-typing-dot"></span>
            <span class="ai-typing-dot"></span>
          </div>
        `;
      messagesContainer.appendChild(typingIndicatorEl);
      scrollToBottom();
    }

    function hideTypingIndicator() {
      if (typingIndicatorEl) {
        typingIndicatorEl.remove();
        typingIndicatorEl = null;
      }
    }

    // Suggestions Chips Render
    function renderSuggestionChips() {
      suggestionsContainer.innerHTML = '';
      const chipsList = suggestionsByPage[currentPage] || defaultSuggestions;

      chipsList.forEach(suggestion => {
        const chip = document.createElement('div');
        chip.className = 'ai-suggest-chip';
        chip.textContent = suggestion;
        chip.addEventListener('click', () => {
          handleUserSubmit(suggestion);
        });
        suggestionsContainer.appendChild(chip);
      });
    }

    function startLearningMode() {
      showTypingIndicator();
      setTimeout(() => {
        hideTypingIndicator();
        learningState.active = true;
        learningState.step = 1;
        learningState.keywords = '';
        appendMessage('bot', "🧠 **Entering Learning Mode!**\n\nI'm ready to learn. What is the key phrase or topic name you want to teach me? (e.g. 'grow lights' or 'humidity target')");
      }, 600);
    }

    function processLearningStep(text) {
      showTypingIndicator();
      setTimeout(() => {
        hideTypingIndicator();
        if (learningState.step === 1) {
          learningState.keywords = text.toLowerCase().trim();
          learningState.step = 2;
          appendMessage('bot', `📝 Got it! When someone asks about "**${text}**", what should my response be? Please type the reply.`);
        } else if (learningState.step === 2) {
          const responseText = text;
          const newKey = 'user_' + Date.now();
          userTaughtData[newKey] = {
            keywords: [learningState.keywords],
            response: responseText
          };
          try {
            localStorage.setItem('farmspherica_taught_data', JSON.stringify(userTaughtData));
          } catch (e) {
            console.error("Failed to save taught data", e);
          }
          // Reset state
          learningState.active = false;
          learningState.step = 0;
          learningState.keywords = '';

          appendMessage('bot', `🎉 **Knowledge saved!** I have successfully saved this information in my persistent memory.\n\nTry typing your keyword "**${userTaughtData[newKey].keywords[0]}**" to test me!`);
        }
      }, 800);
    }

    // Match user query and respond
    function processBotReply(userQuery) {
      showTypingIndicator();

      // Disable inputs
      inputField.disabled = true;
      sendBtn.disabled = true;

      const cleaned = userQuery.toLowerCase().trim();

      // Check user-taught data first!
      let taughtResponse = null;
      for (const key in userTaughtData) {
        const item = userTaughtData[key];
        if (item.keywords.some(kw => isFuzzyMatch(userQuery, kw))) {
          taughtResponse = item.response;
          break;
        }
      }

      if (taughtResponse) {
        setTimeout(() => {
          hideTypingIndicator();
          appendMessage('bot', taughtResponse);
          inputField.disabled = false;
          sendBtn.disabled = false;
          inputField.focus();
        }, 800);
        return;
      }

      if (geminiApiKey) {
        // CALL LIVE GEMINI API
        const systemInstruction = `You are Spherica AI, a friendly, professional urban farming and hydroponics specialist integrated into the Farmspherica dashboard.
Answer this query concisely (typically 2-4 sentences) using practical, easy-to-follow advice.
Format your responses using bold text (**bold**) for key terms and bullet points (•) for lists.
The user is currently visiting the page: ${currentPage}. Keep it relevant.`;

        fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `${systemInstruction}\n\nUser Question: ${userQuery}`
              }]
            }]
          })
        })
          .then(res => {
            if (!res.ok) throw new Error("API request failed");
            return res.json();
          })
          .then(data => {
            hideTypingIndicator();
            let response = "";
            try {
              response = data.candidates[0].content.parts[0].text;
            } catch (e) {
              response = "Error parsing response from Gemini API. Please make sure your key is valid and has active quotas.";
            }
            appendMessage('bot', response);
          })
          .catch(err => {
            hideTypingIndicator();
            appendMessage('bot', "❌ **Connection Error:** Could not contact Gemini AI. Please check your internet connection and verify that your Gemini API key is valid.");
          })
          .finally(() => {
            inputField.disabled = false;
            sendBtn.disabled = false;
            inputField.focus();
          });

      } else {
        // FALLBACK TO SMART LOCAL KNOWLEDGE BASE
        const delay = Math.max(800, Math.min(1500, userQuery.length * 15));

        setTimeout(() => {
          hideTypingIndicator();

          let response = fallbackResponse;
          const cleaned = userQuery.toLowerCase().trim();

          // Match
          for (const key in hydroponicsKnowledge) {
            const item = hydroponicsKnowledge[key];
            if (item.keywords.some(kw => isFuzzyMatch(userQuery, kw))) {
              response = item.response;
              break;
            }
          }

          appendMessage('bot', response);

          // Re-enable
          inputField.disabled = false;
          sendBtn.disabled = false;
          inputField.focus();
        }, delay);
      }
    }

    function handleUserSubmit(text) {
      if (!text) return;
      appendMessage('user', text);

      const cleaned = text.trim();

      // 1. If currently in learning mode
      if (learningState.active) {
        processLearningStep(cleaned);
        return;
      }

      // 2. If user requests /teach command
      if (cleaned.toLowerCase() === '/teach' || cleaned.toLowerCase() === '/teah') {
        startLearningMode();
        return;
      }

      // 3. Otherwise normal bot reply
      processBotReply(cleaned);
    }

    // Send events
    sendBtn.addEventListener('click', () => {
      const text = inputField.value.trim();
      if (text) {
        handleUserSubmit(text);
        inputField.value = '';
      }
    });

    inputField.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const text = inputField.value.trim();
        if (text) {
          handleUserSubmit(text);
          inputField.value = '';
        }
      }
    });

    // Initial state load
    appendMessage('bot', welcomeMessage);
    renderSuggestionChips();
  }

  // Initialize the AI chatbot widget
  initAIChat();
  /* ══════════════════════════════════════
  17. CUSTOM CURSOR WITH COLOR TRAIL
══════════════════════════════════════ */
function initCustomCursor() {
  const cursor = document.createElement('div');
  cursor.id = 'custom-cursor';
  document.body.appendChild(cursor);

  // Pull colors from the current theme's CSS variables
  function getThemeColors() {
    const style = getComputedStyle(document.documentElement);
    return [
      style.getPropertyValue('--accent').trim(),
      style.getPropertyValue('--accent-light').trim(),
      style.getPropertyValue('--green-400').trim(),
      style.getPropertyValue('--green-200').trim(),
      '#ffffff',
    ].filter(Boolean);
  }

  let colors = getThemeColors();
  let colorIndex = 0;

  // Re-pull colors whenever the theme changes
  const themeObserver = new MutationObserver(() => {
    colors = getThemeColors();
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  });

  document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top  = e.clientY + 'px';

    colorIndex = (colorIndex + 1) % colors.length;
    const color = colors[colorIndex];
    cursor.style.backgroundColor = color;

    // Spawn trail dot
    const dot = document.createElement('div');
    dot.className = 'cursor-trail';
    dot.style.left = e.clientX + 'px';
    dot.style.top  = e.clientY + 'px';
    dot.style.backgroundColor = color;
    document.body.appendChild(dot);

    setTimeout(() => dot.remove(), 500);
  });

  // Slightly grow cursor on clickable elements
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest('a, button, [role="button"], input, select, textarea')) {
      cursor.style.transform = 'translate(-50%, -50%) scale(1.6)';
    }
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest('a, button, [role="button"], input, select, textarea')) {
      cursor.style.transform = 'translate(-50%, -50%) scale(1)';
    }
  });
}

initCustomCursor();

})();
//this is peak
