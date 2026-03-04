import { supabase, getCurrentUser } from '../supabase.js';
import { i18n } from '../i18n.js';

// ============================
// State Management
// ============================
let currentUser = null;
let currentFilter = 'all'; // all, buying, selling
let currentStatusFilter = 'all';
let currentDeliveryFilter = 'all';
let allOrders = [];

// ============================
// Initialization
// ============================
document.addEventListener('DOMContentLoaded', async () => {
  try {
    currentUser = await getCurrentUser();
    if (!currentUser) {
      window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
      return;
    }

    await loadOrders();
    setupEventListeners();
  } catch (error) {
    console.error('Error initializing orders page:', error);
  }
});

// ============================
// Event Listeners
// ============================
function setupEventListeners() {
  // Filter tabs
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      filterOrders();
    });
  });

  // Status filter
  document.getElementById('statusFilter')?.addEventListener('change', (e) => {
    currentStatusFilter = e.target.value;
    filterOrders();
  });

  // Delivery filter
  document.getElementById('deliveryFilter')?.addEventListener('change', (e) => {
    currentDeliveryFilter = e.target.value;
    filterOrders();
  });
}

// ============================
// Load Orders
// ============================
async function loadOrders() {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        buyer:buyer_id(id, username, email),
        seller:seller_id(id, username, email),
        product:product_id(id, name, price, images)
      `)
      .or(`buyer_id.eq.${currentUser.id},seller_id.eq.${currentUser.id}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    allOrders = orders || [];
    filterOrders();
  } catch (error) {
    console.error('Error loading orders:', error);
    showError('Failed to load orders. Please refresh the page.');
  }
}

// ============================
// Filter Orders
// ============================
function filterOrders() {
  let filtered = [...allOrders];

  // Filter by role (buying/selling)
  if (currentFilter === 'buying') {
    filtered = filtered.filter(o => o.buyer_id === currentUser.id);
  } else if (currentFilter === 'selling') {
    filtered = filtered.filter(o => o.seller_id === currentUser.id);
  }

  // Filter by status
  if (currentStatusFilter !== 'all') {
    filtered = filtered.filter(o => o.status === currentStatusFilter);
  }

  // Filter by delivery method
  if (currentDeliveryFilter !== 'all') {
    filtered = filtered.filter(o => o.delivery_method === currentDeliveryFilter);
  }

  displayOrders(filtered);
}

// ============================
// Display Orders
// ============================
function displayOrders(orders) {
  const container = document.getElementById('ordersContainer');
  const emptyState = document.getElementById('emptyState');

  if (!orders || orders.length === 0) {
    container.innerHTML = '';
    emptyState.style.display = 'flex';
    return;
  }

  emptyState.style.display = 'none';
  container.innerHTML = orders.map(order => createOrderCard(order)).join('');
}

