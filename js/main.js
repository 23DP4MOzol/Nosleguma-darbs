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
      gap: '8px'
    });
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.textContent = message;
  Object.assign(toast.style, {
    background: type === 'error' ? '#fee2e2' : '#ecfdf5',
    color: type === 'error' ? '#ef4444' : '#065f46',
    padding: '12px 16px',
    borderRadius: '12px',
    boxShadow: '0 6px 18px rgba(0,0,0,0.1)',
    fontWeight: '600',
    fontSize: '14px',
    animation: 'slideIn 0.3s ease-out'
  });

  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function escapeHtml(str = '') {
  return String(str).replace(/[&<>"']/g, s => ({'&':'&','<':'<','>':'>','"':'"',"'":'''}[s]));
}

// ============================
// THEME MANAGEMENT
// ============================

function initializeTheme() {
  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.classList.add(savedTheme);
  document.documentElement.setAttribute("data-theme", savedTheme);

  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    themeToggle.textContent = savedTheme === "dark" ? "☀️" : "🌙";
    themeToggle.addEventListener("click", toggleTheme);
  }

  // Also handle user theme toggle in settings
  const userThemeToggle = document.getElementById('userThemeToggle');
  if (userThemeToggle) {
    userThemeToggle.textContent = savedTheme === "dark" ? "☀️" : "🌙";
    userThemeToggle.addEventListener('click', toggleTheme);
  }
}

function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute("data-theme") || "light";
  const newTheme = currentTheme === "dark" ? "light" : "dark";

  html.classList.remove("dark", "light");
  html.classList.add(newTheme);
  html.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);

  // Update all theme toggle buttons
  document.querySelectorAll('#themeToggle, #userThemeToggle').forEach(btn => {
    if (btn) btn.textContent = newTheme === "dark" ? "☀️" : "🌙";
  });
}

// ============================
// LANGUAGE MANAGEMENT
// ============================

function initializeLanguage() {
  const savedLang = localStorage.getItem("lang") || "en";
  i18n.setLang(savedLang);

  // Initialize language selectors
  document.querySelectorAll('#langSelect, #userLang').forEach(select => {
    if (select) {
      select.value = savedLang;
      select.addEventListener('change', (e) => {
        const lang = e.target.value;
        localStorage.setItem("lang", lang);
        i18n.setLang(lang);
        // Sync all language selectors
        document.querySelectorAll('#langSelect, #userLang').forEach(s => s.value = lang);
      });
    }
  });
}

// ============================
// AUTHENTICATION MANAGEMENT
// ============================

async function updateNavbarAuth() {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    const loginBtn = document.getElementById("loginBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const balanceBadge = document.getElementById("balanceBadge");
    const sellBtn = document.getElementById("sellBtn");
    const settingsBtn = document.getElementById("settingsBtn");

    if (user) {
      // User is logged in
      if (loginBtn) loginBtn.style.display = "none";
      if (logoutBtn) logoutBtn.style.display = "inline-block";
      if (balanceBadge) {
        balanceBadge.style.display = "flex";

        // Fetch user balance from database
        const { data: userData, error } = await supabase
          .from("users")
          .select("balance")
          .eq("id", user.id)
          .single();

        if (userData && !error) {
          balanceBadge.querySelector("span").textContent = `€${parseFloat(userData.balance || 0).toFixed(2)}`;
        } else {
          balanceBadge.querySelector("span").textContent = "€0.00";
        }
      }

      // Enable sell button and settings button
      if (sellBtn) {
        sellBtn.style.opacity = "1";
        sellBtn.style.pointerEvents = "auto";
      }
      if (settingsBtn) {
        settingsBtn.style.opacity = "1";
        settingsBtn.style.pointerEvents = "auto";
      }
    } else {
      // User is not logged in
      if (loginBtn) loginBtn.style.display = "inline-block";
      if (logoutBtn) logoutBtn.style.display = "none";
      if (balanceBadge) balanceBadge.style.display = "none";

      // Disable sell button and settings button visually
      if (sellBtn) {
        sellBtn.style.opacity = "0.6";
        sellBtn.style.pointerEvents = "none";
      }
      if (settingsBtn) {
        settingsBtn.style.opacity = "0.6";
        settingsBtn.style.pointerEvents = "none";
      }
    }
  } catch (error) {
    console.error("Error updating navbar auth:", error);
  }
}

