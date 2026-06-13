/* ============================================================
   FARMSPHERICA — auth.js
   Client-side account system using localStorage
   Include this on EVERY page before app.js
   ============================================================ */

const FarmAuth = (function () {
  'use strict';

  const USERS_KEY   = 'fs_users';
  const SESSION_KEY = 'fs_session';

  /* ══════════════════════════════════════
     STORAGE HELPERS
  ══════════════════════════════════════ */
  function getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
    catch { return []; }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || null; }
    catch { return null; }
  }

  function saveSession(user) {
    const session = {
      id:        user.id,
      email:     user.email,
      firstName: user.firstName,
      lastName:  user.lastName,
      avatar:    user.avatar,
      loginTime: Date.now()
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  /* Simple hash — NOT cryptographic, fine for a demo */
  function hashPassword(pass) {
    let hash = 0;
    for (let i = 0; i < pass.length; i++) {
      hash = ((hash << 5) - hash) + pass.charCodeAt(i);
      hash |= 0;
    }
    return hash.toString(36);
  }

  function generateId() {
    return 'u_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }

  function getInitials(firstName, lastName) {
    return ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase();
  }

  /* ══════════════════════════════════════
     PUBLIC API
  ══════════════════════════════════════ */

  /** Register a new user. Returns { ok, error } */
  function register({ firstName, lastName, email, password }) {
    const users = getUsers();
    const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) return { ok: false, error: 'An account with this email already exists.' };

    const user = {
      id:        generateId(),
      firstName: firstName.trim(),
      lastName:  lastName.trim(),
      email:     email.trim().toLowerCase(),
      password:  hashPassword(password),
      avatar:    getInitials(firstName, lastName),
      createdAt: Date.now()
    };

    users.push(user);
    saveUsers(users);
    saveSession(user);
    return { ok: true, user };
  }

  /** Login an existing user. Returns { ok, error } */
  function login({ email, password }) {
    const users = getUsers();
    const user  = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());

    if (!user) return { ok: false, error: 'No account found with this email.' };
    if (user.password !== hashPassword(password)) return { ok: false, error: 'Incorrect password.' };

    saveSession(user);
    return { ok: true, user };
  }

  /** Logout current user */
  function logout() {
    clearSession();
    window.location.href = 'index.html';
  }

  /** Get current logged-in user (or null) */
  function currentUser() {
    return getSession();
  }

  /** Check if logged in */
  function isLoggedIn() {
    return !!getSession();
  }

  /** Require login — redirects to login page if not authenticated */
  function requireLogin() {
    if (!isLoggedIn()) {
      window.location.href = 'login.html?next=' + encodeURIComponent(window.location.pathname.split('/').pop());
      return false;
    }
    return true;
  }

  /** Update stored user profile */
  function updateProfile(updates) {
    const session = getSession();
    if (!session) return { ok: false };
    const users   = getUsers();
    const idx     = users.findIndex(u => u.id === session.id);
    if (idx === -1) return { ok: false };
    Object.assign(users[idx], updates);
    saveUsers(users);
    saveSession(users[idx]);
    return { ok: true };
  }

  return { register, login, logout, currentUser, isLoggedIn, requireLogin, updateProfile };
})();


/* ══════════════════════════════════════
   NAV INJECTION
   Runs on every page — swaps CTA button
   for user avatar pill when logged in
══════════════════════════════════════ */
(function injectNavUser() {
  const user = FarmAuth.currentUser();
  if (!user) return;

  // Replace "Open Dashboard" button with user pill + logout
  const navActions = document.querySelector('.nav-actions');
  if (!navActions) return;

  // Remove the old CTA link if present
  const oldCta = navActions.querySelector('a.btn');
  if (oldCta) oldCta.remove();

  // Build user pill
  const pill = document.createElement('div');
  pill.className = 'nav-user-pill';
  pill.innerHTML = `
    <div class="nav-avatar">${user.avatar || user.firstName[0].toUpperCase()}</div>
    <span class="nav-user-name">${user.firstName}</span>
    <div class="nav-user-dropdown">
      <div class="nav-dropdown-header">
        <div class="nav-dropdown-avatar">${user.avatar || user.firstName[0].toUpperCase()}</div>
        <div>
          <p class="nav-dropdown-name">${user.firstName} ${user.lastName}</p>
          <p class="nav-dropdown-email">${user.email}</p>
        </div>
      </div>
      <div class="nav-dropdown-divider"></div>
      <a href="dashboard.html" class="nav-dropdown-item">📊 Dashboard</a>
      <a href="crops.html"     class="nav-dropdown-item">🌿 My Crops</a>
      <a href="stats.html"     class="nav-dropdown-item">📈 Stats</a>
      <div class="nav-dropdown-divider"></div>
      <button class="nav-dropdown-item nav-dropdown-logout" id="navLogoutBtn">🚪 Sign Out</button>
    </div>
  `;
  navActions.appendChild(pill);

  // Toggle dropdown
  pill.addEventListener('click', (e) => {
    e.stopPropagation();
    pill.classList.toggle('open');
  });
  document.addEventListener('click', () => pill.classList.remove('open'));

  // Logout
  document.getElementById('navLogoutBtn')?.addEventListener('click', () => FarmAuth.logout());

  // Also update mobile nav
  const mobileNav = document.getElementById('navMobile');
  if (mobileNav) {
    const logoutLink = document.createElement('a');
    logoutLink.href = '#';
    logoutLink.textContent = '🚪 Sign Out';
    logoutLink.style.color = '#e53935';
    logoutLink.addEventListener('click', (e) => { e.preventDefault(); FarmAuth.logout(); });
    mobileNav.appendChild(logoutLink);
  }
})();