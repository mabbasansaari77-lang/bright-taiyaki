/**
 * BRAND COLLECTION — CUSTOMER ACCOUNT PAGE
 * Sign up, log in, forgot password, profile and "My Orders".
 * Uses Supabase Auth through window.DB (assets/js/db.js).
 */
(function () {
  'use strict';

  const esc = (v) => (window.App && App.esc ? App.esc(v) : String(v == null ? '' : v));
  const pkr = (v) => (window.App && App.formatPKR ? App.formatPKR(v) : 'Rs ' + v);
  const toast = (m, t) => (window.App && App.showToast ? App.showToast(m, t) : alert(m));
  const params = new URLSearchParams(location.search);
  let mode = params.get('reset') ? 'reset' : (params.get('mode') === 'signup' ? 'signup' : 'login');

  function box() { return document.getElementById('account-page-content'); }

  function card(inner) {
    return '<div style="max-width:460px;margin:0 auto;background:var(--bg-surface);border:1px solid var(--border-medium);border-radius:var(--radius-md);padding:2rem;">' + inner + '</div>';
  }

  function tabs() {
    const t = (id, label) => '<button type="button" class="btn ' + (mode === id ? 'btn-primary' : 'btn-ghost') + ' btn-sm" style="flex:1" onclick="AccountPage.setMode(\'' + id + '\')">' + label + '</button>';
    return '<div style="display:flex;gap:0.5rem;margin-bottom:1.5rem;">' + t('login', 'LOG IN') + t('signup', 'CREATE ACCOUNT') + '</div>';
  }

  function field(id, label, type, extra) {
    return '<div class="form-group"><label class="form-label" for="' + id + '">' + label + '</label>' +
      '<input id="' + id + '" type="' + type + '" class="form-control" ' + (extra || '') + '></div>';
  }

  function setBusy(form, busy, text) {
    const b = form.querySelector('button[type="submit"]');
    if (!b) return;
    if (busy) { b.dataset.label = b.textContent; b.textContent = text || 'PLEASE WAIT...'; b.disabled = true; }
    else { b.textContent = b.dataset.label || b.textContent; b.disabled = false; }
  }

  function renderDisabled() {
    box().innerHTML = card(
      '<h1 class="display-title" style="font-size:1.6rem;margin-bottom:1rem;">MY ACCOUNT</h1>' +
      '<p style="color:var(--text-secondary);line-height:1.6;">Customer accounts are being switched on. You can still order with Cash on Delivery without an account, and track your order with your order number and phone.</p>' +
      '<div style="display:flex;gap:0.75rem;margin-top:1.5rem;flex-wrap:wrap;"><a class="btn btn-primary btn-sm" href="shop.html">SHOP NOW</a><a class="btn btn-secondary btn-sm" href="track-order.html">TRACK ORDER</a></div>'
    );
  }

  function renderLoggedOut() {
    let html = '<h1 class="display-title" style="font-size:1.6rem;margin-bottom:0.5rem;">' + (mode === 'signup' ? 'CREATE YOUR ACCOUNT' : mode === 'forgot' ? 'RESET PASSWORD' : 'WELCOME BACK') + '</h1>' +
      '<p style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:1.5rem;">Save your address, check your orders and checkout faster.</p>';
    if (mode !== 'forgot') html += tabs();

    if (mode === 'login') {
      html += '<form id="acc-login-form" novalidate>' +
        field('acc-email', 'Email', 'email', 'required autocomplete="email"') +
        field('acc-pass', 'Password', 'password', 'required autocomplete="current-password" minlength="6"') +
        '<button type="submit" class="btn btn-primary btn-full">LOG IN</button>' +
        '<p style="margin-top:1rem;font-size:0.8rem;text-align:center;"><a href="#" onclick="AccountPage.setMode(\'forgot\');return false;">Forgot password?</a></p></form>';
    } else if (mode === 'signup') {
      html += '<form id="acc-signup-form" novalidate>' +
        field('acc-name', 'Full name', 'text', 'required autocomplete="name" maxlength="120"') +
        field('acc-phone', 'Mobile / WhatsApp', 'tel', 'required autocomplete="tel" placeholder="03XXXXXXXXX" maxlength="20"') +
        field('acc-email', 'Email', 'email', 'required autocomplete="email"') +
        field('acc-pass', 'Password (at least 8 characters)', 'password', 'required autocomplete="new-password" minlength="8"') +
        '<button type="submit" class="btn btn-primary btn-full">CREATE ACCOUNT</button>' +
        '<p style="margin-top:1rem;font-size:0.75rem;color:var(--text-muted);text-align:center;">By creating an account you agree to our <a href="terms.html">Terms</a> and <a href="privacy-policy.html">Privacy Policy</a>.</p></form>';
    } else if (mode === 'forgot') {
      html += '<form id="acc-forgot-form" novalidate>' +
        field('acc-email', 'Your account email', 'email', 'required autocomplete="email"') +
        '<button type="submit" class="btn btn-primary btn-full">SEND RESET LINK</button>' +
        '<p style="margin-top:1rem;font-size:0.8rem;text-align:center;"><a href="#" onclick="AccountPage.setMode(\'login\');return false;">Back to log in</a></p></form>';
    }
    box().innerHTML = card(html);
    wireForms();
  }

  function renderReset() {
    box().innerHTML = card(
      '<h1 class="display-title" style="font-size:1.6rem;margin-bottom:1rem;">CHOOSE A NEW PASSWORD</h1>' +
      '<form id="acc-reset-form" novalidate>' +
      field('acc-pass', 'New password (at least 8 characters)', 'password', 'required autocomplete="new-password" minlength="8"') +
      field('acc-pass2', 'Type it again', 'password', 'required autocomplete="new-password" minlength="8"') +
      '<button type="submit" class="btn btn-primary btn-full">SAVE NEW PASSWORD</button></form>'
    );
    wireForms();
  }

  async function renderLoggedIn() {
    const user = DB.user;
    box().innerHTML = '<p style="text-align:center;color:var(--text-secondary);">Loading your account...</p>';
    let profile = {};
    let orders = [];
    try { profile = (await DB.getProfile()) || {}; } catch (e) { console.warn(e); }
    try { orders = await DB.getMyOrders(); } catch (e) { console.warn(e); }

    const cities = (typeof SHIPPING_CONFIG !== 'undefined' ? SHIPPING_CONFIG.cities.map(c => c.name) : []);
    const ordersHtml = orders.length ? orders.map(o =>
      '<div style="background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:var(--radius-sm);padding:1.25rem;margin-bottom:1rem;">' +
        '<div style="display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap;margin-bottom:0.75rem;">' +
          '<div><strong style="color:var(--accent-lime);font-family:var(--font-mono);">' + esc(o.orderId) + '</strong>' +
          '<span style="color:var(--text-muted);font-size:0.75rem;margin-left:0.75rem;">' + esc(o.date) + '</span></div>' +
          '<span class="stock-pill in-stock">' + esc(o.status) + '</span></div>' +
        (o.items || []).map(i => '<div style="display:flex;justify-content:space-between;font-size:0.85rem;gap:1rem;"><span>' + esc(i.name) + ' (' + esc(i.size) + (i.color ? ', ' + esc(i.color) : '') + ') × ' + esc(i.qty) + '</span><span style="font-family:var(--font-mono);">' + pkr(i.price * i.qty) + '</span></div>').join('') +
        '<div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border-subtle);margin-top:0.75rem;padding-top:0.75rem;flex-wrap:wrap;gap:0.5rem;">' +
          '<span style="font-size:0.85rem;">Total: <strong style="color:var(--accent-lime);">' + pkr(o.total) + '</strong> (' + esc(String(o.paymentMethod || '').toUpperCase()) + ')</span>' +
          '<a class="btn btn-secondary btn-sm" href="track-order.html?orderId=' + encodeURIComponent(o.orderId) + '">TRACK</a></div>' +
      '</div>').join('')
      : '<p style="color:var(--text-secondary);">No orders yet. <a href="shop.html">Start shopping</a>.</p>';

    box().innerHTML =
      '<div style="max-width:980px;margin:0 auto;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap;margin-bottom:2rem;border-bottom:1px solid var(--border-subtle);padding-bottom:1.25rem;">' +
          '<div><div class="mono-tag">MY ACCOUNT</div><h1 class="display-title" style="font-size:2rem;margin-top:0.25rem;">SALAM, ' + esc((profile.full_name || user.email || '').split(' ')[0].toUpperCase()) + '</h1>' +
          '<div style="font-size:0.8rem;color:var(--text-muted);">' + esc(user.email) + '</div></div>' +
          '<div style="display:flex;gap:0.5rem;flex-wrap:wrap;">' +
            (DB.isAdmin ? '<a class="btn btn-primary btn-sm" href="admin.html">OPEN ADMIN PANEL</a>' : '') +
            '<button type="button" class="btn btn-secondary btn-sm" onclick="AccountPage.logout()">LOG OUT</button></div>' +
        '</div>' +
        '<div class="bc-account-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:2rem;align-items:start;">' +
          '<section aria-labelledby="acc-orders-h"><h2 id="acc-orders-h" style="font-size:1.2rem;margin-bottom:1rem;">My Orders (' + orders.length + ')</h2>' + ordersHtml + '</section>' +
          '<section aria-labelledby="acc-profile-h" style="background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:var(--radius-sm);padding:1.5rem;">' +
            '<h2 id="acc-profile-h" style="font-size:1.2rem;margin-bottom:1rem;">Delivery Details</h2>' +
            '<form id="acc-profile-form">' +
              field('pf-name', 'Full name', 'text', 'autocomplete="name" maxlength="120" value="' + esc(profile.full_name) + '"') +
              field('pf-phone', 'Mobile / WhatsApp', 'tel', 'autocomplete="tel" maxlength="20" value="' + esc(profile.phone) + '"') +
              '<div class="form-group"><label class="form-label" for="pf-city">City</label><input id="pf-city" class="form-control" list="pf-city-list" maxlength="60" value="' + esc(profile.city) + '"><datalist id="pf-city-list">' + cities.map(c => '<option value="' + esc(c) + '">').join('') + '</datalist></div>' +
              '<div class="form-group"><label class="form-label" for="pf-address">Full address</label><textarea id="pf-address" class="form-control" rows="3" maxlength="400">' + esc(profile.address) + '</textarea></div>' +
              '<button type="submit" class="btn btn-primary btn-full">SAVE DETAILS</button>' +
              '<p style="font-size:0.75rem;color:var(--text-muted);margin-top:0.75rem;">These details fill in automatically at checkout.</p>' +
            '</form>' +
            '<hr style="border:0;border-top:1px solid var(--border-subtle);margin:1.5rem 0;">' +
            '<form id="acc-reset-form">' +
              field('acc-pass', 'Change password', 'password', 'autocomplete="new-password" minlength="8" placeholder="New password"') +
              '<input type="hidden" id="acc-pass2">' +
              '<button type="submit" class="btn btn-secondary btn-sm">UPDATE PASSWORD</button></form>' +
          '</section>' +
        '</div>' +
      '</div>';
    wireForms();
  }

  function wireForms() {
    const on = (id, fn) => { const f = document.getElementById(id); if (f) f.addEventListener('submit', (e) => { e.preventDefault(); fn(f); }); };
    const v = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };

    on('acc-login-form', async (f) => {
      const email = v('acc-email'), pass = document.getElementById('acc-pass').value;
      if (!email || !pass) return toast('Please enter your email and password.', 'error');
      setBusy(f, true, 'LOGGING IN...');
      try {
        const r = await DB.signIn(email, pass);
        toast('Logged in. Welcome back!');
        if (params.get('next') === 'admin' && r.isAdmin) { location.href = 'admin.html'; return; }
        if (params.get('next') === 'checkout') { location.href = 'checkout.html'; return; }
        render();
      } catch (e) { toast(e.message, 'error'); setBusy(f, false); }
    });

    on('acc-signup-form', async (f) => {
      const name = v('acc-name'), phone = v('acc-phone'), email = v('acc-email'), pass = document.getElementById('acc-pass').value;
      if (name.length < 2 || phone.length < 10 || !/^\S+@\S+\.\S+$/.test(email)) return toast('Please fill in your name, mobile number and a valid email.', 'error');
      if (pass.length < 8) return toast('Password must be at least 8 characters.', 'error');
      setBusy(f, true, 'CREATING...');
      try {
        const r = await DB.signUp(email, pass, name, phone);
        if (r.needsConfirmation) {
          box().innerHTML = card('<h1 class="display-title" style="font-size:1.5rem;margin-bottom:1rem;">CHECK YOUR EMAIL</h1><p style="color:var(--text-secondary);line-height:1.6;">We sent a confirmation link to <strong>' + esc(email) + '</strong>. Click it to activate your account, then log in. Check your spam folder if you do not see it.</p><button type="button" class="btn btn-secondary btn-sm" style="margin-top:1.5rem;" onclick="AccountPage.setMode(\'login\')">GO TO LOG IN</button>');
        } else { toast('Account created!'); render(); }
      } catch (e) { toast(e.message, 'error'); setBusy(f, false); }
    });

    on('acc-forgot-form', async (f) => {
      const email = v('acc-email');
      if (!/^\S+@\S+\.\S+$/.test(email)) return toast('Please enter a valid email.', 'error');
      setBusy(f, true, 'SENDING...');
      try {
        await DB.resetPassword(email);
        box().innerHTML = card('<h1 class="display-title" style="font-size:1.5rem;margin-bottom:1rem;">CHECK YOUR EMAIL</h1><p style="color:var(--text-secondary);line-height:1.6;">If an account exists for <strong>' + esc(email) + '</strong>, a password reset link is on its way.</p>');
      } catch (e) { toast(e.message, 'error'); setBusy(f, false); }
    });

    on('acc-reset-form', async (f) => {
      const p1 = document.getElementById('acc-pass').value;
      const p2el = document.getElementById('acc-pass2');
      const p2 = p2el && p2el.type !== 'hidden' ? p2el.value : p1;
      if (p1.length < 8) return toast('Password must be at least 8 characters.', 'error');
      if (p1 !== p2) return toast('The two passwords do not match.', 'error');
      setBusy(f, true, 'SAVING...');
      try {
        await DB.updatePassword(p1);
        toast('Password updated.');
        if (mode === 'reset') { mode = 'login'; history.replaceState(null, '', 'account.html'); }
        render();
      } catch (e) { toast(e.message, 'error'); setBusy(f, false); }
    });

    on('acc-profile-form', async (f) => {
      setBusy(f, true, 'SAVING...');
      try {
        await DB.saveProfile({ full_name: v('pf-name'), phone: v('pf-phone'), city: v('pf-city'), address: v('pf-address') });
        toast('Delivery details saved.');
      } catch (e) { toast(e.message, 'error'); }
      setBusy(f, false);
    });
  }

  async function render() {
    if (!box()) return;
    if (!window.DB || !DB.accountsEnabled()) return renderDisabled();
    box().innerHTML = '<p style="text-align:center;color:var(--text-secondary);">Loading...</p>';
    const ok = await DB.ready();
    if (!ok) { box().innerHTML = card('<p>Could not connect. Please check your internet and refresh the page.</p>'); return; }
    if (mode === 'reset' && DB.user) return renderReset();
    if (DB.user) return renderLoggedIn();
    return renderLoggedOut();
  }

  window.AccountPage = {
    init: function () {
      render();
      if (window.DB) {
        DB.onUpdate((evt) => {
          if (evt === 'password_recovery') { mode = 'reset'; render(); }
          else if (evt === 'auth_changed') render();
        });
      }
    },
    setMode: function (m) { mode = m; render(); },
    logout: async function () { await DB.signOut(); toast('You are logged out.'); mode = 'login'; render(); }
  };
})();