function initializeAuth() {
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const sellBtn = document.getElementById("sellBtn");
  const settingsBtn = document.getElementById("settingsBtn");

  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      window.location.href = "login.html";
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await supabase.auth.signOut();
        window.location.href = "index.html";
      } catch (error) {
        console.error("Error signing out:", error);
      }
    });
  }

  if (sellBtn) {
    sellBtn.addEventListener("click", async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        window.location.href = "sell.html";
      } else {
        showToast(i18n.t("loginFirst"), 'error');
        setTimeout(() => window.location.href = "login.html", 1500);
      }
    });
  }

  if (settingsBtn) {
    settingsBtn.addEventListener("click", async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        window.location.href = "settings.html";
      } else {
        showToast(i18n.t("loginFirst"), 'error');
        setTimeout(() => window.location.href = "login.html", 1500);
      }
    });
  }

  // Listen for auth state changes
  supabase.auth.onAuthStateChange((event, session) => {
    updateNavbarAuth();
  });

  updateNavbarAuth();
}

// ============================
// NAVIGATION MANAGEMENT
// ============================

function initializeNavigation() {
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const navbarLinks = document.querySelector(".navbar-links");

  if (hamburgerBtn && navbarLinks) {
    hamburgerBtn.addEventListener("click", () => {
      navbarLinks.classList.toggle("active");
    });
  }

  // Close navbar when clicking outside
  document.addEventListener("click", (e) => {
    if (navbarLinks && hamburgerBtn) {
      if (!navbarLinks.contains(e.target) && !hamburgerBtn.contains(e.target)) {
        navbarLinks.classList.remove("active");
      }
    }
  });

  // Close navbar when resizing to desktop
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768 && navbarLinks) {
      navbarLinks.classList.remove("active");
    }
  });
}

// ============================
// PAGE-SPECIFIC FUNCTIONS
// ============================

