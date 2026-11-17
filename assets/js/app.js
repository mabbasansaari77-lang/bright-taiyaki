/**
 * BRAND COLLECTION — E-COMMERCE CORE APPLICATION ENGINE
 * Pure Vanilla JavaScript: High performance, zero external dependencies.
 */

(function () {
  'use strict';

  // Synchronize products and orders from persistent backend database or storage
  const savedCustom = localStorage.getItem('bc_custom_products');
  if (savedCustom) {
    try {
      const parsed = JSON.parse(savedCustom);
      if (Array.isArray(parsed) && parsed.length > 0) {
        PRODUCTS_DATA.length = 0;
        parsed.forEach(p => PRODUCTS_DATA.push(p));
      }
    } catch(e) {}
  }

  // Connect to live backend database engine if available
  if (window.DB) {
    window.DB.getProducts().then(prods => {
      if (Array.isArray(prods) && prods.length > 0) {
        PRODUCTS_DATA.length = 0;
        prods.forEach(p => PRODUCTS_DATA.push(p));
        if (typeof renderHomeProducts === 'function') renderHomeProducts();
      }
    });
    window.DB.getOrders().then(ords => {
      if (Array.isArray(ords) && ords.length > 0) {
        STATE.orders = ords;
      }
    });
  }

  // Cloud mode keeps a customer's own orders under a separate key (admin data stays in bc_orders)
  const ORDERS_KEY = (window.DB && window.DB.isCloud) ? 'bc_my_orders' : 'bc_orders';

  // State Management
  const STATE = {
    cart: JSON.parse(localStorage.getItem('bc_cart') || '[]'),
    wishlist: JSON.parse(localStorage.getItem('bc_wishlist') || '[]'),
    appliedCoupon: JSON.parse(localStorage.getItem('bc_coupon') || 'null'),
    currentView: 'home',
    currentCategoryFilter: 'all',
    currentSort: 'relevance',
    searchQuery: '',
    selectedProduct: PRODUCTS_DATA[0],
    selectedSize: PRODUCTS_DATA[0].sizes[0],
    selectedColor: PRODUCTS_DATA[0].colors[0].name,
    selectedQty: 1,
    sizeGuideUnit: 'in', // 'in' or 'cm'
    lang: localStorage.getItem('bc_lang') || 'en', // 'en' or 'ur' (Roman Urdu)
    orders: (function () { try { return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]'); } catch (e) { return []; } })()
  };

  // Roman Urdu Localization Map
  const TRANSLATIONS = {
    en: {
      ticker: 'FREE NATIONWIDE DELIVERY ON ORDERS OVER ₨5,000 | CASH ON DELIVERY AVAILABLE',
      heroSub: 'PAKISTAN’S AVANT-GARDE FASHION ATELIER',
      heroTitle: 'FUTURISTIC LUXURY TAILORED FOR NOW',
      heroDesc: 'Bridging high-performance technical fabric engineering with contemporary Pakistani pret aesthetics. Charcoal tones, warm ivory drapes, and high-voltage accents.',
      shopNow: 'EXPLORE COLLECTION',
      viewLookbook: 'VIEW RUNWAY EDIT',
      cartTitle: 'YOUR SHOPPING CART',
      emptyCart: 'Your cart is empty. Discover the new drop.',
      subtotal: 'Subtotal',
      shipping: 'Shipping',
      freeShipMsg: 'You qualify for FREE nationwide shipping!',
      needMoreShip: (amt) => `Add ₨${amt.toLocaleString()} more for FREE shipping!`,
      checkout: 'PROCEED TO CHECKOUT',
      codTitle: 'Cash on Delivery (COD)',
      codDesc: 'Pay in cash upon doorstep delivery across Pakistan. Transparent handling fee.',
      onlinePayTitle: 'Direct Debit / Credit Card (Simulated 3D Secure)',
      onlinePayDesc: 'Pay securely using any Pakistani Visa, Mastercard or UnionPay.',
      trackOrderTitle: 'TRACK YOUR SHIPMENT',
      trackPlaceholder: 'Enter Order Number (e.g. BC-89241)',
      phonePlaceholder: 'Enter Phone Number (e.g. 03001234567)'
    },
    ur: {
      ticker: '₨5,000 SE ZIAADA KE ORDERS PAR MUFT DELIVERY | CASH ON DELIVERY DASTIYAB HAI',
      heroSub: 'PAKISTAN KA JADEED FASHION ATELIER',
      heroTitle: 'MUSTAQBIL KA LUXURY FASHION — AAJ KE LIYE',
      heroDesc: 'Ala tareen technical kapray aur Pakistan ke naye fashion pret ka shaandaar sangam. Charcoal rang, warm ivory kapray aur electric lime chamak.',
      shopNow: 'COLLECTION DEKHIYE',
      viewLookbook: 'RUNWAY LOOKS',
      cartTitle: 'AAPKA SHOPPING CART',
      emptyCart: 'Aapka cart khaali hai. Naya drop check kijiye.',
      subtotal: 'Kul Raqam (Subtotal)',
      shipping: 'Delivery Kharcha',
      freeShipMsg: 'Mubarak! Aapko FREE nationwide delivery mil rahi hai!',
      needMoreShip: (amt) => `FREE delivery ke liye mazeed ₨${amt.toLocaleString()} ka saamaan shamil karein!`,
      checkout: 'CHECKOUT KI TARAF BARHEIN',
      codTitle: 'Cash on Delivery (COD)',
      codDesc: 'Ghar pohanchne par cash ada karein. Poore Pakistan mein dastiyab.',
      onlinePayTitle: 'Credit / Debit Card (Mehfooz Payment)',
      onlinePayDesc: 'Pakistani Visa, Mastercard ya UnionPay se baa-asani payment karein.',
      trackOrderTitle: 'APNA PARCEL TRACK KAREIN',
      trackPlaceholder: 'Order Number darj karein (e.g. BC-89241)',
      phonePlaceholder: 'Apna Mobile Number likhein (e.g. 03001234567)'
    }
  };

  // Helper: Format PKR
  // Escape text before putting it into HTML
  function esc(v) {
    return String(v === null || v === undefined ? '' : v).replace(/[&<>"'`]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' }[c]));
  }

  function formatPKR(amount) {
    return '₨' + Number(amount).toLocaleString('en-PK');
  }

  // Toast Notification System
  function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = 'position:fixed;bottom:2rem;left:2rem;z-index:200;display:flex;flex-direction:column;gap:0.75rem;pointer-events:none;';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.style.cssText = `
      background: #17191E;
      border: 1px solid ${type === 'success' ? 'var(--accent-lime)' : 'var(--accent-danger)'};
      color: #F5F0E8;
      padding: 0.85rem 1.25rem;
      border-radius: 4px;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      box-shadow: 0 8px 24px rgba(0,0,0,0.6);
      transform: translateY(20px);
      opacity: 0;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      pointer-events: auto;
    `;
    const icon = type === 'success' ? '⚡' : '⚠️';
    toast.innerHTML = `<span style="color:var(--accent-lime);">${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    });
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // Save Cart & Wishlist
  function saveState() {
    localStorage.setItem('bc_cart', JSON.stringify(STATE.cart));
    localStorage.setItem('bc_wishlist', JSON.stringify(STATE.wishlist));
    localStorage.setItem(ORDERS_KEY, JSON.stringify(STATE.orders));
    localStorage.setItem('bc_coupon', JSON.stringify(STATE.appliedCoupon));
    updateCartBadges();
  }

  // Update Badge Counts
  function updateCartBadges() {
    const totalQty = STATE.cart.reduce((sum, item) => sum + item.qty, 0);
    const cartCountEl = document.getElementById('cart-count');
    if (cartCountEl) cartCountEl.textContent = totalQty;
    const wishlistCountEl = document.getElementById('wishlist-count');
    if (wishlistCountEl) wishlistCountEl.textContent = STATE.wishlist.length;
  }

  // Cart Operations
  function addToCart(productId, size, color, qty = 1) {
    const product = PRODUCTS_DATA.find(p => p.id === productId);
    if (!product) return;

    if (product.stock <= 0) {
      showToast('This item is currently out of stock.', 'error');
      return;
    }

    const price = product.salePrice || product.price;
    const itemKey = `${productId}-${size}-${color}`;
    const existingIndex = STATE.cart.findIndex(i => i.key === itemKey);

    if (existingIndex > -1) {
      if (STATE.cart[existingIndex].qty + qty > product.stock) {
        showToast(`Stock limit reached! Only ${product.stock} units available.`, 'error');
        return;
      }
      STATE.cart[existingIndex].qty += qty;
    } else {
      STATE.cart.push({
        key: itemKey,
        id: product.id,
        name: product.name,
        price: price,
        size: size,
        color: color,
        qty: qty,
        image: product.image,
        sku: product.sku
      });
    }

    saveState();
    renderCartDrawer();
    openCartDrawer();
    showToast(`Added ${product.name} to cart.`);
  }

  function updateCartQty(key, delta) {
    const item = STATE.cart.find(i => i.key === key);
    if (!item) return;
    const product = PRODUCTS_DATA.find(p => p.id === item.id);
    const newQty = item.qty + delta;

    if (newQty <= 0) {
      removeFromCart(key);
      return;
    }

    if (product && newQty > product.stock) {
      showToast(`Cannot add more. Only ${product.stock} units in stock.`, 'error');
      return;
    }

    item.qty = newQty;
    saveState();
    renderCartDrawer();
    if (STATE.currentView === 'cart') renderCartPage();
    if (STATE.currentView === 'checkout') renderCheckoutPage();
  }

  function removeFromCart(key) {
    STATE.cart = STATE.cart.filter(i => i.key !== key);
    saveState();
    renderCartDrawer();
    if (STATE.currentView === 'cart') renderCartPage();
    if (STATE.currentView === 'checkout') renderCheckoutPage();
    showToast('Item removed from cart.');
  }

  // Cart Drawer UI
  function openCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('drawer-overlay');
    if (drawer && overlay) {
      drawer.classList.add('active');
      overlay.classList.add('active');
    }
  }

  function closeCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('drawer-overlay');
    if (drawer && overlay) {
      drawer.classList.remove('active');
      overlay.classList.remove('active');
    }
  }

  function renderCartDrawer() {
    const container = document.getElementById('cart-drawer-items');
    if (!container) return;

    if (STATE.cart.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:3rem 1rem;color:var(--text-secondary);">
          <div style="font-size:3rem;margin-bottom:1rem;color:var(--accent-lime);">⚡</div>
          <p style="font-weight:600;margin-bottom:0.5rem;color:var(--text-primary);">${TRANSLATIONS[STATE.lang].emptyCart}</p>
          <p style="font-size:0.8rem;margin-bottom:1.5rem;">Explore our latest limited Pakistani street-luxury drop.</p>
          <button class="btn btn-primary btn-sm" onclick="App.navigateTo('shop')">SHOP ALL DROPS</button>
        </div>
      `;
      document.getElementById('cart-subtotal-val').textContent = '₨0';
      document.getElementById('cart-shipping-val').textContent = 'Calculated at checkout';
      document.getElementById('free-shipping-text').textContent = TRANSLATIONS[STATE.lang].needMoreShip(SHIPPING_CONFIG.freeShippingThreshold);
      document.getElementById('free-shipping-progress').style.width = '0%';
      return;
    }

    let subtotal = 0;
    container.innerHTML = STATE.cart.map(item => {
      subtotal += item.price * item.qty;
      return `
        <div class="cart-item">
          <img src="${item.image}" alt="${item.name}" class="cart-item-img">
          <div class="cart-item-details">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-meta">Size: <strong style="color:var(--accent-lime);">${item.size}</strong> | Color: ${item.color}</div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-top:0.5rem;">
              <div class="cart-qty-ctrl">
                <button class="qty-btn" onclick="App.updateCartQty('${item.key}', -1)" aria-label="Decrease quantity">-</button>
                <span class="qty-val">${item.qty}</span>
                <button class="qty-btn" onclick="App.updateCartQty('${item.key}', 1)" aria-label="Increase quantity">+</button>
              </div>
              <div style="font-family:var(--font-mono);font-weight:700;font-size:0.9rem;">
                ${formatPKR(item.price * item.qty)}
              </div>
            </div>
          </div>
          <button onclick="App.removeFromCart('${item.key}')" style="color:var(--text-muted);font-size:1.1rem;align-self:flex-start;padding:0.25rem;" title="Remove">✕</button>
        </div>
      `;
    }).join('');

    // Shipping calculations
    const freeThreshold = SHIPPING_CONFIG.freeShippingThreshold;
    const progressPercent = Math.min(100, Math.round((subtotal / freeThreshold) * 100));
    const progressEl = document.getElementById('free-shipping-progress');
    const textEl = document.getElementById('free-shipping-text');
    if (progressEl) progressEl.style.width = `${progressPercent}%`;

    if (subtotal >= freeThreshold) {
      if (textEl) textEl.innerHTML = `<strong>⚡ ${TRANSLATIONS[STATE.lang].freeShipMsg}</strong>`;
      document.getElementById('cart-shipping-val').textContent = 'FREE';
    } else {
      const remaining = freeThreshold - subtotal;
      if (textEl) textEl.textContent = TRANSLATIONS[STATE.lang].needMoreShip(remaining);
      document.getElementById('cart-shipping-val').textContent = formatPKR(SHIPPING_CONFIG.standardShippingFee);
    }

    document.getElementById('cart-subtotal-val').textContent = formatPKR(subtotal);
  }

  const PAGE_MAP = {
    'home': 'index.html',
    'shop': 'shop.html',
    'men': 'men.html',
    'women': 'women.html',
    'kids': 'kids.html',
    'collections': 'collections.html',
    'sale': 'sale.html',
    'size-guide': 'size-guide.html',
    'about': 'about.html',
    'cart': 'cart.html',
    'checkout': 'checkout.html',
    'order-confirmation': 'checkout.html',
    'admin': 'admin.html',
    'product': 'product.html',
    'track-order': 'track-order.html',
    'contact': 'contact.html',
    'faq': 'faq.html',
    'account': 'account.html',
    'shipping-policy': 'shipping-policy.html',
    'returns-policy': 'returns-policy.html',
    'privacy-policy': 'privacy-policy.html',
    'terms': 'terms.html',
    'blog': 'blog.html'
  };

  // Navigation / View Controller
  function navigateTo(viewId, params = {}) {
    if (viewId === 'account' && detectCurrentPage() !== 'account') {
      window.location.href = 'account.html';
      return;
    }
    const targetFile = PAGE_MAP[viewId];
    const targetView = document.getElementById(`view-${viewId}`);
    
    // If we are on a multi-page site and the requested view container does not exist on this page, redirect to its dedicated page
    if (targetFile && !targetView) {
      let url = targetFile;
      if (viewId === 'product' && params && params.id) {
        url += `?id=${encodeURIComponent(params.id)}`;
      } else if (viewId === 'shop' && params && params.category) {
        url += `?cat=${encodeURIComponent(params.category)}`;
      } else if (viewId === 'men' && params && params.subCat) {
        url += `?sub=${encodeURIComponent(params.subCat)}`;
      } else if (viewId === 'order-confirmation' && params && params.orderId) {
        url = `checkout.html?orderId=${encodeURIComponent(params.orderId)}`;
      } else if (viewId === 'track-order' && params && params.orderId) {
        url = `track-order.html?orderId=${encodeURIComponent(params.orderId)}`;
      }
      window.location.href = url;
      return;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    STATE.currentView = viewId;

    // Close drawers & modals
    closeCartDrawer();
    closeSearchModal();
    closeSizeGuideModal();

    // Hide all view containers
    document.querySelectorAll('.view-container').forEach(el => el.style.display = 'none');

    // Update active nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.getAttribute('data-view') === viewId);
    });

    // Handle view specific rendering
    if (targetView) {
      targetView.style.display = 'block';
    } else {
      // Fallback to 404
      const view404 = document.getElementById('view-404');
      if (view404) view404.style.display = 'block';
      return;
    }

    switch (viewId) {
      case 'home':
        renderHomeProducts();
        break;
      case 'shop':
        STATE.currentCategoryFilter = params.category || 'all';
        renderShopCatalog();
        break;
      case 'men':
        renderDepartmentCatalog('men', params.subCat || 'all');
        break;
      case 'women':
        renderDepartmentCatalog('women', params.subCat || 'all');
        break;
      case 'kids':
        renderDepartmentCatalog('kids', params.subCat || 'all');
        break;
      case 'collections':
        renderCollectionsView(params.collection);
        break;
      case 'sale':
        STATE.currentCategoryFilter = 'sale';
        renderShopCatalog();
        break;
      case 'product':
        if (params.id) {
          const product = PRODUCTS_DATA.find(p => p.id === params.id || p.slug === params.id);
          if (product) STATE.selectedProduct = product;
        }
        renderProductDetailPage();
        break;
      case 'cart':
        renderCartPage();
        break;
      case 'checkout':
        renderCheckoutPage();
        break;
      case 'order-confirmation':
        renderOrderConfirmationPage(params.orderId);
        break;
      case 'account':
        renderAccountPage();
        break;
      case 'track-order':
        renderTrackOrderPage(params.orderId);
        break;
      case 'admin':
        if (window.AdminApp && typeof window.AdminApp.renderAdminPanel === 'function') {
          window.AdminApp.renderAdminPanel();
        }
        break;
    }
  }

  // Product Detail Page Rendering
  function renderProductDetailPage() {
    const p = STATE.selectedProduct;
    if (!p) return;

    STATE.selectedSize = p.sizes[0];
    STATE.selectedColor = p.colors[0].name;
    STATE.selectedQty = 1;

    const container = document.getElementById('product-detail-content');
    if (!container) return;

    const discountBadge = p.salePrice ? `<span class="product-badge sale">SAVE ${formatPKR(p.price - p.salePrice)}</span>` : '';
    const stockPill = p.stock <= 5 
      ? `<span class="stock-pill low-stock">⚡ ONLY ${p.stock} UNITS REMAINING</span>`
      : `<span class="stock-pill in-stock">✓ IN STOCK (${p.stock} AVAILABLE)</span>`;

    container.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(min(320px, 100%), 1fr));gap:3.5rem;align-items:start;">
        <!-- Left: Image Gallery -->
        <div>
          <div style="position:relative;border-radius:var(--radius-sm);overflow:hidden;border:1px solid var(--border-subtle);background:#14161B;">
            <img id="main-product-img" src="${p.image}" alt="${p.name}" style="width:100%;height:600px;object-fit:cover;">
            <div style="position:absolute;top:1rem;left:1rem;display:flex;gap:0.5rem;">
              ${discountBadge}
              <span class="product-badge">${p.badge || 'ATELIER DROP'}</span>
            </div>
          </div>
          <div style="display:flex;gap:1rem;margin-top:1rem;">
            ${(p.images || [p.image]).map((img, idx) => `
              <div onclick="document.getElementById('main-product-img').src='${img}'" style="width:80px;height:100px;border-radius:var(--radius-sm);overflow:hidden;cursor:pointer;border:1px solid ${idx === 0 ? 'var(--accent-lime)' : 'var(--border-subtle)'};">
                <img src="${img}" alt="Thumbnail" style="width:100%;height:100%;object-fit:cover;">
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Right: Information & Action -->
        <div>
          <div class="mono-tag" style="margin-bottom:0.5rem;">${p.collection} // ${p.sku}</div>
          <h1 class="display-title" style="font-size:2.25rem;margin-bottom:1rem;">${p.name}</h1>
          
          <div style="display:flex;align-items:baseline;gap:1rem;margin-bottom:1.5rem;">
            <span class="price-current" style="font-size:1.75rem;">${formatPKR(p.salePrice || p.price)}</span>
            ${p.salePrice ? `<span class="price-original" style="font-size:1.15rem;">${formatPKR(p.price)}</span>` : ''}
            <div style="margin-left:auto;">${stockPill}</div>
          </div>

          <p style="color:var(--text-secondary);font-size:0.95rem;line-height:1.6;margin-bottom:2rem;">
            ${p.description}
          </p>

          <!-- Color Selection -->
          <div style="margin-bottom:1.5rem;">
            <div style="font-size:0.8rem;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.5rem;color:var(--text-primary);display:flex;justify-content:space-between;">
              <span>Selected Color: <strong id="selected-color-label" style="color:var(--accent-lime);">${p.colors[0].name}</strong></span>
            </div>
            <div style="display:flex;gap:0.75rem;">
              ${p.colors.map((c, i) => `
                <button type="button" onclick="App.selectProductColor('${c.name}', this)" style="display:flex;align-items:center;gap:0.5rem;padding:0.4rem 0.8rem;background:var(--bg-surface-elevated);border:1px solid ${i === 0 ? 'var(--accent-lime)' : 'var(--border-subtle)'};border-radius:var(--radius-sm);color:var(--text-primary);font-size:0.75rem;">
                  <span style="width:14px;height:14px;border-radius:50%;background:${c.hex};border:1px solid rgba(255,255,255,0.2);"></span>
                  <span>${c.name}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Size Selection -->
          <div style="margin-bottom:2rem;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">
              <span style="font-size:0.8rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-primary);">
                Select Size: <strong id="selected-size-label" style="color:var(--accent-lime);">${p.sizes[0]}</strong>
              </span>
              <button onclick="App.openSizeGuideModal()" style="font-size:0.75rem;color:var(--accent-lime);text-decoration:underline;background:none;border:none;">
                📏 View Pakistani Fit & Size Guide
              </button>
            </div>
            <div style="display:flex;gap:0.6rem;flex-wrap:wrap;">
              ${p.sizes.map((sz, i) => `
                <button type="button" onclick="App.selectProductSize('${sz}', this)" class="size-btn ${i === 0 ? 'active' : ''}" style="min-width:48px;height:48px;padding:0 0.8rem;background:var(--bg-surface-elevated);border:1px solid ${i === 0 ? 'var(--accent-lime)' : 'var(--border-subtle)'};color:${i === 0 ? 'var(--accent-lime)' : 'var(--text-primary)'};border-radius:var(--radius-sm);font-family:var(--font-mono);font-size:0.85rem;font-weight:600;">
                  ${sz}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Actions -->
          <div style="display:flex;gap:1rem;margin-bottom:2.5rem;">
            <div class="cart-qty-ctrl" style="padding:0 0.5rem;height:52px;">
              <button class="qty-btn" onclick="App.adjustDetailQty(-1)" style="width:32px;height:100%;font-size:1.2rem;">-</button>
              <span id="detail-qty-val" class="qty-val" style="font-size:1rem;padding:0 1rem;">1</span>
              <button class="qty-btn" onclick="App.adjustDetailQty(1)" style="width:32px;height:100%;font-size:1.2rem;">+</button>
            </div>
            <button class="btn btn-primary" onclick="App.addSelectedProductToCart()" style="flex-grow:1;height:52px;font-size:0.9rem;">
              ⚡ ADD TO BAG — ${formatPKR(p.salePrice || p.price)}
            </button>
            <button class="btn btn-secondary" onclick="App.toggleWishlist('${p.id}')" style="width:52px;height:52px;padding:0;" title="Save to Wishlist">
              ♡
            </button>
          </div>

          <!-- Trust & Value Badges -->
          <div style="background:var(--bg-surface-elevated);border:1px solid var(--border-subtle);border-radius:var(--radius-sm);padding:1.25rem;display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:2rem;font-size:0.75rem;">
            <div style="display:flex;gap:0.6rem;align-items:center;">
              <span style="color:var(--accent-lime);font-size:1.1rem;">📦</span>
              <div>
                <strong>Cash on Delivery (COD)</strong>
                <div style="color:var(--text-muted);">Nationwide doorstep delivery</div>
              </div>
            </div>
            <div style="display:flex;gap:0.6rem;align-items:center;">
              <span style="color:var(--accent-lime);font-size:1.1rem;">🔄</span>
              <div>
                <strong>7-Day Easy Exchange</strong>
                <div style="color:var(--text-muted);">Free reverse pickup in major cities</div>
              </div>
            </div>
          </div>

          <!-- Specifications Tabs -->
          <div style="border-top:1px solid var(--border-subtle);padding-top:1.5rem;">
            <div style="margin-bottom:1rem;">
              <h4 style="font-family:var(--font-mono);font-size:0.8rem;text-transform:uppercase;color:var(--accent-lime);margin-bottom:0.35rem;">Material & Construction</h4>
              <p style="font-size:0.85rem;color:var(--text-secondary);">${p.material}</p>
            </div>
            <div style="margin-bottom:1rem;">
              <h4 style="font-family:var(--font-mono);font-size:0.8rem;text-transform:uppercase;color:var(--accent-lime);margin-bottom:0.35rem;">Fit & Proportions</h4>
              <p style="font-size:0.85rem;color:var(--text-secondary);">${p.fit}</p>
            </div>
            <div style="margin-bottom:1rem;">
              <h4 style="font-family:var(--font-mono);font-size:0.8rem;text-transform:uppercase;color:var(--accent-lime);margin-bottom:0.35rem;">Care & Longevity</h4>
              <p style="font-size:0.85rem;color:var(--text-secondary);">${p.care}</p>
            </div>
            <div>
              <h4 style="font-family:var(--font-mono);font-size:0.8rem;text-transform:uppercase;color:var(--accent-lime);margin-bottom:0.35rem;">Authentic Craft Origin</h4>
              <p style="font-size:0.85rem;color:var(--text-secondary);">${p.origin}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Complementary Drops -->
      <div style="margin-top:6rem;border-top:1px solid var(--border-subtle);padding-top:3rem;">
        <div class="mono-tag" style="margin-bottom:0.5rem;">COMPLETE THE SILHOUETTE</div>
        <h3 class="display-title" style="font-size:1.75rem;margin-bottom:2rem;">PAIRED STYLING RECOMMENDATIONS</h3>
        <div class="products-grid">
          ${PRODUCTS_DATA.filter(item => item.id !== p.id).slice(0, 3).map(renderProductCardHtml).join('')}
        </div>
      </div>
    `;
    updateProductSeo(STATE.selectedProduct);
  }

  function selectProductColor(colorName, btn) {
    STATE.selectedColor = colorName;
    document.getElementById('selected-color-label').textContent = colorName;
    const parent = btn.parentElement;
    parent.querySelectorAll('button').forEach(b => b.style.borderColor = 'var(--border-subtle)');
    btn.style.borderColor = 'var(--accent-lime)';
  }

  function selectProductSize(size, btn) {
    STATE.selectedSize = size;
    document.getElementById('selected-size-label').textContent = size;
    const parent = btn.parentElement;
    parent.querySelectorAll('.size-btn').forEach(b => {
      b.style.borderColor = 'var(--border-subtle)';
      b.style.color = 'var(--text-primary)';
    });
    btn.style.borderColor = 'var(--accent-lime)';
    btn.style.color = 'var(--accent-lime)';
  }

  function adjustDetailQty(delta) {
    const nextVal = STATE.selectedQty + delta;
    if (nextVal >= 1 && nextVal <= (STATE.selectedProduct.stock || 10)) {
      STATE.selectedQty = nextVal;
      document.getElementById('detail-qty-val').textContent = nextVal;
    }
  }

  function addSelectedProductToCart() {
    if (!STATE.selectedProduct) return;
    addToCart(STATE.selectedProduct.id, STATE.selectedSize, STATE.selectedColor, STATE.selectedQty);
  }

  // Home Products Rendering
  function renderHomeProducts() {
    const featuredContainer = document.getElementById('featured-drops-grid');
    if (featuredContainer) {
      featuredContainer.innerHTML = PRODUCTS_DATA.filter(p => p.isFeatured).slice(0, 4).map(renderProductCardHtml).join('');
    }
    const bestsellersContainer = document.getElementById('bestsellers-grid');
    if (bestsellersContainer) {
      bestsellersContainer.innerHTML = PRODUCTS_DATA.filter(p => p.isBestseller).slice(0, 4).map(renderProductCardHtml).join('');
    }
  }

  // Product Card HTML Generator
  // Link to the pre-built SEO page when it exists, otherwise the dynamic product page
  function productUrl(p) {
    const pre = window.BC_PRERENDERED || {};
    if (p.slug && pre[p.slug]) return 'products/' + encodeURIComponent(p.slug) + '.html';
    return 'product.html?id=' + encodeURIComponent(p.id);
  }

  // Update title, description, canonical and Product schema for the product being viewed
  function updateProductSeo(p) {
    if (!p || detectCurrentPage() !== 'product') return;
    try {
      const origin = window.location.origin;
      const url = origin + '/' + productUrl(p).replace(/^\//, '');
      const price = p.salePrice || p.price;
      document.title = p.name + ' — ' + 'Rs ' + Number(price).toLocaleString('en-PK') + ' | Brand Collection Pakistan';
      const setMeta = (sel, attr, val) => { const el = document.querySelector(sel); if (el) el.setAttribute(attr, val); };
      const desc = String(p.description || '').slice(0, 155);
      setMeta('meta[name="description"]', 'content', desc);
      setMeta('meta[property="og:title"]', 'content', p.name);
      setMeta('meta[property="og:description"]', 'content', desc);
      setMeta('meta[property="og:url"]', 'content', url);
      const img = /^https?:/.test(p.image || '') ? p.image : origin + '/' + String(p.image || '').replace(/^\//, '');
      setMeta('meta[property="og:image"]', 'content', img);
      setMeta('link[rel="canonical"]', 'href', url);
      let ld = document.getElementById('bc-product-ld');
      if (!ld) { ld = document.createElement('script'); ld.type = 'application/ld+json'; ld.id = 'bc-product-ld'; document.head.appendChild(ld); }
      ld.textContent = JSON.stringify({
        '@context': 'https://schema.org', '@type': 'Product', name: p.name, sku: p.sku, image: [img],
        description: p.description, brand: { '@type': 'Brand', name: 'Brand Collection' },
        material: p.material, color: (p.colors || []).map(c => c.name).join(', '),
        offers: { '@type': 'Offer', url, priceCurrency: 'PKR', price: String(price),
          availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          itemCondition: 'https://schema.org/NewCondition' }
      });
    } catch (e) { console.warn(e); }
  }

  function renderProductCardHtml(p) {
    const discountPill = p.salePrice 
      ? `<span style="background:var(--gradient-sunset);color:white;font-family:var(--font-mono);font-size:0.68rem;font-weight:800;padding:0.15rem 0.5rem;border-radius:var(--radius-full);margin-left:0.35rem;box-shadow:0 2px 6px rgba(244,63,94,0.3);">SAVE ${formatPKR(p.price - p.salePrice)}</span>` 
      : '';

    const priceDisplay = p.salePrice 
      ? `<span class="price-current">${formatPKR(p.salePrice)}</span><span class="price-original">${formatPKR(p.price)}</span>${discountPill}`
      : `<span class="price-current">${formatPKR(p.price)}</span>`;

    const stockIndicator = p.stock <= 5 
      ? `<span class="stock-pill low-stock">⚡ Only ${p.stock} left</span>`
      : `<span class="stock-pill in-stock">✓ In Stock (${p.stock})</span>`;

    return `
      <div class="product-card" data-id="${p.id}">
        <div class="product-media">
          <a href="${productUrl(p)}" tabindex="-1" aria-hidden="true"><img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" width="400" height="500"></a>
          ${p.badge ? `<span class="product-badge ${p.badgeType === 'sale' ? 'sale' : ''}">${p.badge}</span>` : ''}
          <div class="product-actions">
            <button class="btn btn-primary btn-sm btn-full" onclick="App.navigateTo('product', { id: '${p.id}' })">
              EXPLORE PIECE ⚡
            </button>
            <button class="btn btn-secondary btn-sm" onclick="App.quickAddToCart('${p.id}')" title="Quick Add to Bag">
              🛍️
            </button>
            <button class="btn btn-secondary btn-sm" onclick="App.toggleWishlist('${p.id}')" title="Save to Wishlist">
              ♡
            </button>
          </div>
        </div>
        <div class="product-info">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.35rem;">
            <div class="product-category">${esc(p.category)}${p.subCategory ? ' // ' + esc(p.subCategory) : ''}</div>
            <div style="font-size:0.75rem;color:#F59E0B;">★★★★★</div>
          </div>
          <h3 class="product-title">
            <a href="${productUrl(p)}" style="color:inherit;text-decoration:none;">${esc(p.name)}</a>
          </h3>
          <div class="product-price-row">
            ${priceDisplay}
            ${stockIndicator}
          </div>
          <div style="font-size:0.72rem;color:var(--accent-coral);font-weight:600;margin-top:0.4rem;display:flex;align-items:center;gap:0.35rem;">
            <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#F43F5E;box-shadow:0 0 6px #F43F5E;animation:livePing 1.8s infinite;"></span>
            <span>${p.stock > 0 ? 'Cash on Delivery available' : 'Out of stock'}</span>
          </div>
        </div>
      </div>
    `;
  }

  function quickAddToCart(productId) {
    const p = PRODUCTS_DATA.find(item => item.id === productId);
    if (!p) return;
    addToCart(p.id, p.sizes[0], p.colors[0].name, 1);
  }

  // Shop Catalog View
  function renderShopCatalog() {
    const container = document.getElementById('catalog-products-grid');
    if (!container) return;

    let items = [...PRODUCTS_DATA];

    // Filter by Category
    if (STATE.currentCategoryFilter !== 'all') {
      if (STATE.currentCategoryFilter === 'sale') {
        items = items.filter(p => p.salePrice !== null);
      } else {
        items = items.filter(p => p.category === STATE.currentCategoryFilter || p.subCategory === STATE.currentCategoryFilter);
      }
    }

    // Filter by Search Query if present
    if (STATE.searchQuery.trim() !== '') {
      const q = STATE.searchQuery.toLowerCase();
      items = items.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q) ||
        p.collection.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
      );
    }

    // Sort items
    if (STATE.currentSort === 'price-low') {
      items.sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price));
    } else if (STATE.currentSort === 'price-high') {
      items.sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price));
    } else if (STATE.currentSort === 'rating') {
      items.sort((a, b) => b.rating - a.rating);
    }

    // Update count display
    const countEl = document.getElementById('catalog-count');
    if (countEl) countEl.textContent = `Showing ${items.length} avant-garde pieces`;

    const titleEl = document.getElementById('catalog-title');
    if (titleEl) {
      titleEl.textContent = STATE.currentCategoryFilter === 'all' 
        ? 'SHOP ALL PIECES' 
        : `${STATE.currentCategoryFilter.toUpperCase()} COLLECTION`;
    }

    if (items.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 5rem 1rem;">
          <p style="font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem;">No garments found matching your criteria.</p>
          <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Try adjusting your filters or search keywords.</p>
          <button class="btn btn-secondary btn-sm" onclick="App.resetCatalogFilters()">RESET FILTERS</button>
        </div>
      `;
      return;
    }

    container.innerHTML = items.map(renderProductCardHtml).join('');
  }

  function filterCatalogCategory(category) {
    STATE.currentCategoryFilter = category;
    document.querySelectorAll('.filter-cat-btn').forEach(btn => {
      btn.classList.toggle('btn-primary', btn.getAttribute('data-cat') === category);
      btn.classList.toggle('btn-ghost', btn.getAttribute('data-cat') !== category);
    });
    renderShopCatalog();
  }

  function sortCatalog(sortVal) {
    STATE.currentSort = sortVal;
    renderShopCatalog();
  }

  function resetCatalogFilters() {
    STATE.currentCategoryFilter = 'all';
    STATE.searchQuery = '';
    STATE.currentSort = 'relevance';
    renderShopCatalog();
  }

  // Department (Men / Women / Kids) Catalog Rendering
  function renderDepartmentCatalog(dept, subCat = 'all', sort = 'relevance') {
    const containerId = `${dept}-products-grid`;
    const container = document.getElementById(containerId);
    if (!container) return;

    let items = PRODUCTS_DATA.filter(p => p.category === dept);

    if (subCat !== 'all') {
      items = items.filter(p => p.subCategory === subCat);
    }

    if (sort === 'price-low') {
      items.sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price));
    } else if (sort === 'price-high') {
      items.sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price));
    } else if (sort === 'rating') {
      items.sort((a, b) => b.rating - a.rating);
    }

    if (items.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;">
          <p style="font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem;">No items found in this category.</p>
          <button class="btn btn-secondary btn-sm" onclick="App.filterDepartment('${dept}', 'all')">VIEW ALL ${dept.toUpperCase()}</button>
        </div>
      `;
      return;
    }

    container.innerHTML = items.map(renderProductCardHtml).join('');
  }

  function filterDepartment(dept, subCat) {
    document.querySelectorAll(`.${dept}-sub-btn`).forEach(btn => {
      const isMatch = btn.getAttribute('data-sub') === subCat;
      btn.classList.toggle('btn-primary', isMatch);
      btn.classList.toggle('btn-ghost', !isMatch);
    });
    renderDepartmentCatalog(dept, subCat);
  }

  function sortDepartment(dept, sortVal) {
    const activeBtn = document.querySelector(`.${dept}-sub-btn.btn-primary`);
    const subCat = activeBtn ? activeBtn.getAttribute('data-sub') : 'all';
    renderDepartmentCatalog(dept, subCat, sortVal);
  }

  // Dedicated Cart Page
  function renderCartPage() {
    const container = document.getElementById('cart-page-content');
    if (!container) return;

    if (STATE.cart.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:5rem 1rem;">
          <div style="font-size:3.5rem;color:var(--accent-lime);margin-bottom:1rem;">⚡</div>
          <h2 class="display-title" style="font-size:2rem;margin-bottom:0.5rem;">YOUR BAG IS CURRENTLY EMPTY</h2>
          <p style="color:var(--text-secondary);margin-bottom:2rem;">Start exploring the vanguard of Pakistani technical fashion.</p>
          <button class="btn btn-primary" onclick="App.navigateTo('shop')">EXPLORE THE DROP</button>
        </div>
      `;
      return;
    }

    let subtotal = 0;
    const itemsHtml = STATE.cart.map(item => {
      const lineTotal = item.price * item.qty;
      subtotal += lineTotal;
      return `
        <div class="bc-cart-row" style="display:grid;grid-template-columns:100px 1fr auto;gap:1.5rem;padding:1.5rem 0;border-bottom:1px solid var(--border-subtle);align-items:center;">
          <img src="${item.image}" alt="${item.name}" style="width:100px;height:120px;object-fit:cover;border-radius:var(--radius-sm);background:#111;">
          <div>
            <div style="font-family:var(--font-mono);font-size:0.75rem;color:var(--accent-lime);">${item.sku || 'BC-ITEM'}</div>
            <h4 style="font-size:1.1rem;margin:0.25rem 0;">${item.name}</h4>
            <div style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:0.75rem;">Size: <strong style="color:var(--text-primary);">${item.size}</strong> | Color: ${item.color}</div>
            <div class="cart-qty-ctrl">
              <button class="qty-btn" onclick="App.updateCartQty('${item.key}', -1)">-</button>
              <span class="qty-val">${item.qty}</span>
              <button class="qty-btn" onclick="App.updateCartQty('${item.key}', 1)">+</button>
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-family:var(--font-mono);font-size:1.2rem;font-weight:700;">${formatPKR(lineTotal)}</div>
            <button onclick="App.removeFromCart('${item.key}')" style="margin-top:0.75rem;color:var(--accent-danger);font-size:0.8rem;background:none;border:none;cursor:pointer;">Remove</button>
          </div>
        </div>
      `;
    }).join('');

    const shipping = subtotal >= SHIPPING_CONFIG.freeShippingThreshold ? 0 : SHIPPING_CONFIG.standardShippingFee;
    let discount = 0;
    if (STATE.appliedCoupon) {
      if (STATE.appliedCoupon.discountPercent) {
        discount = Math.round((subtotal * STATE.appliedCoupon.discountPercent) / 100);
      } else if (STATE.appliedCoupon.discountAmount) {
        discount = STATE.appliedCoupon.discountAmount;
      }
    }
    const grandTotal = Math.max(0, subtotal - discount + shipping);

    container.innerHTML = `
      <div class="bc-stack" style="display:grid;grid-template-columns:2fr 1fr;gap:3rem;align-items:start;">
        <div>
          <h2 class="display-title" style="font-size:2rem;margin-bottom:1.5rem;">SHOPPING BAG (${STATE.cart.length})</h2>
          ${itemsHtml}
        </div>
        <div style="background:var(--bg-surface);border:1px solid var(--border-medium);border-radius:var(--radius-md);padding:2rem;">
          <h3 class="display-title" style="font-size:1.4rem;margin-bottom:1.5rem;">ORDER SUMMARY</h3>
          
          <div class="cart-summary-line">
            <span>Subtotal</span>
            <span style="font-family:var(--font-mono);font-weight:600;">${formatPKR(subtotal)}</span>
          </div>

          <div class="cart-summary-line">
            <span>Nationwide Delivery</span>
            <span style="font-family:var(--font-mono);">${shipping === 0 ? '<strong style="color:var(--accent-lime);">FREE</strong>' : formatPKR(shipping)}</span>
          </div>

          ${discount > 0 ? `
            <div class="cart-summary-line" style="color:var(--accent-lime);">
              <span>Discount (${STATE.appliedCoupon.code})</span>
              <span style="font-family:var(--font-mono);">- ${formatPKR(discount)}</span>
            </div>
          ` : ''}

          <!-- Coupon Input -->
          <div style="margin:1.5rem 0;display:flex;gap:0.5rem;">
            <input type="text" id="cart-coupon-input" class="form-control" placeholder="Promo Code (e.g. NEO10)" style="text-transform:uppercase;">
            <button class="btn btn-secondary btn-sm" onclick="App.applyCoupon()">APPLY</button>
          </div>
          ${STATE.appliedCoupon ? `
            <div style="font-size:0.75rem;color:var(--accent-lime);margin-top:-1rem;margin-bottom:1rem;display:flex;justify-content:space-between;">
              <span>✓ ${STATE.appliedCoupon.description}</span>
              <button onclick="App.removeCoupon()" style="color:var(--accent-danger);background:none;border:none;">Remove</button>
            </div>
          ` : ''}

          <div class="cart-summary-line cart-summary-total">
            <span>Total (PKR)</span>
            <span style="font-family:var(--font-mono);color:var(--accent-lime);font-size:1.4rem;">${formatPKR(grandTotal)}</span>
          </div>

          <p style="font-size:0.75rem;color:var(--text-muted);margin:1rem 0;">All taxes included. Transparent Cash on Delivery & Express Courier logistics.</p>

          <button class="btn btn-primary btn-full" onclick="App.navigateTo('checkout')" style="height:52px;font-size:0.95rem;">
            PROCEED TO CHECKOUT ⚡
          </button>
        </div>
      </div>
    `;
  }

  // Coupon handling
  function applyCoupon() {
    const input = document.getElementById('cart-coupon-input') || document.getElementById('checkout-coupon-input');
    if (!input) return;
    const code = input.value.trim().toUpperCase();

    if (!ACTIVE_COUPONS[code]) {
      showToast('Invalid or expired promotional code.', 'error');
      return;
    }

    const coupon = ACTIVE_COUPONS[code];
    const subtotal = STATE.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    if (coupon.minSpend && subtotal < coupon.minSpend) {
      showToast(`Minimum order of ${formatPKR(coupon.minSpend)} required for this code.`, 'error');
      return;
    }

    STATE.appliedCoupon = { code, ...coupon };
    saveState();
    showToast(`Code ${code} applied successfully!`);
    if (STATE.currentView === 'cart') renderCartPage();
    if (STATE.currentView === 'checkout') renderCheckoutPage();
  }

  function removeCoupon() {
    STATE.appliedCoupon = null;
    saveState();
    showToast('Promo code removed.');
    if (STATE.currentView === 'cart') renderCartPage();
    if (STATE.currentView === 'checkout') renderCheckoutPage();
  }

  // Checkout Page
  function renderCheckoutPage() {
    const container = document.getElementById('checkout-page-content');
    if (!container) return;

    if (STATE.cart.length === 0) {
      navigateTo('cart');
      return;
    }

    const subtotal = STATE.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const freeShip = subtotal >= SHIPPING_CONFIG.freeShippingThreshold;
    const baseShipping = freeShip ? 0 : SHIPPING_CONFIG.standardShippingFee;
    let discount = 0;
    if (STATE.appliedCoupon) {
      if (STATE.appliedCoupon.discountPercent) discount = Math.round((subtotal * STATE.appliedCoupon.discountPercent) / 100);
      else if (STATE.appliedCoupon.discountAmount) discount = STATE.appliedCoupon.discountAmount;
    }

    container.innerHTML = `
      <form id="checkout-form" class="bc-stack" onsubmit="App.handlePlaceOrder(event)" style="display:grid;grid-template-columns:1.5fr 1fr;gap:3rem;align-items:start;">
        <!-- Left: Customer & Delivery Details -->
        <div>
          <h2 class="display-title" style="font-size:1.85rem;margin-bottom:1.5rem;">SHIPPING & CONTACT DETAILS</h2>

          <div style="background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:var(--radius-sm);padding:1.5rem;margin-bottom:2rem;">
            <div class="form-group">
              <label class="form-label" for="co-name">Full Name *</label>
              <input type="text" id="co-name" required class="form-control" placeholder="e.g. Bilal Ahmed">
            </div>

            <div class="bc-stack" style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
              <div class="form-group">
                <label class="form-label" for="co-phone">Pakistani Mobile / WhatsApp *</label>
                <input type="tel" id="co-phone" required class="form-control" placeholder="03XXXXXXXXX or +923XXXXXXXXX" pattern="^(\\+92|0)?3[0-9]{2}[\\s\\-]?[0-9]{7}$" title="Please enter a valid Pakistani mobile number starting with 03xx or +923xx">
                <div class="form-help">SMS & WhatsApp order confirmation will be dispatched here.</div>
              </div>
              <div class="form-group">
                <label class="form-label" for="co-email">Email Address *</label>
                <input type="email" id="co-email" required class="form-control" placeholder="name@domain.com">
              </div>
            </div>

            <div class="bc-stack" style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
              <div class="form-group">
                <label class="form-label" for="co-city">City *</label>
                <select id="co-city" required class="form-control" onchange="App.handleCityChange(this.value)">
                  ${SHIPPING_CONFIG.cities.map(c => `
                    <option value="${c.name}">${c.name} (${c.province}) — Est. ${c.standardDays}</option>
                  `).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="co-postal">Postal Code / Area</label>
                <input type="text" id="co-postal" class="form-control" placeholder="e.g. 54000 or DHA Phase 5">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="co-address">Street Address, House/Flat No, Landmark *</label>
              <textarea id="co-address" required rows="3" class="form-control" placeholder="Complete physical address for TCS / Call Courier courier delivery"></textarea>
            </div>

            <div class="form-group">
              <label class="form-label" for="co-notes">Special Delivery Instructions (Optional)</label>
              <input type="text" id="co-notes" class="form-control" placeholder="e.g. Call before delivery, leave with guard">
            </div>
          </div>

          <h3 class="display-title" style="font-size:1.4rem;margin-bottom:1rem;">SELECT PAYMENT METHOD</h3>

          <div class="payment-method-card selected" id="method-cod-card" onclick="App.selectPaymentMethod('cod')">
            <input type="radio" id="pay-cod" name="paymentMethod" value="cod" checked style="margin-top:0.25rem;accent-color:var(--accent-lime);">
            <div>
              <div style="font-weight:700;color:var(--text-primary);display:flex;align-items:center;gap:0.5rem;">
                <span>💵 Cash on Delivery (COD)</span>
                <span class="stock-pill in-stock">Recommended</span>
              </div>
              <p style="font-size:0.8rem;color:var(--text-secondary);margin-top:0.35rem;">
                Pay securely with cash upon doorstep delivery anywhere across Pakistan. Standard ₨150 courier COD reconciliation fee applies.
              </p>
            </div>
          </div>

          <div class="payment-method-card" id="method-card-card" onclick="App.selectPaymentMethod('card')">
            <input type="radio" id="pay-card" name="paymentMethod" value="bank" style="margin-top:0.25rem;accent-color:var(--accent-lime);">
            <div>
              <div style="font-weight:700;color:var(--text-primary);display:flex;align-items:center;gap:0.5rem;">
                <span>🏦 Bank Transfer / JazzCash / Easypaisa</span>
              </div>
              <p style="font-size:0.8rem;color:var(--text-secondary);margin-top:0.35rem;">
                No COD fee. After you place the order, we send our account details on WhatsApp. Your order is dispatched once payment is received.
              </p>
              <div id="card-sim-fields" style="display:none;margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border-subtle);font-size:0.8rem;color:var(--text-secondary);">
                We never ask for card numbers or OTP codes. Only send money to the account we share from our official WhatsApp number.
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Order Review Sidebar -->
        <div style="background:var(--bg-surface);border:1px solid var(--border-medium);border-radius:var(--radius-md);padding:2rem;position:sticky;top:6rem;">
          <h3 class="display-title" style="font-size:1.4rem;margin-bottom:1.5rem;">YOUR ORDER (${STATE.cart.length})</h3>

          <div style="max-height:280px;overflow-y:auto;display:flex;flex-direction:column;gap:1rem;margin-bottom:1.5rem;padding-right:0.5rem;">
            ${STATE.cart.map(item => `
              <div style="display:flex;gap:0.75rem;align-items:center;">
                <img src="${item.image}" alt="${item.name}" style="width:50px;height:60px;object-fit:cover;border-radius:2px;">
                <div style="flex-grow:1;">
                  <div style="font-size:0.85rem;font-weight:600;">${item.name}</div>
                  <div style="font-size:0.75rem;color:var(--text-secondary);">Size: ${item.size} × ${item.qty}</div>
                </div>
                <div style="font-family:var(--font-mono);font-size:0.85rem;font-weight:700;">${formatPKR(item.price * item.qty)}</div>
              </div>
            `).join('')}
          </div>

          <div class="cart-summary-line">
            <span>Subtotal</span>
            <span style="font-family:var(--font-mono);font-weight:600;">${formatPKR(subtotal)}</span>
          </div>

          <div class="cart-summary-line">
            <span>Nationwide Delivery</span>
            <span id="co-shipping-fee" style="font-family:var(--font-mono);">${baseShipping === 0 ? '<strong style="color:var(--accent-lime);">FREE</strong>' : formatPKR(baseShipping)}</span>
          </div>

          <div class="cart-summary-line" id="co-cod-fee-line">
            <span>COD Handling Fee</span>
            <span style="font-family:var(--font-mono);">${formatPKR(SHIPPING_CONFIG.codHandlingFee)}</span>
          </div>

          ${discount > 0 ? `
            <div class="cart-summary-line" style="color:var(--accent-lime);">
              <span>Discount (${STATE.appliedCoupon.code})</span>
              <span style="font-family:var(--font-mono);">- ${formatPKR(discount)}</span>
            </div>
          ` : ''}

          <div class="cart-summary-line cart-summary-total">
            <span>Payable Amount</span>
            <span id="co-grand-total" style="font-family:var(--font-mono);color:var(--accent-lime);font-size:1.4rem;">
              ${formatPKR(subtotal - discount + baseShipping + SHIPPING_CONFIG.codHandlingFee)}
            </span>
          </div>

          <div style="margin:1.5rem 0 1rem;">
            <button type="submit" class="btn btn-primary btn-full" style="height:54px;font-size:0.95rem;">
              CONFIRM ORDER & DISPATCH ⚡
            </button>
          </div>

          <div style="font-size:0.7rem;color:var(--text-muted);text-align:center;line-height:1.4;">
            By placing your order, you agree to Brand Collection’s Terms & Conditions and 7-day Exchange Policy. No card details stored.
          </div>
        </div>
      </form>
    `;
    // Signed-in customers: fill in saved delivery details
    if (window.DB && window.DB.isCloud) {
      window.DB.ready().then(async () => {
        if (!window.DB.user) {
          const form = document.getElementById('checkout-form');
          if (form && !document.getElementById('co-login-hint')) {
            const hint = document.createElement('p');
            hint.id = 'co-login-hint';
            hint.style.cssText = 'grid-column:1/-1;font-size:0.85rem;color:var(--text-secondary);margin:0;';
            hint.innerHTML = 'Have an account? <a href="account.html?next=checkout">Log in</a> to save this order to your account. Guest checkout is fine too.';
            form.prepend(hint);
          }
          return;
        }
        const pf = await window.DB.getProfile();
        const fill = (id, val) => { const el = document.getElementById(id); if (el && !el.value && val) el.value = val; };
        fill('co-name', pf && pf.full_name);
        fill('co-phone', pf && pf.phone);
        fill('co-email', window.DB.user.email);
        fill('co-address', pf && pf.address);
        const city = document.getElementById('co-city');
        if (city && pf && pf.city) { const opt = Array.from(city.options || []).find(o => o.value.toLowerCase() === pf.city.toLowerCase()); if (opt) city.value = opt.value; }
      }).catch(() => {});
    }
  }

  function selectPaymentMethod(method) {
    const codCard = document.getElementById('method-cod-card');
    const cardCard = document.getElementById('method-card-card');
    const cardFields = document.getElementById('card-sim-fields');
    const codFeeLine = document.getElementById('co-cod-fee-line');
    const payCod = document.getElementById('pay-cod');
    const payCard = document.getElementById('pay-card');

    if (method === 'cod') {
      if (payCod) payCod.checked = true;
      if (codCard) codCard.classList.add('selected');
      if (cardCard) cardCard.classList.remove('selected');
      if (cardFields) cardFields.style.display = 'none';
      if (codFeeLine) codFeeLine.style.display = 'flex';
    } else {
      if (payCard) payCard.checked = true;
      if (cardCard) cardCard.classList.add('selected');
      if (codCard) codCard.classList.remove('selected');
      if (cardFields) cardFields.style.display = 'block';
      if (codFeeLine) codFeeLine.style.display = 'none';
    }

    recalculateCheckoutTotal();
  }

  function handleCityChange(city) {
    showToast(`Shipping rate updated for ${city}.`);
    recalculateCheckoutTotal();
  }

  function recalculateCheckoutTotal() {
    const subtotal = STATE.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const freeShip = subtotal >= SHIPPING_CONFIG.freeShippingThreshold;
    const baseShipping = freeShip ? 0 : SHIPPING_CONFIG.standardShippingFee;
    let discount = 0;
    if (STATE.appliedCoupon) {
      if (STATE.appliedCoupon.discountPercent) discount = Math.round((subtotal * STATE.appliedCoupon.discountPercent) / 100);
      else if (STATE.appliedCoupon.discountAmount) discount = STATE.appliedCoupon.discountAmount;
    }
    const payCod = document.getElementById('pay-cod');
    const codFee = (payCod && payCod.checked) ? SHIPPING_CONFIG.codHandlingFee : 0;
    const total = Math.max(0, subtotal - discount + baseShipping + codFee);

    const grandTotalEl = document.getElementById('co-grand-total');
    if (grandTotalEl) grandTotalEl.textContent = formatPKR(total);
  }

  function handlePlaceOrder(e) {
    e.preventDefault();
    const name = document.getElementById('co-name').value.trim();
    const phone = document.getElementById('co-phone').value.trim();
    const email = document.getElementById('co-email').value.trim();
    const city = document.getElementById('co-city').value;
    const address = document.getElementById('co-address').value.trim();
    const payMethod = document.querySelector('input[name="paymentMethod"]:checked').value;

    const subtotal = STATE.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const freeShip = subtotal >= SHIPPING_CONFIG.freeShippingThreshold;
    const shippingFee = freeShip ? 0 : SHIPPING_CONFIG.standardShippingFee;
    const codFee = payMethod === 'cod' ? SHIPPING_CONFIG.codHandlingFee : 0;
    let discount = 0;
    if (STATE.appliedCoupon) {
      if (STATE.appliedCoupon.discountPercent) discount = Math.round((subtotal * STATE.appliedCoupon.discountPercent) / 100);
      else if (STATE.appliedCoupon.discountAmount) discount = STATE.appliedCoupon.discountAmount;
    }
    const grandTotal = subtotal - discount + shippingFee + codFee;

    const notesEl = document.getElementById('co-notes');
    const notes = notesEl ? notesEl.value.trim() : '';

    // CLOUD MODE: the server checks prices, stock and coupon, then saves the order
    if (window.DB && window.DB.isCloud) {
      const btn = e.target.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.dataset.label = btn.innerHTML; btn.innerHTML = 'PLACING ORDER...'; }
      window.DB.placeOrder({
        customerName: name, phone, email, city, address, notes,
        paymentMethod: payMethod,
        couponCode: STATE.appliedCoupon ? STATE.appliedCoupon.code : null,
        items: STATE.cart.map(i => ({ id: i.id, productId: i.id, name: i.name, qty: i.qty, size: i.size, color: i.color }))
      }).then(order => {
        STATE.orders.unshift(order);
        STATE.cart = [];
        STATE.appliedCoupon = null;
        saveState();
        showToast(`Order ${order.orderId} successfully placed!`);
        navigateTo('order-confirmation', { orderId: order.orderId });
      }).catch(err => {
        showToast(err.message || 'Could not place order. Please try again.', 'error');
        if (btn) { btn.disabled = false; btn.innerHTML = btn.dataset.label; }
      });
      return;
    }

    const orderId = 'BC-' + Math.floor(100000 + Math.random() * 900000);
    const newOrder = {
      orderId,
      date: new Date().toISOString().split('T')[0],
      customerName: name,
      phone,
      email,
      city,
      address,
      notes,
      items: [...STATE.cart],
      subtotal,
      shippingFee,
      codFee,
      discount,
      total: grandTotal,
      paymentMethod: payMethod,
      status: 'Order Placed & Verified',
      courier: 'TCS Express Pakistan',
      trackingNumber: 'TCS-' + Math.floor(10000000 + Math.random() * 90000000),
      estimatedDelivery: '3-4 Business Days'
    };

    STATE.orders.unshift(newOrder);
    STATE.cart = [];
    STATE.appliedCoupon = null;
    saveState();

    // Persist immediately to backend database
    if (window.DB) {
      window.DB.saveOrder(newOrder).catch(err => {
        console.warn('Backend order save queued locally', err);
      });
    }

    showToast(`Order ${orderId} successfully placed!`);
    navigateTo('order-confirmation', { orderId });
  }

  // Order Confirmation Page
  function renderOrderConfirmationPage(orderId) {
    const container = document.getElementById('order-confirmation-content');
    if (!container) return;
    container.style.display = 'block';
    const coBox = document.getElementById('checkout-page-content');
    if (coBox) coBox.style.display = 'none';

    const order = STATE.orders.find(o => o.orderId === orderId);
    if (!order) {
      container.innerHTML = `<p>Order not found.</p>`;
      return;
    }

    container.innerHTML = `
      <div style="max-width:800px;margin:0 auto;text-align:center;">
        <div style="width:72px;height:72px;border-radius:50%;background:rgba(199,243,107,0.15);border:2px solid var(--accent-lime);color:var(--accent-lime);display:flex;align-items:center;justify-content:center;font-size:2rem;margin:0 auto 1.5rem;">
          ✓
        </div>
        <div class="mono-tag" style="margin-bottom:0.5rem;">ORDER CONFIRMED & IN DISPATCH QUEUE</div>
        <h1 class="display-title" style="font-size:2.5rem;margin-bottom:1rem;">SHUKRIYA, ${esc(String(order.customerName || '').toUpperCase())}!</h1>
        <p style="color:var(--text-secondary);font-size:1.05rem;margin-bottom:2.5rem;">
          Your order <strong style="color:var(--accent-lime);">${esc(order.orderId)}</strong> has been logged in our Karachi & Lahore fulfillment facility.
        </p>

        <div style="background:var(--bg-surface);border:1px solid var(--border-medium);border-radius:var(--radius-md);padding:2rem;text-align:left;margin-bottom:2.5rem;">
          <div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--border-subtle);padding-bottom:1rem;margin-bottom:1.5rem;">
            <div>
              <div style="font-size:0.75rem;color:var(--text-muted);">ORDER NUMBER</div>
              <div style="font-family:var(--font-mono);font-size:1.2rem;font-weight:700;color:var(--accent-lime);">${esc(order.orderId)}</div>
            </div>
            <div>
              <div style="font-size:0.75rem;color:var(--text-muted);">COURIER PARTNER</div>
              <div style="font-weight:600;">${esc(order.courier)}</div>
            </div>
            <div>
              <div style="font-size:0.75rem;color:var(--text-muted);">ESTIMATED ARRIVAL</div>
              <div style="font-weight:600;">${esc(order.estimatedDelivery)}</div>
            </div>
          </div>

          <div style="display:flex;flex-direction:column;gap:1rem;margin-bottom:1.5rem;">
            ${order.items.map(item => `
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;gap:1rem;align-items:center;">
                  <img src="${esc(item.image)}" alt="${esc(item.name)}" style="width:50px;height:60px;object-fit:cover;border-radius:2px;">
                  <div>
                    <div style="font-weight:600;font-size:0.9rem;">${esc(item.name)}</div>
                    <div style="font-size:0.75rem;color:var(--text-secondary);">Size: ${esc(item.size)} | Color: ${esc(item.color)} × ${item.qty}</div>
                  </div>
                </div>
                <div style="font-family:var(--font-mono);font-weight:700;">${formatPKR(item.price * item.qty)}</div>
              </div>
            `).join('')}
          </div>

          <div style="border-top:1px solid var(--border-subtle);padding-top:1rem;display:flex;flex-direction:column;gap:0.4rem;font-size:0.85rem;">
            <div style="display:flex;justify-content:space-between;">
              <span style="color:var(--text-secondary);">Delivery Address:</span>
              <span>${esc(order.address)}, ${esc(order.city)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:var(--text-secondary);">Payment Method:</span>
              <span>${order.paymentMethod === 'cod' ? 'Cash on Delivery (Pay at Doorstep)' : 'Bank Transfer / JazzCash / Easypaisa (we will WhatsApp you the account details)'}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:1.15rem;font-weight:700;margin-top:0.5rem;padding-top:0.5rem;border-top:1px solid var(--border-subtle);">
              <span>Total Payable:</span>
              <span style="color:var(--accent-lime);font-family:var(--font-mono);">${formatPKR(order.total)}</span>
            </div>
          </div>
        </div>

        <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;">
          <button class="btn btn-primary" onclick="App.navigateTo('track-order', { orderId: '${esc(order.orderId)}' })">
            📍 TRACK LIVE DISPATCH
          </button>
          <a href="https://wa.me/966543805017?text=Hi%20Brand%20Collection,%20I%20have%20an%20inquiry%20regarding%20my%20Order%20${esc(order.orderId)}" target="_blank" class="btn btn-secondary" style="display:inline-flex;align-items:center;gap:0.5rem;">
            <span>💬 WHATSAPP ORDER SUPPORT</span>
          </a>
          <button class="btn btn-ghost" onclick="App.navigateTo('shop')">
            CONTINUE SHOPPING
          </button>
        </div>
      </div>
    `;
  }

  // Order Tracking View
  function renderTrackOrderPage(prefillId = '') {
    const container = document.getElementById('track-order-content');
    if (!container) return;

    container.innerHTML = `
      <div style="max-width:760px;margin:0 auto;">
        <div style="text-align:center;margin-bottom:3rem;">
          <div class="mono-tag" style="margin-bottom:0.5rem;">NATIONWIDE LOGISTICS ENGINE</div>
          <h1 class="display-title" style="font-size:2.5rem;margin-bottom:1rem;">REAL-TIME SHIPMENT TRACKING</h1>
          <p style="color:var(--text-secondary);">Track doorstep delivery via TCS, Call Courier & Trax Logistics across Pakistan.</p>
        </div>

        <div style="background:var(--bg-surface);border:1px solid var(--border-medium);border-radius:var(--radius-md);padding:2rem;margin-bottom:2.5rem;">
          <form class="bc-stack" onsubmit="App.handleTrackLookup(event)" style="display:grid;grid-template-columns:1fr 1fr auto;gap:1rem;align-items:end;">
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label">Order Number</label>
              <input type="text" id="track-input-id" class="form-control" value="${esc(prefillId)}" placeholder="e.g. BC-123456" required style="text-transform:uppercase;">
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label" for="track-input-contact">Phone number used at checkout</label>
              <input type="tel" id="track-input-contact" class="form-control" placeholder="03XXXXXXXXX" required>
            </div>
            <button type="submit" class="btn btn-primary" style="height:48px;">
              TRACK ⚡
            </button>
          </form>
        </div>

        <div id="tracking-result-box">
          ${(prefillId && STATE.orders.find(o => o.orderId === prefillId)) ? generateTrackingStepperHtml(STATE.orders.find(o => o.orderId === prefillId)) : ''}
        </div>
      </div>
    `;
  }

  function handleTrackLookup(e) {
    e.preventDefault();
    const id = document.getElementById('track-input-id').value.trim().toUpperCase();
    const contact = document.getElementById('track-input-contact').value.trim();

    const resultBox = document.getElementById('tracking-result-box');

    if (window.DB && window.DB.isCloud) {
      resultBox.innerHTML = '<p style="text-align:center;color:var(--text-secondary);">Searching...</p>';
      window.DB.trackOrder(id, contact).then(order => {
        if (order) { resultBox.innerHTML = generateTrackingStepperHtml(order); return; }
        resultBox.innerHTML = `
        <div style="background:var(--bg-surface);border:1px solid var(--accent-danger);border-radius:var(--radius-sm);padding:2rem;text-align:center;">
          <p style="font-weight:600;color:var(--accent-danger);margin-bottom:0.5rem;">Order Not Found</p>
          <p style="font-size:0.85rem;color:var(--text-secondary);">We could not find order "${esc(id)}" with that phone number. Please check both, or contact WhatsApp support.</p>
        </div>`;
      }).catch(err => { resultBox.innerHTML = `<p style="text-align:center;color:var(--accent-danger);">${esc(err.message)}</p>`; });
      return;
    }

    const order = STATE.orders.find(o => o.orderId === id);

    if (!order) {
      resultBox.innerHTML = `
        <div style="background:var(--bg-surface);border:1px solid var(--accent-danger);border-radius:var(--radius-sm);padding:2rem;text-align:center;">
          <p style="font-weight:600;color:var(--accent-danger);margin-bottom:0.5rem;">Order Not Found</p>
          <p style="font-size:0.85rem;color:var(--text-secondary);">No record found for order ID "${esc(id)}". Please check your order confirmation SMS or contact WhatsApp support.</p>
        </div>
      `;
      return;
    }

    resultBox.innerHTML = generateTrackingStepperHtml(order);
  }

  // Tracking steps follow the real order status set in the admin panel
  function trackingStepsHtml(order) {
    const st = String(order.status || '').toLowerCase();
    const steps = [
      ['Order Placed', 'Confirmed'], ['Processing', 'Packing your order'], ['In Transit', order.courier || 'Courier'],
      ['Out for Delivery', 'With the rider'], ['Delivered', 'Enjoy!']
    ];
    if (st.includes('cancel')) {
      return `<div style="background:var(--bg-surface-elevated);border:1px solid var(--accent-danger);border-radius:var(--radius-sm);padding:1.25rem;font-size:0.9rem;">This order was cancelled. Questions? Message us on WhatsApp.</div>`;
    }
    let level = 0;
    if (st.includes('process')) level = 1;
    if (st.includes('transit') || st.includes('dispatch')) level = 2;
    if (st.includes('out for')) level = 3;
    if (st.includes('deliver') && !st.includes('out for')) level = 4;
    const html = steps.map((s, i) => `
          <div class="step-item ${i < level || level === 4 ? 'completed' : i === level ? 'active' : ''}">
            <div class="step-bullet">${i < level || level === 4 ? '✓' : i === level ? '⚡' : i + 1}</div>
            <div class="step-label">${s[0]}</div>
            <div class="step-time">${esc(s[1])}</div>
          </div>`).join('');
    const notes = ['We have your order and will confirm it by phone or WhatsApp.', 'Your order is being packed.', 'Your parcel is with the courier.', 'The rider will deliver today. Please keep your phone on.', 'Your order has been delivered. Thank you for shopping with us!'];
    return `<div class="tracking-stepper">${html}</div>
        <div style="background:var(--bg-surface-elevated);border-radius:var(--radius-sm);padding:1.25rem;margin-top:2rem;font-size:0.85rem;">
          <div style="font-weight:600;margin-bottom:0.25rem;color:var(--accent-lime);">Latest update:</div>
          <div style="color:var(--text-secondary);">${notes[level]}</div>
        </div>`;
  }

  function generateTrackingStepperHtml(order) {
    return `
      <div style="background:var(--bg-surface);border:1px solid var(--border-medium);border-radius:var(--radius-md);padding:2rem;">
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border-subtle);padding-bottom:1rem;margin-bottom:2rem;">
          <div>
            <div class="mono-tag">WAYBILL: ${esc(order.trackingNumber || 'Assigned at dispatch')}</div>
            <h3 style="font-size:1.25rem;margin-top:0.25rem;">Order ${esc(order.orderId)} — ${esc(order.customerName)}</h3>
          </div>
          <div style="text-align:right;">
            <span class="stock-pill in-stock" style="font-size:0.8rem;padding:0.35rem 0.75rem;">${esc(order.status)}</span>
            <div style="font-size:0.75rem;color:var(--text-muted);margin-top:0.25rem;">Destination: ${esc(order.city)}</div>
          </div>
        </div>

        ${trackingStepsHtml(order)}
      </div>
    `;
  }

  // Customer Account Page
  function renderAccountPage() {
    const container = document.getElementById('account-page-content');
    if (!container) return;

    container.innerHTML = `
      <div style="max-width:960px;margin:0 auto;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2.5rem;border-bottom:1px solid var(--border-subtle);padding-bottom:1.5rem;">
          <div>
            <div class="mono-tag">AUTHENTICATED CUSTOMER PORTAL</div>
            <h1 class="display-title" style="font-size:2.25rem;margin-top:0.25rem;">ACCOUNT DASHBOARD</h1>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="App.navigateTo('shop')">CONTINUE SHOPPING</button>
        </div>

        <div class="bc-stack" style="display:grid;grid-template-columns:1fr 2.5fr;gap:2.5rem;align-items:start;">
          <!-- Left Navigation -->
          <div style="background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:var(--radius-sm);padding:1.25rem;display:flex;flex-direction:column;gap:0.5rem;">
            <button class="btn btn-primary btn-sm btn-full" style="justify-content:flex-start;">📦 Orders History (${STATE.orders.length})</button>
            <button class="btn btn-ghost btn-sm btn-full" style="justify-content:flex-start;" onclick="App.navigateTo('track-order')">📍 Live Tracking</button>
            <button class="btn btn-ghost btn-sm btn-full" style="justify-content:flex-start;" onclick="App.openSizeGuideModal()">📏 Saved Measurements</button>
            <button class="btn btn-ghost btn-sm btn-full" style="justify-content:flex-start;" onclick="App.navigateTo('contact')">💬 Customer Support</button>
          </div>

          <!-- Right Content: Order History -->
          <div>
            <h3 style="font-size:1.25rem;margin-bottom:1.5rem;">Past Orders & Dispatches</h3>
            <div style="display:flex;flex-direction:column;gap:1.5rem;">
              ${STATE.orders.map(o => `
                <div style="background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:var(--radius-sm);padding:1.5rem;">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;border-bottom:1px solid var(--border-subtle);padding-bottom:0.75rem;">
                    <div>
                      <strong style="color:var(--accent-lime);font-family:var(--font-mono);font-size:1rem;">${o.orderId}</strong>
                      <span style="color:var(--text-muted);font-size:0.75rem;margin-left:0.75rem;">Placed on ${o.date}</span>
                    </div>
                    <span class="stock-pill in-stock">${o.status}</span>
                  </div>
                  <div style="display:flex;flex-direction:column;gap:0.75rem;margin-bottom:1rem;">
                    ${o.items.map(i => `
                      <div style="display:flex;justify-content:space-between;font-size:0.85rem;">
                        <span>${i.name} (${i.size}, ${i.color}) × ${i.qty}</span>
                        <span style="font-family:var(--font-mono);">${formatPKR(i.price * i.qty)}</span>
                      </div>
                    `).join('')}
                  </div>
                  <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border-subtle);padding-top:0.75rem;">
                    <div style="font-size:0.85rem;">Total: <strong style="color:var(--accent-lime);">${formatPKR(o.total)}</strong> (${o.paymentMethod.toUpperCase()})</div>
                    <button class="btn btn-secondary btn-sm" onclick="App.navigateTo('track-order', { orderId: '${o.orderId}' })">TRACK SHIPMENT</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Size Guide Modal
  function openSizeGuideModal() {
    const modal = document.getElementById('size-guide-modal');
    if (modal) modal.classList.add('active');
  }

  function closeSizeGuideModal() {
    const modal = document.getElementById('size-guide-modal');
    if (modal) modal.classList.remove('active');
  }

  function setSizeUnit(unit) {
    STATE.sizeGuideUnit = unit;
    document.querySelectorAll('.unit-btn').forEach(b => {
      b.classList.toggle('btn-primary', b.getAttribute('data-unit') === unit);
      b.classList.toggle('btn-ghost', b.getAttribute('data-unit') !== unit);
    });
    renderSizeTable();
  }

  function renderSizeTable() {
    const isCm = STATE.sizeGuideUnit === 'cm';
    const mult = isCm ? 2.54 : 1;
    const unitLabel = isCm ? 'CM' : 'INCHES';

    const tableContainer = document.getElementById('size-table-container');
    if (!tableContainer) return;

    const sizes = [
      { size: 'S', chest: [36, 38], waist: [29, 31], length: 28, sleeve: 32 },
      { size: 'M', chest: [39, 41], waist: [32, 34], length: 29, sleeve: 33 },
      { size: 'L', chest: [42, 44], waist: [35, 37], length: 30, sleeve: 34 },
      { size: 'XL', chest: [45, 47], waist: [38, 40], length: 31, sleeve: 35 },
      { size: 'XXL', chest: [48, 50], waist: [41, 43], length: 32, sleeve: 36 }
    ];

    function fmt(val) {
      if (Array.isArray(val)) {
        return `${Math.round(val[0] * mult)} - ${Math.round(val[1] * mult)}`;
      }
      return `${Math.round(val * mult)}`;
    }

    tableContainer.innerHTML = `
      <div style="font-family:var(--font-mono);font-size:0.75rem;color:var(--accent-lime);margin-bottom:0.5rem;">MEASUREMENTS IN ${unitLabel}</div>
      <table class="size-table">
        <thead>
          <tr>
            <th>SIZE</th>
            <th>CHEST</th>
            <th>WAIST</th>
            <th>BODY LENGTH</th>
            <th>SLEEVE</th>
          </tr>
        </thead>
        <tbody>
          ${sizes.map(s => `
            <tr>
              <td><strong>${s.size}</strong></td>
              <td>${fmt(s.chest)}</td>
              <td>${fmt(s.waist)}</td>
              <td>${fmt(s.length)}</td>
              <td>${fmt(s.sleeve)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  function calculateRecommendedSize() {
    const height = parseFloat(document.getElementById('calc-height').value);
    const weight = parseFloat(document.getElementById('calc-weight').value);
    const resultEl = document.getElementById('calc-result');

    if (!height || !weight) {
      resultEl.innerHTML = `<span style="color:var(--accent-danger);">Please input both height and weight.</span>`;
      return;
    }

    let recSize = 'M';
    if (weight < 60) recSize = 'S';
    else if (weight <= 73) recSize = 'M';
    else if (weight <= 85) recSize = 'L';
    else if (weight <= 98) recSize = 'XL';
    else recSize = 'XXL';

    resultEl.innerHTML = `
      <div style="padding:0.75rem;background:rgba(199,243,107,0.1);border:1px solid var(--border-lime);border-radius:var(--radius-sm);margin-top:0.75rem;">
        Recommended Fit: <strong style="color:var(--accent-lime);font-size:1.1rem;">Size ${recSize}</strong>
        <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:0.25rem;">For an exaggerated streetwear drape, consider sizing up one size.</div>
      </div>
    `;
  }

  // Search Modal
  function openSearchModal() {
    const modal = document.getElementById('search-modal');
    if (modal) {
      modal.classList.add('active');
      const input = document.getElementById('global-search-input');
      if (input) {
        input.value = '';
        input.focus();
        handleSearchInput('');
      }
    }
  }

  function closeSearchModal() {
    const modal = document.getElementById('search-modal');
    if (modal) modal.classList.remove('active');
  }

  function handleSearchInput(query) {
    const resultsContainer = document.getElementById('search-modal-results');
    if (!resultsContainer) return;

    const q = query.trim().toLowerCase();
    if (q === '') {
      resultsContainer.innerHTML = `
        <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.75rem;">POPULAR SEARCHES</div>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
          <button class="btn btn-ghost btn-sm" onclick="App.searchKeyword('jacket')">Cyber Trench Jacket</button>
          <button class="btn btn-ghost btn-sm" onclick="App.searchKeyword('hoodie')">500GSM Heavy Hoodie</button>
          <button class="btn btn-ghost btn-sm" onclick="App.searchKeyword('pret')">Asymmetric Pret Dress</button>
          <button class="btn btn-ghost btn-sm" onclick="App.searchKeyword('cotton')">Pakistani Cotton</button>
        </div>
      `;
      return;
    }

    const matches = PRODUCTS_DATA.filter(p => 
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q)
    );

    if (matches.length === 0) {
      resultsContainer.innerHTML = `
        <div style="text-align:center;padding:2rem 0;color:var(--text-secondary);">
          <p>No products found for "${query}".</p>
        </div>
      `;
      return;
    }

    resultsContainer.innerHTML = `
      <div style="font-size:0.75rem;color:var(--accent-lime);margin-bottom:0.75rem;font-family:var(--font-mono);">FOUND ${matches.length} RESULTS</div>
      <div style="display:flex;flex-direction:column;gap:0.75rem;">
        ${matches.map(p => `
          <div onclick="App.navigateTo('product', { id: '${p.id}' })" style="display:flex;gap:1rem;align-items:center;padding:0.5rem;border-radius:4px;cursor:pointer;background:var(--bg-surface-elevated);" onmouseover="this.style.background='#2A2D37'" onmouseout="this.style.background='var(--bg-surface-elevated)'">
            <img src="${p.image}" alt="${p.name}" style="width:40px;height:50px;object-fit:cover;border-radius:2px;">
            <div style="flex-grow:1;">
              <div style="font-size:0.85rem;font-weight:600;">${p.name}</div>
              <div style="font-size:0.75rem;color:var(--text-muted);">${p.category} // ${p.sku}</div>
            </div>
            <div style="font-family:var(--font-mono);font-size:0.85rem;font-weight:700;color:var(--accent-lime);">${formatPKR(p.salePrice || p.price)}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function searchKeyword(word) {
    const input = document.getElementById('global-search-input');
    if (input) input.value = word;
    handleSearchInput(word);
  }

  // Language Switcher (English <-> Roman Urdu)
  function toggleLanguage() {
    STATE.lang = STATE.lang === 'en' ? 'ur' : 'en';
    localStorage.setItem('bc_lang', STATE.lang);
    applyLanguageTranslations();
    showToast(STATE.lang === 'en' ? 'Language switched to English' : 'Roman Urdu Mode faal ho gaya!');
  }

  function applyLanguageTranslations() {
    const t = TRANSLATIONS[STATE.lang];
    const tickerEl = document.getElementById('announcement-ticker-text');
    if (tickerEl) tickerEl.textContent = t.ticker;

    const langToggleBtn = document.getElementById('lang-toggle-btn');
    if (langToggleBtn) langToggleBtn.textContent = STATE.lang === 'en' ? '🌐 English / Roman Urdu' : '🌐 Roman Urdu (Active)';

    const heroSubEl = document.getElementById('hero-subheading');
    if (heroSubEl) heroSubEl.textContent = t.heroSub;

    const heroTitleEl = document.getElementById('hero-title');
    if (heroTitleEl) heroTitleEl.textContent = t.heroTitle;

    const heroDescEl = document.getElementById('hero-desc');
    if (heroDescEl) heroDescEl.textContent = t.heroDesc;

    if (STATE.lang === 'en') {
      applyCustomBanners();
    }

    renderCartDrawer();
  }

  const DEFAULT_BANNERS = {
    heroBadge: "PAKISTAN'S AVANT-GARDE FASHION ATELIER",
    heroTitle: "PROMOTE NATIONAL CULTURE",
    heroDesc: "Bridging high-performance technical fabric engineering with contemporary Pakistani pret aesthetics. Charcoal tones, warm ivory drapes, and high-voltage accents.",
    heroImage: "assets/images/uploads/WhatsApp_Image_2026-10-27_at_9.07.04_PM.jpeg",
    heroBtnPrimaryText: "EXPLORE THE DROP ⚡",
    heroBtnPrimaryLink: "shop",
    heroBtnSecondaryText: "VIEW RUNWAY CAPSULES",
    heroBtnSecondaryLink: "collections",
    announcementTicker: "FREE NATIONWIDE DELIVERY ON ORDERS OVER ₨5,000 | CASH ON DELIVERY AVAILABLE",
    menBannerImage: "assets/images/men.jpg",
    menBannerTitle: "MENS COLLECTION",
    menBannerDesc: "Structured techwear jackets, tailored suiting & urban cargos.",
    womenBannerImage: "assets/images/women.jpg",
    womenBannerTitle: "WOMENS ATELIER",
    womenBannerDesc: "Asymmetric luxury draping, high-voltage piping & tailored silhouettes.",
    kidsBannerImage: "assets/images/kids.jpg",
    kidsBannerTitle: "KIDS COLLECTION",
    kidsBannerDesc: "Durable utility parkas and athletic joggers for future leaders."
  };

  // Dynamic Banners & Hero Customizer Application
  function applyCustomBanners() {
    let banners = DEFAULT_BANNERS;
    try {
      const stored = localStorage.getItem('bc_banners');
      if (stored) banners = { ...DEFAULT_BANNERS, ...JSON.parse(stored) };
    } catch (e) {}

    if (!banners) return;

    // 1. Hero Image Backdrop
    const heroImg = document.getElementById('hero-banner-img');
    if (heroImg && banners.heroImage) heroImg.src = banners.heroImage;

    // 2. Hero Badge / Subheading
    const heroBadge = document.getElementById('hero-subheading');
    if (heroBadge && banners.heroBadge) heroBadge.textContent = banners.heroBadge;

    // 3. Hero Title
    const heroTitle = document.getElementById('hero-title');
    if (heroTitle && banners.heroTitle) heroTitle.textContent = banners.heroTitle;

    // 4. Hero Description
    const heroDesc = document.getElementById('hero-desc');
    if (heroDesc && banners.heroDesc) heroDesc.textContent = banners.heroDesc;

    // 5. Hero Buttons
    const heroBtn1 = document.getElementById('hero-btn-primary');
    if (heroBtn1) {
      if (banners.heroBtnPrimaryText) heroBtn1.textContent = banners.heroBtnPrimaryText;
      if (banners.heroBtnPrimaryLink) heroBtn1.setAttribute('onclick', `App.navigateTo('${banners.heroBtnPrimaryLink}')`);
    }
    const heroBtn2 = document.getElementById('hero-btn-secondary');
    if (heroBtn2) {
      if (banners.heroBtnSecondaryText) heroBtn2.textContent = banners.heroBtnSecondaryText;
      if (banners.heroBtnSecondaryLink) heroBtn2.setAttribute('onclick', `App.navigateTo('${banners.heroBtnSecondaryLink}')`);
    }

    // 6. Top Announcement Ticker
    const ticker = document.getElementById('announcement-ticker-text');
    if (ticker && banners.announcementTicker) ticker.textContent = banners.announcementTicker;

    // 7. Category Banners (Men, Women, Kids)
    const menImg = document.getElementById('cat-card-img-men');
    if (menImg && banners.menBannerImage) menImg.src = banners.menBannerImage;
    const menTitle = document.getElementById('cat-card-title-men');
    if (menTitle && banners.menBannerTitle) menTitle.textContent = banners.menBannerTitle;
    const menDesc = document.getElementById('cat-card-desc-men');
    if (menDesc && banners.menBannerDesc) menDesc.textContent = banners.menBannerDesc;

    const womenImg = document.getElementById('cat-card-img-women');
    if (womenImg && banners.womenBannerImage) womenImg.src = banners.womenBannerImage;
    const womenTitle = document.getElementById('cat-card-title-women');
    if (womenTitle && banners.womenBannerTitle) womenTitle.textContent = banners.womenBannerTitle;
    const womenDesc = document.getElementById('cat-card-desc-women');
    if (womenDesc && banners.womenBannerDesc) womenDesc.textContent = banners.womenBannerDesc;

    const kidsImg = document.getElementById('cat-card-img-kids');
    if (kidsImg && banners.kidsBannerImage) kidsImg.src = banners.kidsBannerImage;
    const kidsTitle = document.getElementById('cat-card-title-kids');
    if (kidsTitle && banners.kidsBannerTitle) kidsTitle.textContent = banners.kidsBannerTitle;
    const kidsDesc = document.getElementById('cat-card-desc-kids');
    if (kidsDesc && banners.kidsBannerDesc) kidsDesc.textContent = banners.kidsBannerDesc;
  }

  // Wishlist Handling
  function toggleWishlist(productId) {
    const idx = STATE.wishlist.indexOf(productId);
    if (idx > -1) {
      STATE.wishlist.splice(idx, 1);
      showToast('Removed from saved collection.');
    } else {
      STATE.wishlist.push(productId);
      showToast('Saved to your private wishlist! ⚡');
    }
    saveState();
  }

  // Collections View
  function renderCollectionsView(collectionName) {
    const container = document.getElementById('collections-view-content');
    if (!container) return;

    const collections = [
      { name: 'NEO-CYBER 2026', count: '4 Pieces', desc: 'Tactical outerwear and weather-sealed tailoring engineered for future metropolises.', img: 'assets/images/jacket.jpg' },
      { name: 'OBSIDIAN MINIMALISM', count: '3 Pieces', desc: 'Heavyweight organic cottons in monolithic black and warm ivory tones.', img: 'assets/images/hoodie.jpg' },
      { name: 'HIGH-VOLTAGE ACCENTS', count: '3 Pieces', desc: 'Precision tailored suiting with electric lime contrast accents.', img: 'assets/images/men.jpg' },
      { name: 'FUTURE GENERATION', count: '2 Pieces', desc: 'High-performance luxury streetwear scaled for kids and young icons.', img: 'assets/images/kids.jpg' }
    ];

    container.innerHTML = `
      <div style="margin-bottom:3rem;text-align:center;">
        <div class="mono-tag" style="margin-bottom:0.5rem;">ATELIER CAPSULES</div>
        <h1 class="display-title" style="font-size:2.75rem;margin-bottom:1rem;">CURATED COLLECTIONS</h1>
        <p style="color:var(--text-secondary);max-width:600px;margin:0 auto;">Explore thematic drops exploring avant-garde construction, Pakistani technical craftsmanship, and architectural silhouettes.</p>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(min(300px, 100%), 1fr));gap:2rem;">
        ${collections.map(c => `
          <div class="category-card" onclick="App.navigateTo('shop')" style="height:420px;cursor:pointer;">
            <img src="${c.img}" alt="${c.name}">
            <div class="category-card-overlay">
              <span class="mono-tag" style="margin-bottom:0.25rem;">${c.count}</span>
              <h3 class="category-card-title">${c.name}</h3>
              <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:1rem;">${c.desc}</p>
              <button class="btn btn-secondary btn-sm" style="align-self:flex-start;">EXPLORE CAPSULE ⚡</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // FAQ Accordion Toggle
  function toggleFaq(btn) {
    const answer = btn.nextElementSibling;
    const icon = btn.querySelector('.faq-icon');
    const isOpen = answer.style.display === 'block';

    if (isOpen) {
      answer.style.display = 'none';
      if (icon) icon.textContent = '+';
      btn.style.color = 'var(--text-primary)';
    } else {
      answer.style.display = 'block';
      if (icon) icon.textContent = '−';
      btn.style.color = 'var(--accent-lime)';
    }
  }

  // Newsletter Submission
  function handleNewsletter(e) {
    e.preventDefault();
    const emailInput = document.getElementById('newsletter-email');
    if (!emailInput) return;
    const email = emailInput.value.trim();
    if (email) {
      const done = () => { showToast('Thank you for subscribing! We will send you our new drops and offers.'); emailInput.value = ''; };
      if (window.DB && window.DB.isCloud) {
        window.DB.subscribe(email).then(done).catch(err => showToast(err.message, 'error'));
      } else {
        done();
      }
    }
  }

  // Contact Form Submission
  function handleContactSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const val = (sel) => { const el = form.querySelector(sel); return el ? el.value.trim() : ''; };
    const msg = {
      name: val('[name="name"], #contact-name, input[type="text"]'),
      email: val('[name="email"], #contact-email, input[type="email"]'),
      phone: val('[name="phone"], #contact-phone, input[type="tel"]'),
      subject: val('[name="subject"], #contact-subject, select'),
      message: val('[name="message"], #contact-message, textarea')
    };
    const done = () => { showToast('Message received! We will reply on WhatsApp or email within 24 hours.'); form.reset(); };
    if (window.DB && window.DB.isCloud) {
      window.DB.sendMessage(msg).then(done).catch(err => showToast(err.message, 'error'));
    } else {
      done();
    }
  }

  // Detect current active page from data-page attribute or URL path
  function detectCurrentPage() {
    const pageAttr = document.body ? document.body.getAttribute('data-page') : null;
    if (pageAttr) return pageAttr;
    const path = window.location.pathname.toLowerCase();
    for (const [key, file] of Object.entries(PAGE_MAP)) {
      if (path.endsWith(file.toLowerCase()) || path.endsWith('/' + key)) return key;
    }
    if (window.location.hash === '#admin') return 'admin';
    return 'home';
  }

  // Initialization
  function setupMobileMenu() {
    const btn = document.querySelector('.mobile-toggle');
    const nav = document.querySelector('.main-nav');
    if (!btn || !nav) return;
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const h = document.querySelector('.site-header');
      if (h) document.documentElement.style.setProperty('--bc-header-h', h.getBoundingClientRect().bottom + 'px');
      const open = document.body.classList.toggle('nav-open');
      btn.setAttribute('aria-expanded', String(open));
      btn.textContent = open ? '✕' : '☰';
    });
    nav.addEventListener('click', (e) => {
      if (e.target.closest('a')) { document.body.classList.remove('nav-open'); btn.textContent = '☰'; }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.body.classList.contains('nav-open')) btn.click();
    });
  }

  function init() {
    setupMobileMenu();
    updateCartBadges();
    renderCartDrawer();
    renderSizeTable();
    applyLanguageTranslations();
    applyCustomBanners();

    const page = detectCurrentPage();
    STATE.currentView = page;

    // Highlight nav link matching current page
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.getAttribute('data-view') === page);
    });

    const urlParams = new URLSearchParams(window.location.search);

    if (page === 'home') {
      renderHomeProducts();
    } else if (page === 'shop') {
      const catParam = urlParams.get('cat') || urlParams.get('category');
      if (catParam) STATE.currentCategoryFilter = catParam;
      renderShopCatalog();
    } else if (page === 'men') {
      const subParam = urlParams.get('sub') || 'all';
      renderDepartmentCatalog('men', subParam);
    } else if (page === 'women') {
      const subParam = urlParams.get('sub') || 'all';
      renderDepartmentCatalog('women', subParam);
    } else if (page === 'kids') {
      const subParam = urlParams.get('sub') || 'all';
      renderDepartmentCatalog('kids', subParam);
    } else if (page === 'collections') {
      renderCollectionsView();
    } else if (page === 'sale') {
      STATE.currentCategoryFilter = 'sale';
      renderShopCatalog();
    } else if (page === 'size-guide') {
      renderSizeTable('in');
    } else if (page === 'cart') {
      renderCartPage();
    } else if (page === 'checkout') {
      const orderIdParam = urlParams.get('orderId');
      if (orderIdParam) {
        renderOrderConfirmationPage(orderIdParam);
      } else {
        renderCheckoutPage();
      }
    } else if (page === 'track-order') {
      const orderIdParam = urlParams.get('orderId');
      renderTrackOrderPage(orderIdParam);
    } else if (page === 'product') {
      const prodId = urlParams.get('id') || urlParams.get('product') || document.body.getAttribute('data-product-id');
      if (prodId) {
        const prod = PRODUCTS_DATA.find(p => p.id === prodId || p.slug === prodId);
        if (prod) STATE.selectedProduct = prod;
      }
      renderProductDetailPage();
    } else if (page === 'account') {
      if (window.AccountPage && typeof window.AccountPage.init === 'function') window.AccountPage.init();
    } else if (page === 'admin') {
      if (window.AdminApp && typeof window.AdminApp.renderAdminPanel === 'function') {
        window.AdminApp.renderAdminPanel();
      }
    }

    // Sync banners from DB if available
    if (window.DB && typeof window.DB.getBanners === 'function') {
      window.DB.getBanners().then(() => applyCustomBanners()).catch(() => {});
    }

    // Futuristic theme: gentle reveal animation for category tiles
    try {
      if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const els = document.querySelectorAll('.category-card');
        const io = new IntersectionObserver((entries) => entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('bc-in'); io.unobserve(en.target); } }), { threshold: 0.12 });
        els.forEach((el, i) => { el.classList.add('bc-reveal'); el.style.transitionDelay = (i % 3) * 90 + 'ms'; io.observe(el); });
        setTimeout(() => els.forEach(el => el.classList.add('bc-in')), 1200);
      }
    } catch (e) {}

    // When the cloud database sends the latest products, redraw the current page
    window.addEventListener('brand_collection_db_update', (ev) => {
      const evt = ev.detail && ev.detail.event;
      if (evt !== 'products_synced') return;
      const pg = STATE.currentView;
      try {
        if (pg === 'home') renderHomeProducts();
        else if (pg === 'shop' || pg === 'sale') renderShopCatalog();
        else if (pg === 'men' || pg === 'women' || pg === 'kids') renderDepartmentCatalog(pg, urlParams.get('sub') || 'all');
        else if (pg === 'collections') renderCollectionsView();
        else if (pg === 'product') {
          const pid = urlParams.get('id') || urlParams.get('product') || document.body.getAttribute('data-product-id');
          const prod = PRODUCTS_DATA.find(p => p.id === pid || p.slug === pid);
          if (prod) { STATE.selectedProduct = prod; renderProductDetailPage(); }
        }
      } catch (e) { console.warn('Re-render after sync failed', e); }
    });

    // Close drawers on ESC
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeCartDrawer();
        closeSearchModal();
        closeSizeGuideModal();
      }
    });
  }

  // Expose Public API
  window.App = {
    init,
    esc,
    formatPKR,
    showToast,
    navigateTo,
    addToCart,
    quickAddToCart,
    updateCartQty,
    removeFromCart,
    openCartDrawer,
    closeCartDrawer,
    openSearchModal,
    closeSearchModal,
    handleSearchInput,
    searchKeyword,
    openSizeGuideModal,
    closeSizeGuideModal,
    setSizeUnit,
    calculateRecommendedSize,
    toggleLanguage,
    toggleWishlist,
    applyCoupon,
    removeCoupon,
    selectProductColor,
    selectProductSize,
    adjustDetailQty,
    addSelectedProductToCart,
    filterCatalogCategory,
    sortCatalog,
    resetCatalogFilters,
    selectPaymentMethod,
    handleCityChange,
    handlePlaceOrder,
    handleTrackLookup,
    toggleFaq,
    handleNewsletter,
    handleContactSubmit,
    renderDepartmentCatalog,
    filterDepartment,
    sortDepartment,
    renderHomeProducts,
    renderShopCatalog,
    applyCustomBanners,
    closeAdminEditModal: function() {
      if (window.AdminApp && typeof window.AdminApp.closeEditModal === 'function') {
        window.AdminApp.closeEditModal();
      }
    }
  };

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
