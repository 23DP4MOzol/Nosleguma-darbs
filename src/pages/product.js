import { supabase, addToFavorites, removeFromFavorites, getUserFavorites } from '../supabase.js';
import { i18n } from '../i18n.js';
import { showInfoModal, showConfirmModal } from '../ui/modal.js';

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
let productViewsChannel = null;

function getOrCreateGuestViewerId() {
  try {
    let guestId = localStorage.getItem('vendly_guest_viewer_id');
    if (!guestId) {
      guestId = (crypto?.randomUUID?.() || `guest_${Date.now()}_${Math.random().toString(36).slice(2)}`);
      localStorage.setItem('vendly_guest_viewer_id', guestId);
    }
    return guestId;
  } catch (e) {
    return `guest_fallback_${Date.now()}`;
  }
}

async function getViewerScopeKey() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) return `user:${user.id}`;
  } catch (e) {
    // ignore and fallback to guest
  }
  return `guest:${getOrCreateGuestViewerId()}`;
}

function getViewedStorageKey(viewerScope) {
  return `vendly_viewed_products_${viewerScope}`;
}

function hasViewedProduct(viewerScope, productId) {
  try {
    const parsed = JSON.parse(localStorage.getItem(getViewedStorageKey(viewerScope)) || '[]');
    return Array.isArray(parsed) && parsed.includes(String(productId));
  } catch (e) {
    return false;
  }
}

function markProductViewed(viewerScope, productId) {
  try {
    const key = getViewedStorageKey(viewerScope);
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    const set = new Set(Array.isArray(parsed) ? parsed.map(String) : []);
    set.add(String(productId));
    localStorage.setItem(key, JSON.stringify(Array.from(set)));
  } catch (e) {
    // ignore storage failures
  }
}

function updateProductViewsUI(productId, viewsCount) {
  const safeCount = Number.isFinite(Number(viewsCount)) ? parseInt(viewsCount) : 0;

  const idx = allProducts.findIndex(p => String(p.id) === String(productId));
  if (idx !== -1) allProducts[idx].views_count = safeCount;

  document.querySelectorAll(`[data-views-for="${productId}"]`).forEach(el => {
    el.textContent = `👁️ ${safeCount}`;
  });
}

async function fetchAndSyncProductViews(productId) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, views_count')
      .eq('id', productId)
      .single();
    if (!error && data) {
      updateProductViewsUI(productId, data.views_count || 0);
    }
  } catch (e) {
    // ignore
  }
}

async function recordProductView(productId) {
  try {
    const viewerScope = await getViewerScopeKey();
    if (hasViewedProduct(viewerScope, productId)) {
      return { counted: false };
    }

    markProductViewed(viewerScope, productId);

    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) {
      await supabase.from('product_views').upsert(
        { user_id: user.id, product_id: productId, created_at: new Date().toISOString() },
        { onConflict: 'user_id,product_id' }
      );
    } else {
      const current = allProducts.find(p => String(p.id) === String(productId));
      const next = (parseInt(current?.views_count || 0) || 0) + 1;
      await supabase.from('products').update({ views_count: next }).eq('id', productId);
    }

    const current = allProducts.find(p => String(p.id) === String(productId));
    if (current) {
      updateProductViewsUI(productId, (parseInt(current.views_count || 0) || 0) + 1);
    }
    fetchAndSyncProductViews(productId);
    return { counted: true };
  } catch (error) {
    console.warn('recordProductView failed:', error?.message || error);
    return { counted: false, error };
  }
}

function setupProductViewsRealtime() {
  try {
    if (productViewsChannel) {
      supabase.removeChannel(productViewsChannel);
      productViewsChannel = null;
    }

    productViewsChannel = supabase
      .channel('product-page-views-live')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'products' },
        (payload) => {
          const oldViews = parseInt(payload?.old?.views_count || 0);
          const newViews = parseInt(payload?.new?.views_count || 0);
          if (Number.isFinite(newViews) && newViews !== oldViews) {
            updateProductViewsUI(payload.new.id, newViews);
          }
        }
      )
      .subscribe();
  } catch (error) {
    console.warn('setupProductViewsRealtime failed:', error?.message || error);
  }
}

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
      // Load user's own products based on filter
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

    // Update revenue stats
    updateRevenueStats();

  } catch (error) {
    console.error('Error loading products:', error);
    document.getElementById('productGrid').innerHTML = '<div style="padding:20px;text-align:center;grid-column:1/-1;color:var(--error);">Error loading products.</div>';
  }
}

