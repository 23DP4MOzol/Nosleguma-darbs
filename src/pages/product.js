import { supabase, addToFavorites, removeFromFavorites, getUserFavorites } from '../supabase.js';
import { i18n } from '../i18n.js';

// ============================
// Authentication Check - Redirect guests to login
// ============================
async function checkAuth() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // User is not logged in, redirect to login page
    const redirectUrl = window.location.href;
    const reason = 'products';
    window.location.href = `login.html?redirect=${encodeURIComponent(redirectUrl)}&reason=${reason}`;
    return false;
  }
  return user;
}

// ============================
// Language and Theme Setup (handled globally in i18n.js)
// ============================
document.getElementById('langSelect').addEventListener('change', e => {
  i18n.setLang(e.target.value);
});

// Theme toggle is handled by centralized theme.js

// ============================
// Hamburger Mobile Menu
// ============================
document.getElementById('hamburgerBtn').addEventListener('click', () => {
  document.querySelector('.navbar-links').classList.toggle('active');
});

// ============================
// Supabase Auth
// ============================
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const balanceBadge = document.getElementById('balanceBadge');

let currentUser = null;

async function loadUser() {
  const { data: { user } } = await supabase.auth.getUser();
  currentUser = user;
  if(user) {
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'flex';
    const { data } = await supabase.from('users').select('balance').eq('id', user.id).single();
    balanceBadge.querySelector('span').innerText = `€${parseFloat(data.balance).toFixed(2)}`;

    // Show favorites tab for logged-in users
    document.getElementById('favoritesTab').style.display = 'inline-flex';
  } else {
    loginBtn.style.display = 'flex';
    logoutBtn.style.display = 'none';
    document.getElementById('favoritesTab').style.display = 'none';
  }
}

loginBtn.addEventListener('click', async () => {
  window.location.href = 'login.html';
});

logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
  window.location.href = 'index.html';
});

// ============================
// Product Management
// ============================
let currentFilter = 'all';
let allProducts = [];
let userFavorites = new Set();

// Load products based on current filter
async function loadProducts() {
  if (!currentUser) {
    document.getElementById('productGrid').innerHTML = '<div style="padding:20px;text-align:center;grid-column:1/-1;color:var(--muted);">Please log in to view your products.</div>';
    return;
  }

  try {
    let products = [];

    if (currentFilter === 'favorites') {
      // Load user's favorite products
      try {
        const { data: favorites } = await supabase
          .from('favorites')
          .select('product_id')
          .eq('user_id', currentUser.id);

        if (favorites && favorites.length > 0) {
          const productIds = favorites.map(f => f.product_id);
          const { data: favProducts } = await supabase
            .from('products')
            .select(`
              *,
              seller:users!seller_id(username, avatar_url)
            `)
            .in('id', productIds);

          products = favProducts || [];
        }
      } catch (error) {
        console.warn('Favorites functionality not available:', error);
        products = [];
      }
    } else {
      // Load user's own products or all products based on filter
      let query = supabase
        .from('products')
        .select(`
          *,
          seller:users!seller_id(username, avatar_url)
        `);

      if (currentFilter === 'active') {
        query = query.eq('seller_id', currentUser.id).gt('stock', 0);
      } else if (currentFilter === 'sold') {
        query = query.eq('seller_id', currentUser.id).eq('stock', 0);
      } else {
        // 'all' - show user's products
        query = query.eq('seller_id', currentUser.id);
      }

      const { data } = await query.order('created_at', { ascending: false });
      products = data || [];
    }

    allProducts = products;
    displayProducts(products);

    // Load user's favorites for heart icons
    if (currentUser) {
      try {
        const { data: favorites } = await supabase
          .from('favorites')
          .select('product_id')
          .eq('user_id', currentUser.id);

        userFavorites = new Set(favorites?.map(f => f.product_id) || []);
      } catch (error) {
        console.warn('Favorites table may not exist yet:', error);
        userFavorites = new Set();
      }
    }

  } catch (error) {
    console.error('Error loading products:', error);
    document.getElementById('productGrid').innerHTML = '<div style="padding:20px;text-align:center;grid-column:1/-1;color:var(--error);">Error loading products.</div>';
  }
}

