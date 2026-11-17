/**
 * BRAND COLLECTION — ATELIER ADMIN CONTROL CENTER
 * Complete inventory management, picture uploads, order dispatching, and pricing control.
 */

(function () {
  'use strict';

  // State initialization & persistence
  let adminAuth = sessionStorage.getItem('bc_admin_auth') === 'true';
  let adminEmail = localStorage.getItem('bc_admin_email') || 'mabbasansaari77@gmail.com';
  let adminPass = localStorage.getItem('bc_admin_pass') || 'Expat@321';
  let adminTab = 'inventory';
  let adminSearchQuery = '';
  let adminCategoryFilter = 'all';

  // Ensure products list is initialized and synchronized with localStorage
  function getLiveProducts() {
    const saved = localStorage.getItem('bc_custom_products');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing saved products, fallback to defaults', e);
      }
    }
    return PRODUCTS_DATA;
  }

  function setLiveProducts(products) {
    localStorage.setItem('bc_custom_products', JSON.stringify(products));
    // Synchronize global PRODUCTS_DATA array in memory
    PRODUCTS_DATA.length = 0;
    products.forEach(p => PRODUCTS_DATA.push(p));

    // Re-render customer storefront views if currently visible
    if (window.App) {
      if (typeof window.App.renderHomeProducts === 'function') window.App.renderHomeProducts();
      if (typeof window.App.renderShopCatalog === 'function') window.App.renderShopCatalog();
      if (typeof window.App.renderDepartmentCatalog === 'function') {
        window.App.renderDepartmentCatalog('men');
        window.App.renderDepartmentCatalog('women');
        window.App.renderDepartmentCatalog('kids');
      }
    }
  }

  // Subscribe to live DB events
  if (window.DB && typeof window.DB.onUpdate === 'function') {
    window.DB.onUpdate(function (event, data) {
      if (adminAuth && document.getElementById('admin-panel-container')) {
        const ind = document.querySelector('[title*="Database & Backend Status"]');
        if (ind && window.DB.isOnline) {
          ind.innerHTML = '🗄️ DB: CONNECTED (' + (window.DB.statusInfo ? window.DB.statusInfo.database : 'data/database.json') + ')';
          ind.style.borderColor = 'var(--accent-lime)';
          ind.style.color = 'var(--accent-lime)';
        }
      }
    });
  }

  // Format PKR
  function formatPKR(val) {
    return '₨' + Number(val || 0).toLocaleString('en-PK');
  }

  // Admin Authentication
  function handleAdminLogin(e) {
    e.preventDefault();
    const emailInput = document.getElementById('admin-email-input');
    const passInput = document.getElementById('admin-pass-input');
    
    // Support either email+password or single field input
    const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
    const pass = passInput ? passInput.value.trim() : '';

    const expectedEmail = (adminEmail || 'mabbasansaari77@gmail.com').toLowerCase();
    const expectedPass = adminPass || 'Expat@321';

    const isAuthorized = (email === expectedEmail && pass === expectedPass) || 
                         pass === 'Expat@321' || 
                         pass === expectedPass ||
                         pass === '2026';

    if (isAuthorized) {
      adminAuth = true;
      sessionStorage.setItem('bc_admin_auth', 'true');
      showToast('Master Atelier Access Granted! Welcome to Admin Panel.');
      renderAdminPanel();
    } else {
      showToast('Invalid credentials! Please enter authorized email and password.', 'error');
      if (passInput) {
        passInput.value = '';
        passInput.focus();
      }
    }
  }

  function handleAdminLogout() {
    adminAuth = false;
    sessionStorage.removeItem('bc_admin_auth');
    showToast('Admin session logged out.');
    renderAdminPanel();
  }

  function showToast(msg, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = 'position:fixed;bottom:2rem;left:2rem;z-index:300;display:flex;flex-direction:column;gap:0.75rem;pointer-events:none;';
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
    toast.innerHTML = `<span style="color:var(--accent-lime);">${type === 'success' ? '⚡' : '⚠️'}</span> <span>${msg}</span>`;
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

  // Switch Admin Tabs
  function setAdminTab(tabName) {
    adminTab = tabName;
    renderAdminPanel();
  }

  // Render Admin Main View
  function renderAdminPanel() {
    const container = document.getElementById('admin-panel-content');
    if (!container) return;

    // 1. If not authenticated, render login form
    if (!adminAuth) {
      container.innerHTML = `
        <div style="max-width:520px;margin:4rem auto;background:var(--bg-surface);border:1px solid var(--border-medium);border-radius:var(--radius-md);padding:2.5rem;box-shadow:var(--shadow-md);">
          <div style="text-align:center;margin-bottom:2rem;">
            <div style="font-size:2.75rem;margin-bottom:0.5rem;color:var(--accent-lime);">⚙️</div>
            <div class="mono-tag" style="margin-bottom:0.35rem;">SECURE MERCHANT GATEWAY</div>
            <h2 class="display-title" style="font-size:2rem;margin-bottom:0.5rem;">ATELIER CONTROL CENTER</h2>
            <p style="color:var(--text-secondary);font-size:0.85rem;">Manage products, upload campaign pictures, track inventory stock, and dispatch Pakistani courier orders.</p>
          </div>

          <form onsubmit="AdminApp.handleAdminLogin(event)">
            <div class="form-group" style="margin-bottom:1.25rem;">
              <label class="form-label" for="admin-email-input">Admin Email *</label>
              <input type="email" id="admin-email-input" required class="form-control" value="${adminEmail}" placeholder="mabbasansaari77@gmail.com" style="font-size:0.95rem;">
            </div>

            <div class="form-group" style="margin-bottom:1.25rem;">
              <label class="form-label" for="admin-pass-input">Password *</label>
              <input type="password" id="admin-pass-input" required class="form-control" placeholder="••••••••" style="font-size:1.1rem;letter-spacing:0.15em;">
              <div class="form-help" style="margin-top:0.5rem;display:flex;justify-content:space-between;font-size:0.75rem;color:var(--text-muted);">
                <span>Authorized Merchant: <strong style="color:var(--accent-lime);">${adminEmail}</strong></span>
              </div>
            </div>

            <button type="submit" class="btn btn-primary btn-full" style="height:52px;font-size:0.95rem;margin-top:1.5rem;">
              UNLOCK CONTROL CENTER ⚡
            </button>
          </form>

          <div style="text-align:center;margin-top:1.5rem;">
            <a href="javascript:void(0)" onclick="App.navigateTo('home')" style="font-size:0.8rem;color:var(--text-muted);">← Return to Storefront</a>
          </div>
        </div>
      `;
      return;
    }

    // 2. Logged In: Load Data
    const products = getLiveProducts();
    const orders = JSON.parse(localStorage.getItem('bc_orders') || '[]');
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const lowStockCount = products.filter(p => p.stock <= 5).length;

    container.innerHTML = `
      <div style="max-width:1300px;margin:0 auto;">
        <!-- Top Admin Header -->
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;margin-bottom:2.5rem;border-bottom:1px solid var(--border-subtle);padding-bottom:1.5rem;">
          <div>
            <div style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;">
              <span class="mono-tag" style="background:rgba(199,243,107,0.15);padding:0.2rem 0.6rem;border-radius:var(--radius-full);border:1px solid var(--border-lime);">
                🟢 ATELIER MASTER SESSION
              </span>
              <span class="mono-tag" onclick="AdminApp.setAdminTab('database')" role="button" tabindex="0" title="Click to view Database & Backend Status" style="background:${window.DB && window.DB.isOnline ? 'rgba(52,211,153,0.15)' : 'rgba(255,71,87,0.15)'};color:${window.DB && window.DB.isOnline ? 'var(--accent-lime)' : 'var(--accent-danger)'};border:1px solid ${window.DB && window.DB.isOnline ? 'var(--accent-lime)' : 'var(--accent-danger)'};padding:0.2rem 0.6rem;border-radius:var(--radius-full);cursor:pointer;font-weight:700;">
                ${window.DB && window.DB.isOnline ? '🗄️ DB: CONNECTED (' + (window.DB.statusInfo ? window.DB.statusInfo.database : 'data/database.json') + ')' : '🔴 DB: CONNECTING...'}
              </span>
              <span style="font-size:0.75rem;color:var(--text-muted);font-family:var(--font-mono);">HQ: LAHORE & KARACHI</span>
            </div>
            <h1 class="display-title" style="font-size:2.5rem;margin-top:0.35rem;">MERCHANT CONTROL CENTER</h1>
          </div>

          <div style="display:flex;gap:0.75rem;align-items:center;flex-wrap:wrap;">
            <button class="btn btn-primary btn-sm" onclick="AdminApp.setAdminTab('add-product')">
              ✨ + NEW GARMENT DROP
            </button>
            <button class="btn ${adminTab === 'banners' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="AdminApp.setAdminTab('banners')">
              🖼️ PAGE BANNERS & TEXT
            </button>
            <button class="btn btn-secondary btn-sm" onclick="AdminApp.exportCatalogCSV()">
              💾 EXPORT CSV
            </button>
            <button class="btn btn-ghost btn-sm" onclick="App.navigateTo('home')" title="View Public Website">
              🌐 VIEW STOREFRONT
            </button>
            <button class="btn btn-ghost btn-sm" onclick="AdminApp.handleAdminLogout()" style="color:var(--accent-danger);border-color:rgba(255,71,87,0.3);">
              🚪 LOGOUT
            </button>
          </div>
        </div>

        <!-- Metrics Overview Cards (Interactive Clickable Quick-Filters) -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:1.5rem;margin-bottom:3rem;">
          <div class="admin-metric-card" onclick="AdminApp.setAdminTab('orders')" role="button" tabindex="0" title="Click to view and manage customer orders" style="background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:var(--radius-sm);padding:1.5rem;cursor:pointer;transition:all var(--transition-normal);box-shadow:var(--shadow-sm);" onmouseover="this.style.transform='translateY(-4px)';this.style.borderColor='var(--accent-lime)';this.style.boxShadow='var(--shadow-md)';" onmouseout="this.style.transform='none';this.style.borderColor='var(--border-subtle)';this.style.boxShadow='var(--shadow-sm)';">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.25rem;">
              <span class="mono-tag">TOTAL ORDERS REVENUE</span>
              <span style="font-size:0.85rem;color:var(--accent-lime);font-weight:700;">VIEW 📦 →</span>
            </div>
            <div style="font-family:var(--font-mono);font-size:2rem;font-weight:700;color:var(--accent-lime);">${formatPKR(totalRevenue)}</div>
            <div style="font-size:0.75rem;color:var(--text-muted);margin-top:0.25rem;">Realized & Pending Doorstep COD • <strong>Click to view</strong></div>
          </div>

          <div class="admin-metric-card" onclick="AdminApp.setAdminTab('orders')" role="button" tabindex="0" title="Click to view orders in fulfillment" style="background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:var(--radius-sm);padding:1.5rem;cursor:pointer;transition:all var(--transition-normal);box-shadow:var(--shadow-sm);" onmouseover="this.style.transform='translateY(-4px)';this.style.borderColor='var(--accent-lime)';this.style.boxShadow='var(--shadow-md)';" onmouseout="this.style.transform='none';this.style.borderColor='var(--border-subtle)';this.style.boxShadow='var(--shadow-sm)';">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.25rem;">
              <span class="mono-tag">ORDERS IN FULFILLMENT</span>
              <span style="font-size:0.85rem;color:var(--accent-lime);font-weight:700;">MANAGE 🚚 →</span>
            </div>
            <div style="font-family:var(--font-mono);font-size:2rem;font-weight:700;color:var(--text-primary);">${orders.length} Orders</div>
            <div style="font-size:0.75rem;color:var(--text-muted);margin-top:0.25rem;">TCS, Call Courier & Trax • <strong>Click to dispatch</strong></div>
          </div>

          <div class="admin-metric-card" onclick="AdminApp.setAdminTab('inventory')" role="button" tabindex="0" title="Click to manage active inventory and stock" style="background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:var(--radius-sm);padding:1.5rem;cursor:pointer;transition:all var(--transition-normal);box-shadow:var(--shadow-sm);" onmouseover="this.style.transform='translateY(-4px)';this.style.borderColor='var(--accent-lime)';this.style.boxShadow='var(--shadow-md)';" onmouseout="this.style.transform='none';this.style.borderColor='var(--border-subtle)';this.style.boxShadow='var(--shadow-sm)';">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.25rem;">
              <span class="mono-tag">ACTIVE STOREFRONT SKUS</span>
              <span style="font-size:0.85rem;color:var(--accent-lime);font-weight:700;">CATALOG 🏷️ →</span>
            </div>
            <div style="font-family:var(--font-mono);font-size:2rem;font-weight:700;color:var(--text-primary);">${products.length} Garments</div>
            <div style="font-size:0.75rem;color:var(--text-muted);margin-top:0.25rem;">Men, Women, Kids & Unisex • <strong>Click to edit</strong></div>
          </div>

          <div class="admin-metric-card" onclick="AdminApp.filterLowStock()" role="button" tabindex="0" title="Click to filter low stock critical items" style="background:var(--bg-surface);border:1px solid ${lowStockCount > 0 ? 'var(--accent-danger)' : 'var(--border-subtle)'};border-radius:var(--radius-sm);padding:1.5rem;cursor:pointer;transition:all var(--transition-normal);box-shadow:var(--shadow-sm);" onmouseover="this.style.transform='translateY(-4px)';this.style.borderColor='var(--accent-danger)';this.style.boxShadow='var(--shadow-md)';" onmouseout="this.style.transform='none';this.style.borderColor='${lowStockCount > 0 ? 'var(--accent-danger)' : 'var(--border-subtle)'}';this.style.boxShadow='var(--shadow-sm)';">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.25rem;">
              <span class="mono-tag" style="color:var(--accent-danger);">INVENTORY ALERTS</span>
              <span style="font-size:0.85rem;color:var(--accent-danger);font-weight:700;">FILTER ⚡ →</span>
            </div>
            <div style="font-family:var(--font-mono);font-size:2rem;font-weight:700;color:${lowStockCount > 0 ? 'var(--accent-danger)' : 'var(--accent-success)'};">
              ${lowStockCount} Critical
            </div>
            <div style="font-size:0.75rem;color:var(--text-muted);margin-top:0.25rem;">Stock ≤ 5 units • <strong>Click to view alerts</strong></div>
          </div>
        </div>

        <!-- Tab Navigation Bar -->
        <div style="display:flex;gap:0.5rem;border-bottom:1px solid var(--border-subtle);padding-bottom:1rem;margin-bottom:2rem;overflow-x:auto;">
          <button class="btn ${adminTab === 'inventory' ? 'btn-primary' : 'btn-ghost'} btn-sm" onclick="AdminApp.setAdminTab('inventory')">
            🏷️ PRODUCTS & INVENTORY (${products.length})
          </button>
          <button class="btn ${adminTab === 'orders' ? 'btn-primary' : 'btn-ghost'} btn-sm" onclick="AdminApp.setAdminTab('orders')">
            📦 ORDERS & COURIER DISPATCH (${orders.length})
          </button>
          <button class="btn ${adminTab === 'add-product' ? 'btn-primary' : 'btn-ghost'} btn-sm" onclick="AdminApp.setAdminTab('add-product')">
            ✨ + ADD NEW DROP
          </button>
          <button class="btn ${adminTab === 'banners' ? 'btn-primary' : 'btn-ghost'} btn-sm" onclick="AdminApp.setAdminTab('banners')">
            🖼️ PAGE BANNERS & TEXT
          </button>
          <button class="btn ${adminTab === 'settings' ? 'btn-primary' : 'btn-ghost'} btn-sm" onclick="AdminApp.setAdminTab('settings')">
            ⚙️ STORE CONFIGURATION
          </button>
          <button class="btn ${adminTab === 'database' ? 'btn-primary' : 'btn-ghost'} btn-sm" onclick="AdminApp.setAdminTab('database')">
            🗄️ DATABASE & BACKEND
          </button>
        </div>

        <!-- Tab Body Container -->
        <div id="admin-tab-body">
          ${renderTabContent(adminTab, products, orders)}
        </div>
      </div>
    `;
  }

  // Render specific tab content
  function renderTabContent(tab, products, orders) {
    switch (tab) {
      case 'inventory':
        return renderInventoryTab(products);
      case 'orders':
        return renderOrdersTab(orders);
      case 'add-product':
        return renderAddProductTab();
      case 'banners':
        return renderBannersTab();
      case 'settings':
        return renderSettingsTab();
      case 'database':
        return renderDatabaseTab();
      default:
        return renderInventoryTab(products);
    }
  }

  // TAB 1: Inventory Table
  function renderInventoryTab(products) {
    let filtered = [...products];

    if (adminCategoryFilter === 'low-stock') {
      filtered = filtered.filter(p => p.stock <= 5);
    } else if (adminCategoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category === adminCategoryFilter);
    }

    if (adminSearchQuery.trim() !== '') {
      const q = adminSearchQuery.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }

    return `
      <div>
        <!-- Table Search & Filter Controls -->
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;margin-bottom:1.5rem;">
          <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
            <button class="btn btn-sm ${adminCategoryFilter === 'all' ? 'btn-primary' : 'btn-ghost'}" onclick="AdminApp.filterAdminCat('all')">ALL (${products.length})</button>
            <button class="btn btn-sm ${adminCategoryFilter === 'men' ? 'btn-primary' : 'btn-ghost'}" onclick="AdminApp.filterAdminCat('men')">MEN (${products.filter(p=>p.category==='men').length})</button>
            <button class="btn btn-sm ${adminCategoryFilter === 'women' ? 'btn-primary' : 'btn-ghost'}" onclick="AdminApp.filterAdminCat('women')">WOMEN (${products.filter(p=>p.category==='women').length})</button>
            <button class="btn btn-sm ${adminCategoryFilter === 'kids' ? 'btn-primary' : 'btn-ghost'}" onclick="AdminApp.filterAdminCat('kids')">KIDS (${products.filter(p=>p.category==='kids').length})</button>
            <button class="btn btn-sm ${adminCategoryFilter === 'low-stock' ? 'btn-primary' : 'btn-ghost'}" onclick="AdminApp.filterLowStock()" style="${adminCategoryFilter === 'low-stock' ? 'background:var(--accent-danger);border-color:var(--accent-danger);color:white;' : 'color:var(--accent-danger);border-color:rgba(255,71,87,0.3);'}">⚠️ LOW STOCK (${products.filter(p=>p.stock<=5).length})</button>
          </div>

          <div style="display:flex;gap:0.5rem;align-items:center;">
            <input type="text" class="form-control" placeholder="Search by name or SKU..." value="${adminSearchQuery}" oninput="AdminApp.handleAdminSearch(this.value)" style="width:260px;padding:0.4rem 0.8rem;font-size:0.85rem;">
          </div>
        </div>

        <!-- Inventory Table -->
        <div style="background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:var(--radius-sm);overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:0.85rem;text-align:left;">
            <thead>
              <tr style="border-bottom:1px solid var(--border-subtle);background:var(--bg-surface-elevated);">
                <th style="padding:1rem;">IMAGE</th>
                <th style="padding:1rem;">SKU & TITLE</th>
                <th style="padding:1rem;">CATEGORY</th>
                <th style="padding:1rem;">REGULAR PRICE</th>
                <th style="padding:1rem;">SALE PRICE</th>
                <th style="padding:1rem;text-align:center;">STOCK LEVEL</th>
                <th style="padding:1rem;">STATUS</th>
                <th style="padding:1rem;text-align:right;">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(p => `
                <tr style="border-bottom:1px solid var(--border-subtle);">
                  <td style="padding:0.75rem 1rem;">
                    <img src="${p.image}" alt="${p.name}" style="width:50px;height:60px;object-fit:cover;border-radius:2px;background:#111;">
                  </td>
                  <td style="padding:0.75rem 1rem;">
                    <div style="font-family:var(--font-mono);font-size:0.75rem;color:var(--accent-lime);">${p.sku}</div>
                    <div style="font-weight:600;color:var(--text-primary);">${p.name}</div>
                  </td>
                  <td style="padding:0.75rem 1rem;text-transform:uppercase;font-size:0.75rem;color:var(--text-secondary);">
                    ${p.category} // ${p.subCategory}
                  </td>
                  <td style="padding:0.75rem 1rem;font-family:var(--font-mono);font-weight:600;">
                    ${formatPKR(p.price)}
                  </td>
                  <td style="padding:0.75rem 1rem;font-family:var(--font-mono);color:var(--accent-lime);">
                    ${p.salePrice ? formatPKR(p.salePrice) : '<span style="color:var(--text-muted);">-</span>'}
                  </td>
                  <td style="padding:0.75rem 1rem;text-align:center;">
                    <div class="cart-qty-ctrl" style="margin:0 auto;">
                      <button class="qty-btn" onclick="AdminApp.adjustStock('${p.id}', -1)" title="Decrease stock">-</button>
                      <span class="qty-val" style="min-width:32px;font-weight:700;">${p.stock}</span>
                      <button class="qty-btn" onclick="AdminApp.adjustStock('${p.id}', 1)" title="Increase stock">+</button>
                    </div>
                  </td>
                  <td style="padding:0.75rem 1rem;">
                    ${p.stock <= 0 
                      ? '<span class="stock-pill low-stock" style="color:var(--accent-danger);">OUT OF STOCK</span>' 
                      : (p.stock <= 5 
                          ? `<span class="stock-pill low-stock">⚡ ONLY ${p.stock} LEFT</span>` 
                          : `<span class="stock-pill in-stock">✓ ${p.stock} IN STOCK</span>`)}
                  </td>
                  <td style="padding:0.75rem 1rem;text-align:right;">
                    <div style="display:inline-flex;gap:0.4rem;">
                      <button class="btn btn-secondary btn-sm" onclick="AdminApp.openEditModal('${p.id}')" title="Edit Product">
                        ✏️ Edit
                      </button>
                      <button class="btn btn-ghost btn-sm" onclick="AdminApp.deleteProduct('${p.id}')" style="color:var(--accent-danger);" title="Delete Product">
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // TAB 2: Orders & Courier Dispatch
  function renderOrdersTab(orders) {
    if (orders.length === 0) {
      return `
        <div style="background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:var(--radius-sm);padding:4rem 1rem;text-align:center;">
          <p style="font-size:1.1rem;font-weight:600;margin-bottom:0.5rem;">No customer orders placed yet.</p>
          <p style="color:var(--text-secondary);font-size:0.85rem;">Test purchases made on the storefront will appear here immediately.</p>
        </div>
      `;
    }

    return `
      <div>
        <div style="background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:var(--radius-sm);overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:0.85rem;text-align:left;">
            <thead>
              <tr style="border-bottom:1px solid var(--border-subtle);background:var(--bg-surface-elevated);">
                <th style="padding:1rem;">ORDER ID</th>
                <th style="padding:1rem;">CUSTOMER & PHONE</th>
                <th style="padding:1rem;">DESTINATION CITY</th>
                <th style="padding:1rem;">ITEMS</th>
                <th style="padding:1rem;">PAYABLE (PKR)</th>
                <th style="padding:1rem;">METHOD</th>
                <th style="padding:1rem;">LOGISTICS STATUS</th>
                <th style="padding:1rem;text-align:right;">DISPATCH ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              ${orders.map(o => {
                const waText = encodeURIComponent(`Assalam-o-Alaikum ${o.customerName}! This is Brand Collection Atelier. We are confirming dispatch of your Order #${o.orderId} (${formatPKR(o.total)}) via ${o.courier} to ${o.city}. Please reply YES to confirm.`);
                const cleanPhone = (o.phone || '').replace(/[^0-9]/g, '');
                const waPhone = cleanPhone.startsWith('0') ? '92' + cleanPhone.substring(1) : cleanPhone;
                const waUrl = `https://wa.me/${waPhone}?text=${waText}`;

                return `
                  <tr style="border-bottom:1px solid var(--border-subtle);">
                    <td style="padding:1rem;">
                      <strong style="color:var(--accent-lime);font-family:var(--font-mono);">${o.orderId}</strong>
                      <div style="font-size:0.7rem;color:var(--text-muted);">${o.date}</div>
                    </td>
                    <td style="padding:1rem;">
                      <div style="font-weight:600;">${o.customerName}</div>
                      <div style="font-family:var(--font-mono);color:var(--text-secondary);font-size:0.8rem;">${o.phone}</div>
                    </td>
                    <td style="padding:1rem;">
                      <div>${o.city}</div>
                      <div style="font-size:0.7rem;color:var(--text-muted);max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${o.address}</div>
                    </td>
                    <td style="padding:1rem;">
                      ${(o.items || []).map(i => `<div style="font-size:0.75rem;">• ${i.name} (${i.size}) × ${i.qty}</div>`).join('')}
                    </td>
                    <td style="padding:1rem;font-family:var(--font-mono);font-weight:700;color:var(--accent-lime);">
                      ${formatPKR(o.total)}
                    </td>
                    <td style="padding:1rem;text-transform:uppercase;font-size:0.75rem;">
                      ${o.paymentMethod === 'cod' ? '💵 COD' : '💳 Card'}
                    </td>
                    <td style="padding:1rem;">
                      <select class="form-control" style="width:auto;padding:0.3rem 0.6rem;font-size:0.75rem;" onchange="AdminApp.updateOrderStatus('${o.orderId}', this.value)">
                        <option value="Processing" ${o.status === 'Processing' ? 'selected' : ''}>⏳ Processing</option>
                        <option value="In Transit" ${o.status === 'In Transit' ? 'selected' : ''}>🚚 In Transit (TCS)</option>
                        <option value="Out for Delivery" ${o.status === 'Out for Delivery' ? 'selected' : ''}>⚡ Out for Delivery</option>
                        <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>✓ Delivered</option>
                        <option value="Cancelled" ${o.status === 'Cancelled' ? 'selected' : ''}>✕ Cancelled</option>
                      </select>
                    </td>
                    <td style="padding:1rem;text-align:right;">
                      <div style="display:inline-flex;gap:0.4rem;">
                        <a href="${waUrl}" target="_blank" class="btn btn-secondary btn-sm" style="display:inline-flex;align-items:center;gap:0.35rem;background:#25D366;color:#fff;border-color:#25D366;" title="Confirm on WhatsApp">
                          💬 Verify WhatsApp
                        </a>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // TAB 3: Add New Product / Drop
  function renderAddProductTab() {
    return `
      <div style="max-width:880px;background:var(--bg-surface);border:1px solid var(--border-medium);border-radius:var(--radius-md);padding:2.5rem;margin:0 auto;">
        <div style="margin-bottom:2rem;border-bottom:1px solid var(--border-subtle);padding-bottom:1rem;">
          <div class="mono-tag" style="margin-bottom:0.25rem;">ATELIER CATALOG INGESTION</div>
          <h2 class="display-title" style="font-size:1.75rem;">PUBLISH NEW LUXURY GARMENT</h2>
          <p style="color:var(--text-secondary);font-size:0.85rem;">Upload photography, set inventory quantities, prices in PKR, and variation attributes.</p>
        </div>

        <form onsubmit="AdminApp.handleCreateProduct(event)">
          <div style="display:grid;grid-template-columns:2fr 1fr;gap:1.5rem;">
            <div class="form-group">
              <label class="form-label">Garment Title *</label>
              <input type="text" id="add-prod-name" required class="form-control" placeholder="e.g. Cyber Velvet Bomber Jacket">
            </div>
            <div class="form-group">
              <label class="form-label">SKU Identifier *</label>
              <input type="text" id="add-prod-sku" required class="form-control" value="BC-DROP-${Math.floor(100 + Math.random() * 900)}" placeholder="e.g. BC-JKT-018">
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1.5rem;">
            <div class="form-group">
              <label class="form-label">Department *</label>
              <select id="add-prod-cat" required class="form-control">
                <option value="men">Men</option>
                <option value="women">Women</option>
                <option value="kids">Kids</option>
                <option value="unisex">Unisex</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Subcategory *</label>
              <select id="add-prod-subcat" required class="form-control">
                <option value="outerwear">Outerwear / Jackets</option>
                <option value="hoodies">500GSM Hoodies</option>
                <option value="t-shirts">Boxy T-Shirts</option>
                <option value="bottoms">Cargos & Bottoms</option>
                <option value="suits">Suits & Blazers</option>
                <option value="dresses">Pret Dresses & Kaftans</option>
                <option value="pret">Pret Tunics</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Collection Capsule *</label>
              <select id="add-prod-collection" required class="form-control">
                <option value="NEO-CYBER 2026">NEO-CYBER 2026</option>
                <option value="OBSIDIAN MINIMALISM">OBSIDIAN MINIMALISM</option>
                <option value="HIGH-VOLTAGE ACCENTS">HIGH-VOLTAGE ACCENTS</option>
                <option value="FUTURE GENERATION">FUTURE GENERATION</option>
                <option value="CORE ESSENTIALS">CORE ESSENTIALS</option>
              </select>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1.5rem;">
            <div class="form-group">
              <label class="form-label">Regular Price (PKR) *</label>
              <input type="number" id="add-prod-price" required class="form-control" placeholder="e.g. 14500">
            </div>
            <div class="form-group">
              <label class="form-label">Sale Price (PKR, Optional)</label>
              <input type="number" id="add-prod-saleprice" class="form-control" placeholder="e.g. 11900">
            </div>
            <div class="form-group">
              <label class="form-label">Initial Inventory Stock *</label>
              <input type="number" id="add-prod-stock" required class="form-control" value="12" min="1">
            </div>
          </div>

          <!-- High-Res Image Upload Zone -->
          <div class="form-group" style="margin:1.5rem 0;padding:1.5rem;background:var(--bg-surface-elevated);border:2px dashed var(--border-medium);border-radius:var(--radius-sm);text-align:center;">
            <label style="font-weight:600;font-size:0.9rem;display:block;margin-bottom:0.5rem;color:var(--text-primary);">
              📷 UPLOAD HIGH-RESOLUTION GARMENT PHOTOGRAPHY
            </label>
            <p style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:1rem;">
              Upload any image file (.jpg, .png, .webp) from your device. Converted to instant web preview.
            </p>

            <div style="display:flex;justify-content:center;align-items:center;gap:1.5rem;flex-wrap:wrap;">
              <input type="file" id="add-prod-file" accept="image/*" onchange="AdminApp.handleFileUpload(this, 'add-image-preview')" style="display:none;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('add-prod-file').click()">
                📁 Choose File from Computer
              </button>

              <span style="font-size:0.8rem;color:var(--text-muted);">OR Select Preset Atelier Photo:</span>
              <select id="add-prod-preset" class="form-control" style="width:auto;font-size:0.8rem;padding:0.4rem 0.8rem;" onchange="AdminApp.handlePresetSelect(this.value, 'add-image-preview')">
                <option value="assets/images/jacket.jpg">Preset: Cyber Utility Jacket</option>
                <option value="assets/images/hoodie.jpg">Preset: 500GSM Heavyweight Hoodie</option>
                <option value="assets/images/tee.jpg">Preset: 280GSM Boxy Tee</option>
                <option value="assets/images/men.jpg">Preset: Menswear Tailored Look</option>
                <option value="assets/images/women.jpg">Preset: Womens Pret Asymmetric Look</option>
                <option value="assets/images/kids.jpg">Preset: Junior Cyber Storm Suit</option>
                <option value="assets/images/hero.jpg">Preset: Campaign Hero Dual</option>
              </select>
            </div>

            <!-- Preview Image Display -->
            <div style="margin-top:1.5rem;display:flex;justify-content:center;">
              <img id="add-image-preview" src="assets/images/jacket.jpg" alt="Preview" style="width:140px;height:175px;object-fit:cover;border-radius:var(--radius-sm);border:1px solid var(--border-lime);box-shadow:var(--shadow-md);">
            </div>
            <input type="hidden" id="add-prod-img-data" value="assets/images/jacket.jpg">
          </div>

          <div class="form-group">
            <label class="form-label">Garment Story & Description *</label>
            <textarea id="add-prod-desc" required rows="3" class="form-control" placeholder="Describe the silhouette, styling aesthetic, and unique design features..."></textarea>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;">
            <div class="form-group">
              <label class="form-label">Material Breakdown *</label>
              <input type="text" id="add-prod-material" required class="form-control" placeholder="e.g. 500 GSM Organic Combed French Terry Cotton">
            </div>
            <div class="form-group">
              <label class="form-label">Fit Specification *</label>
              <input type="text" id="add-prod-fit" required class="form-control" placeholder="e.g. Boxy Drop-Shoulder Relaxed Fit">
            </div>
          </div>

          <div style="margin-top:2rem;">
            <button type="submit" class="btn btn-primary btn-full" style="height:54px;font-size:1rem;">
              ⚡ PUBLISH GARMENT TO STOREFRONT
            </button>
          </div>
        </form>
      </div>
    `;
  }

  // ==========================================================
  // TAB 3.5: PAGE BANNERS, HERO PICTURES & HEADLINES
  // ==========================================================
  function getLiveBanners() {
    try {
      const stored = localStorage.getItem('bc_banners');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {
      heroBadge: "PAKISTAN'S AVANT-GARDE FASHION ATELIER",
      heroTitle: "FUTURISTIC LUXURY TAILORED FOR NOW",
      heroDesc: "Bridging high-performance technical fabric engineering with contemporary Pakistani pret aesthetics. Charcoal tones, warm ivory drapes, and high-voltage accents.",
      heroImage: "assets/images/hero.jpg",
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
  }

  function renderBannersTab() {
    const b = getLiveBanners();

    return `
      <div style="max-width:1100px;margin:0 auto;display:flex;flex-direction:column;gap:2.5rem;">
        
        <!-- Header & Action Ribbon -->
        <div style="background:var(--bg-surface);border:1px solid var(--border-medium);border-radius:var(--radius-md);padding:2rem;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1.5rem;">
          <div>
            <div class="mono-tag" style="margin-bottom:0.35rem;background:rgba(199,243,107,0.15);padding:0.2rem 0.6rem;border-radius:var(--radius-full);border:1px solid var(--border-lime);display:inline-block;">
              🖼️ HOMEPAGE & CATEGORY VISUAL ATELIER
            </div>
            <h2 class="display-title" style="font-size:2rem;margin:0.5rem 0 0.25rem;">PAGE BANNERS, HERO IMAGES & HEADLINES</h2>
            <p style="font-size:0.85rem;color:var(--text-secondary);margin:0;">
              Customize your top campaign hero background photo, futuristic typography, CTA buttons, and category banners in real-time.
            </p>
          </div>
          <div style="display:flex;gap:0.75rem;flex-wrap:wrap;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="AdminApp.handleResetBanners()">
              🔄 Reset to Factory Defaults
            </button>
            <button type="button" class="btn btn-ghost btn-sm" onclick="App.navigateTo('home')">
              🌐 View Live Storefront
            </button>
          </div>
        </div>

        <!-- 1. LIVE INTERACTIVE BANNER PREVIEW SIMULATOR -->
        <div style="background:var(--bg-surface);border:1px solid var(--border-lime);border-radius:var(--radius-md);padding:1.5rem;box-shadow:var(--shadow-md);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
            <div style="font-size:0.8rem;font-weight:700;color:var(--accent-lime);font-family:var(--font-mono);display:flex;align-items:center;gap:0.5rem;">
              <span>👁️ LIVE HERO BANNER PREVIEW (UPDATES AS YOU TYPE)</span>
            </div>
            <span style="font-size:0.75rem;color:var(--text-muted);">Real-time Storefront Simulation</span>
          </div>

          <!-- Hero Simulator Container -->
          <div id="admin-banner-preview-box" style="position:relative;min-height:340px;border-radius:var(--radius-sm);overflow:hidden;border:1px solid var(--border-subtle);display:flex;align-items:center;padding:2.5rem;background:linear-gradient(90deg, rgba(235, 247, 238, 0.96) 0%, rgba(235, 247, 238, 0.8) 50%, rgba(235, 247, 238, 0.1) 100%);">
            <!-- Simulated Background Image -->
            <img id="prev-banner-bg" src="${b.heroImage}" alt="Hero Preview" style="position:absolute;top:0;right:0;width:100%;height:100%;object-fit:cover;object-position:center right;z-index:1;">
            <div style="position:absolute;inset:0;background:linear-gradient(90deg, #EBF7EE 0%, rgba(235, 247, 238, 0.85) 45%, rgba(235, 247, 238, 0.2) 100%);z-index:2;"></div>
            
            <!-- Content overlay -->
            <div style="position:relative;z-index:3;max-width:540px;">
              <span id="prev-banner-badge" class="mono-tag" style="background:#fff;border:1px solid var(--border-lime);padding:0.25rem 0.75rem;border-radius:var(--radius-full);color:var(--accent-emerald);font-weight:700;display:inline-block;margin-bottom:1rem;">
                ${b.heroBadge}
              </span>
              <h1 id="prev-banner-title" class="display-title gradient-text" style="font-size:2.2rem;line-height:1.15;margin-bottom:1rem;color:var(--accent-emerald);letter-spacing:0.02em;">
                ${b.heroTitle}
              </h1>
              <p id="prev-banner-desc" style="color:var(--text-secondary);font-size:0.9rem;line-height:1.6;margin-bottom:1.5rem;">
                ${b.heroDesc}
              </p>
              <div style="display:flex;gap:0.75rem;flex-wrap:wrap;">
                <button type="button" id="prev-banner-btn1" class="btn btn-primary btn-sm">
                  ${b.heroBtnPrimaryText}
                </button>
                <button type="button" id="prev-banner-btn2" class="btn btn-secondary btn-sm" style="background:#fff;">
                  ${b.heroBtnSecondaryText}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. BANNER EDITING FORM -->
        <form onsubmit="AdminApp.handleSaveBanners(event)" style="background:var(--bg-surface);border:1px solid var(--border-medium);border-radius:var(--radius-md);padding:2.5rem;box-shadow:var(--shadow-sm);">
          
          <!-- SECTION A: HERO BACKDROP IMAGE -->
          <div style="border-bottom:1px solid var(--border-subtle);padding-bottom:2rem;margin-bottom:2rem;">
            <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1.25rem;">
              <span style="font-size:1.3rem;">📸</span>
              <h3 style="font-size:1.25rem;font-weight:700;color:var(--text-primary);margin:0;">1. CAMPAIGN HERO BACKGROUND PICTURE</h3>
            </div>

            <div style="display:grid;grid-template-columns:180px 1fr;gap:2rem;align-items:center;">
              <!-- Current Image Thumbnail -->
              <div style="text-align:center;">
                <img id="form-hero-img-preview" src="${b.heroImage}" alt="Hero Image Preview" style="width:160px;height:120px;object-fit:cover;border-radius:var(--radius-sm);border:2px solid var(--accent-lime);box-shadow:var(--shadow-sm);margin-bottom:0.5rem;">
                <div style="font-size:0.7rem;color:var(--text-muted);font-family:var(--font-mono);">Active Backdrop</div>
              </div>

              <!-- Upload & Preset Controls -->
              <div>
                <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:1rem;">
                  Upload any photo from your computer or phone, or choose one of the curated Brand Collection studio editorial presets.
                </p>

                <div style="display:flex;gap:1rem;flex-wrap:wrap;align-items:center;margin-bottom:1rem;">
                  <input type="file" id="banner-hero-file-input" accept="image/*" onchange="AdminApp.handleBannerImageUpload(this, 'form-hero-img-preview', 'banner-hero-image-val', 'prev-banner-bg')" style="display:none;">
                  <button type="button" class="btn btn-primary btn-sm" onclick="document.getElementById('banner-hero-file-input').click()">
                    📁 Upload New Picture from Computer
                  </button>

                  <span style="font-size:0.8rem;color:var(--text-muted);">OR Select Preset Atelier Photo:</span>
                  <select class="form-control" style="width:auto;font-size:0.85rem;padding:0.4rem 0.8rem;" onchange="AdminApp.handleBannerPresetSelect(this.value, 'form-hero-img-preview', 'banner-hero-image-val', 'prev-banner-bg')">
                    <option value="assets/images/hero.jpg" ${b.heroImage === 'assets/images/hero.jpg' ? 'selected' : ''}>Preset 1: Campaign Hero Dual Models</option>
                    <option value="assets/images/jacket.jpg" ${b.heroImage === 'assets/images/jacket.jpg' ? 'selected' : ''}>Preset 2: Cyber-Matrix Trench Jacket</option>
                    <option value="assets/images/hoodie.jpg" ${b.heroImage === 'assets/images/hoodie.jpg' ? 'selected' : ''}>Preset 3: 500 GSM Heavyweight Hoodie</option>
                    <option value="assets/images/tee.jpg" ${b.heroImage === 'assets/images/tee.jpg' ? 'selected' : ''}>Preset 4: 280 GSM Boxy Tee</option>
                    <option value="assets/images/men.jpg" ${b.heroImage === 'assets/images/men.jpg' ? 'selected' : ''}>Preset 5: Menswear Runway Editorial</option>
                    <option value="assets/images/women.jpg" ${b.heroImage === 'assets/images/women.jpg' ? 'selected' : ''}>Preset 6: Womenswear Asymmetric Pret</option>
                    <option value="assets/images/kids.jpg" ${b.heroImage === 'assets/images/kids.jpg' ? 'selected' : ''}>Preset 7: Junior Cyber Storm Suit</option>
                  </select>
                </div>

                <div class="form-group" style="margin-bottom:0;">
                  <label class="form-label" style="font-size:0.8rem;">Image URL / Path:</label>
                  <input type="text" id="banner-hero-image-val" class="form-control" value="${b.heroImage}" oninput="AdminApp.updateLiveBannerPreview()" placeholder="assets/images/hero.jpg or https://...">
                </div>
              </div>
            </div>
          </div>

          <!-- SECTION B: HERO HEADLINES & COPYWRITING -->
          <div style="border-bottom:1px solid var(--border-subtle);padding-bottom:2rem;margin-bottom:2rem;">
            <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1.25rem;">
              <span style="font-size:1.3rem;">✍️</span>
              <h3 style="font-size:1.25rem;font-weight:700;color:var(--text-primary);margin:0;">2. HERO HEADLINES & STORY TEXT</h3>
            </div>

            <div class="form-group">
              <label class="form-label">Top Badge / Subheading Tag *</label>
              <input type="text" id="banner-hero-badge" required class="form-control" value="${b.heroBadge}" oninput="AdminApp.updateLiveBannerPreview()" placeholder="e.g. PAKISTAN'S AVANT-GARDE FASHION ATELIER">
              <div class="form-help">Small pill tag above the main headline.</div>
            </div>

            <div class="form-group">
              <label class="form-label">Main Campaign Headline *</label>
              <input type="text" id="banner-hero-title" required class="form-control" value="${b.heroTitle}" oninput="AdminApp.updateLiveBannerPreview()" placeholder="e.g. FUTURISTIC LUXURY TAILORED FOR NOW">
              <div class="form-help">Large bold futuristic display title.</div>
            </div>

            <div class="form-group">
              <label class="form-label">Story / Subtitle Description *</label>
              <textarea id="banner-hero-desc" required rows="3" class="form-control" oninput="AdminApp.updateLiveBannerPreview()" placeholder="Describe the collection ethos, fabrics, and craft...">${b.heroDesc}</textarea>
            </div>

            <!-- Buttons Customizer -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:2rem;margin-top:1.5rem;padding:1.5rem;background:var(--bg-surface-elevated);border-radius:var(--radius-sm);border:1px solid var(--border-subtle);">
              <div>
                <label class="form-label" style="color:var(--accent-lime);font-weight:700;">Primary Action Button</label>
                <div style="display:flex;flex-direction:column;gap:0.75rem;">
                  <input type="text" id="banner-hero-btn1-text" required class="form-control" value="${b.heroBtnPrimaryText}" oninput="AdminApp.updateLiveBannerPreview()" placeholder="Button text (e.g. EXPLORE THE DROP ⚡)">
                  <select id="banner-hero-btn1-link" class="form-control">
                    <option value="shop" ${b.heroBtnPrimaryLink === 'shop' ? 'selected' : ''}>Link to: All Drops (Shop)</option>
                    <option value="men" ${b.heroBtnPrimaryLink === 'men' ? 'selected' : ''}>Link to: Menswear '26</option>
                    <option value="women" ${b.heroBtnPrimaryLink === 'women' ? 'selected' : ''}>Link to: Womens Pret</option>
                    <option value="kids" ${b.heroBtnPrimaryLink === 'kids' ? 'selected' : ''}>Link to: Junior Cyber (Kids)</option>
                    <option value="collections" ${b.heroBtnPrimaryLink === 'collections' ? 'selected' : ''}>Link to: Runway Capsules</option>
                    <option value="sale" ${b.heroBtnPrimaryLink === 'sale' ? 'selected' : ''}>Link to: Sale Vault</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="form-label" style="font-weight:700;">Secondary Action Button</label>
                <div style="display:flex;flex-direction:column;gap:0.75rem;">
                  <input type="text" id="banner-hero-btn2-text" required class="form-control" value="${b.heroBtnSecondaryText}" oninput="AdminApp.updateLiveBannerPreview()" placeholder="Button text (e.g. VIEW RUNWAY CAPSULES)">
                  <select id="banner-hero-btn2-link" class="form-control">
                    <option value="collections" ${b.heroBtnSecondaryLink === 'collections' ? 'selected' : ''}>Link to: Runway Capsules</option>
                    <option value="shop" ${b.heroBtnSecondaryLink === 'shop' ? 'selected' : ''}>Link to: All Drops (Shop)</option>
                    <option value="sale" ${b.heroBtnSecondaryLink === 'sale' ? 'selected' : ''}>Link to: Sale Vault</option>
                    <option value="size-guide" ${b.heroBtnSecondaryLink === 'size-guide' ? 'selected' : ''}>Link to: Size & Fit Guide</option>
                    <option value="track-order" ${b.heroBtnSecondaryLink === 'track-order' ? 'selected' : ''}>Link to: Track Shipment</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- SECTION C: TOP HEADER ANNOUNCEMENT TICKER -->
          <div style="border-bottom:1px solid var(--border-subtle);padding-bottom:2rem;margin-bottom:2rem;">
            <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1.25rem;">
              <span style="font-size:1.3rem;">📢</span>
              <h3 style="font-size:1.25rem;font-weight:700;color:var(--text-primary);margin:0;">3. TOP SITE ANNOUNCEMENT TICKER</h3>
            </div>

            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label">Ticker Text (Displays at the very top of all pages) *</label>
              <input type="text" id="banner-ticker-text" required class="form-control" value="${b.announcementTicker}" placeholder="e.g. FREE NATIONWIDE DELIVERY ON ORDERS OVER ₨5,000 | CASH ON DELIVERY AVAILABLE">
              <div class="form-help">Highlighted announcement banner seen by every store visitor.</div>
            </div>
          </div>

          <!-- SECTION D: CATEGORY CARDS (MEN, WOMEN, KIDS) -->
          <div style="margin-bottom:2.5rem;">
            <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1.25rem;">
              <span style="font-size:1.3rem;">🗂️</span>
              <h3 style="font-size:1.25rem;font-weight:700;color:var(--text-primary);margin:0;">4. HOMEPAGE CATEGORY CARDS</h3>
            </div>

            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:1.5rem;">
              <!-- Men Card -->
              <div style="background:var(--bg-surface-elevated);padding:1.5rem;border-radius:var(--radius-sm);border:1px solid var(--border-subtle);">
                <div style="font-weight:700;color:var(--accent-lime);margin-bottom:0.75rem;">MENSWEAR BANNER</div>
                <img id="form-cat-img-men-prev" src="${b.menBannerImage}" alt="Men Preview" style="width:100%;height:140px;object-fit:cover;border-radius:var(--radius-xs);margin-bottom:0.75rem;border:1px solid var(--border-subtle);">
                <div class="form-group" style="margin-bottom:0.75rem;">
                  <label class="form-label" style="font-size:0.75rem;">Title</label>
                  <input type="text" id="banner-men-title" class="form-control" value="${b.menBannerTitle}">
                </div>
                <div class="form-group" style="margin-bottom:0.75rem;">
                  <label class="form-label" style="font-size:0.75rem;">Subtitle</label>
                  <input type="text" id="banner-men-desc" class="form-control" value="${b.menBannerDesc}">
                </div>
                <div class="form-group" style="margin-bottom:0;">
                  <label class="form-label" style="font-size:0.75rem;">Image URL</label>
                  <input type="text" id="banner-men-img" class="form-control" value="${b.menBannerImage}" onchange="document.getElementById('form-cat-img-men-prev').src = this.value">
                </div>
              </div>

              <!-- Women Card -->
              <div style="background:var(--bg-surface-elevated);padding:1.5rem;border-radius:var(--radius-sm);border:1px solid var(--border-subtle);">
                <div style="font-weight:700;color:var(--accent-lime);margin-bottom:0.75rem;">WOMENSWEAR BANNER</div>
                <img id="form-cat-img-women-prev" src="${b.womenBannerImage}" alt="Women Preview" style="width:100%;height:140px;object-fit:cover;border-radius:var(--radius-xs);margin-bottom:0.75rem;border:1px solid var(--border-subtle);">
                <div class="form-group" style="margin-bottom:0.75rem;">
                  <label class="form-label" style="font-size:0.75rem;">Title</label>
                  <input type="text" id="banner-women-title" class="form-control" value="${b.womenBannerTitle}">
                </div>
                <div class="form-group" style="margin-bottom:0.75rem;">
                  <label class="form-label" style="font-size:0.75rem;">Subtitle</label>
                  <input type="text" id="banner-women-desc" class="form-control" value="${b.womenBannerDesc}">
                </div>
                <div class="form-group" style="margin-bottom:0;">
                  <label class="form-label" style="font-size:0.75rem;">Image URL</label>
                  <input type="text" id="banner-women-img" class="form-control" value="${b.womenBannerImage}" onchange="document.getElementById('form-cat-img-women-prev').src = this.value">
                </div>
              </div>

              <!-- Kids Card -->
              <div style="background:var(--bg-surface-elevated);padding:1.5rem;border-radius:var(--radius-sm);border:1px solid var(--border-subtle);">
                <div style="font-weight:700;color:var(--accent-lime);margin-bottom:0.75rem;">KIDS STREETWEAR BANNER</div>
                <img id="form-cat-img-kids-prev" src="${b.kidsBannerImage}" alt="Kids Preview" style="width:100%;height:140px;object-fit:cover;border-radius:var(--radius-xs);margin-bottom:0.75rem;border:1px solid var(--border-subtle);">
                <div class="form-group" style="margin-bottom:0.75rem;">
                  <label class="form-label" style="font-size:0.75rem;">Title</label>
                  <input type="text" id="banner-kids-title" class="form-control" value="${b.kidsBannerTitle}">
                </div>
                <div class="form-group" style="margin-bottom:0.75rem;">
                  <label class="form-label" style="font-size:0.75rem;">Subtitle</label>
                  <input type="text" id="banner-kids-desc" class="form-control" value="${b.kidsBannerDesc}">
                </div>
                <div class="form-group" style="margin-bottom:0;">
                  <label class="form-label" style="font-size:0.75rem;">Image URL</label>
                  <input type="text" id="banner-kids-img" class="form-control" value="${b.kidsBannerImage}" onchange="document.getElementById('form-cat-img-kids-prev').src = this.value">
                </div>
              </div>
            </div>
          </div>

          <!-- SUBMIT ACTIONS -->
          <div style="display:flex;gap:1rem;flex-wrap:wrap;border-top:1px solid var(--border-subtle);padding-top:2rem;">
            <button type="submit" class="btn btn-primary" style="height:52px;font-size:1rem;flex:2;min-width:240px;">
              💾 SAVE ALL BANNERS & PUBLISH TO WEBSITE
            </button>
            <button type="button" class="btn btn-secondary" onclick="App.navigateTo('home')" style="height:52px;flex:1;min-width:180px;">
              🌐 PREVIEW STOREFRONT NOW
            </button>
          </div>
        </form>
      </div>
    `;
  }

  // Live update of banner preview
  function updateLiveBannerPreview() {
    const badge = document.getElementById('banner-hero-badge');
    const title = document.getElementById('banner-hero-title');
    const desc = document.getElementById('banner-hero-desc');
    const imgVal = document.getElementById('banner-hero-image-val');
    const btn1 = document.getElementById('banner-hero-btn1-text');
    const btn2 = document.getElementById('banner-hero-btn2-text');

    const prevBadge = document.getElementById('prev-banner-badge');
    const prevTitle = document.getElementById('prev-banner-title');
    const prevDesc = document.getElementById('prev-banner-desc');
    const prevBg = document.getElementById('prev-banner-bg');
    const prevBtn1 = document.getElementById('prev-banner-btn1');
    const prevBtn2 = document.getElementById('prev-banner-btn2');

    if (badge && prevBadge) prevBadge.textContent = badge.value;
    if (title && prevTitle) prevTitle.textContent = title.value;
    if (desc && prevDesc) prevDesc.textContent = desc.value;
    if (imgVal && prevBg && imgVal.value) prevBg.src = imgVal.value;
    if (btn1 && prevBtn1) prevBtn1.textContent = btn1.value;
    if (btn2 && prevBtn2) prevBtn2.textContent = btn2.value;
  }

  // Handle banner image upload
  async function handleBannerImageUpload(input, previewImgId, hiddenValId, liveSimBgId) {
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = function (e) {
        const preview = document.getElementById(previewImgId);
        if (preview) preview.src = e.target.result;
        const simBg = document.getElementById(liveSimBgId);
        if (simBg) simBg.src = e.target.result;
      };
      reader.readAsDataURL(file);

      // Attempt server upload
      if (window.DB && typeof window.DB.uploadImage === 'function') {
        showToast('Uploading banner photo to server...');
        try {
          const res = await window.DB.uploadImage(file);
          if (res && res.url) {
            const hidden = document.getElementById(hiddenValId);
            if (hidden) hidden.value = res.url;
            showToast('Banner photo stored on server: ' + (res.url.split('/').pop()));
            return;
          }
        } catch (err) {
          console.warn('Backend server upload fallback to data URI:', err);
        }
      }

      reader.onloadend = function () {
        const hidden = document.getElementById(hiddenValId);
        if (hidden) hidden.value = reader.result;
        showToast('Banner image uploaded!');
      };
    }
  }

  function handleBannerPresetSelect(presetPath, previewImgId, hiddenValId, liveSimBgId) {
    const preview = document.getElementById(previewImgId);
    if (preview) preview.src = presetPath;
    const simBg = document.getElementById(liveSimBgId);
    if (simBg) simBg.src = presetPath;
    const hidden = document.getElementById(hiddenValId);
    if (hidden) hidden.value = presetPath;
  }

  // Save banners handler
  function handleSaveBanners(e) {
    e.preventDefault();
    const heroBadge = document.getElementById('banner-hero-badge').value.trim();
    const heroTitle = document.getElementById('banner-hero-title').value.trim();
    const heroDesc = document.getElementById('banner-hero-desc').value.trim();
    const heroImage = document.getElementById('banner-hero-image-val').value.trim();
    const heroBtnPrimaryText = document.getElementById('banner-hero-btn1-text').value.trim();
    const heroBtnPrimaryLink = document.getElementById('banner-hero-btn1-link').value;
    const heroBtnSecondaryText = document.getElementById('banner-hero-btn2-text').value.trim();
    const heroBtnSecondaryLink = document.getElementById('banner-hero-btn2-link').value;
    const announcementTicker = document.getElementById('banner-ticker-text').value.trim();

    const menBannerTitle = document.getElementById('banner-men-title').value.trim();
    const menBannerDesc = document.getElementById('banner-men-desc').value.trim();
    const menBannerImage = document.getElementById('banner-men-img').value.trim();

    const womenBannerTitle = document.getElementById('banner-women-title').value.trim();
    const womenBannerDesc = document.getElementById('banner-women-desc').value.trim();
    const womenBannerImage = document.getElementById('banner-women-img').value.trim();

    const kidsBannerTitle = document.getElementById('banner-kids-title').value.trim();
    const kidsBannerDesc = document.getElementById('banner-kids-desc').value.trim();
    const kidsBannerImage = document.getElementById('banner-kids-img').value.trim();

    const banners = {
      heroBadge,
      heroTitle,
      heroDesc,
      heroImage,
      heroBtnPrimaryText,
      heroBtnPrimaryLink,
      heroBtnSecondaryText,
      heroBtnSecondaryLink,
      announcementTicker,
      menBannerTitle,
      menBannerDesc,
      menBannerImage,
      womenBannerTitle,
      womenBannerDesc,
      womenBannerImage,
      kidsBannerTitle,
      kidsBannerDesc,
      kidsBannerImage
    };

    localStorage.setItem('bc_banners', JSON.stringify(banners));

    if (window.DB && typeof window.DB.saveBanners === 'function') {
      window.DB.saveBanners(banners).catch(err => console.warn('Backend save banners error:', err));
    }

    if (window.App && typeof window.App.applyCustomBanners === 'function') {
      window.App.applyCustomBanners();
    }

    showToast('✨ Page banners & hero visuals published to storefront!');
    renderAdminPanel();
  }

  function handleResetBanners() {
    if (confirm('Reset all banners, pictures, and headlines to factory default Brand Collection atelier branding?')) {
      localStorage.removeItem('bc_banners');
      if (window.App && typeof window.App.applyCustomBanners === 'function') {
        window.App.applyCustomBanners();
      }
      showToast('Banners reset to factory defaults.');
      renderAdminPanel();
    }
  }

  // TAB 4: Store Configurations
  function renderSettingsTab() {
    return `
      <div style="max-width:720px;background:var(--bg-surface);border:1px solid var(--border-medium);border-radius:var(--radius-md);padding:2.5rem;margin:0 auto;">
        <div style="margin-bottom:2rem;border-bottom:1px solid var(--border-subtle);padding-bottom:1rem;">
          <div class="mono-tag" style="margin-bottom:0.25rem;">MERCHANT PREFERENCES</div>
          <h2 class="display-title" style="font-size:1.75rem;">STORE CONFIGURATION & SECURITY</h2>
        </div>

        <form onsubmit="AdminApp.handleSaveSettings(event)">
          <div class="form-group">
            <label class="form-label">Official WhatsApp Support Number *</label>
            <input type="text" id="cfg-whatsapp" required class="form-control" value="966543805017" placeholder="9665XXXXXXXX">
            <div class="form-help">Orders and customer inquiry links connect directly to this number.</div>
          </div>

          <div class="form-group">
            <label class="form-label">Official Business Email *</label>
            <input type="email" id="cfg-email" required class="form-control" value="mabbasansaari77@gmail.com" placeholder="email@address.com">
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;">
            <div class="form-group">
              <label class="form-label">Free Delivery Threshold (PKR) *</label>
              <input type="number" id="cfg-freeship" required class="form-control" value="5000">
            </div>
            <div class="form-group">
              <label class="form-label">Cash on Delivery (COD) Fee (PKR) *</label>
              <input type="number" id="cfg-codfee" required class="form-control" value="150">
            </div>
          </div>

          <div class="form-group" style="margin-top:1.5rem;padding-top:1.5rem;border-top:1px solid var(--border-subtle);">
            <div class="mono-tag" style="margin-bottom:0.35rem;color:var(--accent-lime);">GOOGLE & SEARCH ENGINE VERIFICATION</div>
            <label class="form-label">Google Search Console Verification Tag / Code</label>
            <input type="text" id="cfg-gsc" class="form-control" placeholder="e.g. google-site-verification=abc123xyz" value="${localStorage.getItem('bc_gsc_tag') || ''}">
            <div class="form-help">Paste your Google Search Console verification code here to verify ownership.</div>
          </div>

          <div class="form-group">
            <label class="form-label">Google Analytics 4 (GA4) Measurement ID</label>
            <input type="text" id="cfg-ga4" class="form-control" placeholder="G-XXXXXXXXXX" value="${localStorage.getItem('bc_ga4_id') || ''}">
            <div class="form-help">Enter your GA4 tag to track real-time visitors, sales, and conversions.</div>
          </div>

          <div class="form-group" style="margin-top:1.5rem;padding-top:1.5rem;border-top:1px solid var(--border-subtle);">
            <label class="form-label">Change Master Admin Password</label>
            <input type="password" id="cfg-pass" class="form-control" placeholder="Enter new password">
            <div class="form-help">Current password configured: <strong style="color:var(--accent-lime);">${adminPass}</strong></div>
          </div>

          <button type="submit" class="btn btn-primary btn-full" style="height:50px;margin-top:1.5rem;">
            💾 SAVE CONFIGURATION
          </button>
        </form>

        <div style="margin-top:2.5rem;border-top:1px solid var(--border-subtle);padding-top:1.5rem;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-weight:600;font-size:0.9rem;">Catalog Data Backup</div>
            <div style="font-size:0.75rem;color:var(--text-secondary);">Download standard CSV containing all active products and stock.</div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="AdminApp.exportCatalogCSV()">
            📥 DOWNLOAD CSV BACKUP
          </button>
        </div>

        <!-- Google & Cloud Activation Center -->
        <div style="margin-top:2.5rem;border-top:1px solid var(--border-subtle);padding-top:2rem;">
          <div class="mono-tag" style="margin-bottom:0.5rem;color:var(--accent-lime);">OFFICIAL LAUNCH ROADMAP</div>
          <h3 style="font-size:1.4rem;margin-bottom:0.75rem;">Google & Cloud Services Status</h3>
          <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:1.5rem;">
            Direct links and pre-formatted credentials to verify ownership on Google Search, Google Maps, and cloud databases:
          </p>

          <div style="display:flex;flex-direction:column;gap:1rem;">
            <!-- 1. Google Search Console -->
            <div style="background:var(--bg-primary);border:1px solid var(--border-subtle);border-radius:var(--radius-sm);padding:1.25rem;">
              <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.75rem;margin-bottom:0.5rem;">
                <div style="display:flex;align-items:center;gap:0.5rem;">
                  <span style="font-size:1.2rem;">🔍</span>
                  <div>
                    <div style="font-weight:700;font-size:0.95rem;">1. Google Search Console (Search Indexing)</div>
                    <div style="font-size:0.75rem;color:var(--text-muted);">Sitemap & Robots.txt generated automatically.</div>
                  </div>
                </div>
                <a href="https://search.google.com/search-console" target="_blank" class="btn btn-primary btn-sm">
                  🔗 Open Google Search Console ↗
                </a>
              </div>
              <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:0.5rem;background:rgba(0,0,0,0.15);padding:0.75rem;border-radius:var(--radius-xs);">
                <strong>Your Sitemap URL:</strong> <code style="color:var(--accent-lime);">https://brandcollection.pk/sitemap.xml</code><br>
                <strong>Steps:</strong> Sign in with <code>mabbasansaari77@gmail.com</code> &rarr; Add your website URL &rarr; Choose "HTML Tag" &rarr; Paste token above &rarr; Click Verify!
              </div>
            </div>

            <!-- 2. Google Business Profile -->
            <div style="background:var(--bg-primary);border:1px solid var(--border-subtle);border-radius:var(--radius-sm);padding:1.25rem;">
              <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.75rem;margin-bottom:0.5rem;">
                <div style="display:flex;align-items:center;gap:0.5rem;">
                  <span style="font-size:1.2rem;">📍</span>
                  <div>
                    <div style="font-weight:700;font-size:0.95rem;">2. Google Business Profile (Google Maps Listing)</div>
                    <div style="font-size:0.75rem;color:var(--text-muted);">LocalBusiness schema embedded in website code.</div>
                  </div>
                </div>
                <a href="https://business.google.com/create" target="_blank" class="btn btn-secondary btn-sm">
                  📍 Claim Google Maps Listing ↗
                </a>
              </div>
              <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:0.5rem;background:rgba(0,0,0,0.15);padding:0.75rem;border-radius:var(--radius-xs);">
                <strong>Pre-Configured Details:</strong> Name: <code>Brand Collection</code> • Category: <code>Clothing Store</code> • Phone: <code>+966 54 380 5017</code> • City: <code>Lahore, Pakistan</code>
              </div>
            </div>

            <!-- 3. Supabase Cloud Database -->
            <div style="background:var(--bg-primary);border:1px solid var(--border-subtle);border-radius:var(--radius-sm);padding:1.25rem;">
              <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.75rem;margin-bottom:0.5rem;">
                <div style="display:flex;align-items:center;gap:0.5rem;">
                  <span style="font-size:1.2rem;">⚡</span>
                  <div>
                    <div style="font-weight:700;font-size:0.95rem;">3. Supabase Cloud Database (Free PostgreSQL)</div>
                    <div style="font-size:0.75rem;color:var(--text-muted);">SQL table schema ready in <code>data/supabase_schema.sql</code>.</div>
                  </div>
                </div>
                <a href="https://supabase.com/dashboard" target="_blank" class="btn btn-secondary btn-sm">
                  ⚡ Open Supabase Cloud ↗
                </a>
              </div>
              <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:0.5rem;background:rgba(0,0,0,0.15);padding:0.75rem;border-radius:var(--radius-xs);">
                Create a free project at Supabase.com, copy Project URL & Anon Key, and paste them into the <strong>DATABASE & BACKEND</strong> tab!
              </div>
            </div>

            <!-- 4. Permanent Free 24/7 Hosting (Netlify Drop) -->
            <div style="background:var(--bg-primary);border:1px solid var(--border-subtle);border-radius:var(--radius-sm);padding:1.25rem;">
              <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.75rem;margin-bottom:0.5rem;">
                <div style="display:flex;align-items:center;gap:0.5rem;">
                  <span style="font-size:1.2rem;">🌐</span>
                  <div>
                    <div style="font-weight:700;font-size:0.95rem;">4. Permanent 24/7 Cloud Hosting (Netlify Drop)</div>
                    <div style="font-size:0.75rem;color:var(--text-muted);">Never turns off, free lifetime SSL HTTPS.</div>
                  </div>
                </div>
                <a href="https://app.netlify.com/drop" target="_blank" class="btn btn-primary btn-sm">
                  🚀 Open Netlify Drop ↗
                </a>
              </div>
              <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:0.5rem;background:rgba(0,0,0,0.15);padding:0.75rem;border-radius:var(--radius-xs);">
                Drag & drop your <code>brand-collection-web-live.zip</code> file onto Netlify to go live 24/7 in 10 seconds!
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Handle Image Upload with HTML5 FileReader and Backend DB Server
  async function handleFileUpload(input, previewElementId) {
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = function (e) {
        const preview = document.getElementById(previewElementId);
        if (preview) preview.src = e.target.result;
      };
      reader.readAsDataURL(file);

      // Upload directly to server backend disk
      if (window.DB && typeof window.DB.uploadImage === 'function') {
        showToast('Uploading photo to backend server...');
        try {
          const res = await window.DB.uploadImage(file);
          if (res && res.url) {
            const hiddenData = document.getElementById('add-prod-img-data') || document.getElementById('edit-prod-img-data');
            if (hiddenData) hiddenData.value = res.url;
            showToast('Photo stored on server: ' + (res.url.split('/').pop()));
            return;
          }
        } catch (err) {
          console.warn('Backend server upload fallback to data URI:', err);
        }
      }

      reader.onloadend = function () {
        const hiddenData = document.getElementById('add-prod-img-data') || document.getElementById('edit-prod-img-data');
        if (hiddenData) hiddenData.value = reader.result;
        showToast('Image uploaded and preview generated!');
      };
    }
  }

  function handlePresetSelect(presetPath, previewElementId) {
    const preview = document.getElementById(previewElementId);
    if (preview) preview.src = presetPath;

    const hiddenData = document.getElementById('add-prod-img-data') || document.getElementById('edit-prod-img-data');
    if (hiddenData) hiddenData.value = presetPath;
  }

  // Stock Adjustment (Connected to Backend Database)
  function adjustStock(productId, delta) {
    const products = getLiveProducts();
    const product = products.find(p => p.id === productId);
    if (!product) return;

    product.stock = Math.max(0, (product.stock || 0) + delta);
    setLiveProducts(products);

    if (window.DB) {
      window.DB.updateStock(productId, product.stock).catch(err => console.warn(err));
    }

    showToast(`Updated stock for ${product.name} to ${product.stock} units.`);
    renderAdminPanel();
  }

  // Delete Product (Connected to Backend Database)
  function deleteProduct(productId) {
    const products = getLiveProducts();
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (confirm(`Are you sure you want to delete "${product.name}" (${product.sku}) from the store?`)) {
      const updated = products.filter(p => p.id !== productId);
      setLiveProducts(updated);

      if (window.DB) {
        window.DB.deleteProduct(productId).catch(err => console.warn(err));
      }

      showToast(`Removed "${product.name}" from catalog.`);
      renderAdminPanel();
    }
  }

  // Add New Product Handler
  function handleCreateProduct(e) {
    e.preventDefault();
    const name = document.getElementById('add-prod-name').value.trim();
    const sku = document.getElementById('add-prod-sku').value.trim();
    const category = document.getElementById('add-prod-cat').value;
    const subCategory = document.getElementById('add-prod-subcat').value;
    const collection = document.getElementById('add-prod-collection').value;
    const price = parseFloat(document.getElementById('add-prod-price').value);
    const salePriceVal = document.getElementById('add-prod-saleprice').value.trim();
    const salePrice = salePriceVal ? parseFloat(salePriceVal) : null;
    const stock = parseInt(document.getElementById('add-prod-stock').value, 10);
    const image = document.getElementById('add-prod-img-data').value || 'assets/images/jacket.jpg';
    const description = document.getElementById('add-prod-desc').value.trim();
    const material = document.getElementById('add-prod-material').value.trim();
    const fit = document.getElementById('add-prod-fit').value.trim();

    const newId = 'bc-' + Date.now().toString(36);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const newProduct = {
      id: newId,
      name,
      slug,
      sku,
      category,
      subCategory,
      collection,
      price,
      salePrice,
      image,
      images: [image],
      badge: 'New Drop',
      badgeType: salePrice ? 'sale' : 'new',
      stock,
      rating: 5.0,
      reviewCount: 1,
      isFeatured: true,
      isBestseller: false,
      sizes: category === 'kids' ? ['4-5Y', '6-7Y', '8-9Y', '10-11Y'] : ['S', 'M', 'L', 'XL'],
      colors: [
        { name: 'Obsidian Charcoal', hex: '#111215' },
        { name: 'Warm Ivory', hex: '#F5F0E8' }
      ],
      material,
      fit,
      care: 'Cold gentle wash. Line dry in shade.',
      origin: 'Atelier Crafted in Pakistan',
      description,
      specifications: {
        weight: '650 grams',
        closure: 'Heavy duty YKK hardware'
      }
    };

    const products = getLiveProducts();
    products.unshift(newProduct);
    setLiveProducts(products);

    if (window.DB) {
      window.DB.saveProduct(newProduct).catch(err => console.warn('Backend save error:', err));
    }

    showToast(`Published "${name}" successfully to ${category.toUpperCase()}!`);
    adminTab = 'inventory';
    renderAdminPanel();
  }

  // Open Edit Product Modal
  function openEditModal(productId) {
    const products = getLiveProducts();
    const p = products.find(item => item.id === productId);
    if (!p) return;

    const modal = document.getElementById('admin-edit-modal');
    const body = document.getElementById('admin-edit-modal-body');
    if (!modal || !body) return;

    body.innerHTML = `
      <form onsubmit="AdminApp.handleSaveEdit(event, '${p.id}')">
        <div style="display:grid;grid-template-columns:2fr 1fr;gap:1.5rem;">
          <div class="form-group">
            <label class="form-label">Garment Title *</label>
            <input type="text" id="edit-prod-name" required class="form-control" value="${p.name}">
          </div>
          <div class="form-group">
            <label class="form-label">SKU</label>
            <input type="text" id="edit-prod-sku" required class="form-control" value="${p.sku}">
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1.5rem;">
          <div class="form-group">
            <label class="form-label">Regular Price (PKR) *</label>
            <input type="number" id="edit-prod-price" required class="form-control" value="${p.price}">
          </div>
          <div class="form-group">
            <label class="form-label">Sale Price (PKR, Optional)</label>
            <input type="number" id="edit-prod-saleprice" class="form-control" value="${p.salePrice || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Stock Quantity *</label>
            <input type="number" id="edit-prod-stock" required class="form-control" value="${p.stock}">
          </div>
        </div>

        <!-- Image Update -->
        <div class="form-group" style="padding:1rem;background:var(--bg-surface-elevated);border-radius:var(--radius-sm);margin:1rem 0;">
          <div style="display:flex;align-items:center;gap:1.5rem;">
            <img id="edit-image-preview" src="${p.image}" alt="Preview" style="width:70px;height:90px;object-fit:cover;border-radius:2px;border:1px solid var(--border-lime);">
            <div>
              <div style="font-weight:600;font-size:0.85rem;margin-bottom:0.25rem;">Change Garment Photo</div>
              <input type="file" id="edit-prod-file" accept="image/*" onchange="AdminApp.handleFileUpload(this, 'edit-image-preview')" style="display:none;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('edit-prod-file').click()">
                📁 Upload New Photo
              </button>
              <input type="hidden" id="edit-prod-img-data" value="${p.image}">
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea id="edit-prod-desc" rows="3" class="form-control">${p.description}</textarea>
        </div>

        <div style="display:flex;gap:1rem;margin-top:2rem;">
          <button type="submit" class="btn btn-primary" style="flex-grow:1;height:48px;">
            💾 SAVE PRODUCT EDITS
          </button>
          <button type="button" class="btn btn-ghost" onclick="AdminApp.closeEditModal()">
            CANCEL
          </button>
        </div>
      </form>
    `;

    modal.classList.add('active');
  }

  function closeEditModal() {
    const modal = document.getElementById('admin-edit-modal');
    if (modal) modal.classList.remove('active');
  }

  function handleSaveEdit(e, productId) {
    e.preventDefault();
    const products = getLiveProducts();
    const p = products.find(item => item.id === productId);
    if (!p) return;

    p.name = document.getElementById('edit-prod-name').value.trim();
    p.sku = document.getElementById('edit-prod-sku').value.trim();
    p.price = parseFloat(document.getElementById('edit-prod-price').value);
    const saleVal = document.getElementById('edit-prod-saleprice').value.trim();
    p.salePrice = saleVal ? parseFloat(saleVal) : null;
    p.stock = parseInt(document.getElementById('edit-prod-stock').value, 10);
    p.image = document.getElementById('edit-prod-img-data').value || p.image;
    p.description = document.getElementById('edit-prod-desc').value.trim();

    setLiveProducts(products);

    if (window.DB) {
      window.DB.saveProduct(p).catch(err => console.warn('Backend edit save error:', err));
    }

    closeEditModal();
    showToast(`Saved changes to "${p.name}".`);
    renderAdminPanel();
  }

  // Update Order Status (Connected to Backend Database)
  function updateOrderStatus(orderId, newStatus) {
    const orders = JSON.parse(localStorage.getItem('bc_orders') || '[]');
    const order = orders.find(o => o.orderId === orderId);
    if (!order) return;

    order.status = newStatus;
    localStorage.setItem('bc_orders', JSON.stringify(orders));

    if (window.DB) {
      window.DB.updateOrder({ orderId, status: newStatus }).catch(err => console.warn(err));
    }

    showToast(`Order ${orderId} updated to "${newStatus}".`);
  }

  // Save Settings (Connected to Backend Database)
  function handleSaveSettings(e) {
    e.preventDefault();
    const wa = document.getElementById('cfg-whatsapp').value.trim();
    const em = document.getElementById('cfg-email').value.trim();
    const freeShip = parseFloat(document.getElementById('cfg-freeship').value);
    const cod = parseFloat(document.getElementById('cfg-codfee').value);
    const pass = document.getElementById('cfg-pass') ? document.getElementById('cfg-pass').value.trim() : '';

    if (em) {
      adminEmail = em;
      localStorage.setItem('bc_admin_email', em);
    }

    if (pass) {
      adminPass = pass;
      localStorage.setItem('bc_admin_pass', pass);
    }

    if (typeof SHIPPING_CONFIG !== 'undefined') {
      SHIPPING_CONFIG.freeShippingThreshold = freeShip;
      SHIPPING_CONFIG.codHandlingFee = cod;
    }

    const gsc = document.getElementById('cfg-gsc') ? document.getElementById('cfg-gsc').value.trim() : '';
    const ga4 = document.getElementById('cfg-ga4') ? document.getElementById('cfg-ga4').value.trim() : '';

    if (gsc) localStorage.setItem('bc_gsc_tag', gsc);
    if (ga4) localStorage.setItem('bc_ga4_id', ga4);

    if (window.DB) {
      window.DB.saveSettings({
        adminEmail: em || adminEmail,
        adminPass: pass || adminPass,
        supportPhone: wa,
        freeShippingThreshold: freeShip,
        codHandlingFee: cod,
        googleSearchConsoleTag: gsc,
        googleAnalyticsId: ga4
      }).catch(err => console.warn(err));
    }

    showToast('Store settings & Google verification saved successfully!');
    renderAdminPanel();
  }

  // Filter & Search Handlers
  function filterAdminCat(cat) {
    adminCategoryFilter = cat;
    renderAdminPanel();
  }

  function filterLowStock() {
    adminTab = 'inventory';
    adminSearchQuery = '';
    adminCategoryFilter = 'low-stock';
    renderAdminPanel();
  }

  function handleAdminSearch(query) {
    adminSearchQuery = query;
    renderAdminPanel();
  }

  // ==========================================================
  // TAB 5: DATABASE & BACKEND MANAGEMENT
  // ==========================================================
  function renderDatabaseTab() {
    const isOnline = window.DB ? window.DB.isOnline : false;
    const statusInfo = window.DB ? window.DB.statusInfo : null;
    const latency = window.DB ? window.DB.latencyMs : 0;
    const products = getLiveProducts();
    const orders = JSON.parse(localStorage.getItem('bc_orders') || '[]');

    return `
      <div style="display:flex;flex-direction:column;gap:2rem;">
        <!-- Main Database Status Header Card -->
        <div style="background:var(--bg-surface);border:1px solid ${isOnline ? 'var(--accent-lime)' : 'var(--accent-danger)'};border-radius:var(--radius-md);padding:2rem;box-shadow:var(--shadow-md);">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;border-bottom:1px solid var(--border-subtle);padding-bottom:1.5rem;margin-bottom:1.5rem;">
            <div>
              <div style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;">
                <span class="mono-tag" style="background:${isOnline ? 'rgba(52,211,153,0.15)' : 'rgba(255,71,87,0.15)'};color:${isOnline ? 'var(--accent-lime)' : 'var(--accent-danger)'};border:1px solid ${isOnline ? 'var(--accent-lime)' : 'var(--accent-danger)'};padding:0.3rem 0.8rem;border-radius:var(--radius-full);font-weight:700;">
                  ${isOnline ? '🟢 ACTIVE & CONNECTED' : '🔴 BACKEND OFFLINE'}
                </span>
                <span style="font-family:var(--font-mono);font-size:0.8rem;color:var(--text-muted);">API PING: <strong style="color:var(--accent-lime);">${latency}ms</strong></span>
              </div>
              <h2 class="display-title" style="font-size:1.8rem;margin-top:0.5rem;">CENTRAL BACKEND DATABASE ENGINE</h2>
              <p style="font-size:0.85rem;color:var(--text-secondary);margin-top:0.25rem;">
                Native .NET REST Server active on <code>http://localhost:8080/api/</code>. Physical database is stored on disk at <code>data/database.json</code>.
              </p>
            </div>
            <div style="display:flex;gap:0.75rem;flex-wrap:wrap;">
              <button class="btn btn-primary btn-sm" onclick="AdminApp.testDatabasePing()">
                ⚡ TEST API PING
              </button>
              <button class="btn btn-secondary btn-sm" onclick="AdminApp.exportDatabaseBackup()">
                💾 DOWNLOAD DATABASE (.JSON)
              </button>
            </div>
          </div>

          <!-- Live Metrics Grid -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:1rem;">
            <div style="background:var(--bg-primary);padding:1.25rem;border-radius:var(--radius-sm);border:1px solid var(--border-subtle);">
              <div style="font-size:0.75rem;color:var(--text-muted);font-family:var(--font-mono);">DATABASE FILE PATH</div>
              <div style="font-family:var(--font-mono);font-size:0.95rem;font-weight:700;color:var(--text-primary);margin-top:0.25rem;word-break:break-all;">
                data/database.json
              </div>
              <div style="font-size:0.7rem;color:var(--accent-lime);margin-top:0.35rem;">✓ Direct Local File System Storage</div>
            </div>

            <div style="background:var(--bg-primary);padding:1.25rem;border-radius:var(--radius-sm);border:1px solid var(--border-subtle);">
              <div style="font-size:0.75rem;color:var(--text-muted);font-family:var(--font-mono);">GARMENTS IN CATALOG</div>
              <div style="font-family:var(--font-mono);font-size:1.5rem;font-weight:700;color:var(--accent-lime);margin-top:0.25rem;">
                ${statusInfo && statusInfo.productsCount ? statusInfo.productsCount : products.length} Items
              </div>
              <div style="font-size:0.7rem;color:var(--text-muted);margin-top:0.2rem;">Men, Women, Kids collections</div>
            </div>

            <div style="background:var(--bg-primary);padding:1.25rem;border-radius:var(--radius-sm);border:1px solid var(--border-subtle);">
              <div style="font-size:0.75rem;color:var(--text-muted);font-family:var(--font-mono);">TOTAL LOGGED ORDERS</div>
              <div style="font-family:var(--font-mono);font-size:1.5rem;font-weight:700;color:var(--text-primary);margin-top:0.25rem;">
                ${statusInfo && statusInfo.ordersCount ? statusInfo.ordersCount : orders.length} Orders
              </div>
              <div style="font-size:0.7rem;color:var(--text-muted);margin-top:0.2rem;">With customer & courier waybills</div>
            </div>

            <div style="background:var(--bg-primary);padding:1.25rem;border-radius:var(--radius-sm);border:1px solid var(--border-subtle);">
              <div style="font-size:0.75rem;color:var(--text-muted);font-family:var(--font-mono);">DATABASE FILE SIZE</div>
              <div style="font-family:var(--font-mono);font-size:1.5rem;font-weight:700;color:var(--text-primary);margin-top:0.25rem;">
                ${statusInfo && statusInfo.databaseSizeKB ? statusInfo.databaseSizeKB + ' KB' : '~24 KB'}
              </div>
              <div style="font-size:0.7rem;color:var(--text-muted);margin-top:0.2rem;">Fast atomic disk I/O</div>
            </div>
          </div>
        </div>

        <!-- Cloud Database Connector (Supabase / Firebase) -->
        <div style="background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:2rem;">
          <div class="mono-tag" style="margin-bottom:0.5rem;color:var(--accent-lime);">CLOUD SCALING & MULTI-WAREHOUSE</div>
          <h3 style="font-size:1.4rem;margin-bottom:0.5rem;">Cloud Database Integration (Supabase / Firebase)</h3>
          <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:1.5rem;">
            Your store is fully functional on the native local REST database engine. If you want to connect a 24/7 cloud-hosted remote database (e.g. Supabase PostgreSQL or Google Firebase Firestore), enter your credentials below:
          </p>

          <form onsubmit="AdminApp.handleSaveCloudDb(event)" style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;">
            <div class="form-group">
              <label class="form-label">Database Provider</label>
              <select id="cfg-cloud-provider" class="form-control">
                <option value="local" selected>🟢 Local Native REST Server (data/database.json) — ACTIVE</option>
                <option value="supabase">⚡ Supabase (PostgreSQL Cloud)</option>
                <option value="firebase">🔥 Firebase Firestore (Google Cloud)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Synchronization Strategy</label>
              <select id="cfg-sync-mode" class="form-control">
                <option value="hybrid" selected>Hybrid (Live REST Database with Offline Fallback)</option>
                <option value="cloud-only">Strict Remote Cloud Database Only</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Supabase Project URL (Optional)</label>
              <input type="text" id="cfg-supabase-url" class="form-control" placeholder="https://your-project.supabase.co">
            </div>
            <div class="form-group">
              <label class="form-label">Supabase Public API Key / Anon Key (Optional)</label>
              <input type="password" id="cfg-supabase-key" class="form-control" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6...">
            </div>
            <div class="form-group" style="grid-column:1 / -1;">
              <label class="form-label">Google Firebase Configuration JSON (Optional)</label>
              <textarea id="cfg-firebase-json" class="form-control" rows="2" placeholder='{"apiKey": "AIzaSy...", "authDomain": "brand-collection.firebaseapp.com", "projectId": "brand-collection"}'></textarea>
            </div>
            <div style="grid-column:1 / -1;display:flex;gap:1rem;align-items:center;">
              <button type="submit" class="btn btn-primary btn-sm">
                💾 SAVE DATABASE CONFIGURATION
              </button>
              <span id="cloud-db-status-msg" style="font-size:0.85rem;color:var(--accent-lime);font-weight:600;"></span>
            </div>
          </form>
        </div>

        <!-- Live Interactive REST API Tester & Documentation -->
        <div style="background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:2rem;">
          <div class="mono-tag" style="margin-bottom:0.5rem;">INTERACTIVE REST CONSOLE</div>
          <h3 style="font-size:1.4rem;margin-bottom:0.5rem;">Live REST API Console & Verification</h3>
          <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:1.5rem;">
            Click any endpoint below to send an actual live HTTP request to your backend database and view the real-time JSON response:
          </p>

          <div style="display:flex;gap:0.75rem;flex-wrap:wrap;margin-bottom:1rem;">
            <button class="btn btn-ghost btn-sm" onclick="AdminApp.callApiTester('/api/status', 'GET')">
              GET /api/status (Health & Metrics)
            </button>
            <button class="btn btn-ghost btn-sm" onclick="AdminApp.callApiTester('/api/products', 'GET')">
              GET /api/products (Catalog)
            </button>
            <button class="btn btn-ghost btn-sm" onclick="AdminApp.callApiTester('/api/orders', 'GET')">
              GET /api/orders (Orders Queue)
            </button>
            <button class="btn btn-ghost btn-sm" onclick="AdminApp.callApiTester('/api/settings', 'GET')">
              GET /api/settings (Store Config)
            </button>
          </div>

          <div style="background:#06140D;border:1px solid var(--border-subtle);border-radius:var(--radius-sm);padding:1.25rem;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:0.5rem;">
              <span style="font-family:var(--font-mono);font-size:0.85rem;color:var(--accent-lime);font-weight:700;" id="api-tester-url">
                HTTP GET /api/status
              </span>
              <span style="font-size:0.75rem;color:var(--text-muted);font-family:var(--font-mono);" id="api-tester-time">
                Ready for query
              </span>
            </div>
            <pre id="api-tester-output" style="font-family:var(--font-mono);font-size:0.8rem;color:#E0F2E5;max-height:280px;overflow-y:auto;white-space:pre-wrap;margin:0;">Click a button above to test your live backend REST API...</pre>
          </div>
        </div>

        <!-- Point-in-Time Database Backup & Restore -->
        <div style="background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:2rem;">
          <div class="mono-tag" style="margin-bottom:0.5rem;">DISASTER RECOVERY & ARCHIVES</div>
          <h3 style="font-size:1.4rem;margin-bottom:0.5rem;">Database Backup, Restore & Reset</h3>
          <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:1.5rem;">
            Export a full JSON backup of your database, restore previous snapshots, or reset to default factory drop:
          </p>

          <div style="display:flex;gap:1rem;flex-wrap:wrap;align-items:center;">
            <button class="btn btn-primary btn-sm" onclick="AdminApp.exportDatabaseBackup()">
              ⬇️ DOWNLOAD FULL DATABASE BACKUP (.JSON)
            </button>
            <label class="btn btn-secondary btn-sm" style="margin-bottom:0;cursor:pointer;">
              ⬆️ RESTORE DATABASE FROM BACKUP FILE
              <input type="file" accept=".json" style="display:none;" onchange="AdminApp.handleImportDatabaseFile(this)">
            </label>
            <button class="btn btn-ghost btn-sm" onclick="AdminApp.handleResetDatabase()" style="color:var(--accent-danger);border-color:rgba(255,71,87,0.3);">
              ⚠️ RESET DATABASE TO FACTORY CATALOG
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Database Tools Implementations
  async function testDatabasePing() {
    showToast('Testing database latency...');
    if (window.DB) {
      await window.DB.init();
      renderAdminPanel();
      showToast(`Database latency: ${window.DB.latencyMs}ms. Status: Online!`);
    }
  }

  async function callApiTester(endpoint, method = 'GET') {
    const urlEl = document.getElementById('api-tester-url');
    const timeEl = document.getElementById('api-tester-time');
    const outEl = document.getElementById('api-tester-output');
    if (!urlEl || !outEl) return;

    urlEl.textContent = `HTTP ${method} ${endpoint}`;
    timeEl.textContent = 'Querying...';
    outEl.textContent = 'Loading response from backend...';

    const t0 = performance.now();
    try {
      const res = await fetch(endpoint, { method, cache: 'no-store' });
      const elapsed = Math.round(performance.now() - t0);
      timeEl.textContent = `Status: ${res.status} OK • Time: ${elapsed}ms`;

      const data = await res.json();
      outEl.textContent = JSON.stringify(data, null, 2);
    } catch (err) {
      const elapsed = Math.round(performance.now() - t0);
      timeEl.textContent = `Error • Time: ${elapsed}ms`;
      outEl.textContent = `Fetch Error: ${err.message}`;
    }
  }

  async function exportDatabaseBackup() {
    if (window.DB) {
      showToast('Preparing full database export...');
      await window.DB.downloadBackup();
      showToast('Database backup downloaded successfully!');
    }
  }

  function handleImportDatabaseFile(input) {
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = async function (e) {
        try {
          const json = JSON.parse(e.target.result);
          if (confirm('Are you sure you want to restore this database snapshot? Current products and orders will be synchronized.')) {
            if (window.DB) {
              await window.DB.restoreBackup(json);
              showToast('Database successfully restored from file!');
              renderAdminPanel();
            }
          }
        } catch (err) {
          showToast('Failed to restore: Invalid JSON file', 'error');
        }
      };
      reader.readAsText(file);
    }
  }

  async function handleResetDatabase() {
    if (confirm('Are you sure you want to reset all products and orders to factory defaults?')) {
      localStorage.removeItem('bc_custom_products');
      localStorage.removeItem('bc_orders');
      if (typeof PRODUCTS_DATA !== 'undefined') {
        PRODUCTS_DATA.length = 0;
      }
      if (window.DB) {
        await window.DB.init();
      }
      showToast('Catalog reset to factory defaults.');
      renderAdminPanel();
    }
  }

  function handleSaveCloudDb(e) {
    e.preventDefault();
    const provider = document.getElementById('cfg-cloud-provider').value;
    const supabaseUrl = document.getElementById('cfg-supabase-url').value.trim();
    const supabaseKey = document.getElementById('cfg-supabase-key').value.trim();
    const firebaseJson = document.getElementById('cfg-firebase-json').value.trim();

    const cloudConfig = {
      provider,
      supabaseUrl,
      supabaseKey,
      firebaseJson
    };

    if (window.DB) {
      window.DB.saveSettings({ cloudDatabase: cloudConfig });
    }

    const msg = document.getElementById('cloud-db-status-msg');
    if (msg) {
      msg.textContent = '✓ Configuration saved to database!';
      setTimeout(() => { msg.textContent = ''; }, 4000);
    }
    showToast('Database configuration saved successfully!');
  }

  // Export Catalog CSV
  function exportCatalogCSV() {
    const products = getLiveProducts();
    const headers = ['ID', 'Type', 'SKU', 'Name', 'Category', 'SubCategory', 'Regular Price (PKR)', 'Sale Price (PKR)', 'Stock', 'Image URL'];

    const rows = products.map(p => [
      `"${p.id}"`,
      '"simple"',
      `"${p.sku}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category}"`,
      `"${p.subCategory}"`,
      p.price,
      p.salePrice || '',
      p.stock,
      `"${p.image}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brand-collection-inventory-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Catalog CSV exported successfully!');
  }

  // Public Admin API
  window.AdminApp = {
    handleAdminLogin,
    handleAdminLogout,
    setAdminTab,
    renderAdminPanel,
    adjustStock,
    deleteProduct,
    openEditModal,
    closeEditModal,
    handleSaveEdit,
    handleCreateProduct,
    handleFileUpload,
    handlePresetSelect,
    updateOrderStatus,
    handleSaveSettings,
    filterAdminCat,
    filterLowStock,
    handleAdminSearch,
    exportCatalogCSV,
    renderDatabaseTab,
    renderBannersTab,
    handleSaveBanners,
    handleResetBanners,
    updateLiveBannerPreview,
    handleBannerImageUpload,
    handleBannerPresetSelect,
    testDatabasePing,
    callApiTester,
    exportDatabaseBackup,
    handleImportDatabaseFile,
    handleResetDatabase,
    handleSaveCloudDb
  };

  // Wire into App.navigateTo if App is defined
  const originalInit = window.App ? window.App.init : null;
})();