function createOrderCard(order) {
  const isBuyer = order.buyer_id === currentUser.id;
  const otherUser = isBuyer ? order.seller : order.buyer;
  const productImage = order.product?.images?.[0] || 'https://placehold.co/150x150/667eea/white?text=No+Image';
  
  const statusBadge = getStatusBadge(order.status);
  const deliveryIcon = order.delivery_method === 'meetup' ? '🤝' : '📦';
  
  return `
    <div class="order-card" data-order-id="${order.id}">
      <div class="order-header">
        <div class="order-number">
          <strong>${order.order_number}</strong>
          <span class="order-date">${formatDate(order.created_at)}</span>
        </div>
        ${statusBadge}
      </div>

      <div class="order-body">
        <div class="order-product">
          <img src="${productImage}" alt="${order.product?.name || 'Product'}" class="order-product-image">
          <div class="order-product-info">
            <h3>${order.product?.name || 'Product'}</h3>
            <p class="order-role">${isBuyer ? '🛒 Buying from' : '💰 Selling to'} ${otherUser?.username || otherUser?.email || 'Unknown'}</p>
            <p class="order-quantity">Quantity: ${order.quantity}</p>
          </div>
        </div>

        <div class="order-details">
          <div class="order-detail-row">
            <span>${deliveryIcon} Delivery:</span>
            <strong>${order.delivery_method === 'meetup' ? 'Meetup' : 'Shipping'}</strong>
          </div>
          
          ${order.delivery_method === 'shipping' ? `
            <div class="order-detail-row">
              <span>📮 Carrier:</span>
              <strong>${getCarrierName(order.shipping_carrier)}</strong>
            </div>
            ${order.tracking_number ? `
              <div class="order-detail-row">
                <span>🔢 Tracking:</span>
                <strong>${order.tracking_number}</strong>
              </div>
            ` : ''}
          ` : ''}
          
          ${order.delivery_method === 'meetup' && order.meetup_location ? `
            <div class="order-detail-row">
              <span>📍 Location:</span>
              <strong>${order.meetup_location}</strong>
            </div>
            ${order.meetup_date ? `
              <div class="order-detail-row">
                <span>📅 Date:</span>
                <strong>${formatDateTime(order.meetup_date)}</strong>
              </div>
            ` : ''}
          ` : ''}
          
          <div class="order-detail-row order-total">
            <span>Total:</span>
            <strong>€${parseFloat(order.total_amount).toFixed(2)}</strong>
          </div>
        </div>
      </div>

      <div class="order-actions">
        <button class="btn btn-secondary" onclick="viewOrderDetails('${order.id}')">View Details</button>
        
        ${isBuyer && order.status === 'pending' ? `
          <button class="btn btn-sell" onclick="payOrder('${order.id}')">Pay Now</button>
          <button class="btn btn-danger" onclick="cancelOrder('${order.id}')">Cancel</button>
        ` : ''}
        
        ${order.status === 'escrow' ? `
          <button class="btn btn-warning" style="pointer-events:none;">⏳ Funds in Escrow</button>
          <button class="btn btn-sell" onclick="confirmDelivery('${order.id}')">Confirm Meetup</button>
        ` : ''}
        
        ${!isBuyer && order.status === 'paid' ? `
          <button class="btn btn-sell" onclick="markAsProcessing('${order.id}')">Start Processing</button>
        ` : ''}
        
        ${!isBuyer && order.status === 'processing' && order.delivery_method === 'meetup' ? `
          <button class="btn btn-sell" onclick="markReadyForPickup('${order.id}')">Ready for Pickup</button>
        ` : ''}
        
        ${!isBuyer && order.status === 'processing' && order.delivery_method === 'shipping' ? `
          <button class="btn btn-sell" onclick="addTrackingNumber('${order.id}')">Add Tracking & Ship</button>
        ` : ''}
        
        ${isBuyer && (order.status === 'shipped' || order.status === 'ready_for_pickup') ? `
          <button class="btn btn-sell" onclick="confirmDelivery('${order.id}')">Confirm Delivery</button>
        ` : ''}
        
        ${order.tracking_number ? `
          <button class="btn btn-secondary" onclick="trackShipment('${order.id}')">Track Shipment</button>
        ` : ''}
      </div>
    </div>
  `;
}

// ============================
// Order Actions
// ============================