// Display products in grid
function displayProducts(products) {
  const grid = document.getElementById('productGrid');
  const emptyState = document.getElementById('emptyState');

  if (products.length === 0) {
    grid.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }

  grid.style.display = 'grid';
  emptyState.style.display = 'none';

  grid.innerHTML = products.map(product => `
    <div class="product-card-modern" data-product-id="${product.id}">
      <div class="product-image-container">
        <img src="${product.image_url || 'https://placehold.co/400x300/667eea/white?text=No+Image'}" alt="${product.name}" class="product-image">
        <button class="product-like-btn ${userFavorites.has(product.id) ? 'liked' : ''}" data-product-id="${product.id}">
          ${userFavorites.has(product.id) ? '❤️' : '🤍'}
        </button>
        <div class="product-overlay">
          <button class="btn-quick-view" data-product-id="${product.id}">Quick View</button>
        </div>
      </div>
      <div class="product-info">
        <div class="product-seller" style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.5rem;">
          <div class="seller-avatar" style="width:24px; height:24px; border-radius:50%; background:linear-gradient(135deg,#667eea,#764ba2); display:flex; align-items:center; justify-content:center; font-size:12px; color:white; font-weight:600;" onclick="showUserProfile('${product.seller_id}')">
            ${product.seller?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span class="seller-name" style="font-size:0.875rem; color:var(--muted); cursor:pointer;" onclick="showUserProfile('${product.seller_id}')">
            ${product.seller?.username || 'Unknown'}
          </span>
        </div>
        <h3 class="product-name">${product.name}</h3>
        <div class="product-meta">
          <span class="product-rating">⭐ ${product.condition || 'N/A'}</span>
          <span class="product-views">📦 ${product.stock || 0}</span>
        </div>
        <p class="product-description">${product.description || 'No description available.'}</p>
        <div class="product-footer">
          <div class="product-price">
            ${product.original_price && product.original_price > product.price ?
              `<span class="price-original">€${parseFloat(product.original_price).toFixed(2)}</span>` : ''}
            <span class="price-currency">€</span>
            <span class="price-amount">${parseFloat(product.price).toFixed(2)}</span>
          </div>
          <div class="product-actions">
            ${product.seller_id === currentUser?.id ?
              `<button class="btn-edit" data-product-id="${product.id}">✏️</button>
               <button class="btn-delete" data-product-id="${product.id}">🗑️</button>` :
              `<button class="btn-add-cart" data-product-id="${product.id}">🛒</button>
               <button class="btn-buy-now" data-product-id="${product.id}">Buy Now</button>`
            }
          </div>
        </div>
      </div>
    </div>
  `).join('');

  // Add event listeners
  attachProductEventListeners();
}

// Attach event listeners to product cards
function attachProductEventListeners() {
  // Favorite buttons
  document.querySelectorAll('.product-like-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const productId = btn.dataset.productId;
      await toggleFavorite(productId);
    });
  });

  // Quick view buttons
  document.querySelectorAll('.btn-quick-view').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const productId = btn.dataset.productId;
      showProductModal(productId);
    });
  });

  // Buy/Add to cart buttons
  document.querySelectorAll('.btn-buy-now, .btn-add-cart').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const productId = btn.dataset.productId;
      const action = btn.classList.contains('btn-buy-now') ? 'buy' : 'cart';
      handleProductAction(productId, action);
    });
  });

  // Edit/Delete buttons (for own products)
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const productId = btn.dataset.productId;
      editProduct(productId);
    });
  });

  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const productId = btn.dataset.productId;
      deleteProduct(productId);
    });
  });
}

// Toggle favorite status
async function toggleFavorite(productId) {
  if (!currentUser) {
    alert('Please log in to add favorites');
    return;
  }

  try {
    const isFavorited = userFavorites.has(productId);

    if (isFavorited) {
      // Remove from favorites
      await removeFromFavorites(currentUser.id, productId);
      userFavorites.delete(productId);
    } else {
      // Add to favorites
      await addToFavorites(currentUser.id, productId);
      userFavorites.add(productId);
    }

    // Update UI
    const btn = document.querySelector(`.product-like-btn[data-product-id="${productId}"]`);
    if (btn) {
      btn.classList.toggle('liked', !isFavorited);
      btn.textContent = !isFavorited ? '❤️' : '🤍';
    }

  } catch (error) {
    console.error('Error toggling favorite:', error);
    alert('Favorites functionality is not available yet. Please contact support.');
  }
}

