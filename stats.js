/* ============================================================
   FARMSPHERICA — stats.js
   Stats page logic: crop dataset, category chart heights,
   table progress bars, and a fake "live monitoring" feed.
   Designed to run alongside app.js (uses its reveal/observer
   patterns; no conflicts — separate selectors).
   ============================================================ */

(function () {
  'use strict';

  /* ══════════════════════════════════════
     1. CROP DATASET (17 crops, 5 categories)
     progress = simulated current grow progress %
  ══════════════════════════════════════ */
  const CROPS = [
    { name: 'Butterhead Lettuce', emoji: '🥬', category: 'Leafy Greens',  difficulty: 'Easy',     days: '25–30', progress: 64 },
    { name: 'Spinach',            emoji: '🥬', category: 'Leafy Greens',  difficulty: 'Easy',     days: '30–45', progress: 48 },
    { name: 'Kale',                emoji: '🥬', category: 'Leafy Greens',  difficulty: 'Medium',   days: '55–65', progress: 71 },
    { name: 'Arugula',             emoji: '🥬', category: 'Leafy Greens',  difficulty: 'Easy',     days: '20–30', progress: 38 },
    { name: 'Sweet Basil',         emoji: '🌿', category: 'Herbs',         difficulty: 'Easy',     days: '28–35', progress: 82 },
    { name: 'Peppermint',          emoji: '🌿', category: 'Herbs',         difficulty: 'Easy',     days: '30–40', progress: 55 },
    { name: 'Cilantro',            emoji: '🌿', category: 'Herbs',         difficulty: 'Medium',   days: '21–28', progress: 29 },
    { name: 'Chives',              emoji: '🌿', category: 'Herbs',         difficulty: 'Easy',     days: '30–40', progress: 90 },
    { name: 'Cherry Tomatoes',     emoji: '🍅', category: 'Fruiting',      difficulty: 'Advanced', days: '60–80', progress: 42 },
    { name: 'Cucumber',            emoji: '🥒', category: 'Fruiting',      difficulty: 'Medium',   days: '50–70', progress: 67 },
    { name: 'Bell Pepper',         emoji: '🫑', category: 'Fruiting',      difficulty: 'Advanced', days: '70–90', progress: 23 },
    { name: 'Strawberry',          emoji: '🍓', category: 'Fruiting',      difficulty: 'Medium',   days: '60–90', progress: 58 },
    { name: 'Radish',              emoji: '🥕', category: 'Root Crops',    difficulty: 'Easy',     days: '20–30', progress: 95 },
    { name: 'Beetroot',            emoji: '🥕', category: 'Root Crops',    difficulty: 'Medium',   days: '55–70', progress: 34 },
    { name: 'Sunflower Shoots',    emoji: '🌱', category: 'Microgreens',   difficulty: 'Easy',     days: '7–10',  progress: 88 },
    { name: 'Pea Shoots',          emoji: '🌱', category: 'Microgreens',   difficulty: 'Easy',     days: '10–14', progress: 72 },
    { name: 'Broccoli Microgreens',emoji: '🌱', category: 'Microgreens',   difficulty: 'Easy',     days: '7–12',  progress: 51 },
  ];

  const TOTAL_CROPS = CROPS.length;

  /* ══════════════════════════════════════
     2. OVERVIEW CARDS
  ══════════════════════════════════════ */
  function initOverview() {
    const totalEl = document.getElementById('stat-total-crops');
    const avgEl   = document.getElementById('stat-avg-progress');
    const harvestEl = document.getElementById('stat-near-harvest');
    const categoriesEl = document.getElementById('stat-categories');

    if (!totalEl) return;

    const avgProgress = Math.round(
      CROPS.reduce((sum, c) => sum + c.progress, 0) / TOTAL_CROPS
    );
    const nearHarvest = CROPS.filter(c => c.progress >= 80).length;
    const categories = new Set(CROPS.map(c => c.category)).size;

    totalEl.setAttribute('data-count', TOTAL_CROPS);
    avgEl.setAttribute('data-count', avgProgress);
    harvestEl.setAttribute('data-count', nearHarvest);
    categoriesEl.setAttribute('data-count', categories);
  }

  /* ══════════════════════════════════════
     3. CATEGORY DISTRIBUTION CHART
  ══════════════════════════════════════ */
  function initCategoryChart() {
    const chartWrap = document.getElementById('category-chart');
    if (!chartWrap) return;

    const categoryMeta = {
      'Leafy Greens': '🥬',
      'Herbs': '🌿',
      'Fruiting': '🍅',
      'Root Crops': '🥕',
      'Microgreens': '🌱',
    };

    // Count crops per category
    const counts = {};
    CROPS.forEach(c => {
      counts[c.category] = (counts[c.category] || 0) + 1;
    });

    const max = Math.max(...Object.values(counts));

    Object.entries(counts).forEach(([category, count]) => {
      const heightPct = Math.round((count / max) * 100);

      const col = document.createElement('div');
      col.className = 'chart-col';
      col.innerHTML = `
        <div class="chart-bar-track">
          <div class="chart-bar-fill" data-height="${heightPct}%">
            <span class="chart-bar-value">${count}</span>
          </div>
        </div>
        <div class="chart-col-label">
          <div class="chart-col-emoji">${categoryMeta[category] || '🌾'}</div>
          ${category}
        </div>
      `;
      chartWrap.appendChild(col);
    });

    // Animate bars in after a short delay (mirrors app.js initStatsBars timing)
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const bars = chartWrap.querySelectorAll('.chart-bar-fill[data-height]');
          bars.forEach((bar, i) => {
            setTimeout(() => {
              bar.style.height = bar.getAttribute('data-height');
            }, 150 + i * 80);
          });
          observer.unobserve(chartWrap);
        }
      });
    }, { threshold: 0.3 });

    observer.observe(chartWrap);
  }

  /* ══════════════════════════════════════
     4. CROP PERFORMANCE TABLE
  ══════════════════════════════════════ */
  function initCropTable() {
    const tbody = document.getElementById('crop-table-body');
    if (!tbody) return;

    CROPS.forEach(crop => {
      const diffClass = 'diff-' + crop.difficulty.toLowerCase();
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>
          <div class="crop-table-name">
            <span class="crop-table-emoji">${crop.emoji}</span>
            ${crop.name}
          </div>
        </td>
        <td>${crop.category}</td>
        <td>${crop.days} days</td>
        <td><span class="diff-pill ${diffClass}">${crop.difficulty}</span></td>
        <td>
          <span class="table-progress-track">
            <span class="table-progress-fill" data-width="${crop.progress}%"></span>
          </span>
          <span class="mono-stat">${crop.progress}%</span>
        </td>
      `;
      tbody.appendChild(row);
    });

    // Animate progress fills
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const fills = tbody.querySelectorAll('.table-progress-fill[data-width]');
          fills.forEach((fill, i) => {
            setTimeout(() => {
              fill.style.width = fill.getAttribute('data-width');
            }, 100 + i * 40);
          });
          observer.unobserve(tbody);
        }
      });
    }, { threshold: 0.1 });

    observer.observe(tbody);
  }

  /* ══════════════════════════════════════
     5. LIVE MONITORING FEED
     Fake rotating sensor/crop events
  ══════════════════════════════════════ */
  function initLiveFeed() {
    const feed = document.getElementById('live-feed');
    if (!feed) return;

    const events = [
      { type: 'ok',    text: 'pH stabilized at 6.2 in Channel A' },
      { type: 'ok',    text: 'Nutrient dosing cycle completed — EC at 1.8' },
      { type: 'ok',    text: 'Sweet Basil reached 82% growth — harvest window opening' },
      { type: 'warn',  text: 'Water temperature rising in Channel C — 26.4°C' },
      { type: 'ok',    text: 'Radish batch ready for harvest (95% complete)' },
      { type: 'ok',    text: 'Humidity holding steady at 68% across grow room' },
      { type: 'warn',  text: 'Cherry Tomato canopy needs pruning — light blockage detected' },
      { type: 'ok',    text: 'Pump cycle #142 completed — flow rate normal' },
      { type: 'alert', text: 'Low reservoir level in Tank 2 — refill recommended' },
      { type: 'ok',    text: 'New seedlings transplanted: Pea Shoots tray 4' },
      { type: 'ok',    text: 'Dissolved oxygen levels optimal — 7.2 mg/L' },
      { type: 'warn',  text: 'EC drifting slightly high in Channel B — monitor closely' },
      { type: 'ok',    text: 'Broccoli Microgreens crossed 50% growth stage' },
      { type: 'ok',    text: 'Daily nutrient mix recalibrated automatically' },
      { type: 'ok',    text: 'Cucumber vines trained along trellis — Row 3' },
      { type: 'warn',  text: 'Light intensity dipped during cloud cover — backup LEDs engaged' },
      { type: 'ok',    text: 'Strawberry tower irrigation completed' },
      { type: 'ok',    text: 'Air circulation fans cycled — CO₂ refreshed' },
    ];

    let index = 0;
    const maxItems = 8;

    function timeAgoLabel(secondsAgo) {
      if (secondsAgo < 60) return 'just now';
      const mins = Math.round(secondsAgo / 60);
      return mins + (mins === 1 ? ' min ago' : ' mins ago');
    }

    function addFeedItem() {
      const ev = events[index % events.length];
      index++;

      const item = document.createElement('div');
      item.className = 'feed-item';
      item.innerHTML = `
        <span class="feed-dot ${ev.type === 'ok' ? '' : ev.type}"></span>
        <div class="feed-body">
          <div class="feed-text">${ev.text}</div>
          <div class="feed-time">just now</div>
        </div>
      `;

      feed.insertBefore(item, feed.firstChild);

      // Trim list
      while (feed.children.length > maxItems) {
        feed.removeChild(feed.lastChild);
      }

      // Update "time ago" labels for existing items
      updateFeedTimestamps();
    }

    // Track creation time per item for relative timestamps
    const itemTimes = new WeakMap();

    function updateFeedTimestamps() {
      const now = Date.now();
      Array.from(feed.children).forEach(item => {
        if (!itemTimes.has(item)) {
          itemTimes.set(item, now);
        }
        const created = itemTimes.get(item);
        const secondsAgo = Math.round((now - created) / 1000);
        const timeEl = item.querySelector('.feed-time');
        if (timeEl) timeEl.textContent = timeAgoLabel(secondsAgo);
      });
    }

    // Seed feed with a few initial items (staggered "ages")
    for (let i = 0; i < 4; i++) {
      addFeedItem();
    }

    // Refresh timestamps every 20s
    setInterval(updateFeedTimestamps, 20000);

    // Add a new event every ~12s
    setInterval(addFeedItem, 12000);
  }

  /* ══════════════════════════════════════
     6. INIT (only runs if stats elements exist)
  ══════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', () => {
    initOverview();
    initCategoryChart();
    initCropTable();
    initLiveFeed();
  });

  // In case script loads after DOMContentLoaded already fired
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initOverview();
    initCategoryChart();
    initCropTable();
    initLiveFeed();
  }

})();