window.viewOrderDetails = async function(orderId) {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        buyer:buyer_id(id, username, email, avatar_url),
        seller:seller_id(id, username, email, avatar_url),
        product:product_id(id, name, description, price, images, category)
      `)
      .eq('id', orderId)
      .single();

    if (error) throw error;

    // Load order history
    const { data: history } = await supabase
      .from('order_status_history')
      .select('*, changed_by_user:changed_by(username, email)')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    displayOrderDetails(order, history || []);
  } catch (error) {
    console.error('Error loading order details:', error);
    showError('Failed to load order details');
  }
};

function displayOrderDetails(order, history) {
  const isBuyer = order.buyer_id === currentUser.id;
  const otherUser = isBuyer ? order.seller : order.buyer;
  const productImage = order.product?.images?.[0] || 'https://placehold.co/400x400/667eea/white?text=No+Image';

  const content = `
    <div class="order-details-modal">
      <h2>📦 Order ${order.order_number}</h2>
      
      <div class="order-details-grid">
        <!-- Product Info -->
        <div class="order-details-section">
          <h3>Product Information</h3>
          <div class="order-product-detail">
            <img src="${productImage}" alt="${order.product?.name}" class="order-detail-image">
            <div>
              <h4>${order.product?.name}</h4>
              <p>${order.product?.description || ''}</p>
              <p><strong>Category:</strong> ${order.product?.category || 'N/A'}</p>
              <p><strong>Unit Price:</strong> €${parseFloat(order.unit_price).toFixed(2)}</p>
              <p><strong>Quantity:</strong> ${order.quantity}</p>
            </div>
          </div>
        </div>

        <!-- Order Status -->
        <div class="order-details-section">
          <h3>Order Status</h3>
          <div class="status-timeline">
            ${getStatusTimeline(order, history)}
          </div>
        </div>

        <!-- Delivery Information -->
        <div class="order-details-section">
          <h3>Delivery Information</h3>
          ${order.delivery_method === 'meetup' ? `
            <p><strong>Method:</strong> 🤝 Meetup</p>
            ${order.meetup_location ? `<p><strong>Location:</strong> ${order.meetup_location}</p>` : ''}
            ${order.meetup_date ? `<p><strong>Date & Time:</strong> ${formatDateTime(order.meetup_date)}</p>` : ''}
            <p><strong>Buyer Confirmed:</strong> ${order.meetup_confirmed_by_buyer ? '✅ Yes' : '❌ No'}</p>
            <p><strong>Seller Confirmed:</strong> ${order.meetup_confirmed_by_seller ? '✅ Yes' : '❌ No'}</p>
          ` : `
            <p><strong>Method:</strong> 📦 Shipping</p>
            <p><strong>Carrier:</strong> ${getCarrierName(order.shipping_carrier)}</p>
            <p><strong>Service:</strong> ${order.shipping_service || 'N/A'}</p>
            ${order.tracking_number ? `<p><strong>Tracking:</strong> ${order.tracking_number}</p>` : ''}
            <p><strong>Shipping Cost:</strong> €${parseFloat(order.shipping_cost || 0).toFixed(2)}</p>
            
            <div class="shipping-address">
              <h4>Shipping Address</h4>
              <p>${order.recipient_name || ''}</p>
              <p>${order.recipient_phone || ''}</p>
              ${order.parcel_locker_address ? `
                <p><strong>Parcel Locker:</strong></p>
                <p>${order.parcel_locker_address}</p>
              ` : `
                <p>${order.shipping_address || ''}</p>
                <p>${order.shipping_city || ''}, ${order.shipping_postal_code || ''}</p>
                <p>${getCountryName(order.shipping_country)}</p>
              `}
            </div>
          `}
        </div>

        <!-- Payment Information -->
        <div class="order-details-section">
          <h3>Payment Information</h3>
          <p><strong>Payment Method:</strong> ${order.payment_method || 'balance'}</p>
          <p><strong>Payment Status:</strong> ${getStatusBadge(order.payment_status).outerHTML}</p>
          ${order.paid_at ? `<p><strong>Paid At:</strong> ${formatDateTime(order.paid_at)}</p>` : ''}
          <div class="order-pricing">
            <p><strong>Subtotal:</strong> €${(parseFloat(order.unit_price) * order.quantity).toFixed(2)}</p>
            <p><strong>Shipping:</strong> €${parseFloat(order.shipping_cost || 0).toFixed(2)}</p>
            <p class="order-total-line"><strong>Total:</strong> €${parseFloat(order.total_amount).toFixed(2)}</p>
          </div>
        </div>

        <!-- User Information -->
        <div class="order-details-section">
          <h3>${isBuyer ? 'Seller' : 'Buyer'} Information</h3>
          <div class="user-info">
            ${otherUser?.avatar_url ? `<img src="${otherUser.avatar_url}" alt="Avatar" class="user-avatar">` : ''}
            <div>
              <p><strong>Username:</strong> ${otherUser?.username || 'N/A'}</p>
              <p><strong>Email:</strong> ${otherUser?.email || 'N/A'}</p>
              <a href="chat.html?user=${otherUser?.id}" class="btn btn-secondary">💬 Message</a>
            </div>
          </div>
        </div>

        <!-- Notes -->
        ${(order.buyer_notes || order.seller_notes) ? `
          <div class="order-details-section">
            <h3>Notes</h3>
            ${order.buyer_notes ? `<p><strong>Buyer Notes:</strong> ${order.buyer_notes}</p>` : ''}
            ${order.seller_notes ? `<p><strong>Seller Notes:</strong> ${order.seller_notes}</p>` : ''}
          </div>
        ` : ''}
      </div>

      <div class="modal-actions">
        <button class="btn btn-secondary" onclick="closeOrderModal()">Close</button>
        ${order.tracking_number ? `
          <button class="btn btn-sell" onclick="trackShipment('${order.id}')">Track Shipment</button>
        ` : ''}
      </div>
    </div>
  `;

  document.getElementById('orderDetailsContent').innerHTML = content;
  document.getElementById('orderDetailsModal').style.display = 'flex';
}

window.closeOrderModal = function() {
  document.getElementById('orderDetailsModal').style.display = 'none';
};

// ============================
// Payment Actions
// ============================

window.payOrder = async function(orderId) {
  if (!confirm('Process payment for this order?')) return;

  try {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found');

    // Check buyer balance
    const { data: userData } = await supabase
      .from('users')
      .select('balance')
      .eq('id', currentUser.id)
      .single();

    if (!userData || parseFloat(userData.balance) < parseFloat(order.total_amount)) {
      showError(`Insufficient balance. You need €${parseFloat(order.total_amount).toFixed(2)}. Please add funds to your balance.`);
      return;
    }

    // Process payment
    const { error: paymentError } = await supabase.rpc('process_order_payment', {
      p_order_id: orderId,
      p_buyer_id: currentUser.id
    });

    if (paymentError) throw paymentError;

    showSuccess('Payment successful! Order confirmed.');
    await loadOrders();
  } catch (error) {
    console.error('Error processing payment:', error);
    showError('Payment failed: ' + (error.message || 'Unknown error'));
  }
};

// ============================
// Seller Actions
// ============================

window.markAsProcessing = async function(orderId) {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ 
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (error) throw error;

    showSuccess('Order marked as processing');
    await loadOrders();
  } catch (error) {
    console.error('Error updating order:', error);
    showError('Failed to update order status');
  }
};

window.markReadyForPickup = async function(orderId) {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ 
        status: 'ready_for_pickup',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (error) throw error;

    showSuccess('Order marked as ready for pickup');
    await loadOrders();
  } catch (error) {
    console.error('Error updating order:', error);
    showError('Failed to update order status');
  }
};

window.addTrackingNumber = async function(orderId) {
  const trackingNumber = prompt('Enter tracking number:');
  if (!trackingNumber) return;

  try {
    const { error } = await supabase
      .from('orders')
      .update({ 
        status: 'shipped',
        tracking_number: trackingNumber,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (error) throw error;

    showSuccess('Tracking number added and order marked as shipped');
    await loadOrders();
  } catch (error) {
    console.error('Error updating order:', error);
    showError('Failed to add tracking number');
  }
};

// ============================
// Buyer Actions
// ============================

window.confirmDelivery = function(orderId) {
  window.currentConfirmOrderId = orderId;
  document.getElementById('confirmDeliveryModal').style.display = 'flex';
};

window.closeConfirmDeliveryModal = function() {
  document.getElementById('confirmDeliveryModal').style.display = 'none';
  window.currentConfirmOrderId = null;
};

document.getElementById('confirmDeliveryBtn')?.addEventListener('click', async () => {
  if (!window.currentConfirmOrderId) return;

  try {
    const order = allOrders.find(o => o.id === window.currentConfirmOrderId);
    
    // Check if this is a meetup order with escrow
    if (order && order.delivery_method === 'meetup' && order.status === 'escrow') {
      // Use escrow release function
      const { data, error } = await supabase.rpc('release_escrow', {
        p_order_id: window.currentConfirmOrderId,
        p_confirmed_by: currentUser.id
      });

      if (error) throw error;

      if (data.completed) {
        showSuccess('✅ Both parties confirmed! Escrow released and payment sent to seller.');
      } else {
        showSuccess('✅ Confirmation recorded. Waiting for other party to confirm meetup.');
      }
    } else {
      // Regular shipping delivery confirmation
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', window.currentConfirmOrderId);

      if (error) throw error;

      showSuccess('Delivery confirmed! Order completed.');
    }

    closeConfirmDeliveryModal();
    await loadOrders();
  } catch (error) {
    console.error('Error confirming delivery:', error);
    showError('Failed to confirm delivery');
  }
});

window.cancelOrder = function(orderId) {
  window.currentCancelOrderId = orderId;
  document.getElementById('cancelOrderModal').style.display = 'flex';
};

window.closeCancelOrderModal = function() {
  document.getElementById('cancelOrderModal').style.display = 'none';
  document.getElementById('cancelReason').value = '';
  window.currentCancelOrderId = null;
};

document.getElementById('confirmCancelBtn')?.addEventListener('click', async () => {
  if (!window.currentCancelOrderId) return;

  try {
    const reason = document.getElementById('cancelReason').value;
    
    const { error } = await supabase
      .from('orders')
      .update({ 
        status: 'cancelled',
        buyer_notes: reason || 'Cancelled by buyer',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', window.currentCancelOrderId)
      .eq('buyer_id', currentUser.id);

    if (error) throw error;

    showSuccess('Order cancelled successfully');
    closeCancelOrderModal();
    await loadOrders();
  } catch (error) {
    console.error('Error cancelling order:', error);
    showError('Failed to cancel order');
  }
});

// ============================
// Tracking
// ============================

window.trackShipment = function(orderId) {
  const order = allOrders.find(o => o.id === orderId);
  if (!order || !order.tracking_number) {
    showError('No tracking number available');
    return;
  }

  const trackingUrl = getTrackingUrl(order.shipping_carrier, order.tracking_number);
  if (trackingUrl) {
    window.open(trackingUrl, '_blank');
  } else {
    alert(`Tracking Number: ${order.tracking_number}\n\nPlease visit the carrier's website to track your shipment.`);
  }
};