// Show user profile modal
async function showUserProfile(userId) {
  try {
    // Get user profile
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (!user) return;

    // Get user's products
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Build profile HTML
    const profileHtml = `
      <div style="text-align:center; margin-bottom:2rem;">
        <div style="width:80px; height:80px; border-radius:50%; background:linear-gradient(135deg,#667eea,#764ba2); display:flex; align-items:center; justify-content:center; font-size:2rem; color:white; font-weight:700; margin:0 auto 1rem;">
          ${user.username?.charAt(0).toUpperCase() || 'U'}
        </div>
        <h2>${user.username || 'Unknown User'}</h2>
        ${user.bio ? `<p style="color:var(--muted); margin:0.5rem 0;">${user.bio}</p>` : ''}
        <div style="display:flex; justify-content:center; gap:1rem; margin:1rem 0;">
          <div style="text-align:center;">
            <div style="font-weight:700; font-size:1.25rem;">${products?.length || 0}</div>
            <div style="font-size:0.875rem; color:var(--muted);">Products</div>
          </div>
          <div style="text-align:center;">
            <div style="font-weight:700; font-size:1.25rem;">⭐</div>
            <div style="font-size:0.875rem; color:var(--muted);">Rating</div>
          </div>
        </div>
      </div>

      <h3 style="margin-bottom:1rem;">Recent Products</h3>
      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(200px, 1fr)); gap:1rem;">
        ${products?.map(product => `
          <div class="product-card-modern" style="margin:0;">
            <div class="product-image-container">
              <img src="${product.image_url || 'https://placehold.co/200x150/667eea/white?text=No+Image'}" alt="${product.name}" class="product-image">
            </div>
            <div class="product-info" style="padding:1rem;">
              <h4 style="font-size:1rem; margin:0 0 0.5rem 0;">${product.name}</h4>
              <div class="product-price" style="margin-bottom:0.5rem;">
                <span class="price-currency">€</span>
                <span class="price-amount">${parseFloat(product.price).toFixed(2)}</span>
              </div>
              <button class="btn-buy-now" style="width:100%; padding:0.5rem;" data-product-id="${product.id}">View Product</button>
            </div>
          </div>
        `).join('') || '<p style="grid-column:1/-1; text-align:center; color:var(--muted);">No products yet.</p>'}
      </div>
    `;

    document.getElementById('profileModalContent').innerHTML = profileHtml;
    document.getElementById('userProfileModal').style.display = 'flex';

    // Add event listeners for product buttons in modal
    document.querySelectorAll('#profileModalContent .btn-buy-now').forEach(btn => {
      btn.addEventListener('click', () => {
        const productId = btn.dataset.productId;
        document.getElementById('userProfileModal').style.display = 'none';
        showProductModal(productId);
      });
    });

  } catch (error) {
    console.error('Error loading user profile:', error);
  }
}

// Show product modal
function showProductModal(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  // For now, redirect to index.html with product modal
  // In a full implementation, you'd show a detailed modal here
  window.location.href = `index.html?product=${productId}`;
}

// Handle product actions
function handleProductAction(productId, action) {
  // For now, just show alerts
  if (action === 'buy') {
    alert('Purchase functionality would be implemented here');
  } else {
    alert('Add to cart functionality would be implemented here');
  }
}

// Edit product
function editProduct(productId) {
  // Redirect to sell page with edit mode
  window.location.href = `sell.html?edit=${productId}`;
}

// Delete product
import { showConfirmModal, showInfoModal } from '../ui/modal.js';

async function deleteProduct(productId) {
  const confirmed = await showConfirmModal({ title: 'Delete Product', message: 'Are you sure you want to delete this product?', okText: 'Delete', cancelText: 'Cancel' });
  if (!confirmed) return;

  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) throw error;

    // Reload products
    loadProducts();
    await showInfoModal('Product deleted successfully', 'Deleted');

  } catch (error) {
    console.error('Error deleting product:', error);
    await showInfoModal('Error deleting product', 'Error');
  }
}

// Filter tabs
document.querySelectorAll('.filter-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    // Update active tab
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    // Update filter and reload
    currentFilter = tab.dataset.filter;
    loadProducts();
  });
});

// Sell now buttons
document.getElementById('sellNowBtn')?.addEventListener('click', () => {
  window.location.href = 'sell.html';
});

document.getElementById('sellNowEmptyBtn')?.addEventListener('click', () => {
  window.location.href = 'sell.html';
});

// Modal close handlers
document.getElementById('profileModalClose')?.addEventListener('click', () => {
  document.getElementById('userProfileModal').style.display = 'none';
});

document.getElementById('profileModalOverlay')?.addEventListener('click', () => {
  document.getElementById('userProfileModal').style.display = 'none';
});

// ============================
// Initialize Page (after auth check)
// ============================
async function initializePage() {
  currentUser = await checkAuth();
  if (!currentUser) return; // Redirect happened
  
  loadUser().then(() => {
    loadProducts();
  });
}

// Run initialization
initializePage();
