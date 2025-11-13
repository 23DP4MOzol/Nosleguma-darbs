// Product Modal Functionality
import { supabase } from './supabase.js';

export async function showProductModal(product) {
  const modal = document.getElementById('productModal');
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
    
    // Get seller rating from reviews
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating, product_id')
      .in('product_id', await getSellerProducts(product.seller_id));
    
    if (reviews && reviews.length > 0) {
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      sellerRating = (totalRating / reviews.length).toFixed(1);
      sellerReviews = reviews.length;
    }
  }
  
  // Get product stats (likes/saves - we'll use a placeholder for now)
  const productLikes = Math.floor(Math.random() * 50); // Placeholder
  const productSaves = Math.floor(Math.random() * 30); // Placeholder
  const productViews = Math.floor(Math.random() * 200) + 50; // Placeholder
  
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
  
  // Calculate listing fee
  const listingFee = Math.max(parseFloat(price) * 0.005, 0.50).toFixed(2);
  
  modalBody.innerHTML = `
    <div class="modal-product-grid">
      <div>
        <img src="${imageUrl}" alt="${product.name}" class="modal-product-image">
      </div>
      
      <div class="modal-product-info">
        <h1>${product.name}</h1>
        <div class="modal-product-price">€${price}</div>
        
        <div class="modal-product-meta">
          <span class="modal-badge" style="background: #dbeafe; color: #1e40af;">
            ${conditionEmoji[product.condition] || '📦'} ${conditionText}
          </span>
          <span class="modal-badge" style="background: #fef3c7; color: #92400e;">
            📍 ${product.location || 'Not specified'}
          </span>
          <span class="modal-badge" style="background: #f3e8ff; color: #6b21a8;">
            📦 ${product.category || 'other'}
          </span>
          ${product.stock > 0 
            ? `<span class="modal-badge" style="background: #d1fae5; color: #065f46;">✓ ${product.stock} in stock</span>`
            : `<span class="modal-badge" style="background: #fee2e2; color: #991b1b;">✗ Out of stock</span>`
          }
        </div>
        
        <div class="modal-description">
          <h3 style="margin-bottom: 0.75rem; font-size: 1.125rem;">Description</h3>
          <p>${product.description || 'No description provided.'}</p>
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
          <h3>${sellerData?.username || 'Unknown Seller'}</h3>
          <div class="modal-seller-rating">
            ${'⭐'.repeat(Math.floor(sellerRating))} ${sellerRating}/5 (${sellerReviews} reviews)
          </div>
          <div style="font-size: 0.875rem; color: var(--muted); margin-top: 0.25rem;">
            Member since ${sellerData?.created_at ? new Date(sellerData.created_at).toLocaleDateString() : 'N/A'}
          </div>
        </div>
      </div>
      
      ${sellerData ? `
        <button class="modal-btn modal-btn-secondary" style="width: 100%;" onclick="openChatWithSeller('${product.seller_id}', '${product.id}')">
          💬 Chat with Seller
        </button>
      ` : ''}
    </div>
    
    <!-- Action Buttons -->
    <div class="modal-actions">
      <button class="modal-btn modal-btn-secondary" onclick="toggleSaveProduct('${product.id}')">
        🔖 Save for Later
      </button>
      <button class="modal-btn modal-btn-secondary" onclick="toggleLikeProduct('${product.id}')">
        ❤️ Like Product
      </button>
      ${product.stock > 0 && !product.is_reserved ? `
        <button class="modal-btn modal-btn-secondary" onclick="handleReserve('${product.id}')">
          🔖 Reserve (€0.20)
        </button>
        <button class="modal-btn modal-btn-primary" onclick="handlePurchase('${product.id}')">
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
  
  document.getElementById('modalClose').onclick = closeModal;
  document.getElementById('modalOverlay').onclick = closeModal;
}

// Helper function to get seller's products
async function getSellerProducts(sellerId) {
  const { data } = await supabase
    .from('products')
    .select('id')
    .eq('seller_id', sellerId);
  
  return data ? data.map(p => p.id) : [];
}

// Global functions for modal actions
window.openChatWithSeller = function(sellerId, productId) {
  // Redirect to chat page with seller info
  window.location.href = `chat.html?seller=${sellerId}&product=${productId}`;
};

window.toggleSaveProduct = function(productId) {
  // TODO: Implement save functionality
  alert('Product saved! (Feature coming soon)');
};

window.toggleLikeProduct = function(productId) {
  // TODO: Implement like functionality  
  alert('Product liked! (Feature coming soon)');
};

// Use existing handlers from main.js
window.handlePurchase = async function(productId) {
  const event = new CustomEvent('purchaseProduct', { detail: { productId } });
  document.dispatchEvent(event);
};

window.handleReserve = async function(productId) {
  const event = new CustomEvent('reserveProduct', { detail: { productId } });
  document.dispatchEvent(event);
};