function getTrackingUrl(carrier, trackingNumber) {
  const urls = {
    'omniva': `https://www.omniva.lv/private/track_and_trace?barcode=${trackingNumber}`,
    'dpd': `https://www.dpd.com/lv/en/tracking/?query=${trackingNumber}`,
    'latvijas_pasts': `https://www.pasts.lv/lv/palidziba/sut-ijumu-mekle-ana/?number=${trackingNumber}`
  };
  return urls[carrier] || null;
}

// ============================
// Helper Functions
// ============================

function getStatusBadge(status) {
  const badges = {
    'pending': '<span class="badge badge-warning">Pending Payment</span>',
    'paid': '<span class="badge badge-success">Paid</span>',
    'escrow': '<span class="badge badge-info">Escrow (Awaiting Confirmation)</span>',
    'processing': '<span class="badge badge-info">Processing</span>',
    'ready_for_pickup': '<span class="badge badge-info">Ready for Pickup</span>',
    'shipped': '<span class="badge badge-primary">Shipped</span>',
    'in_transit': '<span class="badge badge-primary">In Transit</span>',
    'delivered': '<span class="badge badge-success">Delivered</span>',
    'completed': '<span class="badge badge-success">Completed</span>',
    'cancelled': '<span class="badge badge-danger">Cancelled</span>',
    'refunded': '<span class="badge badge-warning">Refunded</span>',
    'disputed': '<span class="badge badge-danger">Disputed</span>'
  };
  
  const badgeHTML = badges[status] || `<span class="badge">${status}</span>`;
  const temp = document.createElement('div');
  temp.innerHTML = badgeHTML;
  return temp.firstChild;
}

