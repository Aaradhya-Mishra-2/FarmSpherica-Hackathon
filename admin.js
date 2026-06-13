/* ============================================================
   FARMSPHERICA — admin.js
   Handles: admin login auth, admin panel CRUD (localStorage)
   ============================================================ */

(function () {
  'use strict';

  const AUTH_KEY = 'farmspherica-admin';
  const DATA_KEY = 'farmspherica-data';
  const ADMIN_USER = 'admin';
  const ADMIN_PASS = 'farmspherica';

  /* ── Default data (mirrors dashboard.html defaults) ── */
  const DEFAULT_DATA = {
    statusText: 'All systems nominal — nutrients balanced, temperature stable, pH in optimal range',
    sensors: {
      ph:    { value: 6.2,  bar: 74 },
      temp:  { value: 22.0, bar: 68 },
      ec:    { value: 1.8,  bar: 60 },
      hum:   { value: 78,   bar: 88 },
      light: { value: 14,   bar: 58 },
      water: { value: 2.4,  bar: 48 }
    },
    plants: [
      { emoji: '🥬', name: 'Butterhead Lettuce',  day: 18, harvest: 12, pct: 82 },
      { emoji: '🌿', name: 'Sweet Basil',          day: 14, harvest: 21, pct: 67 },
      { emoji: '🍅', name: 'Cherry Tomatoes',      day: 45, harvest: 35, pct: 56 },
      { emoji: '🍃', name: 'Peppermint',           day: 22, harvest: 18, pct: 45 },
      { emoji: '🥒', name: 'Cucumber',             day: 28, harvest: 42, pct: 38 },
      { emoji: '🌱', name: 'Broccoli Microgreens', day: 4,  harvest: 8,  pct: 33 }
    ],
    quickStats: {
      daysRunning: 18,
      activeCrops: 6,
      uptime: 94,
      litresSaved: 12,
      alertsResolved: 3,
      peakTemp: 31
    },
    nextHarvest: {
      icon: '🥬',
      crop: 'Butterhead Lettuce',
      days: 12
    }
  };

  function loadData() {
    try {
      const raw = localStorage.getItem(DATA_KEY);
      if (!raw) return JSON.parse(JSON.stringify(DEFAULT_DATA));
      const parsed = JSON.parse(raw);
      // Shallow-merge so missing keys fall back to defaults
      return Object.assign({}, JSON.parse(JSON.stringify(DEFAULT_DATA)), parsed);
    } catch (e) {
      return JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
  }

  function saveData(data) {
    localStorage.setItem(DATA_KEY, JSON.stringify(data));
  }

  function isLoggedIn() {
    return sessionStorage.getItem(AUTH_KEY) === 'true';
  }

  function logout() {
    sessionStorage.removeItem(AUTH_KEY);
    window.location.href = 'admin-login.html';
  }

  /* ══════════════════════════════════════
     LOGIN PAGE
  ══════════════════════════════════════ */
  const loginForm = document.getElementById('adminLoginForm');
  if (loginForm) {
    // If already logged in, skip straight to panel
    if (isLoggedIn()) {
      window.location.href = 'admin.html';
    }

    const errorEl = document.getElementById('adminError');

    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const user = document.getElementById('adminUser').value.trim();
      const pass = document.getElementById('adminPass').value;

      if (user === ADMIN_USER && pass === ADMIN_PASS) {
        sessionStorage.setItem(AUTH_KEY, 'true');
        window.location.href = 'admin.html';
      } else {
        errorEl.classList.add('show');
        document.getElementById('adminPass').value = '';
        document.getElementById('adminPass').focus();
      }
    });
  }

  /* ══════════════════════════════════════
     ADMIN PANEL
  ══════════════════════════════════════ */
  const adminMain = document.querySelector('.admin-main');
  if (adminMain) {

    // Guard: redirect to login if not authenticated
    if (!isLoggedIn()) {
      window.location.href = 'admin-login.html';
      return;
    }

    const data = loadData();

    /* ── Populate sensor fields ── */
    const sensorMap = {
      ph: 'f-ph', temp: 'f-temp', ec: 'f-ec',
      hum: 'f-hum', light: 'f-light', water: 'f-water'
    };
    const barMap = {
      ph: 'f-bar-ph', temp: 'f-bar-temp', ec: 'f-bar-ec',
      hum: 'f-bar-hum', light: 'f-bar-light', water: 'f-bar-water'
    };
    Object.keys(sensorMap).forEach(key => {
      const valEl = document.getElementById(sensorMap[key]);
      const barEl = document.getElementById(barMap[key]);
      if (valEl) valEl.value = data.sensors[key].value;
      if (barEl) barEl.value = data.sensors[key].bar;
    });

    /* ── Status banner ── */
    const statusEl = document.getElementById('f-status-text');
    if (statusEl) statusEl.value = data.statusText;

    /* ── Plant rows ── */
    const plantList = document.getElementById('plantEditList');
    function renderPlantRows() {
      plantList.innerHTML = '';
      data.plants.forEach((plant, i) => {
        const row = document.createElement('div');
        row.className = 'admin-plant-edit-row';
        row.innerHTML = `
          <div class="admin-field admin-plant-emoji-field">
            <label>Icon</label>
            <input type="text" maxlength="4" data-field="emoji" data-idx="${i}" value="${plant.emoji}" />
          </div>
          <div class="admin-field">
            <label>Crop name</label>
            <input type="text" data-field="name" data-idx="${i}" value="${plant.name}" />
          </div>
          <div class="admin-field">
            <label>Day</label>
            <input type="number" step="1" min="0" data-field="day" data-idx="${i}" value="${plant.day}" />
          </div>
          <div class="admin-field">
            <label>Harvest in (days)</label>
            <input type="number" step="1" min="0" data-field="harvest" data-idx="${i}" value="${plant.harvest}" />
          </div>
          <div class="admin-field">
            <label>Growth (%)</label>
            <input type="number" step="1" min="0" max="100" data-field="pct" data-idx="${i}" value="${plant.pct}" />
          </div>
        `;
        plantList.appendChild(row);
      });
    }
    renderPlantRows();

    /* ── Quick stats ── */
    document.getElementById('f-days-running').value = data.quickStats.daysRunning;
    document.getElementById('f-active-crops').value = data.quickStats.activeCrops;
    document.getElementById('f-uptime').value = data.quickStats.uptime;
    document.getElementById('f-litres-saved').value = data.quickStats.litresSaved;
    document.getElementById('f-alerts-resolved').value = data.quickStats.alertsResolved;
    document.getElementById('f-peak-temp').value = data.quickStats.peakTemp;

    /* ── Next harvest ── */
    document.getElementById('f-harvest-crop').value = data.nextHarvest.crop;
    document.getElementById('f-harvest-days').value = data.nextHarvest.days;
    document.getElementById('f-harvest-icon').value = data.nextHarvest.icon;

    /* ── Save handler ── */
    const saveMsg = document.getElementById('saveMsg');
    document.getElementById('saveAllBtn').addEventListener('click', () => {
      const newData = JSON.parse(JSON.stringify(data));

      // Sensors
      Object.keys(sensorMap).forEach(key => {
        const valEl = document.getElementById(sensorMap[key]);
        const barEl = document.getElementById(barMap[key]);
        newData.sensors[key].value = parseFloat(valEl.value);
        newData.sensors[key].bar = Math.max(0, Math.min(100, parseFloat(barEl.value)));
      });

      // Status text
      newData.statusText = document.getElementById('f-status-text').value.trim();

      // Plants
      plantList.querySelectorAll('input').forEach(input => {
        const idx = parseInt(input.getAttribute('data-idx'), 10);
        const field = input.getAttribute('data-field');
        if (field === 'name' || field === 'emoji') {
          newData.plants[idx][field] = input.value;
        } else {
          newData.plants[idx][field] = Math.max(0, parseInt(input.value, 10) || 0);
        }
      });

      // Quick stats
      newData.quickStats.daysRunning   = parseInt(document.getElementById('f-days-running').value, 10) || 0;
      newData.quickStats.activeCrops   = parseInt(document.getElementById('f-active-crops').value, 10) || 0;
      newData.quickStats.uptime        = parseInt(document.getElementById('f-uptime').value, 10) || 0;
      newData.quickStats.litresSaved   = parseInt(document.getElementById('f-litres-saved').value, 10) || 0;
      newData.quickStats.alertsResolved = parseInt(document.getElementById('f-alerts-resolved').value, 10) || 0;
      newData.quickStats.peakTemp      = parseInt(document.getElementById('f-peak-temp').value, 10) || 0;

      // Next harvest
      newData.nextHarvest.crop = document.getElementById('f-harvest-crop').value.trim();
      newData.nextHarvest.days = parseInt(document.getElementById('f-harvest-days').value, 10) || 0;
      newData.nextHarvest.icon = document.getElementById('f-harvest-icon').value.trim();

      saveData(newData);

      saveMsg.classList.add('show');
      setTimeout(() => saveMsg.classList.remove('show'), 3000);
    });

    /* ── Reset to defaults ── */
    document.getElementById('resetDataBtn').addEventListener('click', () => {
      if (!confirm('Reset all dashboard data back to the original defaults?')) return;
      localStorage.removeItem(DATA_KEY);
      window.location.reload();
    });

    /* ── Logout ── */
    const logoutBtn = document.getElementById('adminLogoutBtn');
    const logoutBtnMobile = document.getElementById('adminLogoutBtnMobile');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
    if (logoutBtnMobile) logoutBtnMobile.addEventListener('click', (e) => { e.preventDefault(); logout(); });
  }

  /* ══════════════════════════════════════
     EXPOSE DATA LOADER for dashboard.js
  ══════════════════════════════════════ */
  window.FarmspherciaAdminData = {
    load: loadData,
    DEFAULT_DATA: DEFAULT_DATA
  };

})();