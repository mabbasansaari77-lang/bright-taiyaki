/**
 * BRAND COLLECTION — DATABASE & LOGIN ENGINE (Supabase free tier)
 *
 * ======================= EDIT THESE 2 LINES =======================
 * Supabase dashboard > Project Settings > API (or "Connect"):
 *   SUPABASE_URL      = "Project URL"      (https://xxxx.supabase.co)
 *   SUPABASE_ANON_KEY = "anon public" key  (or the "publishable" key)
 * The anon/publishable key is SAFE to put here. It is meant to be public.
 * NEVER put the "service_role" or "secret" key in this file.
 * ===================================================================
 */
window.BC_CONFIG = window.BC_CONFIG || {
  SUPABASE_URL: 'https://rkowphpfrgsmyolpdurk.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_iyRYN9ItGaVQjiFDfm1GTQ_ae0e4lVZ',
  SUPABASE_LIB: 'assets/js/vendor/supabase-2.117.3.min.js'
};

/*
 * How it works
 * - If the 2 lines above are filled in, the whole store (shop pages, checkout,
 *   customer accounts AND the admin panel) reads and writes the Supabase cloud.
 * - If they are empty, the site keeps working in the old "this browser only"
 *   mode (localStorage), exactly like before.
 * - The admin panel files are not changed. They call the same DB functions as
 *   before and read the same localStorage keys; this file keeps those keys in
 *   sync with the cloud. Cloud writes only work after the store owner signs in
 *   on account.html with an email listed in the admin_emails table.
 */