// Update revenue stats banner
async function updateRevenueStats() {
  if (!currentUser) return;
  try {
    // Get all user's products
    const { data: allUserProducts } = await supabase
      .from('products')
      .select('id, price, stock, likes_count, sold_at')
      .eq('seller_id', currentUser.id);

    if (!allUserProducts) return;

    const sold = allUserProducts.filter(p => p.stock === 0 && p.sold_at);
    const active = allUserProducts.filter(p => p.stock > 0);
    const totalRevenue = sold.reduce((sum, p) => sum + parseFloat(p.price || 0), 0);
    const totalLikes = allUserProducts.reduce((sum, p) => sum + parseInt(p.likes_count || 0), 0);

    const statsEl = document.getElementById('revenueStats');
    if (statsEl) statsEl.style.display = 'block';
    const revenueEl = document.getElementById('totalRevenue');
    if (revenueEl) revenueEl.textContent = `€${totalRevenue.toFixed(2)}`;
    const soldEl = document.getElementById('totalSold');
    if (soldEl) soldEl.textContent = sold.length;
    const activeEl = document.getElementById('totalActive');
    if (activeEl) activeEl.textContent = active.length;
    const likesEl = document.getElementById('totalLikes');
    if (likesEl) likesEl.textContent = totalLikes;
  } catch (e) {
    console.warn('Could not load revenue stats:', e);
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

  grid.innerHTML = products.map(product => {
    const likesCount = parseInt(product.likes_count || 0);
    const viewsCount = parseInt(product.views_count || 0);
    const isSold = product.stock === 0;
    const soldDate = product.sold_at ? new Date(product.sold_at).toLocaleDateString() : '';

    return `
    <div class="product-card-modern" data-product-id="${product.id}" ${isSold ? 'style="opacity:0.75;"' : ''}>
      <div class="product-image-container">
        <img src="${product.image_url || 'https://placehold.co/400x300/667eea/white?text=No+Image'}" alt="${product.name}" class="product-image">
        <button class="product-like-btn ${userFavorites.has(product.id) ? 'liked' : ''}" data-product-id="${product.id}">
          <svg width="20" height="20" fill="${userFavorites.has(product.id) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"></path>
          </svg>
        </button>
        ${isSold ? '<span class="product-badge-new" style="background:#ef4444;">SOLD</span>' : ''}
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
        <div class="product-meta" style="display:flex; gap:1rem; align-items:center; margin-bottom:0.25rem;">
          <span style="font-size:0.8rem; color:var(--muted);" data-likes>❤️ ${likesCount}</span>
          <span style="font-size:0.8rem; color:var(--muted);" data-views-for="${product.id}">👁️ ${viewsCount}</span>
          <span style="font-size:0.8rem; color:var(--muted);">📦 ${product.stock || 0}</span>
        </div>
        ${isSold && soldDate ? `<div style="font-size:0.75rem; color:var(--error); margin-bottom:0.25rem;">Sold on ${soldDate}</div>` : ''}
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
              (isSold ? '<span style="color:#ef4444; font-weight:600; font-size:0.8rem;">SOLD</span>' :
              `<button class="btn-add-cart" data-product-id="${product.id}">🛒</button>
               <button class="btn-buy-now" data-product-id="${product.id}">Buy Now</button>`)
            }
          </div>
        </div>
      </div>
    </div>
  `}).join('');

  // Add event listeners
  attachProductEventListeners();
}

// Attach event listeners to product cards
function attachProductEventListeners() {
  // Product card click - navigate to product listing page
  document.querySelectorAll('.product-card-modern').forEach(card => {
    card.addEventListener('click', async (e) => {
      const productId = card.dataset.productId;
      // Only navigate if clicking on the card itself, not buttons
      if (!e.target.closest('button')) {
        await recordProductView(productId);
        window.location.href = `index.html?product=${productId}`;
      }
    });
  });

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
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const productId = btn.dataset.productId;
      await recordProductView(productId);
      showProductModal(productId);
    });
  });

  // Buy/Add to cart buttons
  document.querySelectorAll('.btn-buy-now, .btn-add-cart').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const productId = btn.dataset.productId;
      const action = btn.classList.contains('btn-buy-now') ? 'buy' : 'cart';
      handleProductAction(productId, action);
    });
  });

  // Edit/Delete buttons (for own products)
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const productId = btn.dataset.productId;
      editProduct(productId);
    });
  });

  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const productId = btn.dataset.productId;
      deleteProduct(productId);
    });
  });
}

