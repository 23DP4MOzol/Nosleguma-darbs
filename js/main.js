// =======================================
// MAIN.JS - Consolidated JavaScript for all pages
// =======================================

import { supabase } from './supabase.js';
import { i18n } from './i18n.js';

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

    if (user) {
      if (loginBtn) loginBtn.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = 'inline-block';
      if (balanceBadge) {
        balanceBadge.style.display = 'flex';
        const span = balanceBadge.querySelector('span');
        try {
          const { data: userData, error } = await supabase
            .from('users')
            .select('balance')
            .eq('id', user.id)
            .single();
          if (!error && userData) {
            const bal = parseFloat(userData.balance || 0);
            if (span) span.textContent = `€${bal.toFixed(2)}`;
          } else {
            if (span) span.textContent = '€0.00';
          }
        } catch (err) {
          if (span) span.textContent = '€0.00';
        }
      }

      if (sellBtn) {
        sellBtn.style.opacity = '1';
        sellBtn.style.pointerEvents = 'auto';
      }
      if (settingsBtn) {
        settingsBtn.style.opacity = '1';
        settingsBtn.style.pointerEvents = 'auto';
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
        settingsBtn.style.opacity = '0.6';
        settingsBtn.style.pointerEvents = 'none';
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

  // Product rendering
  let allProducts = [];
  let currentCategory = 'all';

  async function loadProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      allProducts = Array.isArray(data) ? data : [];
      renderProducts();
      updateStats();
    } catch (error) {
      console.error('Error loading products:', error);
      showToast(i18n.t ? i18n.t('error_loading_products') || 'Error loading products' : 'Error loading products', 'error');
    }
  }

  function renderProducts() {
    const grid = document.getElementById('productGrid');
    if (!grid) return;

    const filtered = currentCategory === 'all'
      ? allProducts
      : allProducts.filter(p => (p.category || '').toLowerCase() === (currentCategory || '').toLowerCase());

    if (!filtered || filtered.length === 0) {
      grid.innerHTML = `<div style="padding:40px;text-align:center;grid-column:1/-1;color:var(--muted);">
        <span data-i18n="no_products">No products found</span>
      </div>`;
      if (i18n && typeof i18n.setLang === 'function') i18n.setLang(i18n.lang || 'en');
      return;
    }

    grid.innerHTML = '';

    filtered.forEach(product => {
      const imageUrl = product.image_url || 'https://via.placeholder.com/600x400';
      const price = Number.isFinite(Number(product.price)) ? parseFloat(product.price).toFixed(2) : '0.00';
      const stock = product.stock != null ? product.stock : 0;
      const categoryText = escapeHtml(product.category || 'other');
      const nameText = escapeHtml(product.name || 'Unnamed Product');

      const card = document.createElement('div');
      card.className = 'product-card-modern';
      card.innerHTML = `
        <div class="product-image-container">
          <img src="${escapeHtml(imageUrl)}" alt="${nameText}" class="product-image">
          <button class="product-like-btn" data-id="${escapeHtml(product.id)}" aria-label="Like">❤️</button>
          ${product.is_reserved ? `<span class="product-badge-new" data-i18n="reserved">Reserved</span>` : ''}
          <div class="product-overlay">
            <button class="btn-quick-view" data-id="${escapeHtml(product.id)}" data-i18n="quickView">Quick View</button>
          </div>
        </div>
        <div class="product-info">
          <span class="product-category">${categoryText}</span>
          <h3 class="product-name">${nameText}</h3>
          <div class="product-meta">
            <span class="product-views">👁 ${escapeHtml(stock)} <span data-i18n="stock">stock</span></span>
          </div>
          <div class="product-footer">
            <div class="product-price">
              <span class="price-currency">€</span>
              <span class="price-amount">${price}</span>
            </div>
            <div class="product-actions">
              ${!product.is_reserved ? `
                <button class="btn-add-cart" data-id="${escapeHtml(product.id)}" title="Reserve">🔖</button>
                <button class="btn-buy-now" data-id="${escapeHtml(product.id)}" data-i18n="buyNow">Buy Now</button>
              ` : `
                <button class="btn-buy-now" disabled style="opacity:0.5" data-i18n="reserved">Reserved</button>
              `}
            </div>
          </div>
        </div>
      `;
      grid.appendChild(card);
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

  function showProductModal(product) {
    // lightweight quick view — replace with real modal in your app if needed
    const details = [
      `Product: ${product.name || 'Unnamed'}`,
      `Price: €${Number.isFinite(Number(product.price)) ? parseFloat(product.price).toFixed(2) : '0.00'}`,
      `Category: ${product.category || 'N/A'}`,
      `Stock: ${product.stock != null ? product.stock : 'N/A'}`,
      `Description: ${product.description || 'No description'}`,
      product.is_reserved ? 'Status: RESERVED' : 'Status: Available'
    ].join('\n');
    // Use alert as simple fallback
    alert(details);
  }

  // Filter tabs
  const filterTabs = document.querySelectorAll('.filter-tab');
  if (filterTabs && filterTabs.length) {
    filterTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentCategory = tab.dataset.category || 'all';
        renderProducts();
      });
    });
  }

  // Hero buttons
  document.querySelector('.btn-hero-primary')?.addEventListener('click', () => {
    document.querySelector('.main-container')?.scrollIntoView({ behavior: 'smooth' });
  });

  document.querySelector('.btn-hero-secondary')?.addEventListener('click', () => {
    document.querySelector('.features-section')?.scrollIntoView({ behavior: 'smooth' });
  });

  // Load products on page load
  loadProducts();
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

       const resp = await supabase.from('users').select('balance,email').eq('id', user.id).single();
       if (resp.error) {
         console.error('Error loading user settings:', resp.error);
         return;
       }
       const dataRow = resp.data;
       const emailEl = document.getElementById('userEmail');
       const balanceEl = document.getElementById('userBalance');

       if (emailEl) emailEl.value = dataRow.email || '';
       if (balanceEl) balanceEl.value = `€${Number.isFinite(Number(dataRow.balance)) ? parseFloat(dataRow.balance).toFixed(2) : '0.00'}`;
     } catch (error) {
       console.error('Error in loadUserSettings:', error);
     }
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
       userThemeToggle.textContent = newTheme === 'dark' ? '🌙' : '☀️';
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
        stock: parseInt(document.getElementById('productStockInput')?.value || '1')
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
