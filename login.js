/* ============================================================
   FARMSPHERICA — login.js
   Auth form logic wired to FarmAuth (auth.js)
   ============================================================ */

(function () {
  'use strict';

  /* ─── Redirect if already logged in ─── */
  if (FarmAuth.isLoggedIn()) {
    const params = new URLSearchParams(window.location.search);
    window.location.href = params.get('next') || 'index.html';
    return;
  }

  /* ─── Element refs ─── */
  const tabLogin       = document.getElementById('tabLogin');
  const tabSignup      = document.getElementById('tabSignup');
  const tabIndicator   = document.getElementById('tabIndicator');
  const formLogin      = document.getElementById('formLogin');
  const formSignup     = document.getElementById('formSignup');
  const authSuccess    = document.getElementById('authSuccess');
  const successMsg     = document.getElementById('successMsg');
  const successBar     = document.getElementById('successBar');
  const forgotLink     = document.getElementById('forgotLink');
  const forgotOverlay  = document.getElementById('forgotOverlay');
  const forgotBack     = document.getElementById('forgotBack');
  const btnReset       = document.getElementById('btnReset');
  const resetSent      = document.getElementById('resetSent');
  const switchToSignup = document.getElementById('switchToSignup');
  const switchToLogin  = document.getElementById('switchToLogin');

  /* ══════════════════════════════════════
     1. TAB SWITCHING
  ══════════════════════════════════════ */
  function showTab(tab) {
    const isLogin = tab === 'login';
    tabLogin.classList.toggle('active', isLogin);
    tabSignup.classList.toggle('active', !isLogin);
    tabIndicator.classList.toggle('right', !isLogin);
    formLogin.classList.toggle('active', isLogin);
    formSignup.classList.toggle('active', !isLogin);
    if (forgotOverlay) forgotOverlay.style.display = 'none';
    if (authSuccess)   authSuccess.style.display   = 'none';
    clearAllErrors();
  }

  tabLogin?.addEventListener('click',  () => showTab('login'));
  tabSignup?.addEventListener('click', () => showTab('signup'));
  switchToSignup?.addEventListener('click', e => { e.preventDefault(); showTab('signup'); });
  switchToLogin?.addEventListener('click',  e => { e.preventDefault(); showTab('login');  });

  /* ══════════════════════════════════════
     2. VALIDATION HELPERS
  ══════════════════════════════════════ */
  function setError(groupId, errorId, msg) {
    document.getElementById(groupId)?.querySelector('.field-input')?.classList.add('error');
    const el = document.getElementById(errorId);
    if (el) el.textContent = msg;
  }

  function clearError(groupId, errorId) {
    const input = document.getElementById(groupId)?.querySelector('.field-input');
    if (input) { input.classList.remove('error', 'success'); }
    const el = document.getElementById(errorId);
    if (el) el.textContent = '';
  }

  function setSuccess(groupId) {
    const input = document.getElementById(groupId)?.querySelector('.field-input');
    if (input) { input.classList.remove('error'); input.classList.add('success'); }
  }

  function clearAllErrors() {
    document.querySelectorAll('.field-input').forEach(i => i.classList.remove('error', 'success'));
    document.querySelectorAll('.field-error').forEach(e => e.textContent = '');
  }

  function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  function attachLive(inputId, groupId, errorId, validate) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.addEventListener('blur', () => {
      const err = validate(input.value.trim());
      err ? setError(groupId, errorId, err) : setSuccess(groupId);
    });
    input.addEventListener('input', () => {
      if (input.classList.contains('error')) {
        if (!validate(input.value.trim())) clearError(groupId, errorId);
      }
    });
  }

  attachLive('loginEmail',    'lg-email-group', 'lg-email-error', v => !v ? 'Required.' : !isValidEmail(v) ? 'Invalid email.' : null);
  attachLive('loginPassword', 'lg-pass-group',  'lg-pass-error',  v => !v ? 'Required.' : v.length < 6 ? 'Too short.' : null);
  attachLive('signupFname',   'sg-fname-group', 'sg-fname-error', v => !v ? 'Required.' : null);
  attachLive('signupEmail',   'sg-email-group', 'sg-email-error', v => !v ? 'Required.' : !isValidEmail(v) ? 'Invalid email.' : null);

  /* ══════════════════════════════════════
     3. PASSWORD STRENGTH
  ══════════════════════════════════════ */
  const signupPassword = document.getElementById('signupPassword');
  const strengthBars   = [1,2,3,4].map(i => document.getElementById('sbar' + i));
  const strengthLabel  = document.getElementById('strengthLabel');

  function getStrength(p) {
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8)  s++;
    if (p.length >= 12) s++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return Math.min(s, 4);
  }

  const sTexts  = ['Too short','Weak','Fair','Good','Strong'];
  const sColors = ['','active-1','active-2','active-3','active-4'];
  const sHex    = ['','#e53935','#ff9800','#ffc107','var(--green-500)'];

  signupPassword?.addEventListener('input', () => {
    const score = getStrength(signupPassword.value);
    strengthBars.forEach((b, i) => { if(b) { b.className = 'strength-bar'; if(i < score) b.classList.add(sColors[score]); }});
    if (strengthLabel) {
      strengthLabel.textContent = signupPassword.value ? sTexts[score] : 'Enter a password';
      strengthLabel.style.color = sHex[score] || 'var(--text-muted)';
    }
  });

  /* ══════════════════════════════════════
     4. SHOW / HIDE PASSWORD
  ══════════════════════════════════════ */
  document.querySelectorAll('.toggle-pass').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      if (!input) return;
      input.type = input.type === 'password' ? 'text' : 'password';
      btn.textContent = input.type === 'password' ? '👁' : '🙈';
    });
  });

  /* ══════════════════════════════════════
     5. LOGIN SUBMIT
  ══════════════════════════════════════ */
  formLogin?.addEventListener('submit', async e => {
    e.preventDefault();
    clearAllErrors();

    const email = document.getElementById('loginEmail')?.value.trim();
    const pass  = document.getElementById('loginPassword')?.value;
    let valid   = true;

    if (!email || !isValidEmail(email)) { setError('lg-email-group','lg-email-error','Enter a valid email.'); valid = false; }
    if (!pass || pass.length < 6)       { setError('lg-pass-group','lg-pass-error','Enter your password.'); valid = false; }
    if (!valid) return;

    const btn = document.getElementById('btnLogin');
    setLoading(btn, true);
    await delay(1000);

    const result = FarmAuth.login({ email, password: pass });
    setLoading(btn, false);

    if (!result.ok) {
      // Show error on the relevant field
      if (result.error.includes('email')) setError('lg-email-group','lg-email-error', result.error);
      else                                setError('lg-pass-group','lg-pass-error', result.error);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    showSuccess(`Welcome back, ${result.user.firstName}! Taking you home…`, params.get('next') || 'index.html');
  });

  /* ══════════════════════════════════════
     6. SIGNUP SUBMIT
  ══════════════════════════════════════ */
  formSignup?.addEventListener('submit', async e => {
    e.preventDefault();
    clearAllErrors();

    const firstName = document.getElementById('signupFname')?.value.trim();
    const lastName  = document.getElementById('signupLname')?.value.trim();
    const email     = document.getElementById('signupEmail')?.value.trim();
    const pass      = document.getElementById('signupPassword')?.value;
    const confirm   = document.getElementById('signupConfirm')?.value;
    const terms     = document.getElementById('agreeTerms')?.checked;
    let valid = true;

    if (!firstName)             { setError('sg-fname-group','sg-fname-error','Required.'); valid = false; }
    if (!lastName)              { setError('sg-lname-group','sg-lname-error','Required.'); valid = false; }
    if (!email||!isValidEmail(email)) { setError('sg-email-group','sg-email-error','Enter a valid email.'); valid = false; }
    if (!pass||pass.length < 8) { setError('sg-pass-group','sg-pass-error','Min. 8 characters.'); valid = false; }
    else if (getStrength(pass) < 2) { setError('sg-pass-group','sg-pass-error','Choose a stronger password.'); valid = false; }
    if (pass && confirm !== pass) {
      const ci = document.getElementById('signupConfirm');
      if (ci) ci.classList.add('error');
      const ce = document.getElementById('sg-confirm-error');
      if (ce) ce.textContent = 'Passwords do not match.';
      valid = false;
    }
    if (!terms) {
      const te = document.getElementById('sg-terms-error');
      if (te) te.textContent = 'You must agree to continue.';
      valid = false;
    }
    if (!valid) return;

    const btn = document.getElementById('btnSignup');
    setLoading(btn, true);
    await delay(1200);

    const result = FarmAuth.register({ firstName, lastName, email, password: pass });
    setLoading(btn, false);

    if (!result.ok) {
      setError('sg-email-group','sg-email-error', result.error);
      return;
    }

    showSuccess(`Account created! Welcome, ${firstName}! Taking you home…`, 'index.html');
  });

  /* ══════════════════════════════════════
     7. SOCIAL BUTTONS (demo only)
  ══════════════════════════════════════ */
  async function handleSocial(provider, btn) {
    const orig = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span style="display:inline-block;width:16px;height:16px;border:2px solid rgba(0,0,0,0.15);border-top-color:var(--accent);border-radius:50%;animation:spin 0.7s linear infinite;vertical-align:middle;margin-right:6px;"></span> Connecting…`;
    await delay(1400);
    // Register a demo social user
    const email = provider.toLowerCase() + '_demo@farmspherica.com';
    let result = FarmAuth.login({ email, password: 'social_demo_pass' });
    if (!result.ok) {
      result = FarmAuth.register({ firstName: provider + 'User', lastName: 'Demo', email, password: 'social_demo_pass' });
    }
    btn.disabled = false;
    btn.innerHTML = orig;
    if (result.ok) showSuccess(`Signed in with ${provider}! Taking you home…`, 'index.html');
  }

  document.getElementById('googleBtn')?.addEventListener('click', function() { handleSocial('Google', this); });
  document.getElementById('githubBtn')?.addEventListener('click', function() { handleSocial('GitHub', this); });

  /* ══════════════════════════════════════
     8. FORGOT PASSWORD
  ══════════════════════════════════════ */
  forgotLink?.addEventListener('click', e => {
    e.preventDefault();
    formLogin.classList.remove('active');
    if (forgotOverlay) forgotOverlay.style.display = 'flex';
  });

  forgotBack?.addEventListener('click', () => {
    if (forgotOverlay) forgotOverlay.style.display = 'none';
    formLogin.classList.add('active');
    if (resetSent) resetSent.style.display = 'none';
  });

  btnReset?.addEventListener('click', async () => {
    const email = document.getElementById('resetEmail')?.value.trim();
    const input = document.getElementById('resetEmail');
    if (!email || !isValidEmail(email)) { if(input) input.classList.add('error'); return; }
    if(input) input.classList.remove('error');
    setLoading(btnReset, true);
    await delay(1300);
    setLoading(btnReset, false);
    if (resetSent) resetSent.style.display = 'block';
  });

  /* ══════════════════════════════════════
     9. SUCCESS STATE + REDIRECT
  ══════════════════════════════════════ */
  function showSuccess(message, redirectTo) {
    formLogin.classList.remove('active');
    formSignup.classList.remove('active');
    if (forgotOverlay) forgotOverlay.style.display = 'none';
    authSuccess.style.display = 'flex';
    if (successMsg) successMsg.textContent = message;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (successBar) successBar.style.width = '100%';
      });
    });
    setTimeout(() => { window.location.href = redirectTo; }, 2200);
  }

  /* ══════════════════════════════════════
     10. LIVE SENSOR TICK (left panel)
  ══════════════════════════════════════ */
  const sBase = {
    ph:   { el: document.querySelector('[data-sensor="ph"]'),   val: 6.2, min:5.8, max:6.8, step:0.05, fmt: v => v.toFixed(1) },
    temp: { el: document.querySelector('[data-sensor="temp"]'), val: 22,  min:18,  max:26,  step:0.2,  fmt: v => v.toFixed(1)+'°' },
    hum:  { el: document.querySelector('[data-sensor="hum"]'),  val: 68,  min:55,  max:80,  step:1,    fmt: v => Math.round(v)+'%' },
    ec:   { el: document.querySelector('[data-sensor="ec"]'),   val: 1.8, min:1.4, max:2.4, step:0.04, fmt: v => v.toFixed(1) },
  };
  setInterval(() => {
    Object.values(sBase).forEach(s => {
      if (!s.el) return;
      s.val = Math.min(s.max, Math.max(s.min, s.val + (Math.random()-0.5)*2*s.step));
      s.el.textContent = s.fmt(s.val);
    });
  }, 3000);

  /* ── Utilities ── */
  function setLoading(btn, state) {
    if (!btn) return;
    btn.disabled = state;
    btn.classList.toggle('loading', state);
  }
  function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

})();