function getStatusTimeline(order, history) {
  // Different timeline for meetup vs shipping
  const isMeetup = order.delivery_method === 'meetup';
  
  const meetupStatuses = [
    { key: 'pending', label: 'Order Placed', icon: '📝' },
    { key: 'escrow', label: 'Payment in Escrow', icon: '🔒' },
    { key: 'ready_for_pickup', label: 'Ready for Meetup', icon: '🤝' },
    { key: 'completed', label: 'Meetup Confirmed', icon: '✅' }
  ];
  
  const shippingStatuses = [
    { key: 'pending', label: 'Order Placed', icon: '📝' },
    { key: 'paid', label: 'Payment Confirmed', icon: '💰' },
    { key: 'processing', label: 'Processing', icon: '⚙️' },
    { key: 'shipped', label: 'Shipped', icon: '📦' },
    { key: 'completed', label: 'Completed', icon: '✅' }
  ];

  const allStatuses = isMeetup ? meetupStatuses : shippingStatuses;

  const statusHistory = {};
  history.forEach(h => {
    if (!statusHistory[h.new_status]) {
      statusHistory[h.new_status] = h.created_at;
    }
  });

  return allStatuses.map(s => {
    const isActive = statusHistory[s.key];
    const isCurrent = order.status === s.key;
    
    return `
      <div class="timeline-item ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''}">
        <div class="timeline-icon">${s.icon}</div>
        <div class="timeline-content">
          <strong>${s.label}</strong>
          ${isActive ? `<small>${formatDateTime(statusHistory[s.key])}</small>` : ''}
          ${s.key === 'escrow' && isCurrent ? `
            <small style="color: var(--warning);">
              ${order.meetup_confirmed_by_buyer ? '✓ Buyer confirmed' : '○ Buyer pending'}
              ${order.meetup_confirmed_by_seller ? '✓ Seller confirmed' : '○ Seller pending'}
            </small>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function getCarrierName(carrier) {
  const names = {
    'omniva': 'Omniva',
    'dpd': 'DPD',
    'latvijas_pasts': 'Latvijas Pasts'
  };
  return names[carrier] || carrier || 'N/A';
}

function getCountryName(code) {
  const names = {
    'LV': 'Latvia',
    'LT': 'Lithuania',
    'EE': 'Estonia'
  };
  return names[code] || code || '';
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('en-GB', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function showSuccess(message) {
  alert('✅ ' + message);
}

function showError(message) {
  alert('❌ ' + message);
}