// Toggle favorite status
async function toggleFavorite(productId) {
  if (!currentUser) {
    await showInfoModal('Please log in to add favorites', 'Authentication Required');
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

    // Update UI immediately
    const btn = document.querySelector(`.product-like-btn[data-product-id="${productId}"]`);
    if (btn) {
      btn.classList.toggle('liked', !isFavorited);
        const isFav = !isFavorited;
        btn.innerHTML = `<svg width="20" height="20" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"></path></svg>`;
    // Update likes count immediately
    await updateProductLikesCount(productId, !isFavorited);

  } catch (error) {
    console.error('Error toggling favorite:', error);
    await showInfoModal('Favorites functionality is not available yet. Please contact support.', 'Error');
  }
}

// Update product likes count in real-time
async function updateProductLikesCount(productId) {
  try {
    // Get current likes count from server
    const { count } = await supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', productId);
    
    if (count !== null) {
      // Update ALL product cards with this ID (in case displayed multiple times)
      const cards = document.querySelectorAll(`[data-product-id="${productId}"]`);
      cards.forEach(card => {
        const likesSpan = card.querySelector('[data-likes]');
        if (likesSpan) {
          likesSpan.textContent = `❤️ ${count}`;
        }
      });
      
      // Update product in allProducts array
      const productIndex = allProducts.findIndex(p => p.id === productId);
      if (productIndex !== -1) {
        allProducts[productIndex].likes_count = count;
      }
      
      // Update stats
      updateRevenueStats();
    }
  } catch (error) {
    console.error('Error updating likes count:', error);
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
  if (action === 'buy') {
    // Redirect to orders page to complete purchase
    window.location.href = `orders.html?buy=${productId}`;
  } else {
    // Add to cart - redirect to orders page
    window.location.href = `orders.html?buy=${productId}`;
  }
}

// Expose functions to window for inline onclick handlers
window.showUserProfile = showUserProfile;
window.handleProductAction = handleProductAction;

// Edit product
function editProduct(productId) {
  // Redirect to sell page with edit mode
  window.location.href = `sell.html?edit=${productId}`;
}

// Delete product
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
// Real-time Subscription to Favorites
// ============================
function setupRealtimeListeners() {
  if (!currentUser) return;
  
  // Subscribe to changes on favorites table
  const subscription = supabase
    .channel(`favorites-public`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'favorites'
      },
      (payload) => {
        // Update likes for affected product
        const productId = payload.new.product_id;
        if (productId) {
          updateProductLikesCount(productId);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'favorites'
      },
      (payload) => {
        // Update likes for affected product
        const productId = payload.old.product_id;
        if (productId) {
          updateProductLikesCount(productId);
        }
      }
    )
    .subscribe();

  return subscription;
}

// ============================
// Initialize Page (after auth check)
// ============================
async function initializePage() {
  currentUser = await checkAuth();
  if (!currentUser) return; // Redirect happened

  await loadUser();
  await loadProducts();
  setupProductViewsRealtime();
  setupRealtimeListeners();
}

// Run initialization
initializePage();