// Index page functions
async function initializeIndexPage() {
  if (!document.querySelector('.product-grid-modern')) return;

  // Initialize theme and language
  initializeTheme();
  initializeLanguage();

  // Stats updater
  async function updateStats() {
    try {
      const { count: productsCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
      const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
      const { count: sellersCount } = await supabase.from('products').select('seller_id', { count: 'exact', head: true });

      document.getElementById('statsProducts').textContent = productsCount || '0';
      document.getElementById('statsUsers').textContent = usersCount || '0';
      document.getElementById('statsSellers').textContent = sellersCount || '0';
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  }

  // Product rendering
  let allProducts = [];
  let currentCategory = 'all';

  async function loadProducts() {
    try {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      allProducts = data || [];
      renderProducts();
      updateStats();
    } catch (error) {
      console.error('Error loading products:', error);
      showToast('Error loading products', 'error');
    }
  }

  function renderProducts() {
    const grid = document.getElementById('productGrid');
    const filtered = currentCategory === 'all'
      ? allProducts
      : allProducts.filter(p => p.category === currentCategory);

    if (filtered.length === 0) {
      grid.innerHTML = `<div style="padding:40px;text-align:center;grid-column:1/-1;color:var(--muted);">
        <span data-i18n="no_products">No products found</span>
      </div>`;
      i18n.setLang(i18n.lang);
      return;
    }

    grid.innerHTML = '';

    filtered.forEach(product => {
      const card = document.createElement('div');
      card.className = 'product-card-modern';
      card.innerHTML = `
        <div class="product-image-container">
          <img src="${product.image_url || 'https://via.placeholder.com/600x400'}" alt="${escapeHtml(product.name)}" class="product-image">
          <button class="product-like-btn" data-id="${product.id}">❤️</button>
          ${product.is_reserved ? `<span class="product-badge-new" data-i18n="reserved">Reserved</span>` : ''}
          <div class="product-overlay">
            <button class="btn-quick-view" data-id="${product.id}" data-i18n="quickView">Quick View</button>
          </div>
        </div>
        <div class="product-info">
          <span class="product-category">${escapeHtml(product.category || 'other')}</span>
          <h3 class="product-name">${escapeHtml(product.name)}</h3>
          <div class="product-meta">
            <span class="product-views">👁 ${product.stock || 0} <span data-i18n="stock">stock</span></span>
          </div>
          <div class="product-footer">
            <div class="product-price">
              <span class="price-currency">€</span>
              <span class="price-amount">${parseFloat(product.price).toFixed(2)}</span>
            </div>
            <div class="product-actions">
              ${!product.is_reserved ? `
                <button class="btn-add-cart" data-id="${product.id}" title="Reserve">🔖</button>
                <button class="btn-buy-now" data-id="${product.id}" data-i18n="buyNow">Buy Now</button>
              ` : `
                <button class="btn-buy-now" disabled style="opacity:0.5" data-i18n="reserved">Reserved</button>
              `}
            </div>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });

    // Apply translations to newly rendered elements
    i18n.setLang(i18n.lang);

    // Add event listeners
    addProductEventListeners();
  }

  function addProductEventListeners() {
    // Buy Now buttons
    document.querySelectorAll('.btn-buy-now:not([disabled])').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const productId = e.currentTarget.dataset.id;
        await handlePurchase(productId);
      });
    });

    // Reserve buttons (cart icon)
    document.querySelectorAll('.btn-add-cart').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const productId = e.currentTarget.dataset.id;
        await handleReserve(productId);
      });
    });

    // Quick View buttons
    document.querySelectorAll('.btn-quick-view').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const productId = e.currentTarget.dataset.id;
        const product = allProducts.find(p => p.id === productId);
        if (product) {
          showProductModal(product);
        }
      });
    });
  }

  async function handlePurchase(productId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showToast(i18n.t('loginFirst'), 'error');
      setTimeout(() => window.location.href = 'login.html', 1500);
      return;
    }

    try {
      const { purchaseProduct } = await import('./supabase.js');
      await purchaseProduct(productId, user.id);
      showToast(i18n.t('purchaseComplete'), 'success');
      loadProducts();
      updateNavbarAuth();
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  async function handleReserve(productId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showToast(i18n.t('loginFirst'), 'error');
      setTimeout(() => window.location.href = 'login.html', 1500);
      return;
    }

    try {
      const { reserveProduct } = await import('./supabase.js');
      await reserveProduct(productId, user.id, 0.20);
      showToast('Product reserved successfully!', 'success');
      loadProducts();
      updateNavbarAuth();
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  function showProductModal(product) {
    const details = `
Product: ${product.name}
Price: €${parseFloat(product.price).toFixed(2)}
Category: ${product.category}
Stock: ${product.stock}
Description: ${product.description || 'No description'}
${product.is_reserved ? 'Status: RESERVED' : 'Status: Available'}
    `;
    alert(details);
  }

  // Filter tabs
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentCategory = tab.dataset.category;
      renderProducts();
    });
  });

  // Hero buttons
  document.querySelector('.btn-hero-primary')?.addEventListener('click', () => {
    document.querySelector('.main-container').scrollIntoView({ behavior: 'smooth' });
  });

  document.querySelector('.btn-hero-secondary')?.addEventListener('click', () => {
    document.querySelector('.features-section').scrollIntoView({ behavior: 'smooth' });
  });

  // Load products on page load
  loadProducts();
}

// Settings page functions
function initializeSettingsPage() {
  if (!document.getElementById('userEmail')) return;

  // Load user data
  async function loadUserSettings() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showToast('You must be logged in to access settings.', 'error');
      setTimeout(() => window.location.href = 'login.html', 2000);
      return;
    }

    const { data } = await supabase.from('users').select('balance,email').eq('id', user.id).single();
    if (data) {
      document.getElementById('userEmail').value = data.email;
      document.getElementById('userBalance').value = `€${parseFloat(data.balance).toFixed(2)}`;
    }
  }

  loadUserSettings();
}

// Sell page functions
function initializeSellPage() {
  if (!document.getElementById('sellForm')) return;

  // Check auth
  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showToast('You must be logged in to sell items.', 'error');
      setTimeout(() => window.location.href = 'login.html', 2000);
    }
  }

  checkAuth();

  // Form submission
  document.getElementById('sellForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showToast(i18n.t('loginFirst'), 'error');
      return;
    }

    const productData = {
      name: document.getElementById('productNameInput').value,
      category: document.getElementById('productCategoryInput').value,
      price: parseFloat(document.getElementById('productPriceInput').value),
      description: document.getElementById('productDescriptionInput').value,
      image_url: document.getElementById('productImageInput').value
    };

    try {
      const { listProduct } = await import('./supabase.js');
      const result = await listProduct(productData, user.id);
      if (result) {
        showToast('Product listed successfully!', 'success');
        e.target.reset();
      } else {
        showToast('Error listing product', 'error');
      }
    } catch (error) {
      console.error('Error listing product:', error);
      showToast('Error listing product: ' + error.message, 'error');
    }
  });
}

// Login page functions
function initializeLoginPage() {
  if (!document.getElementById('loginForm')) return;

  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('emailInput').value.trim();
    const password = document.getElementById('passwordInput').value;

    if (!email || !password) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    try {
      const { loginUser } = await import('./supabase.js');
      const result = await loginUser(email, password);
      if (result.error) {
        showToast('Login failed: ' + result.error.message, 'error');
        return;
      }

      window.location.href = 'index.html';
    } catch (error) {
      console.error('Login error:', error);
      showToast('Login failed. Please try again.', 'error');
    }
  });
}

// Register page functions
function initializeRegisterPage() {
  if (!document.getElementById('registerForm')) return;

  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('usernameInput').value.trim();
    const email = document.getElementById('emailInput').value.trim();
    const password = document.getElementById('passwordInput').value;
    const confirmPassword = document.getElementById('confirmPasswordInput').value;

    if (password !== confirmPassword) {
      showToast(i18n.t('passwords_not_match') || 'Passwords do not match', 'error');
      return;
    }

    if (password.length < 6) {
      showToast(i18n.t('password_too_short') || 'Password must be at least 6 characters', 'error');
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

      if (result.error) throw result.error;

      showToast(i18n.t('registration_success') || 'Registration successful! Please check your email to verify your account.');
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
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('users').select('balance').eq('id', user.id).single();
      if (data) {
        const balance = parseFloat(data.balance);
        document.getElementById('currentBalance').innerText = `€${balance.toFixed(2)}`;
      }
      loadTransactions(user.id);
    }
  }

  document.getElementById('addFundsBtn').addEventListener('click', async () => {
    const amount = parseFloat(document.getElementById('fundAmount').value);
    if (isNaN(amount) || amount <= 0) {
      showToast("Enter a valid amount", 'error');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showToast("Please login first", 'error');
      return;
    }

    try {
      const { addBalance } = await import('./supabase.js');
      await addBalance(user.id, amount);
      loadUserBalance();
      document.getElementById('fundAmount').value = '';
      showToast('Funds added successfully!', 'success');
    } catch (error) {
      showToast('Failed to add funds', 'error');
    }
  });

  async function loadTransactions(userId) {
    const { data, error } = await supabase.from('user_transactions').select().eq('user_id', userId).order('created_at', { ascending: false });
    const container = document.getElementById('transactionHistory');
    container.innerHTML = '';
    if (data && data.length) {
      data.forEach(tx => {
        const div = document.createElement('div');
        div.className = 'transaction-item';
        div.innerHTML = `<span>${tx.transaction_type === 'deposit' ? '➕' : '➖'} €${Math.abs(tx.amount).toFixed(2)}</span> <span>${new Date(tx.created_at).toLocaleString()}</span>`;
        container.appendChild(div);
      });
    } else {
      container.innerHTML = `<p data-i18n="no_tx">No transactions yet.</p>`;
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

  // Initialize page-specific functionality
  initializeIndexPage();
  initializeSettingsPage();
  initializeSellPage();
  initializeLoginPage();
  initializeRegisterPage();
  initializeBalancePage();
});

// Export for potential use in other modules
export { showToast, updateNavbarAuth };