(function () {
  'use strict';

  const CFG = window.BC_CONFIG;
  const CLOUD = !!(CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY);

  const KEYS = {
    products: 'bc_custom_products',
    orders: 'bc_orders',
    myOrders: 'bc_my_orders',
    settings: 'bc_settings',
    banners: 'bc_banners',
    dbStatus: 'bc_db_status'
  };

  const DEFAULT_BANNERS = {
    heroBadge: "PAKISTAN'S AVANT-GARDE FASHION ATELIER",
    heroTitle: 'FUTURISTIC LUXURY TAILORED FOR NOW',
    heroDesc: 'Bridging high-performance technical fabric engineering with contemporary Pakistani pret aesthetics. Charcoal tones, warm ivory drapes, and high-voltage accents.',
    heroImage: 'assets/images/hero.jpg',
    heroBtnPrimaryText: 'EXPLORE THE DROP ⚡',
    heroBtnPrimaryLink: 'shop',
    heroBtnSecondaryText: 'VIEW RUNWAY CAPSULES',
    heroBtnSecondaryLink: 'collections',
    announcementTicker: 'FREE NATIONWIDE DELIVERY ON ORDERS OVER ₨5,000 | CASH ON DELIVERY AVAILABLE',
    menBannerImage: 'assets/images/men.jpg',
    menBannerTitle: 'MENS COLLECTION',
    menBannerDesc: 'Structured techwear jackets, tailored suiting & urban cargos.',
    womenBannerImage: 'assets/images/women.jpg',
    womenBannerTitle: 'WOMENS ATELIER',
    womenBannerDesc: 'Asymmetric luxury draping, high-voltage piping & tailored silhouettes.',
    kidsBannerImage: 'assets/images/kids.jpg',
    kidsBannerTitle: 'KIDS COLLECTION',
    kidsBannerDesc: 'Durable utility parkas and athletic joggers for future leaders.'
  };

  // ---------- small helpers ----------
  function readJSON(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch (e) { return fallback; }
  }
  function writeJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch (e) {
      console.warn('[DB] Browser storage full, skipped cache for', key); return false;
    }
  }
  function slugify(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'item';
  }
  function isAdminPage() {
    const b = document.body;
    return (b && b.getAttribute('data-page') === 'admin') || /admin(\.html)?$/i.test(location.pathname);
  }
  function syncProductsMemory(products) {
    if (typeof PRODUCTS_DATA !== 'undefined' && Array.isArray(products) && products.length) {
      PRODUCTS_DATA.length = 0;
      products.forEach(p => PRODUCTS_DATA.push(p));
    }
  }
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = resolve; s.onerror = () => reject(new Error('Could not load ' + src));
      document.head.appendChild(s);
    });
  }
  function friendlyError(err) {
    const m = (err && (err.message || err.error_description || String(err))) || 'Unknown error';
    if (/OUT_OF_STOCK:(.*)/.test(m)) return 'Sorry, "' + m.split('OUT_OF_STOCK:')[1].split('\n')[0] + '" does not have enough stock.';
    if (/PRODUCT_NOT_FOUND/.test(m)) return 'One item in your bag is no longer available. Please remove it and try again.';
    if (/MISSING_DETAILS/.test(m)) return 'Please fill in your name, phone, city and full address.';
    if (/EMPTY_CART/.test(m)) return 'Your bag is empty.';
    if (/TOO_MANY_ORDERS/.test(m)) return 'Too many orders from this phone number. Please wait 10 minutes or contact us on WhatsApp.';
    if (/Invalid login credentials/i.test(m)) return 'Wrong email or password.';
    if (/Email not confirmed/i.test(m)) return 'Please confirm your email first. Check your inbox (and spam folder).';
    if (/already registered/i.test(m)) return 'This email already has an account. Please log in.';
    if (/not authorized|email_address_not_authorized/i.test(m)) return 'Account sign-up by email is not switched on yet. You can still order as a guest with Cash on Delivery.';
    if (/rate limit/i.test(m)) return 'Too many emails sent. Please wait a few minutes and try again.';
    if (/Failed to fetch|NetworkError/i.test(m)) return 'No internet connection. Please try again.';
    return m;
  }

  // ---------- row <-> object mapping ----------
  function productToRow(p) {
    const data = Object.assign({}, p);
    return {
      id: String(p.id),
      slug: p.slug || (slugify(p.name) + '-' + slugify(p.id)),
      name: p.name || 'Untitled product',
      category: p.category || 'men',
      price: Number(p.price) || 0,
      sale_price: (p.salePrice === null || p.salePrice === undefined || p.salePrice === '' || Number(p.salePrice) <= 0) ? null : Number(p.salePrice),
      stock: Math.max(0, parseInt(p.stock, 10) || 0),
      is_active: p.isActive !== false,
      data: data,
      updated_at: new Date().toISOString()
    };
  }
  function rowToProduct(r) {
    return Object.assign({}, r.data || {}, {
      id: r.id,
      slug: r.slug,
      name: r.name,
      category: r.category,
      price: Number(r.price),
      salePrice: r.sale_price === null ? null : Number(r.sale_price),
      stock: r.stock
    });
  }
  function rowToOrder(r) {
    return {
      orderId: r.order_id,
      date: (r.created_at || '').slice(0, 10),
      createdAt: r.created_at,
      customerName: r.customer_name,
      phone: r.phone,
      email: r.email || '',
      city: r.city,
      address: r.address,
      notes: r.notes || '',
      items: r.items || [],
      subtotal: Number(r.subtotal),
      shippingFee: Number(r.shipping_fee),
      codFee: Number(r.cod_fee),
      discount: Number(r.discount),
      total: Number(r.total),
      couponCode: r.coupon_code,
      paymentMethod: r.payment_method,
      status: r.status,
      courier: r.courier,
      trackingNumber: r.tracking_number,
      estimatedDelivery: r.estimated_delivery
    };
  }
  function orderUpdateToRow(o) {
    const map = {
      status: 'status', courier: 'courier', trackingNumber: 'tracking_number',
      estimatedDelivery: 'estimated_delivery', notes: 'notes', customerName: 'customer_name',
      phone: 'phone', email: 'email', city: 'city', address: 'address'
    };
    const row = { updated_at: new Date().toISOString() };
    Object.keys(map).forEach(k => { if (o[k] !== undefined) row[map[k]] = o[k]; });
    return row;
  }
  function orderToRow(o) {
    return {
      order_id: o.orderId, customer_name: o.customerName || 'Customer', phone: o.phone || '-',
      email: o.email || null, city: o.city || '-', address: o.address || '-', notes: o.notes || null,
      items: o.items || [], subtotal: Number(o.subtotal) || 0, shipping_fee: Number(o.shippingFee) || 0,
      cod_fee: Number(o.codFee) || 0, discount: Number(o.discount) || 0, total: Number(o.total) || 0,
      payment_method: o.paymentMethod || 'cod', status: o.status || 'Order Placed & Verified',
      courier: o.courier || null, tracking_number: o.trackingNumber || null,
      estimated_delivery: o.estimatedDelivery || null,
      created_at: o.date ? new Date(o.date).toISOString() : new Date().toISOString()
    };
  }

  // ---------- the DB object (same API as before, plus login functions) ----------
  const DB = {
    isOnline: false,
    isCloud: CLOUD,
    isAdmin: false,
    user: null,
    latencyMs: 0,
    statusInfo: null,
    listeners: [],
    client: null,
    _ready: null,

    onUpdate: function (cb) { if (typeof cb === 'function') this.listeners.push(cb); },
    notifyListeners: function (event, data) {
      this.listeners.forEach(fn => { try { fn(event, data); } catch (e) { console.error('DB listener error:', e); } });
      window.dispatchEvent(new CustomEvent('brand_collection_db_update', { detail: { event, data } }));
    },

    // Load the Supabase library + session once
    ready: function () {
      if (!CLOUD) return Promise.resolve(false);
      if (this._ready) return this._ready;
      this._ready = (async () => {
        if (!window.supabase || !window.supabase.createClient) {
          await loadScript(CFG.SUPABASE_LIB);
        }
        this.client = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY, {
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
        });
        const { data } = await this.client.auth.getSession();
        this.user = data && data.session ? data.session.user : null;
        await this._refreshAdmin();
        this.client.auth.onAuthStateChange((evt, session) => {
          const before = this.user ? this.user.id : null;
          this.user = session ? session.user : null;
          if ((this.user ? this.user.id : null) !== before) {
            this._refreshAdmin().then(() => this.notifyListeners('auth_changed', { user: this.user, isAdmin: this.isAdmin }));
          }
          if (evt === 'PASSWORD_RECOVERY') this.notifyListeners('password_recovery', {});
        });
        return true;
      })().catch(err => {
        console.error('[DB] Supabase failed to start:', err);
        this._ready = null;
        return false;
      });
      return this._ready;
    },

    _refreshAdmin: async function () {
      this.isAdmin = false;
      if (!this.client || !this.user) return false;
      try {
        const { data, error } = await this.client.rpc('is_admin');
        this.isAdmin = !error && data === true;
      } catch (e) { this.isAdmin = false; }
      return this.isAdmin;
    },

    // 1. INITIALIZE (called on load and by the admin panel)
    init: async function () {
      if (!CLOUD) {
        this.isOnline = false;
        this.statusInfo = { database: 'This browser only (Supabase not set up yet)' };
        this.notifyListeners('offline', { error: 'Cloud database not configured' });
        return false;
      }
      const t0 = performance.now();
      const ok = await this.ready();
      if (!ok) {
        this.isOnline = false;
        this.notifyListeners('offline', { error: 'Supabase not reachable' });
        return false;
      }
      try {
        const products = await this.getProducts();
        this.isOnline = true;
        this.latencyMs = Math.round(performance.now() - t0);
        this.statusInfo = {
          database: 'Supabase Cloud' + (this.isAdmin ? ' — admin: ' + this.user.email : this.user ? ' — signed in' : ''),
          provider: 'supabase', isAdmin: this.isAdmin
        };
        writeJSON(KEYS.dbStatus, this.statusInfo);

        if (this.isAdmin) {
          await this._seedIfEmpty(products);
          await this.getOrders();
          await this.getBanners();
        } else {
          this.getBanners().catch(() => {});
        }
        this.notifyListeners('connected', this.statusInfo);
        this.notifyListeners('products_synced', PRODUCTS_DATA);
        return true;
      } catch (err) {
        console.warn('[DB] Cloud sync failed:', err);
        this.isOnline = false;
        this.notifyListeners('offline', { error: err.message });
        return false;
      }
    },

    // First admin login: copy the products the admin already had into the cloud
    _seedIfEmpty: async function (cloudProducts) {
      if (this._cloudProductCount !== 0) return; // only when the cloud table is really empty
      const local = readJSON(KEYS.products, null);
      const source = (Array.isArray(local) && local.length) ? local
        : (typeof window.BC_DEFAULT_PRODUCTS !== 'undefined' ? window.BC_DEFAULT_PRODUCTS : []);
      if (!source.length) return;
      const rows = source.map(productToRow);
      const { error } = await this.client.from('products').upsert(rows, { onConflict: 'id' });
      if (error) { console.warn('[DB] Starter products upload failed:', error.message); return; }
      console.log('[DB] Uploaded', rows.length, 'starter products to Supabase.');
      await this.getProducts();
    },

    // 2. PRODUCTS
    getProducts: async function () {
      if (CLOUD && await this.ready()) {
        const { data, error } = await this.client.from('products').select('*').order('created_at', { ascending: false });
        if (!error && Array.isArray(data)) {
          const list = data.map(rowToProduct);
          this._cloudProductCount = list.length;
          if (list.length) {
            writeJSON(KEYS.products, list);
            syncProductsMemory(list);
          }
          return list.length ? list : (typeof PRODUCTS_DATA !== 'undefined' ? [...PRODUCTS_DATA] : []);
        }
        if (error) console.warn('[DB] Products read error:', error.message);
      }
      const cached = readJSON(KEYS.products, null);
      if (Array.isArray(cached) && cached.length) return cached;
      return typeof PRODUCTS_DATA !== 'undefined' ? [...PRODUCTS_DATA] : [];
    },

    _requireAdmin: function (what) {
      if (CLOUD && !this.isAdmin) {
        const msg = 'Saved in this browser only. To save "' + what + '" to the cloud, sign in on the Account page with your admin email.';
        console.warn('[DB] ' + msg);
        showAdminNotice(msg, true);
        return false;
      }
      return true;
    },

    saveProduct: async function (product) {
      if (!product) return { success: false, error: 'Product data required' };
      if (!product.sku) product.sku = 'BC-SKU-' + Math.floor(100 + Math.random() * 900);
      if (!product.category) product.category = 'men';
      if (!product.id) product.id = 'bc-' + Date.now().toString(36);

      if (CLOUD && await this.ready() && this._requireAdmin('product')) {
        let row = productToRow(product);
        let { error } = await this.client.from('products').upsert(row, { onConflict: 'id' });
        if (error && /slug/i.test(error.message)) {
          row.slug = row.slug + '-' + slugify(row.id);
          ({ error } = await this.client.from('products').upsert(row, { onConflict: 'id' }));
        }
        if (error) { showAdminNotice('Cloud save failed: ' + error.message, true); return { success: false, error: error.message }; }
        const products = await this.getProducts();
        this.notifyListeners('products_updated', products);
        return { success: true, product };
      }

      const products = await this.getProducts();
      const idx = products.findIndex(p => p.id === product.id);
      if (idx !== -1) products[idx] = Object.assign({}, products[idx], product); else products.unshift(product);
      writeJSON(KEYS.products, products);
      syncProductsMemory(products);
      this.notifyListeners('products_updated', products);
      return { success: true, product };
    },

    deleteProduct: async function (productId) {
      if (!productId) return { success: false };
      if (CLOUD && await this.ready() && this._requireAdmin('product delete')) {
        const { error } = await this.client.from('products').delete().eq('id', productId);
        if (error) { showAdminNotice('Cloud delete failed: ' + error.message, true); return { success: false, error: error.message }; }
        const remaining = (await this.getProducts()).filter(p => p.id !== productId);
        writeJSON(KEYS.products, remaining);
        syncProductsMemory(remaining);
        this.notifyListeners('products_updated', remaining);
        return { success: true };
      }
      const products = (await this.getProducts()).filter(p => p.id !== productId);
      writeJSON(KEYS.products, products);
      syncProductsMemory(products);
      this.notifyListeners('products_updated', products);
      return { success: true };
    },

    updateStock: async function (productId, newStock) {
      const stockNum = Math.max(0, parseInt(newStock, 10) || 0);
      if (CLOUD && await this.ready() && this._requireAdmin('stock')) {
        const { data: cur } = await this.client.from('products').select('data').eq('id', productId).maybeSingle();
        const data = Object.assign({}, cur ? cur.data : {}, { stock: stockNum });
        const { error } = await this.client.from('products')
          .update({ stock: stockNum, data, updated_at: new Date().toISOString() }).eq('id', productId);
        if (error) { showAdminNotice('Cloud stock update failed: ' + error.message, true); return { success: false }; }
      }
      const products = await this.getProducts();
      const p = products.find(x => x.id === productId);
      if (p) p.stock = stockNum;
      writeJSON(KEYS.products, products);
      if (typeof PRODUCTS_DATA !== 'undefined') {
        const mem = PRODUCTS_DATA.find(x => x.id === productId);
        if (mem) mem.stock = stockNum;
      }
      this.notifyListeners('stock_updated', { productId, stock: stockNum });
      return { success: true, productId, stock: stockNum };
    },

    // 3. ORDERS
    // Admin: all orders. Signed-in customer: their own orders. Visitor: this browser's orders.
    getOrders: async function () {
      if (CLOUD && await this.ready() && this.user) {
        const { data, error } = await this.client.from('orders').select('*').order('created_at', { ascending: false }).limit(1000);
        if (!error && Array.isArray(data)) {
          const list = data.map(rowToOrder);
          writeJSON(this.isAdmin ? KEYS.orders : KEYS.myOrders, list);
          return list;
        }
      }
      return readJSON(CLOUD ? KEYS.myOrders : KEYS.orders, []);
    },

    // Only the signed-in customer's own orders (used on the Account page)
    getMyOrders: async function () {
      if (!(CLOUD && await this.ready() && this.user)) return readJSON(CLOUD ? KEYS.myOrders : KEYS.orders, []);
      const { data, error } = await this.client.from('orders').select('*').eq('user_id', this.user.id).order('created_at', { ascending: false }).limit(200);
      if (error) throw new Error(friendlyError(error));
      return (data || []).map(rowToOrder);
    },

    // Checkout. In cloud mode the SERVER recalculates prices, stock, coupon and fees.
    placeOrder: async function (payload) {
      if (CLOUD) {
        if (!(await this.ready())) throw new Error('Could not connect to the store. Please check your internet and try again.');
        const { data, error } = await this.client.rpc('place_order', { payload });
        if (error) throw new Error(friendlyError(error));
        const mine = readJSON(KEYS.myOrders, []);
        mine.unshift(data);
        writeJSON(KEYS.myOrders, mine.slice(0, 50));
        this.getProducts().catch(() => {});
        this.notifyListeners('order_created', data);
        return data;
      }
      return null; // local mode: app.js builds the order itself
    },

    saveOrder: async function (order) {
      if (!order) return { success: false };
      if (!order.orderId) order.orderId = 'BC-' + Math.floor(100000 + Math.random() * 900000);
      if (!order.date) order.date = new Date().toISOString().split('T')[0];
      if (CLOUD) {
        const saved = await this.placeOrder(Object.assign({}, order, { couponCode: order.couponCode }));
        return { success: true, order: saved };
      }
      const orders = readJSON(KEYS.orders, []);
      if (!orders.find(o => o.orderId === order.orderId)) orders.unshift(order);
      writeJSON(KEYS.orders, orders);
      if (Array.isArray(order.items)) {
        const products = await this.getProducts();
        order.items.forEach(item => {
          const match = products.find(p => p.id === (item.productId || item.id));
          if (match && match.stock) match.stock = Math.max(0, match.stock - (item.qty || 1));
        });
        writeJSON(KEYS.products, products);
      }
      this.notifyListeners('order_created', order);
      return { success: true, order };
    },

    updateOrder: async function (orderUpdate) {
      if (!orderUpdate || !orderUpdate.orderId) return { success: false };
      if (CLOUD && await this.ready() && this._requireAdmin('order status')) {
        const { error } = await this.client.from('orders').update(orderUpdateToRow(orderUpdate)).eq('order_id', orderUpdate.orderId);
        if (error) { showAdminNotice('Cloud order update failed: ' + error.message, true); return { success: false }; }
      }
      const orders = readJSON(KEYS.orders, []);
      const idx = orders.findIndex(o => o.orderId === orderUpdate.orderId);
      if (idx !== -1) { orders[idx] = Object.assign({}, orders[idx], orderUpdate); writeJSON(KEYS.orders, orders); }
      this.notifyListeners('order_updated', orderUpdate);
      return { success: true, order: orders[idx] };
    },

    // Public order tracking: order ID + phone number
    trackOrder: async function (orderId, phone) {
      if (CLOUD && await this.ready()) {
        const { data, error } = await this.client.rpc('track_order', { p_order_id: orderId, p_phone: phone });
        if (error) throw new Error(friendlyError(error));
        return data || null;
      }
      const local = readJSON(KEYS.orders, []);
      return local.find(o => o.orderId === orderId) || null;
    },

    // 4. IMAGE UPLOADS (Supabase Storage, 1 GB free)
    uploadImage: async function (fileOrBase64, filename) {
      let file = fileOrBase64;
      let name = filename || (file && file.name) || ('garment_' + Date.now() + '.jpg');
      let base64 = '';
      if (!(file instanceof Blob)) {
        base64 = String(fileOrBase64 || '');
      }
      if (CLOUD && await this.ready() && this.isAdmin) {
        try {
          if (!(file instanceof Blob)) file = await (await fetch(base64)).blob();
          const ext = (name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
          const path = 'products/' + Date.now() + '-' + slugify(name.replace(/\.[^.]+$/, '')) + '.' + ext;
          const { error } = await this.client.storage.from('product-images').upload(path, file, {
            cacheControl: '31536000', upsert: false, contentType: file.type || 'image/jpeg'
          });
          if (error) throw error;
          const { data } = this.client.storage.from('product-images').getPublicUrl(path);
          return { success: true, url: data.publicUrl, filename: path };
        } catch (e) {
          showAdminNotice('Photo upload to cloud failed (' + friendlyError(e) + '). Saved inside the product instead.', true);
        }
      } else if (CLOUD) {
        this._requireAdmin('photo');
      }
      if (file instanceof Blob && !base64) {
        base64 = await new Promise((resolve, reject) => {
          const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(file);
        });
      }
      return { success: true, url: base64, filename: name, isBase64: true };
    },

    // 5. SETTINGS
    _getSetting: async function (key) {
      if (!(CLOUD && await this.ready())) return null;
      const { data, error } = await this.client.from('store_settings').select('value').eq('key', key).maybeSingle();
      return (!error && data) ? data.value : null;
    },
    _setSetting: async function (key, value) {
      const { error } = await this.client.from('store_settings').upsert({ key, value, updated_at: new Date().toISOString() });
      if (error) throw error;
    },

    getSettings: async function () {
      const cloud = await this._getSetting('admin');
      if (cloud) { writeJSON(KEYS.settings, cloud); return cloud; }
      return readJSON(KEYS.settings, { supportPhone: '+966 54 380 5017' });
    },

    saveSettings: async function (settings) {
      const merged = Object.assign({}, readJSON(KEYS.settings, {}), settings || {});
      writeJSON(KEYS.settings, merged);
      if (CLOUD && await this.ready() && this._requireAdmin('settings')) {
        try {
          const safe = Object.assign({}, merged);
          delete safe.adminPass; // never store passwords in the database
          await this._setSetting('admin', safe);
          if (settings && (settings.freeShippingThreshold !== undefined || settings.codHandlingFee !== undefined)) {
            const ship = Object.assign({ freeShippingThreshold: 5000, standardShippingFee: 250, codHandlingFee: 150 },
              (await this._getSetting('shipping')) || {});
            if (settings.freeShippingThreshold !== undefined) ship.freeShippingThreshold = Number(settings.freeShippingThreshold) || 0;
            if (settings.codHandlingFee !== undefined) ship.codHandlingFee = Number(settings.codHandlingFee) || 0;
            await this._setSetting('shipping', ship);
          }
          if (settings && (settings.googleAnalyticsId !== undefined || settings.supportPhone !== undefined)) {
            const pub = Object.assign({}, (await this._getSetting('public')) || {});
            if (settings.googleAnalyticsId !== undefined) pub.ga4Id = settings.googleAnalyticsId;
            if (settings.supportPhone !== undefined) pub.supportPhone = settings.supportPhone;
            await this._setSetting('public', pub);
          }
        } catch (e) { showAdminNotice('Cloud settings save failed: ' + friendlyError(e), true); }
      }
      return { success: true };
    },

    // Public settings for every visitor (Google Analytics ID, shipping fees)
    getPublicSettings: async function () {
      const [pub, ship] = await Promise.all([this._getSetting('public'), this._getSetting('shipping')]);
      return { public: pub || {}, shipping: ship || null };
    },

    // 5.5 BANNERS
    getBanners: async function () {
      const cloud = await this._getSetting('banners');
      if (cloud && cloud.heroTitle) { writeJSON(KEYS.banners, cloud); return cloud; }
      return readJSON(KEYS.banners, null) || Object.assign({}, DEFAULT_BANNERS);
    },
    saveBanners: async function (banners) {
      writeJSON(KEYS.banners, banners);
      if (CLOUD && await this.ready() && this._requireAdmin('banners')) {
        try { await this._setSetting('banners', banners); }
        catch (e) { showAdminNotice('Cloud banner save failed: ' + friendlyError(e), true); }
      }
      return { success: true };
    },

    // 6. BACKUP & RESTORE
    exportDatabaseUrl: function () { return '#'; },

    downloadBackup: async function () {
      const backup = { metadata: { version: '2.0.0', source: CLOUD && this.isAdmin ? 'supabase' : 'browser', exportedAt: new Date().toISOString() } };
      backup.products = await this.getProducts();
      backup.orders = await this.getOrders();
      backup.banners = await this.getBanners();
      backup.settings = await this.getSettings();
      if (CLOUD && this.isAdmin) {
        const m = await this.client.from('messages').select('*').order('created_at', { ascending: false });
        const s = await this.client.from('subscribers').select('*');
        backup.messages = m.data || [];
        backup.subscribers = s.data || [];
      }
      if (backup.settings) delete backup.settings.adminPass;
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'brand_collection_backup_' + new Date().toISOString().split('T')[0] + '.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      return true;
    },

    restoreBackup: async function (jsonContent) {
      let parsed;
      try { parsed = typeof jsonContent === 'string' ? JSON.parse(jsonContent) : jsonContent; }
      catch (e) { return { success: false, error: 'Invalid JSON format' }; }
      if (CLOUD && await this.ready() && this._requireAdmin('backup restore')) {
        try {
          if (Array.isArray(parsed.products) && parsed.products.length) {
            const { error } = await this.client.from('products').upsert(parsed.products.map(productToRow), { onConflict: 'id' });
            if (error) throw error;
          }
          if (Array.isArray(parsed.orders) && parsed.orders.length) {
            const { error } = await this.client.from('orders').upsert(parsed.orders.map(orderToRow), { onConflict: 'order_id' });
            if (error) throw error;
          }
          if (parsed.banners) await this._setSetting('banners', parsed.banners);
          await this.init();
          return { success: true };
        } catch (e) { return { success: false, error: friendlyError(e) }; }
      }
      if (parsed.products) writeJSON(KEYS.products, parsed.products);
      if (parsed.orders) writeJSON(KEYS.orders, parsed.orders);
      if (parsed.settings) writeJSON(KEYS.settings, parsed.settings);
      return { success: true };
    },

    // 7. CUSTOMER ACCOUNTS (Supabase Auth)
    _needCloud: async function () {
      if (!CLOUD) throw new Error('Customer accounts are not switched on yet. The store owner needs to finish the Supabase setup.');
      if (!(await this.ready())) throw new Error('Could not connect. Please check your internet and try again.');
    },
    accountsEnabled: function () { return CLOUD; },
    getUser: async function () { if (!CLOUD || !(await this.ready())) return null; return this.user; },

    signUp: async function (email, password, fullName, phone) {
      await this._needCloud();
      const redirect = location.origin + location.pathname.replace(/[^/]*$/, '') + 'account.html';
      const { data, error } = await this.client.auth.signUp({
        email, password, options: { data: { full_name: fullName || '', phone: phone || '' }, emailRedirectTo: redirect }
      });
      if (error) throw new Error(friendlyError(error));
      return { needsConfirmation: !data.session, user: data.user };
    },
    signIn: async function (email, password) {
      await this._needCloud();
      const { data, error } = await this.client.auth.signInWithPassword({ email, password });
      if (error) throw new Error(friendlyError(error));
      this.user = data.user;
      await this._refreshAdmin();
      return { user: data.user, isAdmin: this.isAdmin };
    },
    signOut: async function () {
      if (!CLOUD || !(await this.ready())) return;
      await this.client.auth.signOut();
      this.user = null; this.isAdmin = false;
      try { localStorage.removeItem(KEYS.myOrders); } catch (e) {}
    },
    resetPassword: async function (email) {
      await this._needCloud();
      const redirect = location.origin + location.pathname.replace(/[^/]*$/, '') + 'account.html?reset=1';
      const { error } = await this.client.auth.resetPasswordForEmail(email, { redirectTo: redirect });
      if (error) throw new Error(friendlyError(error));
      return true;
    },
    updatePassword: async function (newPassword) {
      await this._needCloud();
      const { error } = await this.client.auth.updateUser({ password: newPassword });
      if (error) throw new Error(friendlyError(error));
      return true;
    },
    getProfile: async function () {
      await this._needCloud();
      if (!this.user) return null;
      const { data } = await this.client.from('profiles').select('*').eq('id', this.user.id).maybeSingle();
      return data || { id: this.user.id, full_name: '', phone: '', city: '', address: '' };
    },
    saveProfile: async function (profile) {
      await this._needCloud();
      if (!this.user) throw new Error('Please log in first.');
      const row = {
        id: this.user.id,
        full_name: (profile.full_name || '').slice(0, 120),
        phone: (profile.phone || '').slice(0, 30),
        city: (profile.city || '').slice(0, 60),
        address: (profile.address || '').slice(0, 400),
        updated_at: new Date().toISOString()
      };
      const { error } = await this.client.from('profiles').upsert(row);
      if (error) throw new Error(friendlyError(error));
      return row;
    },

    // 8. CONTACT FORM & NEWSLETTER
    sendMessage: async function (msg) {
      if (!CLOUD || !(await this.ready())) return false;
      const { error } = await this.client.from('messages').insert({
        name: (msg.name || '').slice(0, 120), email: (msg.email || '').slice(0, 160),
        phone: (msg.phone || '').slice(0, 30), subject: (msg.subject || '').slice(0, 200),
        message: (msg.message || '').slice(0, 3000) || '(empty)'
      });
      if (error) throw new Error(friendlyError(error));
      return true;
    },
    subscribe: async function (email) {
      if (!CLOUD || !(await this.ready())) return false;
      const { error } = await this.client.from('subscribers').insert({ email: String(email).trim().toLowerCase().slice(0, 160) });
      if (error && !/duplicate/i.test(error.message)) throw new Error(friendlyError(error));
      return true;
    },

    friendlyError: friendlyError
  };

  window.DB = DB;

  // ---------- admin page helper (no admin files are changed) ----------
  function showAdminNotice(text, isWarning) {
    if (!isAdminPage() || !document.body) return;
    let bar = document.getElementById('bc-cloud-notice');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'bc-cloud-notice';
      bar.setAttribute('role', 'status');
      bar.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:12px;z-index:400;max-width:92vw;padding:10px 14px;border-radius:6px;font:600 13px/1.4 system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.35);display:flex;gap:10px;align-items:center;';
      document.body.appendChild(bar);
    }
    bar.style.background = isWarning ? '#3a1d12' : '#0f2a1c';
    bar.style.border = '1px solid ' + (isWarning ? '#F59E0B' : '#34D399');
    bar.style.color = '#F5F0E8';
    bar.innerHTML = '';
    const span = document.createElement('span'); span.textContent = text; bar.appendChild(span);
    if (isWarning && CLOUD && !DB.isAdmin) {
      const a = document.createElement('a');
      a.href = 'account.html?next=admin'; a.textContent = 'Sign in';
      a.style.cssText = 'color:#C7F36B;text-decoration:underline;white-space:nowrap;';
      bar.appendChild(a);
    }
    const x = document.createElement('button');
    x.type = 'button'; x.textContent = '×'; x.setAttribute('aria-label', 'Close');
    x.style.cssText = 'background:none;border:0;color:inherit;font-size:18px;cursor:pointer;';
    x.onclick = () => bar.remove();
    bar.appendChild(x);
  }

  let lastAdminSnapshot = '';
  function refreshAdminIfChanged() {
    if (!isAdminPage()) return;
    const snap = (localStorage.getItem(KEYS.products) || '').length + ':' + (localStorage.getItem(KEYS.orders) || '');
    if (snap === lastAdminSnapshot) return;
    const first = lastAdminSnapshot === '';
    lastAdminSnapshot = snap;
    const el = document.activeElement;
    const typing = el && /INPUT|TEXTAREA|SELECT/.test(el.tagName);
    const modalOpen = document.querySelector('.modal.open, .modal-overlay.open, [data-modal-open="true"]');
    if (!typing && !modalOpen && window.AdminApp && typeof window.AdminApp.renderAdminPanel === 'function') {
      try { window.AdminApp.renderAdminPanel(); } catch (e) { console.warn(e); }
    }
    if (first) return;
  }

  // ---------- Google Analytics for every visitor (ID saved from admin settings) ----------
  function startAnalytics(id) {
    if (!id || !/^G-[A-Z0-9]{4,}$/i.test(id) || window.__bcGa) return;
    window.__bcGa = true;
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', id);
  }

  // ---------- start ----------
  async function boot() {
    const ok = await DB.init();
    if (CLOUD && ok) {
      DB.getPublicSettings().then(s => {
        if (s.public && s.public.ga4Id) startAnalytics(s.public.ga4Id);
        if (s.shipping && typeof SHIPPING_CONFIG !== 'undefined') {
          ['freeShippingThreshold', 'standardShippingFee', 'codHandlingFee'].forEach(k => {
            if (s.shipping[k] !== undefined) SHIPPING_CONFIG[k] = Number(s.shipping[k]);
          });
        }
      }).catch(() => {});
    }
    if (isAdminPage()) {
      lastAdminSnapshot = '';
      refreshAdminIfChanged();
      if (!CLOUD) {
        showAdminNotice('Cloud database is not set up yet. Products and orders are saved in this browser only.', true);
      } else if (!DB.isAdmin) {
        showAdminNotice(DB.user ? ('Signed in as ' + DB.user.email + ', but this email is not an admin. Changes will not reach the cloud.') : 'You are not signed in to the cloud database. Customer orders will not show here until you sign in.', true);
      } else {
        showAdminNotice('Connected to the cloud database as ' + DB.user.email + '. Customer orders are live.', false);
        setTimeout(() => { const b = document.getElementById('bc-cloud-notice'); if (b) b.remove(); }, 6000);
        // Check for new orders every 60 seconds while the admin page is open
        setInterval(async () => { await DB.getOrders(); await DB.getProducts(); refreshAdminIfChanged(); }, 60000);
      }
    }
  }

  // Keep a copy of the original demo catalogue for first-time cloud setup
  if (typeof PRODUCTS_DATA !== 'undefined' && !window.BC_DEFAULT_PRODUCTS) {
    window.BC_DEFAULT_PRODUCTS = JSON.parse(JSON.stringify(PRODUCTS_DATA));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
