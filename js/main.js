// =======================================
// MAIN.JS - Consolidated JavaScript for all pages
// =======================================

import { supabase } from './supabase.js';
import { i18n } from './i18n.js';
import './navbar.js';

// ============================
// UTILITY FUNCTIONS
// ============================

function showToast(message, type = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    Object.assign(container.style, {
      position: 'fixed',
      right: '20px',
      bottom: '20px',
      zIndex: '9999',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      maxWidth: '320px'
    });
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.textContent = message;
  Object.assign(toast.style, {
    background: type === 'error' ? '#fee2e2' : '#ecfdf5',
    color: type === 'error' ? '#991b1b' : '#065f46',
    padding: '12px 16px',
    borderRadius: '12px',
    boxShadow: '0 6px 18px rgba(0,0,0,0.1)',
    fontWeight: '600',
    fontSize: '14px',
    transition: 'transform 0.25s ease, opacity 0.25s ease',
    transform: 'translateY(8px)',
    opacity: '0'
  });

  container.appendChild(toast);

  // animate in
  requestAnimationFrame(() => {
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
  });

  // remove after 3s
  setTimeout(() => {
    toast.style.transform = 'translateY(8px)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 250);
  }, 3000);
}

/**
 * Safely escape HTML to prevent XSS.
 * Accepts null/undefined gracefully by converting to empty string.
 */
function escapeHtml(input = '') {
  const str = String(input);
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return str.replace(/[&<>"']/g, (m) => map[m]);
}

// ============================
// THEME MANAGEMENT
// ============================

function initializeTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  const html = document.documentElement;
  html.classList.remove('light', 'dark');
  html.classList.add(savedTheme);
  html.setAttribute('data-theme', savedTheme);

  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    themeToggle.addEventListener('click', toggleTheme);
  }

  const userThemeToggle = document.getElementById('userThemeToggle');
  if (userThemeToggle) {
    userThemeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    userThemeToggle.addEventListener('click', toggleTheme);
  }
}

function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

  html.classList.remove('dark', 'light');
  html.classList.add(newTheme);
  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);

  document.querySelectorAll('#themeToggle, #userThemeToggle').forEach(btn => {
    if (btn) btn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
  });
}

// ============================
// LANGUAGE MANAGEMENT
// ============================

function initializeLanguage() {
  const savedLang = localStorage.getItem('lang') || 'en';
  if (i18n && typeof i18n.setLang === 'function') {
    i18n.setLang(savedLang);
  }

  // Initialize language selectors (might be selects or simple inputs)
  const selectors = document.querySelectorAll('#langSelect, #userLang');
  if (selectors && selectors.length) {
    selectors.forEach(select => {
      if (!select) return;
      try {
        select.value = savedLang;
      } catch (e) {
        // some elements may not have value property (graceful fallback)
      }
      select.addEventListener('change', (e) => {
        const lang = e.target.value;
        localStorage.setItem('lang', lang);
        if (i18n && typeof i18n.setLang === 'function') {
          i18n.setLang(lang);
        }
        // Sync all language selectors
        document.querySelectorAll('#langSelect, #userLang').forEach(s => {
          if (s) s.value = lang;
        });
      });
    });
  }
}

// ============================
// AUTHENTICATION MANAGEMENT
// ============================

async function updateNavbarAuth() {
  try {
    const { data } = await supabase.auth.getUser();
    const user = data ? data.user : null;

    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const balanceBadge = document.getElementById('balanceBadge');
    const sellBtn = document.getElementById('sellBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const adminBtn = document.getElementById('adminBtn');

    if (user) {
      // Get user role
      let userRole = 'user';
      try {
        const { data: userData, error } = await supabase
          .from('users')
          .select('balance, role')
          .eq('id', user.id)
          .single();
        
        console.log('User data from database:', userData);
        console.log('User ID:', user.id);
        console.log('Error fetching user:', error);
        
        if (!error && userData) {
          userRole = userData.role || 'user';
          console.log('User role:', userRole);
          const bal = parseFloat(userData.balance || 0);
          if (balanceBadge) {
            balanceBadge.style.display = 'flex';
            const span = balanceBadge.querySelector('span');
            if (span) span.textContent = `€${bal.toFixed(2)}`;
          }
        } else {
          console.warn('No user data found in public.users table - creating entry');
          // Try to create user entry if it doesn't exist
          const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert([{
              id: user.id,
              email: user.email,
              username: user.email.split('@')[0],
              role: 'user',
              balance: 0
            }])
            .select()
            .single();
          
          if (!insertError && newUser) {
            userRole = newUser.role;
          }
          
          if (balanceBadge) {
            balanceBadge.style.display = 'flex';
            const span = balanceBadge.querySelector('span');
            if (span) span.textContent = '€0.00';
          }
        }
      } catch (err) {
        console.error('Error in updateNavbarAuth:', err);
        if (balanceBadge) {
          balanceBadge.style.display = 'flex';
          const span = balanceBadge.querySelector('span');
          if (span) span.textContent = '€0.00';
        }
      }
      
      console.log('Admin button element:', adminBtn);
      console.log('Setting admin button display for role:', userRole);

      if (loginBtn) loginBtn.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = 'inline-block';

      if (sellBtn) {
        sellBtn.style.opacity = '1';
        sellBtn.style.pointerEvents = 'auto';
      }
      if (settingsBtn) {
        settingsBtn.style.display = 'inline-block';
        settingsBtn.style.opacity = '1';
        settingsBtn.style.pointerEvents = 'auto';
      }
      if (adminBtn) {
        if (userRole === 'admin') {
          adminBtn.style.display = 'block';
        } else {
          adminBtn.style.display = 'none';
        }
      }
    } else {
      if (loginBtn) loginBtn.style.display = 'inline-block';
      if (logoutBtn) logoutBtn.style.display = 'none';
      if (balanceBadge) balanceBadge.style.display = 'none';

      if (sellBtn) {
        sellBtn.style.opacity = '0.6';
        sellBtn.style.pointerEvents = 'none';
      }
      if (settingsBtn) {
        settingsBtn.style.display = 'none';
      }
      if (adminBtn) {
        adminBtn.style.display = 'none';
      }
    }
  } catch (error) {
    // avoid breaking UI on unexpected auth errors
    console.error('Error updating navbar auth:', error);
  }
}

function initializeAuth() {
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const sellBtn = document.getElementById('sellBtn');
  const settingsBtn = document.getElementById('settingsBtn');

  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      window.location.href = 'login.html';
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await supabase.auth.signOut();
        await updateNavbarAuth();
        window.location.href = 'index.html';
      } catch (error) {
        console.error('Error signing out:', error);
        showToast('Error signing out', 'error');
      }
    });
  }

  if (sellBtn) {
    sellBtn.addEventListener('click', async () => {
      const { data } = await supabase.auth.getUser();
      const user = data ? data.user : null;
      if (user) {
        window.location.href = 'sell.html';
      } else {
        showToast(i18n.t ? i18n.t('loginFirst') : 'Please log in first', 'error');
        setTimeout(() => (window.location.href = 'login.html'), 1500);
      }
    });
  }

  if (settingsBtn) {
    settingsBtn.addEventListener('click', async () => {
      const { data } = await supabase.auth.getUser();
      const user = data ? data.user : null;
      if (user) {
        window.location.href = 'settings.html';
      } else {
        showToast(i18n.t ? i18n.t('loginFirst') : 'Please log in first', 'error');
        setTimeout(() => (window.location.href = 'login.html'), 1500);
      }
    });
  }

  // Listen for auth state changes
  if (supabase && supabase.auth && typeof supabase.auth.onAuthStateChange === 'function') {
    supabase.auth.onAuthStateChange(() => {
      updateNavbarAuth();
    });
  }

  updateNavbarAuth();
}

