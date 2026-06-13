/* ============================================================
   FARMSPHERICA — dashboard.js
   Live sensors · Bar chart · Progress bars · Clock
   Alerts · Activity log · Insights
   ============================================================ */

(function () {
  'use strict';

  /* ══════════════════════════════════════
     0. APPLY ADMIN OVERRIDES (from admin.html)
  ══════════════════════════════════════ */
  const ADMIN_DATA_KEY = 'farmspherica-data';
  let adminOverrides = null;
  try {
    const raw = localStorage.getItem(ADMIN_DATA_KEY);
    if (raw) adminOverrides = JSON.parse(raw);
  } catch (e) { /* ignore bad data */ }

  let defaultStatusText = 'All systems nominal — nutrients balanced, temperature stable, pH in optimal range';

  function applyAdminOverrides() {
    if (!adminOverrides) return;

    // Status banner default text
    if (adminOverrides.statusText) {
      defaultStatusText = adminOverrides.statusText;
      const textEl = document.getElementById('statusText');
      if (textEl) textEl.textContent = defaultStatusText;
    }

    // Plant growth tracker
    if (Array.isArray(adminOverrides.plants)) {
      const items = document.querySelectorAll('#plantList .plant-item');
      adminOverrides.plants.forEach((plant, i) => {
        const item = items[i];
        if (!item) return;
        const emojiEl = item.querySelector('.plant-item-emoji');
        const nameEl  = item.querySelector('.plant-item-name');
        const metaEl  = item.querySelector('.plant-item-meta');
        const pctEl   = item.querySelector('.plant-item-pct');
        const fillEl  = item.querySelector('.plant-progress-fill');
        if (emojiEl) emojiEl.textContent = plant.emoji;
        if (nameEl)  nameEl.textContent  = plant.name;
        if (metaEl)  metaEl.textContent  = `Day ${plant.day} · Harvest in ${plant.harvest} days`;
        if (pctEl)   pctEl.textContent   = `${plant.pct}%`;
        if (fillEl)  fillEl.setAttribute('data-width', Math.max(0, Math.min(100, plant.pct)) + '%');
      });
    }

    // Quick stats (This Cycle panel) — order matches the HTML
    if (adminOverrides.quickStats) {
      const qs = adminOverrides.quickStats;
      const order = ['daysRunning', 'activeCrops', 'uptime', 'litresSaved', 'alertsResolved', 'peakTemp'];
      document.querySelectorAll('.quick-stat-num[data-count]').forEach((el, i) => {
        const key = order[i];
        if (key && qs[key] !== undefined) el.setAttribute('data-count', qs[key]);
      });
    }

    // Next harvest countdown
    if (adminOverrides.nextHarvest) {
      const harvestDaysEl = document.getElementById('harvestDays');
      const harvestCropEl = document.querySelector('.harvest-crop');
      const harvestIconEl = document.querySelector('.harvest-icon');
      if (harvestDaysEl) harvestDaysEl.textContent = adminOverrides.nextHarvest.days;
      if (harvestCropEl) harvestCropEl.textContent = adminOverrides.nextHarvest.crop;
      if (harvestIconEl) harvestIconEl.textContent = adminOverrides.nextHarvest.icon;
    }
  }

  applyAdminOverrides();

  /* ══════════════════════════════════════
     1. LIVE CLOCK
  ══════════════════════════════════════ */
  const clockEl   = document.getElementById('live-clock');
  const refreshEl = document.getElementById('last-refreshed');

  function updateClock() {
    if (!clockEl) return;
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  }
  updateClock();
  setInterval(updateClock, 1000);

  function setRefreshed() {
    if (!refreshEl) return;
    const now = new Date();
    refreshEl.textContent = 'Updated ' + now.toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit'
    });
    // Spin the refresh icon
    const icon = document.getElementById('refreshIcon');
    if (icon) {
      icon.classList.add('spinning');
      setTimeout(() => icon.classList.remove('spinning'), 600);
    }
  }
  setRefreshed();
  setInterval(setRefreshed, 30000);

  /* ══════════════════════════════════════
     2. SENSOR DATA + LIVE TICK
  ══════════════════════════════════════ */
  const sensors = {
    ph:    { el: document.getElementById('sensor-ph'),    val: 6.2,  min: 5.5,  max: 7.0,  step: 0.04,  dec: 1,  barId: 'bar-ph',    trendId: 'trend-ph',    barMin: 5.5, barMax: 7.0  },
    temp:  { el: document.getElementById('sensor-temp'),  val: 22.0, min: 18,   max: 28,   step: 0.15,  dec: 1,  barId: 'bar-temp',  trendId: 'trend-temp',  barMin: 18,  barMax: 28   },
    ec:    { el: document.getElementById('sensor-ec'),    val: 1.8,  min: 1.4,  max: 2.4,  step: 0.03,  dec: 1,  barId: 'bar-ec',    trendId: 'trend-ec',    barMin: 1.4, barMax: 2.4  },
    hum:   { el: document.getElementById('sensor-hum'),   val: 78,   min: 55,   max: 85,   step: 0.8,   dec: 0,  barId: 'bar-hum',   trendId: 'trend-hum',   barMin: 55,  barMax: 85   },
    light: { el: document.getElementById('sensor-light'), val: 14,   min: 12,   max: 18,   step: 0,     dec: 0,  barId: 'bar-light', trendId: 'trend-light', barMin: 12,  barMax: 18   },
    water: { el: document.getElementById('sensor-water'), val: 2.4,  min: 1.5,  max: 4.0,  step: 0.05,  dec: 1,  barId: 'bar-water', trendId: 'trend-water', barMin: 1.5, barMax: 4.0  },
  };

  function pct(val, min, max) {
    return Math.round(((val - min) / (max - min)) * 100);
  }

  // Apply admin-saved sensor values
  if (adminOverrides && adminOverrides.sensors) {
    Object.keys(sensors).forEach(key => {
      const override = adminOverrides.sensors[key];
      if (!override) return;
      const s = sensors[key];
      s.val = override.value;
      if (s.el) s.el.textContent = s.val.toFixed(s.dec);

      // Also update the bar's data-width so initBarFills animates to the right spot
      const bar = document.getElementById(s.barId);
      if (bar) {
        const p = pct(s.val, s.barMin, s.barMax);
        bar.setAttribute('data-width', Math.min(100, Math.max(4, p)) + '%');
      }
    });
  }

  // Animate bar fills on load
  function initBarFills() {
    document.querySelectorAll('[data-width]').forEach(el => {
      setTimeout(() => {
        el.style.width = el.getAttribute('data-width');
      }, 400);
    });
  }
  initBarFills();

  function getTrend(key, newVal) {
    const s = sensors[key];
    const mid = (s.min + s.max) / 2;
    if (key === 'hum' && newVal > 75) return { text: '⚠ High',   cls: 'trend-warn' };
    if (key === 'ec'  && newVal < 1.6) return { text: '⚠ Low',    cls: 'trend-warn' };
    if (newVal > mid) return { text: '↑ Good',    cls: 'trend-up'     };
    if (newVal < mid) return { text: '↓ Normal',  cls: 'trend-stable' };
    return             { text: '↔ Stable',  cls: 'trend-stable' };
  }

  function tickSensors() {
    Object.entries(sensors).forEach(([key, s]) => {
      if (s.step === 0) return; // static value (light cycle)
      const delta = (Math.random() - 0.5) * 2 * s.step;
      s.val = Math.min(s.max, Math.max(s.min, +(s.val + delta).toFixed(s.dec)));

      if (s.el) {
        s.el.textContent = s.val.toFixed(s.dec);
        // Flash on change
        s.el.style.color = 'var(--accent)';
        setTimeout(() => { s.el.style.color = ''; }, 400);
      }

      // Update bar
      const bar = document.getElementById(s.barId);
      if (bar) {
        const p = pct(s.val, s.barMin, s.barMax);
        bar.style.width = Math.min(100, Math.max(4, p)) + '%';
        // Warn colour for humidity
        if (key === 'hum' && s.val > 75) bar.classList.add('warn');
        else bar.classList.remove('warn');
      }

      // Update trend badge
      const trendEl = document.getElementById(s.trendId);
      if (trendEl) {
        const trend = getTrend(key, s.val);
        trendEl.textContent = trend.text;
        trendEl.className   = 'stat-card-trend ' + trend.cls;
      }
    });

    // Update status banner
    updateStatusBanner();
  }

  setInterval(tickSensors, 6000);

  /* ══════════════════════════════════════
     3. STATUS BANNER
  ══════════════════════════════════════ */
  function updateStatusBanner() {
    const banner   = document.getElementById('statusBanner');
    const textEl   = document.getElementById('statusText');
    const badge    = document.getElementById('alertBadge');
    if (!banner || !textEl) return;

    const humHigh = sensors.hum.val > 75;
    const ecLow   = sensors.ec.val  < 1.6;
    const issues  = [humHigh && 'humidity high', ecLow && 'EC low'].filter(Boolean);

    if (issues.length) {
      banner.classList.add('warn');
      textEl.textContent = '⚠ Attention — ' + issues.join(' · ') + '. Check your system.';
      if (badge) badge.textContent = issues.length;
    } else {
      banner.classList.remove('warn');
      textEl.textContent = defaultStatusText;
      if (badge) badge.textContent = '0';
      if (badge) badge.style.display = issues.length ? '' : 'none';
    }
  }

  // Dismiss banner
  document.getElementById('bannerClose')?.addEventListener('click', () => {
    const banner = document.getElementById('statusBanner');
    if (banner) {
      banner.style.opacity = '0';
      banner.style.transform = 'translateY(-8px)';
      banner.style.transition = 'all 0.3s ease';
      setTimeout(() => banner.style.display = 'none', 300);
    }
  });

  /* ══════════════════════════════════════
     4. PLANT PROGRESS BARS
  ══════════════════════════════════════ */
  function initPlantBars() {
    const fills = document.querySelectorAll('.plant-progress-fill.dash-bar-fill');
    fills.forEach((el, i) => {
      const target = el.getAttribute('data-width');
      if (!target) return;
      setTimeout(() => {
        el.style.width = target;
      }, 500 + i * 80);
    });
  }
  initPlantBars();

  /* ══════════════════════════════════════
     5. BAR CHART
  ══════════════════════════════════════ */
  const chartData = {
    ph:   {
      label: 'pH Level — optimal range 5.5 – 7.0',
      unit: 'pH',
      values: [6.0, 6.1, 6.3, 6.2, 6.4, 6.1, 6.2],
      min: 5.5, max: 7.0
    },
    temp: {
      label: 'Temperature — optimal range 18 – 28°C',
      unit: '°C',
      values: [21.2, 22.0, 21.8, 22.5, 23.0, 22.1, 22.0],
      min: 18, max: 28
    },
    ec:   {
      label: 'EC Level — optimal range 1.4 – 2.4 mS/cm',
      unit: 'mS',
      values: [2.0, 1.9, 1.8, 1.9, 1.8, 1.7, 1.8],
      min: 1.4, max: 2.4
    },
    hum:  {
      label: 'Humidity — optimal range 55 – 75%',
      unit: '%',
      values: [65, 68, 70, 72, 75, 76, 78],
      min: 55, max: 85
    },
  };

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Now'];
  let activeMetric = 'ph';

  function buildChart(metric) {
    const data      = chartData[metric];
    const barsEl    = document.getElementById('chartBars');
    const xLabels   = document.getElementById('chartXLabels');
    const yLabels   = document.getElementById('chartYLabels');
    const legendEl  = document.getElementById('chartLegendLabel');
    if (!barsEl || !xLabels || !yLabels) return;

    // Y labels
    const ySteps = 4;
    const range  = data.max - data.min;
    yLabels.innerHTML = '';
    for (let i = ySteps; i >= 0; i--) {
      const v   = data.min + (range / ySteps) * i;
      const lbl = document.createElement('span');
      lbl.className   = 'chart-y-label';
      lbl.textContent = v.toFixed(metric === 'hum' ? 0 : 1) + (metric === 'temp' ? '°' : '');
      yLabels.appendChild(lbl);
    }

    // Bars
    barsEl.innerHTML = '';
    data.values.forEach((val, i) => {
      const heightPct = Math.round(((val - data.min) / range) * 100);
      const col       = document.createElement('div');
      col.className   = 'chart-bar-col';

      const fill = document.createElement('div');
      fill.className      = 'chart-bar-fill';
      fill.setAttribute('data-value', val.toFixed(metric === 'hum' ? 0 : 1) + data.unit);
      fill.style.height   = '0%';
      if (i === data.values.length - 1) fill.classList.add('active-bar');

      col.appendChild(fill);
      barsEl.appendChild(col);

      // Animate in staggered
      setTimeout(() => {
        fill.style.height = Math.max(4, heightPct) + '%';
      }, 100 + i * 60);
    });

    // X labels
    xLabels.innerHTML = '';
    dayLabels.forEach(day => {
      const lbl = document.createElement('span');
      lbl.className   = 'chart-x-label';
      lbl.textContent = day;
      xLabels.appendChild(lbl);
    });

    // Legend
    if (legendEl) legendEl.textContent = data.label;
  }

  // Tab switching
  document.querySelectorAll('.chart-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeMetric = tab.getAttribute('data-metric');
      buildChart(activeMetric);
    });
  });

  // Build initial chart
  buildChart('ph');

  // Auto-update the last bar every 6s to match live sensor
  setInterval(() => {
    const data  = chartData[activeMetric];
    const bars  = document.querySelectorAll('.chart-bar-fill');
    const last  = bars[bars.length - 1];
    if (!last || !sensors[activeMetric]) return;

    const val   = sensors[activeMetric].val;
    const range = data.max - data.min;
    const h     = Math.max(4, Math.round(((val - data.min) / range) * 100));
    last.style.height = h + '%';
    last.setAttribute('data-value', val.toFixed(activeMetric === 'hum' ? 0 : 1) + data.unit);
  }, 6000);

  /* ══════════════════════════════════════
     6. ACTIVITY LOG — LIVE EVENTS
  ══════════════════════════════════════ */
  const logMessages = [
    { type: 'good', text: 'pH stable within target range' },
    { type: 'good', text: 'Water pump flow verified — 2.4 L/hr' },
    { type: 'info', text: 'Sensor readings synced to dashboard' },
    { type: 'warn', text: 'Humidity nudging above 75% — monitor' },
    { type: 'good', text: 'Root zone temperature optimal at 20°C' },
    { type: 'info', text: 'EC reading logged — 1.8 mS/cm' },
    { type: 'good', text: 'Light cycle on schedule' },
    { type: 'info', text: 'Daily system health check passed' },
  ];

  let logIndex = 0;

  function addLogEntry() {
    const log = document.getElementById('activityLog');
    if (!log) return;

    const msg  = logMessages[logIndex % logMessages.length];
    logIndex++;

    const item = document.createElement('div');
    item.className = 'activity-item activity-' + msg.type;
    item.style.opacity = '0';
    item.style.transform = 'translateX(-8px)';
    item.style.transition = 'all 0.4s ease';
    item.innerHTML = `
      <div class="activity-dot dot-${msg.type}"></div>
      <div class="activity-body">
        <p class="activity-text">${msg.text}</p>
        <span class="activity-time">Just now</span>
      </div>
    `;

    // Prepend to top
    log.insertBefore(item, log.firstChild);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        item.style.opacity = '1';
        item.style.transform = 'translateX(0)';
      });
    });

    // Trim log to 12 items
    const items = log.querySelectorAll('.activity-item');
    if (items.length > 12) {
      items[items.length - 1].remove();
    }

    // Update badge
    const badge = document.getElementById('alertBadge');
    if (badge && msg.type === 'warn') {
      const count = parseInt(badge.textContent) || 0;
      badge.textContent = count + 1;
      badge.style.display = '';
    }
  }

  // Add a new log entry every 20 seconds
  setInterval(addLogEntry, 20000);

  // Clear log button
  document.getElementById('clearLogBtn')?.addEventListener('click', () => {
    const log   = document.getElementById('activityLog');
    const badge = document.getElementById('alertBadge');
    if (!log) return;

    // Fade out all items
    log.querySelectorAll('.activity-item').forEach((item, i) => {
      setTimeout(() => {
        item.style.opacity = '0';
        item.style.transform = 'translateX(8px)';
        item.style.transition = 'all 0.25s ease';
      }, i * 30);
    });

    setTimeout(() => {
      log.innerHTML = `
        <div class="activity-item activity-info">
          <div class="activity-dot dot-info"></div>
          <div class="activity-body">
            <p class="activity-text">Log cleared — monitoring continues</p>
            <span class="activity-time">Just now</span>
          </div>
        </div>
      `;
      if (badge) { badge.textContent = '0'; badge.style.display = 'none'; }
    }, 400);
  });

  /* ══════════════════════════════════════
     7. COUNT-UP NUMBERS
  ══════════════════════════════════════ */
  function animateCount(el) {
    const target   = parseInt(el.getAttribute('data-count'), 10);
    const suffix   = el.getAttribute('data-suffix') || '';
    const duration = 1600;
    const start    = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(e * target) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        countObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-count]').forEach(el => countObserver.observe(el));

  /* ══════════════════════════════════════
     8. HARVEST COUNTDOWN
  ══════════════════════════════════════ */
  function updateHarvestCountdown() {
    // Just for display — counts down visually from 12
    const el = document.getElementById('harvestDays');
    if (el) {
      let days = parseInt(el.textContent);
      // Demo only: decrement by 1 every hour (won't actually change in a session)
    }
  }

  /* ══════════════════════════════════════
     9. ALERT BUTTON SCROLL TO INSIGHTS
  ══════════════════════════════════════ */
  document.getElementById('alertToggleBtn')?.addEventListener('click', () => {
    const panel = document.getElementById('insightsPanel');
    if (panel) {
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Briefly highlight
      panel.style.boxShadow = '0 0 0 2px var(--accent), ' + getComputedStyle(document.documentElement).getPropertyValue('--card-shadow');
      setTimeout(() => panel.style.boxShadow = '', 1500);
    }
  });

  /* ══════════════════════════════════════
     10. REVEAL ANIMATIONS
  ══════════════════════════════════════ */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });

  document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(el => {
    revealObserver.observe(el);
  });

  /* ══════════════════════════════════════
     11. INSIGHTS — DISMISS
  ══════════════════════════════════════ */
  document.querySelectorAll('.insight-item').forEach(item => {
    item.addEventListener('dblclick', () => {
      item.style.opacity    = '0';
      item.style.transform  = 'translateX(20px)';
      item.style.transition = 'all 0.3s ease';
      item.style.maxHeight  = item.offsetHeight + 'px';
      setTimeout(() => {
        item.style.maxHeight  = '0';
        item.style.padding    = '0';
        item.style.margin     = '0';
        item.style.overflow   = 'hidden';
      }, 300);
      setTimeout(() => item.remove(), 600);

      // Update count
      const countEl = document.getElementById('insightCount');
      if (countEl) {
        const n = parseInt(countEl.textContent) - 1;
        countEl.textContent = Math.max(0, n) + ' new';
      }
    });
  });

})();