// ============================
// NAVIGATION MANAGEMENT
// ============================

function initializeNavigation() {
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const navbarLinks = document.querySelector('.navbar-links');

  if (hamburgerBtn && navbarLinks) {
    hamburgerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navbarLinks.classList.toggle('active');
    });
  }

  // Close navbar when clicking outside
  document.addEventListener('click', (e) => {
    if (navbarLinks && hamburgerBtn) {
      if (!navbarLinks.contains(e.target) && !hamburgerBtn.contains(e.target)) {
        navbarLinks.classList.remove('active');
      }
    }
  });

  // Close navbar when resizing to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && navbarLinks) {
      navbarLinks.classList.remove('active');
    }
  });
}

// ============================
// PAGE-SPECIFIC FUNCTIONS
// ============================

// Index page functions
async function initializeIndexPage() {
  if (!document.querySelector('.product-grid-modern')) return;


  // Stats updater
  async function updateStats() {
    try {
      // head true + count exact returns count in `count` property in response
      const productsResp = await supabase.from('products').select('*', { count: 'exact', head: true });
      const usersResp = await supabase.from('users').select('*', { count: 'exact', head: true });
      // For sellers count trying unique seller_id
      const sellersResp = await supabase
        .from('products')
        .select('seller_id', { count: 'exact', head: true });

      const productsCount = productsResp.count || 0;
      const usersCount = usersResp.count || 0;
      const sellersCount = sellersResp.count || 0;

      const statsProductsEl = document.getElementById('statsProducts');
      const statsUsersEl = document.getElementById('statsUsers');
      const statsSellersEl = document.getElementById('statsSellers');

      if (statsProductsEl) statsProductsEl.textContent = productsCount.toString();
      if (statsUsersEl) statsUsersEl.textContent = usersCount.toString();
      if (statsSellersEl) statsSellersEl.textContent = sellersCount.toString();
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  }

  // Product rendering and filtering
  let allProducts = [];
  let currentCategory = 'all';
  let currentFilters = {
    search: '',
    minPrice: '',
    maxPrice: '',
    location: '',
    condition: '',
    stock: '',
    availability: '',
    brand: '',
    color: '',
    date: '',
    sortBy: 'newest'
  };

  async function loadProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      allProducts = Array.isArray(data) ? data : [];
      applyFiltersAndRender();
      updateStats();
    } catch (error) {
      console.error('Error loading products:', error);
      showToast(i18n.t ? i18n.t('error_loading_products') || 'Error loading products' : 'Error loading products', 'error');
    }
  }

  function applyFiltersAndRender() {
    let filteredProducts = [...allProducts];

    // Category filter
    if (currentCategory !== 'all') {
      filteredProducts = filteredProducts.filter(p => (p.category || '').toLowerCase() === currentCategory.toLowerCase());
    }

    // Search filter
    if (currentFilters.search) {
      const searchTerm = currentFilters.search.toLowerCase();
      filteredProducts = filteredProducts.filter(p =>
        (p.name || '').toLowerCase().includes(searchTerm) ||
        (p.description || '').toLowerCase().includes(searchTerm) ||
        (p.category || '').toLowerCase().includes(searchTerm)
      );
    }

    // Price filters
    if (currentFilters.minPrice) {
      const minPrice = parseFloat(currentFilters.minPrice);
      filteredProducts = filteredProducts.filter(p => parseFloat(p.price || 0) >= minPrice);
    }
    if (currentFilters.maxPrice) {
      const maxPrice = parseFloat(currentFilters.maxPrice);
      filteredProducts = filteredProducts.filter(p => parseFloat(p.price || 0) <= maxPrice);
    }

    // Location filter
    if (currentFilters.location) {
      filteredProducts = filteredProducts.filter(p =>
        (p.location || '').toLowerCase().includes(currentFilters.location.toLowerCase())
      );
    }

    // Condition filter
    if (currentFilters.condition) {
      filteredProducts = filteredProducts.filter(p => (p.condition || '') === currentFilters.condition);
    }

    // Stock filter
    if (currentFilters.stock) {
      filteredProducts = filteredProducts.filter(p => {
        const stock = parseInt(p.stock || 0);
        switch (currentFilters.stock) {
          case 'in_stock':
            return stock > 0;
          case 'low_stock':
            return stock >= 1 && stock <= 5;
          case 'high_stock':
            return stock >= 10;
          case 'out_of_stock':
            return stock === 0;
          default:
            return true;
        }
      });
    }

    // Availability filter
    if (currentFilters.availability) {
      filteredProducts = filteredProducts.filter(p => {
        if (currentFilters.availability === 'available') {
          return !p.is_reserved && (p.stock || 0) > 0;
        } else if (currentFilters.availability === 'reserved') {
          return p.is_reserved;
        }
        return true;
      });
    }

    // Brand filter
    if (currentFilters.brand) {
      const brandTerm = currentFilters.brand.toLowerCase();
      filteredProducts = filteredProducts.filter(p =>
        (p.brand || '').toLowerCase().includes(brandTerm)
      );
    }

    // Color filter
    if (currentFilters.color) {
      const colorTerm = currentFilters.color.toLowerCase();
      filteredProducts = filteredProducts.filter(p =>
        (p.color || '').toLowerCase().includes(colorTerm)
      );
    }

    // Date filter
    if (currentFilters.date) {
      const now = new Date();
      filteredProducts = filteredProducts.filter(p => {
        const createdDate = new Date(p.created_at);
        const diffTime = now - createdDate;
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        
        switch (currentFilters.date) {
          case 'today':
            return diffDays < 1;
          case 'week':
            return diffDays < 7;
          case 'month':
            return diffDays < 30;
          case '3months':
            return diffDays < 90;
          default:
            return true;
        }
      });
    }

    // Sorting
    switch (currentFilters.sortBy) {
      case 'oldest':
        filteredProducts.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case 'price_low':
        filteredProducts.sort((a, b) => parseFloat(a.price || 0) - parseFloat(b.price || 0));
        break;
      case 'price_high':
        filteredProducts.sort((a, b) => parseFloat(b.price || 0) - parseFloat(a.price || 0));
        break;
      case 'name':
        filteredProducts.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'name_desc':
        filteredProducts.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
        break;
      case 'popular':
        filteredProducts.sort((a, b) => {
          const viewsA = parseInt(a.views || 0);
          const viewsB = parseInt(b.views || 0);
          return viewsB - viewsA;
        });
        break;
      case 'newest':
      default:
        filteredProducts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
    }

    renderProducts(filteredProducts);
  }

  async function renderProducts(products = null) {
    const grid = document.getElementById('productGrid');
    if (!grid) return;

    const productsToRender = products || allProducts;

    if (!productsToRender || productsToRender.length === 0) {
      grid.innerHTML = `<div style="padding:40px;text-align:center;grid-column:1/-1;color:var(--muted);">
        <div style="font-size: 3rem; margin-bottom: 1rem;">📦</div>
        <span data-i18n="no_products">No products found</span>
        <p style="margin-top: 0.5rem; font-size: 0.875rem;">Try adjusting your filters or search terms</p>
      </div>`;
      if (i18n && typeof i18n.setLang === 'function') i18n.setLang(i18n.lang || 'en');
      return;
    }

    // Get current user info for permission checks
    const { data } = await supabase.auth.getUser();
    const currentUser = data?.user;
    let userRole = 'user';
    
    if (currentUser) {
      try {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', currentUser.id)
          .single();
        userRole = userData?.role || 'user';
      } catch (err) {
        console.error('Error fetching user role:', err);
      }
    }

    grid.innerHTML = '';

    productsToRender.forEach(product => {
      const imageUrl = product.image_url || 'https://via.placeholder.com/300x200';
      const price = Number.isFinite(Number(product.price)) ? parseFloat(product.price).toFixed(2) : '0.00';
      const stock = product.stock != null ? product.stock : 0;
      const categoryText = escapeHtml(product.category || 'other');
      const nameText = escapeHtml(product.name || 'Unnamed Product');
      const locationText = escapeHtml(product.location || '');
      const conditionText = product.condition ? product.condition.replace('_', ' ') : '';

      const conditionEmoji = {
        'new': '✨',
        'like_new': '🔄',
        'good': '👍',
        'fair': '😐',
        'poor': '⚠️'
      };
      
      // Check if user can manage this product
      const canManage = currentUser && (userRole === 'admin' || product.seller_id === currentUser.id);

      const card = document.createElement('div');
      card.className = 'product-card-modern';
      card.style.cursor = 'pointer';
      card.setAttribute('data-product-id', product.id);
      
      // Add click handler to open modal
      card.addEventListener('click', (e) => {
        // Don't open modal if clicking action buttons
        if (!e.target.closest('.btn-buy-now') && !e.target.closest('.btn-reserve')) {
          showProductModal(product);
        }
      });
      
      card.innerHTML = `
        <div class="product-image-container">
          <img src="${escapeHtml(imageUrl)}" alt="${nameText}" class="product-image" onerror="this.src='https://via.placeholder.com/300x200'">
          <button class="product-like-btn" data-id="${escapeHtml(product.id)}" aria-label="Like">❤️</button>
          ${product.is_reserved ? `<span class="product-badge-new" data-i18n="reserved">Reserved</span>` : ''}
          <div class="product-overlay">
            <button class="btn-quick-view" data-id="${escapeHtml(product.id)}" data-i18n="quickView">👁 Quick View</button>
          </div>
        </div>
        <div class="product-info">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
            <span class="product-category">${categoryText}</span>
            ${conditionText ? `<span style="background: #dbeafe; color: #1e40af; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 500;">${conditionEmoji[product.condition]} ${conditionText}</span>` : ''}
          </div>
          <h3 class="product-name">${nameText}</h3>
          <div class="product-meta">
            ${locationText ? `<span style="display: block; color: #6b7280; font-size: 0.875rem; margin-bottom: 0.25rem;">📍 ${locationText}</span>` : ''}
            <span class="product-views">📦 ${escapeHtml(stock)} in stock</span>
          </div>
          <div class="product-footer">
            <div class="product-price">
              <span class="price-currency">€</span>
              <span class="price-amount">${price}</span>
            </div>
            <div class="product-actions">
              ${!product.is_reserved ? `
                <button class="btn-add-cart" data-id="${escapeHtml(product.id)}" title="Reserve">🔖 Reserve</button>
                <button class="btn-buy-now" data-id="${escapeHtml(product.id)}" data-i18n="buyNow">🛒 Buy Now</button>
              ` : `
                <button class="btn-buy-now" disabled style="opacity:0.5" data-i18n="reserved">Reserved</button>
              `}
            </div>
          </div>
          ${canManage ? `
            <div class="product-management-actions" style="display: flex; gap: 0.5rem; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--border);">
              <button class="btn-edit-product" data-product-id="${escapeHtml(product.id)}" style="flex: 1; padding: 0.5rem; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 0.875rem; cursor: pointer; font-weight: 500; transition: background 0.2s;">
                ✏️ Edit
              </button>
              <button class="btn-delete-product" data-product-id="${escapeHtml(product.id)}" style="flex: 1; padding: 0.5rem; background: #ef4444; color: white; border: none; border-radius: 6px; font-size: 0.875rem; cursor: pointer; font-weight: 500; transition: background 0.2s;">
                🗑️ Delete
              </button>
            </div>
          ` : ''}
        </div>
      `;
      grid.appendChild(card);
      
      // Add management button handlers
      if (canManage) {
        const editBtn = card.querySelector('.btn-edit-product');
        const deleteBtn = card.querySelector('.btn-delete-product');
        
        if (editBtn) {
          editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showEditProductModal(product);
          });
        }
        
        if (deleteBtn) {
          deleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
              await handleDeleteProduct(product.id);
            }
          });
        }
      }
    });

    // Apply translations to newly rendered elements (if i18n supports it)
    if (i18n && typeof i18n.setLang === 'function') i18n.setLang(i18n.lang || 'en');

    // Add event listeners for newly created product elements
    addProductEventListeners();
  }

  function addProductEventListeners() {
    // Buy Now buttons
    document.querySelectorAll('.btn-buy-now:not([disabled])').forEach(btn => {
      btn.replaceWith(btn.cloneNode(true)); // remove duplicate listeners by cloning
    });
    document.querySelectorAll('.btn-buy-now:not([disabled])').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const productId = e.currentTarget.dataset.id;
        await handlePurchase(productId);
      });
    });

    // Reserve buttons (cart icon)
    document.querySelectorAll('.btn-add-cart').forEach(btn => {
      btn.replaceWith(btn.cloneNode(true));
    });
    document.querySelectorAll('.btn-add-cart').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const productId = e.currentTarget.dataset.id;
        await handleReserve(productId);
      });
    });

    // Quick View buttons
    document.querySelectorAll('.btn-quick-view').forEach(btn => {
      btn.replaceWith(btn.cloneNode(true));
    });
    document.querySelectorAll('.btn-quick-view').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const productId = e.currentTarget.dataset.id;
        const product = allProducts.find(p => String(p.id) === String(productId));
        if (product) {
          showProductModal(product);
        }
      });
    });
  }

  async function handlePurchase(productId) {
    try {
      const { data } = await supabase.auth.getUser();
      const user = data ? data.user : null;
      if (!user) {
        showToast(i18n.t ? i18n.t('loginFirst') : 'Please log in first', 'error');
        setTimeout(() => (window.location.href = 'login.html'), 1500);
        return;
      }

      // dynamic import of helper function from supabase.js (if available)
      const mod = await import('./supabase.js');
      if (mod && typeof mod.purchaseProduct === 'function') {
        await mod.purchaseProduct(productId, user.id);
        showToast(i18n.t ? i18n.t('purchaseComplete') : 'Purchase completed', 'success');
        await loadProducts();
        await updateNavbarAuth();
      } else {
        throw new Error('Purchase function not available');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      showToast(error.message || 'Purchase failed', 'error');
    }
  }

  async function handleReserve(productId) {
    try {
      const { data } = await supabase.auth.getUser();
      const user = data ? data.user : null;
      if (!user) {
        showToast(i18n.t ? i18n.t('loginFirst') : 'Please log in first', 'error');
        setTimeout(() => (window.location.href = 'login.html'), 1500);
        return;
      }

      const mod = await import('./supabase.js');
      if (mod && typeof mod.reserveProduct === 'function') {
        // example reservation fee of 0.20
        await mod.reserveProduct(productId, user.id, 0.20);
        showToast(i18n.t ? i18n.t('reserved_success') || 'Product reserved successfully!' : 'Product reserved successfully!', 'success');
        await loadProducts();
        await updateNavbarAuth();
      } else {
        throw new Error('Reserve function not available');
      }
    } catch (error) {
      console.error('Reserve error:', error);
      showToast(error.message || 'Reservation failed', 'error');
    }
  }

  async function showProductModal(product) {
    const modal = document.getElementById('productModal');
    if (!modal) return;
    
    const modalBody = modal.querySelector('.modal-body');
    
    // Get seller information
    let sellerData = null;
    let sellerRating = 0;
    let sellerReviews = 0;
    
    if (product.seller_id) {
      const { data: seller } = await supabase
        .from('users')
        .select('id, username, email, created_at')
        .eq('id', product.seller_id)
        .single();
      
      sellerData = seller;
      
      // Get seller rating from reviews (placeholder for now)
      sellerRating = 4.5;
      sellerReviews = 23;
    }
    
    // Get product stats (placeholders)
    const productLikes = Math.floor(Math.random() * 50);
    const productSaves = Math.floor(Math.random() * 30);
    const productViews = Math.floor(Math.random() * 200) + 50;
    
    const conditionEmoji = {
      'new': '✨',
      'like_new': '🔄',
      'good': '👍',
      'fair': '😐',
      'poor': '⚠️'
    };
    
    const conditionText = product.condition ? product.condition.replace('_', ' ') : '';
    const imageUrl = product.image_url || 'https://via.placeholder.com/600x400';
    const price = Number.isFinite(Number(product.price)) ? parseFloat(product.price).toFixed(2) : '0.00';
    
    modalBody.innerHTML = `
      <div class="modal-product-grid">
        <div>
          <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(product.name)}" class="modal-product-image">
        </div>
        
        <div class="modal-product-info">
          <h1>${escapeHtml(product.name)}</h1>
          <div class="modal-product-price">€${price}</div>
          
          <div class="modal-product-meta">
            <span class="modal-badge" style="background: #dbeafe; color: #1e40af;">
              ${conditionEmoji[product.condition] || '📦'} ${escapeHtml(conditionText)}
            </span>
            <span class="modal-badge" style="background: #fef3c7; color: #92400e;">
              📍 ${escapeHtml(product.location) || 'Not specified'}
            </span>
            <span class="modal-badge" style="background: #f3e8ff; color: #6b21a8;">
              📦 ${escapeHtml(product.category) || 'other'}
            </span>
            ${product.stock > 0 
              ? `<span class="modal-badge" style="background: #d1fae5; color: #065f46;">✓ ${product.stock} in stock</span>`
              : `<span class="modal-badge" style="background: #fee2e2; color: #991b1b;">✗ Out of stock</span>`
            }
          </div>
          
          <div class="modal-description">
            <h3 style="margin-bottom: 0.75rem; font-size: 1.125rem;">Description</h3>
            <p>${escapeHtml(product.description) || 'No description provided.'}</p>
          </div>
          
          <!-- Product Stats -->
          <div class="modal-stats">
            <div class="modal-stat">
              <div class="modal-stat-value">❤️ ${productLikes}</div>
              <div class="modal-stat-label">Likes</div>
            </div>
            <div class="modal-stat">
              <div class="modal-stat-value">🔖 ${productSaves}</div>
              <div class="modal-stat-label">Saved</div>
            </div>
            <div class="modal-stat">
              <div class="modal-stat-value">👁 ${productViews}</div>
              <div class="modal-stat-label">Views</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Seller Information -->
      <div class="modal-seller-card">
        <div class="modal-seller-header">
          <div class="modal-seller-avatar">
            ${sellerData?.username ? sellerData.username.charAt(0).toUpperCase() : '?'}
          </div>
          <div class="modal-seller-info">
            <h3>${escapeHtml(sellerData?.username) || 'Unknown Seller'}</h3>
            <div class="modal-seller-rating">
              ${'⭐'.repeat(Math.floor(sellerRating))} ${sellerRating}/5 (${sellerReviews} reviews)
            </div>
            <div style="font-size: 0.875rem; color: var(--muted); margin-top: 0.25rem;">
              Member since ${sellerData?.created_at ? new Date(sellerData.created_at).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        </div>
        
        ${sellerData ? `
          <button class="modal-btn modal-btn-secondary" style="width: 100%; margin-top: 1rem;" id="chatSellerBtn" data-seller="${product.seller_id}" data-product="${product.id}">
            💬 Chat with Seller
          </button>
        ` : ''}
      </div>
      
      <!-- Action Buttons -->
      <div class="modal-actions">
        <button class="modal-btn modal-btn-secondary" id="saveProductBtn">
          🔖 Save for Later
        </button>
        <button class="modal-btn modal-btn-secondary" id="likeProductBtn">
          ❤️ Like Product
        </button>
        ${product.stock > 0 && !product.is_reserved ? `
          <button class="modal-btn modal-btn-secondary" id="modalReserveBtn" data-id="${product.id}">
            🔖 Reserve (€0.20)
          </button>
          <button class="modal-btn modal-btn-primary" id="modalBuyBtn" data-id="${product.id}">
            🛒 Buy Now - €${price}
          </button>
        ` : ''}
      </div>
    `;
    
    // Show modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Close modal handlers
    const closeModal = () => {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    };
    
    const closeBtn = document.getElementById('modalClose');
    const overlay = document.getElementById('modalOverlay');
    if (closeBtn) closeBtn.onclick = closeModal;
    if (overlay) overlay.onclick = closeModal;
    
    // Action button handlers
    const chatBtn = document.getElementById('chatSellerBtn');
    if (chatBtn) {
      chatBtn.onclick = () => {
        window.location.href = `chat.html?seller=${product.seller_id}&product=${product.id}`;
      };
    }
    
    const saveBtn = document.getElementById('saveProductBtn');
    if (saveBtn) {
      saveBtn.onclick = () => {
        showToast('Product saved for later!', 'success');
      };
    }
    
    const likeBtn = document.getElementById('likeProductBtn');
    if (likeBtn) {
      likeBtn.onclick = () => {
        showToast('Product liked!', 'success');
      };
    }
    
    const modalReserveBtn = document.getElementById('modalReserveBtn');
    if (modalReserveBtn) {
      modalReserveBtn.onclick = async () => {
        await handleReserve(product.id);
        closeModal();
      };
    }
    
    const modalBuyBtn = document.getElementById('modalBuyBtn');
    if (modalBuyBtn) {
      modalBuyBtn.onclick = async () => {
        await handlePurchase(product.id);
        closeModal();
      };
    }
  }

  // Filter tabs
  const filterTabs = document.querySelectorAll('.filter-tab');
  if (filterTabs && filterTabs.length) {
    filterTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentCategory = tab.dataset.category || 'all';
        applyFiltersAndRender();
      });
    });
  }

  // Advanced filters
  const applyFiltersBtn = document.getElementById('applyFilters');
  const clearFiltersBtn = document.getElementById('clearFilters');

  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', () => {
      currentFilters.search = document.getElementById('searchInput')?.value || '';
      currentFilters.minPrice = document.getElementById('minPrice')?.value || '';
      currentFilters.maxPrice = document.getElementById('maxPrice')?.value || '';
      currentFilters.location = document.getElementById('locationFilter')?.value || '';
      currentFilters.condition = document.getElementById('conditionFilter')?.value || '';
      currentFilters.stock = document.getElementById('stockFilter')?.value || '';
      currentFilters.availability = document.getElementById('availabilityFilter')?.value || '';
      currentFilters.brand = document.getElementById('brandFilter')?.value || '';
      currentFilters.color = document.getElementById('colorFilter')?.value || '';
      currentFilters.date = document.getElementById('dateFilter')?.value || '';
      currentFilters.sortBy = document.getElementById('sortFilter')?.value || 'newest';

      applyFiltersAndRender();
      updateActiveFilters();
      showToast('Filters applied successfully!', 'success');
    });
  }

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
      currentFilters = {
        search: '',
        minPrice: '',
        maxPrice: '',
        location: '',
        condition: '',
        stock: '',
        availability: '',
        brand: '',
        color: '',
        date: '',
        sortBy: 'newest'
      };

      // Clear form inputs
      const inputs = ['searchInput', 'minPrice', 'maxPrice', 'brandFilter', 'colorFilter'];
      inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });

      const selects = ['locationFilter', 'conditionFilter', 'stockFilter', 'availabilityFilter', 'dateFilter', 'sortFilter'];
      selects.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = id === 'sortFilter' ? 'newest' : '';
      });

      // Clear category filter
      const catFilter = document.getElementById('categoryFilter');
      if (catFilter) catFilter.value = '';

      // Reset category to all
      currentCategory = 'all';
      filterTabs.forEach(t => t.classList.remove('active'));
      const allTab = document.querySelector('[data-category="all"]');
      if (allTab) allTab.classList.add('active');

      applyFiltersAndRender();
      updateActiveFilters();
      showToast('Filters cleared!', 'success');
    });
  }

  // Update active filters display
  function updateActiveFilters() {
    const activeFiltersDiv = document.getElementById('activeFilters');
    const filterTagsDiv = document.getElementById('filterTags');
    if (!activeFiltersDiv || !filterTagsDiv) return;

    filterTagsDiv.innerHTML = '';
    let hasFilters = false;

    const filterLabels = {
      search: '🔍 Search',
      minPrice: '💰 Min',
      maxPrice: '💸 Max',
      location: '📍 Location',
      condition: '⭐ Condition',
      stock: '📊 Stock',
      availability: '🔖 Status',
      brand: '🏷️ Brand',
      color: '🎨 Color',
      date: '📅 Date',
      sortBy: '🔄 Sort'
    };

    Object.keys(currentFilters).forEach(key => {
      if (currentFilters[key] && currentFilters[key] !== 'newest') {
        hasFilters = true;
        const tag = document.createElement('div');
        tag.className = 'filter-tag';
        tag.innerHTML = `
          ${filterLabels[key]}: ${currentFilters[key]}
          <span class="remove-tag">×</span>
        `;
        tag.onclick = () => {
          currentFilters[key] = key === 'sortBy' ? 'newest' : '';
          const inputId = {
            search: 'searchInput',
            minPrice: 'minPrice',
            maxPrice: 'maxPrice',
            location: 'locationFilter',
            condition: 'conditionFilter',
            stock: 'stockFilter',
            availability: 'availabilityFilter',
            brand: 'brandFilter',
            color: 'colorFilter',
            date: 'dateFilter',
            sortBy: 'sortFilter'
          }[key];
          const el = document.getElementById(inputId);
          if (el) el.value = key === 'sortBy' ? 'newest' : '';
          applyFiltersAndRender();
          updateActiveFilters();
        };
        filterTagsDiv.appendChild(tag);
      }
    });

    activeFiltersDiv.style.display = hasFilters ? 'block' : 'none';
  }

  // Real-time search
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        currentFilters.search = searchInput.value;
        applyFiltersAndRender();
      }, 300);
    });
  }

  // Toggle advanced filters
  const toggleFiltersBtn = document.getElementById('toggleFiltersBtn');
  const advancedFiltersContainer = document.getElementById('advancedFiltersContainer');
  const filterArrow = document.getElementById('filterArrow');
  let filtersVisible = false;

  if (toggleFiltersBtn && advancedFiltersContainer) {
    toggleFiltersBtn.addEventListener('click', () => {
      filtersVisible = !filtersVisible;
      
      if (filtersVisible) {
        advancedFiltersContainer.style.display = 'block';
        filterArrow.style.transform = 'rotate(180deg)';
        toggleFiltersBtn.querySelector('[data-i18n]').setAttribute('data-i18n', 'hide_filters');
        toggleFiltersBtn.querySelector('[data-i18n]').textContent = i18n.t('hide_filters');
      } else {
        advancedFiltersContainer.style.display = 'none';
        filterArrow.style.transform = 'rotate(0deg)';
        toggleFiltersBtn.querySelector('[data-i18n]').setAttribute('data-i18n', 'show_filters');
        toggleFiltersBtn.querySelector('[data-i18n]').textContent = i18n.t('show_filters');
      }
    });
  }

  // Hero buttons
  document.querySelector('.btn-hero-primary')?.addEventListener('click', () => {
    document.querySelector('.main-container')?.scrollIntoView({ behavior: 'smooth' });
  });

  document.querySelector('.btn-hero-secondary')?.addEventListener('click', () => {
    document.querySelector('.features-section')?.scrollIntoView({ behavior: 'smooth' });
  });

  // Delete product handler
  async function handleDeleteProduct(productId) {
    try {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user) {
        showToast('Please log in first', 'error');
        return;
      }

      const { deleteProduct } = await import('./supabase.js');
      await deleteProduct(productId, user.id);
      
      showToast('Product deleted successfully!', 'success');
      loadProducts(); // Reload products
    } catch (error) {
      console.error('Error deleting product:', error);
      showToast(error.message || 'Failed to delete product', 'error');
    }
  }

  // Show edit product modal
  function showEditProductModal(product) {
    // Create modal
    const modalHtml = `
      <div id="editProductModal" class="product-modal" style="display: flex;">
        <div class="modal-overlay" onclick="closeEditModal()"></div>
        <div class="modal-content" style="max-width: 800px;">
          <button class="modal-close" onclick="closeEditModal()">×</button>
          <div class="modal-body">
            <h2 style="margin-bottom: 1.5rem; color: var(--text-primary);">Edit Product</h2>
            <form id="editProductForm" style="display: flex; flex-direction: column; gap: 1rem;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div>
                  <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Product Name</label>
                  <input type="text" id="editName" value="${escapeHtml(product.name)}" required style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px;">
                </div>
                <div>
                  <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Price (€)</label>
                  <input type="number" id="editPrice" value="${product.price}" required min="0" step="0.01" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px;">
                </div>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div>
                  <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Category</label>
                  <select id="editCategory" required style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px;">
                    <option value="electronics" ${product.category === 'electronics' ? 'selected' : ''}>Electronics</option>
                    <option value="clothing" ${product.category === 'clothing' ? 'selected' : ''}>Clothing</option>
                    <option value="furniture" ${product.category === 'furniture' ? 'selected' : ''}>Furniture</option>
                    <option value="books" ${product.category === 'books' ? 'selected' : ''}>Books</option>
                    <option value="sports" ${product.category === 'sports' ? 'selected' : ''}>Sports</option>
                    <option value="home" ${product.category === 'home' ? 'selected' : ''}>Home</option>
                    <option value="vehicles" ${product.category === 'vehicles' ? 'selected' : ''}>Vehicles</option>
                    <option value="other" ${product.category === 'other' ? 'selected' : ''}>Other</option>
                  </select>
                </div>
                <div>
                  <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Condition</label>
                  <select id="editCondition" required style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px;">
                    <option value="new" ${product.condition === 'new' ? 'selected' : ''}>New</option>
                    <option value="like_new" ${product.condition === 'like_new' ? 'selected' : ''}>Like New</option>
                    <option value="good" ${product.condition === 'good' ? 'selected' : ''}>Good</option>
                    <option value="fair" ${product.condition === 'fair' ? 'selected' : ''}>Fair</option>
                    <option value="poor" ${product.condition === 'poor' ? 'selected' : ''}>Poor</option>
                  </select>
                </div>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div>
                  <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Stock</label>
                  <input type="number" id="editStock" value="${product.stock}" required min="0" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px;">
                </div>
                <div>
                  <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Location</label>
                  <input type="text" id="editLocation" value="${escapeHtml(product.location || '')}" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px;">
                </div>
              </div>
              
              <div>
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Description</label>
                <textarea id="editDescription" required rows="4" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px;">${escapeHtml(product.description || '')}</textarea>
              </div>
              
              <div>
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Image URL</label>
                <input type="url" id="editImageUrl" value="${escapeHtml(product.image_url || '')}" required style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px;">
              </div>
              
              <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                <button type="submit" style="flex: 1; padding: 0.75rem; background: #3b82f6; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                  💾 Save Changes
                </button>
                <button type="button" onclick="closeEditModal()" style="flex: 1; padding: 0.75rem; background: #e5e7eb; color: #374151; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                  ✖️ Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('editProductModal');
    if (existingModal) existingModal.remove();
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.body.style.overflow = 'hidden';
    
    // Add form submit handler
    document.getElementById('editProductForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleUpdateProduct(product.id);
    });
  }
  
  // Close edit modal
  window.closeEditModal = function() {
    const modal = document.getElementById('editProductModal');
    if (modal) {
      modal.remove();
      document.body.style.overflow = 'auto';
    }
  };
  
  // Update product handler
  async function handleUpdateProduct(productId) {
    try {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user) {
        showToast('Please log in first', 'error');
        return;
      }

      const productData = {
        name: document.getElementById('editName').value,
        price: parseFloat(document.getElementById('editPrice').value),
        category: document.getElementById('editCategory').value,
        condition: document.getElementById('editCondition').value,
        stock: parseInt(document.getElementById('editStock').value),
        location: document.getElementById('editLocation').value,
        description: document.getElementById('editDescription').value,
        image_url: document.getElementById('editImageUrl').value
      };

      const { updateProduct } = await import('./supabase.js');
      await updateProduct(productId, user.id, productData);
      
      showToast('Product updated successfully!', 'success');
      closeEditModal();
      loadProducts(); // Reload products
    } catch (error) {
      console.error('Error updating product:', error);
      showToast(error.message || 'Failed to update product', 'error');
    }
  }

  // Load products on page load
  loadProducts();
  
  // Listen for purchase/reserve events from modal
  document.addEventListener('purchaseProduct', async (e) => {
    await handlePurchase(e.detail.productId);
    // Close modal
    document.getElementById('productModal').style.display = 'none';
    document.body.style.overflow = 'auto';
  });
  
  document.addEventListener('reserveProduct', async (e) => {
    await handleReserve(e.detail.productId);
    // Close modal
    document.getElementById('productModal').style.display = 'none';
    document.body.style.overflow = 'auto';
  });
}

// Settings page functions
function initializeSettingsPage() {
   if (!document.getElementById('userEmail')) return;

   async function loadUserSettings() {
     try {
       const { data } = await supabase.auth.getUser();
       const user = data ? data.user : null;
       if (!user) {
         showToast('You must be logged in to access settings.', 'error');
         setTimeout(() => (window.location.href = 'login.html'), 2000);
         return;
       }

       const resp = await supabase.from('users').select('*').eq('id', user.id).single();
       if (resp.error) {
         console.error('Error loading user settings:', resp.error);
         return;
       }
       const userData = resp.data;
       
       // Update email fields
       const emailEl = document.getElementById('userEmail');
       const emailDisplayEl = document.getElementById('userEmailDisplay');
       if (emailEl) emailEl.value = userData.email || '';
       if (emailDisplayEl) emailDisplayEl.textContent = userData.email || '';
       
       // Update balance display
       const balanceDisplayEl = document.getElementById('userBalanceDisplay');
       if (balanceDisplayEl) balanceDisplayEl.textContent = `€${Number.isFinite(Number(userData.balance)) ? parseFloat(userData.balance).toFixed(2) : '0.00'}`;
       
       // Update username
       const userNameEl = document.getElementById('userName');
       const usernameInput = document.getElementById('usernameInput');
       if (userNameEl) userNameEl.textContent = userData.username || 'User';
       if (usernameInput) usernameInput.value = userData.username || '';
       
       // Update avatar
       const avatarImg = document.getElementById('userAvatar');
       const avatarText = document.getElementById('userAvatarText');
       const avatarUrlInput = document.getElementById('avatarUrlInput');
       if (userData.avatar_url) {
         if (avatarImg) {
           avatarImg.src = userData.avatar_url;
           avatarImg.style.display = 'block';
         }
         if (avatarText) avatarText.style.display = 'none';
         if (avatarUrlInput) avatarUrlInput.value = userData.avatar_url;
       } else {
         if (avatarText) avatarText.textContent = (userData.username || 'U').charAt(0).toUpperCase();
       }
       
       // Update bio
       const bioInput = document.getElementById('bioInput');
       if (bioInput) bioInput.value = userData.bio || '';
       
       // Update what I sell
       const whatISellInput = document.getElementById('whatISellInput');
       if (whatISellInput) whatISellInput.value = userData.what_i_sell || '';
       
       // Load user stats
       loadUserStats(user.id);
     } catch (error) {
       console.error('Error in loadUserSettings:', error);
     }
   }
   
   // Load user statistics
   async function loadUserStats(userId) {
     try {
       // Count user's products
       const { count: productsCount } = await supabase
         .from('products')
         .select('*', { count: 'exact', head: true })
         .eq('seller_id', userId);
       
       // Count user's sales
       const { count: salesCount } = await supabase
         .from('user_transactions')
         .select('*', { count: 'exact', head: true })
         .eq('user_id', userId)
         .eq('transaction_type', 'sale');
       
       const productCountEl = document.getElementById('userProductCount');
       const salesCountEl = document.getElementById('userSalesCount');
       
       if (productCountEl) productCountEl.textContent = productsCount || 0;
       if (salesCountEl) salesCountEl.textContent = salesCount || 0;
     } catch (error) {
       console.error('Error loading user stats:', error);
     }
   }
   
   // Save profile button
   const saveProfileBtn = document.getElementById('saveProfileBtn');
   if (saveProfileBtn) {
     saveProfileBtn.addEventListener('click', async () => {
       try {
         const { data } = await supabase.auth.getUser();
         const user = data?.user;
         if (!user) {
           showToast('Please log in first', 'error');
           return;
         }
         
         const username = document.getElementById('usernameInput')?.value;
         const avatarUrl = document.getElementById('avatarUrlInput')?.value;
         const bio = document.getElementById('bioInput')?.value;
         const whatISell = document.getElementById('whatISellInput')?.value;
         
         const { error } = await supabase
           .from('users')
           .update({
             username: username || null,
             avatar_url: avatarUrl || null,
             bio: bio || null,
             what_i_sell: whatISell || null,
             updated_at: new Date().toISOString()
           })
           .eq('id', user.id);
         
         if (error) throw error;
         
         showToast(i18n.t('profile_updated'), 'success');
         loadUserSettings();
       } catch (error) {
         console.error('Error updating profile:', error);
         showToast(i18n.t('profile_update_failed'), 'error');
       }
     });
   }
   
   // Change avatar button
   const changeAvatarBtn = document.getElementById('changeAvatarBtn');
   const avatarUrlInput = document.getElementById('avatarUrlInput');
   if (changeAvatarBtn && avatarUrlInput) {
     changeAvatarBtn.addEventListener('click', () => {
       avatarUrlInput.focus();
       avatarUrlInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
     });
   }
   
   // Real-time avatar preview
   if (avatarUrlInput) {
     avatarUrlInput.addEventListener('input', () => {
       const url = avatarUrlInput.value;
       const avatarImg = document.getElementById('userAvatar');
       const avatarText = document.getElementById('userAvatarText');
       
       if (url) {
         if (avatarImg) {
           avatarImg.src = url;
           avatarImg.style.display = 'block';
           avatarImg.onerror = () => {
             avatarImg.style.display = 'none';
             if (avatarText) avatarText.style.display = 'flex';
           };
         }
         if (avatarText) avatarText.style.display = 'none';
       } else {
         if (avatarImg) avatarImg.style.display = 'none';
         if (avatarText) avatarText.style.display = 'flex';
       }
     });
   }

   // Theme toggle functionality
   const userThemeToggle = document.getElementById('userThemeToggle');
   if (userThemeToggle) {
     userThemeToggle.addEventListener('click', () => {
       const html = document.documentElement;
       const currentTheme = html.getAttribute('data-theme') || 'light';
       const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

       html.classList.remove('dark', 'light');
       html.classList.add(newTheme);
       html.setAttribute('data-theme', newTheme);
       localStorage.setItem('theme', newTheme);

       // Update button text
       userThemeToggle.textContent = newTheme === 'dark' ? '🌙 Toggle Dark Mode' : '☀️ Toggle Light Mode';
       userThemeToggle.setAttribute('data-i18n', newTheme === 'dark' ? 'toggle_theme' : 'toggle_theme');

       showToast(`Switched to ${newTheme} mode`, 'success');
     });
   }

   // Logout button in settings
   const settingsLogoutBtn = document.getElementById('logoutBtn');
   if (settingsLogoutBtn) {
     settingsLogoutBtn.addEventListener('click', async () => {
       try {
         await supabase.auth.signOut();
         showToast('Logged out successfully', 'success');
         setTimeout(() => (window.location.href = 'index.html'), 1000);
       } catch (error) {
         console.error('Error signing out:', error);
         showToast('Error signing out', 'error');
       }
     });
   }

   // Delete account functionality
   const deleteAccountBtn = document.getElementById('deleteAccountBtn');
   if (deleteAccountBtn) {
     deleteAccountBtn.addEventListener('click', async () => {
       const confirmed = confirm('Are you sure you want to delete your account? This action cannot be undone.');
       if (!confirmed) return;

       try {
         const { data } = await supabase.auth.getUser();
         const user = data ? data.user : null;
         if (!user) return;

         // Delete user profile first
         await supabase.from('users').delete().eq('id', user.id);

         // Delete auth user
         await supabase.auth.admin.deleteUser(user.id);

         showToast('Account deleted successfully', 'success');
         setTimeout(() => (window.location.href = 'index.html'), 1000);
       } catch (error) {
         console.error('Error deleting account:', error);
         showToast('Error deleting account', 'error');
       }
     });
   }

   loadUserSettings();
}

// Sell page functions
function initializeSellPage() {
  if (!document.getElementById('sellForm')) return;

  async function checkAuth() {
    const { data } = await supabase.auth.getUser();
    const user = data ? data.user : null;
    if (!user) {
      showToast('You must be logged in to sell items.', 'error');
      setTimeout(() => (window.location.href = 'login.html'), 2000);
    }
  }

  checkAuth();

  const sellForm = document.getElementById('sellForm');
  if (sellForm) {
    sellForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const { data } = await supabase.auth.getUser();
      const user = data ? data.user : null;
      if (!user) {
        showToast(i18n.t ? i18n.t('loginFirst') : 'Please log in first', 'error');
        return;
      }

      const productData = {
        name: document.getElementById('productNameInput')?.value || '',
        category: document.getElementById('productCategoryInput')?.value || '',
        price: parseFloat(document.getElementById('productPriceInput')?.value || '0'),
        description: document.getElementById('productDescriptionInput')?.value || '',
        image_url: document.getElementById('productImageInput')?.value || '',
        stock: parseInt(document.getElementById('productStockInput')?.value || '1'),
        condition: document.getElementById('productConditionInput')?.value || '',
        location: document.getElementById('productLocationInput')?.value || ''
      };

      try {
        const mod = await import('./supabase.js');
        if (mod && typeof mod.listProduct === 'function') {
          const result = await mod.listProduct(productData, user.id);
          if (result) {
            showToast('Product listed successfully!', 'success');
            e.target.reset();
            // optionally refresh listings
          } else {
            showToast('Error listing product', 'error');
          }
        } else {
          throw new Error('listProduct helper not found');
        }
      } catch (error) {
        console.error('Error listing product:', error);
        showToast('Error listing product: ' + (error.message || ''), 'error');
      }
    });
  }
}

// Login page functions
function initializeLoginPage() {
  if (!document.getElementById('loginForm')) return;

  const loginForm = document.getElementById('loginForm');
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('emailInput')?.value.trim() || '';
    const password = document.getElementById('passwordInput')?.value || '';

    if (!email || !password) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    try {
      const mod = await import('./supabase.js');
      if (mod && typeof mod.loginUser === 'function') {
        const result = await mod.loginUser(email, password);
        if (result && result.error) {
          showToast('Login failed: ' + (result.error.message || result.error), 'error');
          return;
        }
        // If sign in succeeded, redirect
        window.location.href = 'index.html';
      } else {
        // fallback to supabase auth
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          showToast('Login failed: ' + error.message, 'error');
          return;
        }
        window.location.href = 'index.html';
      }
    } catch (error) {
      console.error('Login error:', error);
      showToast('Login failed. Please try again.', 'error');
    }
  });
}

// Register page functions
function initializeRegisterPage() {
  if (!document.getElementById('registerForm')) return;

  const registerForm = document.getElementById('registerForm');
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('usernameInput')?.value.trim() || '';
    const email = document.getElementById('emailInput')?.value.trim() || '';
    const password = document.getElementById('passwordInput')?.value || '';
    const confirmPassword = document.getElementById('confirmPasswordInput')?.value || '';

    if (password !== confirmPassword) {
      showToast(i18n.t ? i18n.t('passwords_not_match') || 'Passwords do not match' : 'Passwords do not match', 'error');
      return;
    }

    if (password.length < 6) {
      showToast(i18n.t ? i18n.t('password_too_short') || 'Password must be at least 6 characters' : 'Password must be at least 6 characters', 'error');
      return;
    }

    try {
      const result = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username
          }
        }
      });

      // supabase v2 returns error property on result
      if (result.error) throw result.error;

      showToast(i18n.t ? i18n.t('registration_success') || 'Registration successful! Please check your email to verify your account.' : 'Registration successful! Please check your email to verify your account.');
      window.location.href = 'login.html';
    } catch (error) {
      console.error('Registration error:', error);
      showToast(error.message || 'Registration failed. Please try again.', 'error');
    }
  });
}

// Balance page functions
function initializeBalancePage() {
  if (!document.getElementById('currentBalance')) return;

  async function loadUserBalance() {
    try {
      const { data } = await supabase.auth.getUser();
      const user = data ? data.user : null;
      if (!user) return;

      const resp = await supabase.from('users').select('balance').eq('id', user.id).single();
      const el = document.getElementById('currentBalance');
      if (!resp.error && resp.data) {
        const balance = parseFloat(resp.data.balance || 0);
        if (el) el.innerText = `€${balance.toFixed(2)}`;
      } else {
        if (el) el.innerText = '€0.00';
      }
      loadTransactions(user.id);
    } catch (error) {
      console.error('Error loading user balance:', error);
    }
  }

  const addFundsBtn = document.getElementById('addFundsBtn');
  if (addFundsBtn) {
    addFundsBtn.addEventListener('click', async () => {
      const amountInput = document.getElementById('fundAmount');
      const amount = parseFloat(amountInput?.value || '0');
      if (isNaN(amount) || amount <= 0) {
        showToast('Enter a valid amount', 'error');
        return;
      }

      const { data } = await supabase.auth.getUser();
      const user = data ? data.user : null;
      if (!user) {
        showToast('Please login first', 'error');
        return;
      }

      try {
        const mod = await import('./supabase.js');
        if (mod && typeof mod.addBalance === 'function') {
          await mod.addBalance(user.id, amount);
          await loadUserBalance();
          if (amountInput) amountInput.value = '';
          showToast('Funds added successfully!', 'success');
        } else {
          throw new Error('addBalance helper not found');
        }
      } catch (error) {
        console.error('Failed to add funds:', error);
        showToast('Failed to add funds', 'error');
      }
    });
  }

  async function loadTransactions(userId) {
    try {
      const { data, error } = await supabase.from('user_transactions').select().eq('user_id', userId).order('created_at', { ascending: false });
      const container = document.getElementById('transactionHistory');
      if (!container) return;
      container.innerHTML = '';
      if (!error && data && data.length) {
        data.forEach(tx => {
          const div = document.createElement('div');
          div.className = 'transaction-item';
          const typeIcon = tx.transaction_type === 'deposit' ? '➕' : '➖';
          const amt = Number.isFinite(Number(tx.amount)) ? Math.abs(Number(tx.amount)).toFixed(2) : '0.00';
          const when = tx.created_at ? new Date(tx.created_at).toLocaleString() : '';
          div.innerHTML = `<span>${typeIcon} €${amt}</span> <span>${when}</span>`;
          container.appendChild(div);
        });
      } else {
        container.innerHTML = `<p data-i18n="no_tx">No transactions yet.</p>`;
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  }

  loadUserBalance();
}

// ============================
// INITIALIZATION
// ============================

document.addEventListener('DOMContentLoaded', () => {
  // Initialize common functionality
  initializeNavigation();
  initializeAuth();
  initializeTheme();
  initializeLanguage();

  // Initialize page-specific functionality
  // These functions already guard by checking for page-specific elements
  initializeIndexPage();
  initializeSettingsPage();
  initializeSellPage();
  initializeLoginPage();
  initializeRegisterPage();
  initializeBalancePage();
});

// Export for potential use in other modules
export { showToast, updateNavbarAuth };
