// Checkout Modal with Delivery Options and Logistics Integration
import { supabase, getCurrentUser } from './supabase.js';
import { showInfoModal } from './ui/modal.js';

// ============================
// Global State
// ============================
let currentCheckoutProduct = null;
let selectedDeliveryMethod = 'meetup';
let selectedShippingCarrier = null;
let selectedShippingService = null;
let selectedParcelLocker = null;
let shippingCost = 0;
let parcelLockers = [];

// ============================
// Show Checkout Modal
// ============================
export async function showCheckoutModal(product) {
  currentCheckoutProduct = product;
  
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
    return;
  }

  // Create modal if it doesn't exist
  let modal = document.getElementById('checkoutModal');
  if (!modal) {
    modal = createCheckoutModal();
    document.body.appendChild(modal);
  }

  // Load parcel lockers
  await loadParcelLockers();

  // Render checkout content
  renderCheckoutModal(product);
  
  // Show modal
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

// ============================
// Create Modal Structure
// ============================
function createCheckoutModal() {
  const modal = document.createElement('div');
  modal.id = 'checkoutModal';
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content modal-large" id="checkoutModalContent">
      <button class="modal-close" onclick="closeCheckoutModal()">&times;</button>
      <div id="checkoutContent"></div>
    </div>
  `;
  return modal;
}

// ============================
// Render Checkout Modal
// ============================
function renderCheckoutModal(product) {
  const content = document.getElementById('checkoutContent');
  const productImage = product.images?.[0] || product.image_url || 'https://placehold.co/150x150/667eea/white?text=No+Image';
  const price = parseFloat(product.price).toFixed(2);

  content.innerHTML = `
    <div class="checkout-container">
      <h2>🛒 Checkout</h2>
      
      <!-- Product Summary -->
      <div class="checkout-section">
        <h3>Product</h3>
        <div class="checkout-product-summary">
          <img src="${productImage}" alt="${product.name}" class="checkout-product-image">
          <div class="checkout-product-info">
            <h4>${product.name}</h4>
            <p class="checkout-product-price">€${price}</p>
            <div class="checkout-quantity">
              <label>Quantity:</label>
              <input type="number" id="checkoutQuantity" value="1" min="1" max="${product.stock || 1}" 
                     onchange="updateCheckoutTotal()" style="width: 80px; padding: 0.5rem;">
            </div>
          </div>
        </div>
      </div>

      <!-- Delivery Method Selection -->
      <div class="checkout-section">
        <h3>🚚 Delivery Method</h3>
        <div class="delivery-method-tabs">
          <button class="delivery-tab active" onclick="selectDeliveryMethod('meetup')" id="meetupTab">
            🤝 Meetup
          </button>
          <button class="delivery-tab" onclick="selectDeliveryMethod('shipping')" id="shippingTab">
            📦 Shipping
          </button>
        </div>

        <!-- Meetup Options -->
        <div id="meetupOptions" class="delivery-options">
          <div class="form-group">
            <label for="meetupLocation">📍 Meeting Location</label>
            <input type="text" id="meetupLocation" placeholder="e.g., Starbucks, Brīvības iela 372, Rīga" 
                   class="form-input" data-i18n-placeholder="checkout_meetup_location">
          </div>
          <div class="form-group">
            <label for="meetupDate">📅 Preferred Date & Time</label>
            <input type="datetime-local" id="meetupDate" class="form-input">
          </div>
          <div class="form-group">
            <label for="meetupNotes">📝 Additional Notes (optional)</label>
            <textarea id="meetupNotes" rows="3" placeholder="Any special instructions..." 
                      class="form-input" data-i18n-placeholder="checkout_notes"></textarea>
          </div>
          <div class="info-box">
            <strong>ℹ️ About Meetup</strong>
            <p>Meet the seller in person to inspect the item before payment. No shipping fees!</p>
          </div>
        </div>

        <!-- Shipping Options -->
        <div id="shippingOptions" class="delivery-options" style="display:none;">
          <!-- Country Selection -->
          <div class="form-group">
            <label for="shippingCountry">🌍 Shipping Country</label>
            <select id="shippingCountry" class="form-input" onchange="updateShippingOptions()">
              <option value="LV">🇱🇻 Latvia</option>
              <option value="LT">🇱🇹 Lithuania</option>
              <option value="EE">🇪🇪 Estonia</option>
            </select>
          </div>

          <!-- Carrier Selection -->
          <div class="form-group">
            <label>📦 Select Carrier & Service</label>
            <div class="shipping-carriers">
              <div class="carrier-card" onclick="selectShippingCarrier('omniva', 'parcel_locker')">
                <div class="carrier-logo">📮</div>
                <div class="carrier-info">
                  <strong>Omniva Parcel Locker</strong>
                  <p class="carrier-price">From €3.49</p>
                  <p class="carrier-time">1-3 days</p>
                </div>
              </div>
              <div class="carrier-card" onclick="selectShippingCarrier('dpd', 'parcel_locker')">
                <div class="carrier-logo">📦</div>
                <div class="carrier-info">
                  <strong>DPD Pickup Point</strong>
                  <p class="carrier-price">From €3.99</p>
                  <p class="carrier-time">1-3 days</p>
                </div>
              </div>
              <div class="carrier-card" onclick="selectShippingCarrier('dpd', 'courier')">
                <div class="carrier-logo">🚚</div>
                <div class="carrier-info">
                  <strong>DPD Courier</strong>
                  <p class="carrier-price">From €6.99</p>
                  <p class="carrier-time">1-2 days</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Parcel Locker Selection -->
          <div id="parcelLockerSection" style="display:none;">
            <div class="form-group">
              <label>📍 Select Parcel Locker</label>
              <div class="form-group">
                <input type="text" id="lockerSearch" placeholder="Search by city or address..." 
                       class="form-input" oninput="filterParcelLockers()">
              </div>
              <div id="parcelLockerList" class="parcel-locker-list"></div>
            </div>
          </div>

          <!-- Courier Address -->
          <div id="courierAddressSection" style="display:none;">
            <div class="form-group">
              <label for="recipientName">👤 Recipient Name</label>
              <input type="text" id="recipientName" class="form-input" required>
            </div>
            <div class="form-group">
              <label for="recipientPhone">📞 Phone Number</label>
              <input type="tel" id="recipientPhone" class="form-input" required>
            </div>
            <div class="form-group">
              <label for="shippingAddress">🏠 Street Address</label>
              <input type="text" id="shippingAddress" class="form-input" required>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="shippingCity">🏙️ City</label>
                <input type="text" id="shippingCity" class="form-input" required>
              </div>
              <div class="form-group">
                <label for="shippingPostalCode">📮 Postal Code</label>
                <input type="text" id="shippingPostalCode" class="form-input" required>
              </div>
            </div>
          </div>

          <div id="shippingCostDisplay" class="shipping-cost" style="display:none;">
            <strong>Shipping Cost:</strong> <span id="shippingCostAmount">€0.00</span>
          </div>
        </div>
      </div>

      <!-- Order Summary -->
      <div class="checkout-section checkout-summary">
        <h3>💰 Order Summary</h3>
        <div class="summary-row">
          <span>Subtotal:</span>
          <span id="summarySubtotal">€${price}</span>
        </div>
        <div class="summary-row">
          <span>Delivery:</span>
          <span id="summaryShipping">€0.00</span>
        </div>
        <div class="summary-row summary-total">
          <strong>Total:</strong>
          <strong id="summaryTotal">€${price}</strong>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="checkout-actions">
        <button class="btn btn-secondary" onclick="closeCheckoutModal()">Cancel</button>
        <button class="btn btn-sell" onclick="proceedToPayment()" id="checkoutPayBtn">
          Proceed to Payment
        </button>
      </div>
    </div>
  `;

  updateCheckoutTotal();
}

// ============================
// Delivery Method Selection
// ============================
window.selectDeliveryMethod = function(method) {
  selectedDeliveryMethod = method;
  
  // Update tabs
  document.getElementById('meetupTab').classList.toggle('active', method === 'meetup');
  document.getElementById('shippingTab').classList.toggle('active', method === 'shipping');
  
  // Toggle sections
  document.getElementById('meetupOptions').style.display = method === 'meetup' ? 'block' : 'none';
  document.getElementById('shippingOptions').style.display = method === 'shipping' ? 'block' : 'none';
  
  updateCheckoutTotal();
};

// ============================
// Shipping Carrier Selection
// ============================
window.selectShippingCarrier = async function(carrier, service) {
  selectedShippingCarrier = carrier;
  selectedShippingService = service;
  
  // Highlight selected carrier
  document.querySelectorAll('.carrier-card').forEach(card => card.classList.remove('selected'));
  document.querySelectorAll('.carrier-card').forEach(card => {
    const text = card.textContent.toLowerCase();
    const isSelected = text.includes(carrier.toLowerCase()) && (
      (service === 'courier' && text.includes('courier')) ||
      (service === 'parcel_locker' && !text.includes('courier'))
    );
    card.classList.toggle('selected', isSelected);
  });
  
  // Show appropriate input section
  const isParcelLocker = service === 'parcel_locker';
  document.getElementById('parcelLockerSection').style.display = isParcelLocker ? 'block' : 'none';
  document.getElementById('courierAddressSection').style.display = isParcelLocker ? 'none' : 'block';
  
  if (isParcelLocker) {
    renderParcelLockers(carrier);
  }
  
  // Get shipping quote
  await updateShippingCost();
};

// ============================
// Load Parcel Lockers
// ============================
async function loadParcelLockers() {
  try {
    const { data, error } = await supabase
      .from('parcel_lockers')
      .select('*')
      .eq('active', true)
      .order('city', { ascending: true });
    
    if (error) throw error;
    parcelLockers = data || [];
  } catch (error) {
    console.error('Error loading parcel lockers:', error);
    parcelLockers = [];
  }
}

function renderParcelLockers(carrier) {
  const container = document.getElementById('parcelLockerList');
  const country = document.getElementById('shippingCountry').value;
  
  const filtered = parcelLockers.filter(l => 
    l.carrier === carrier && l.country === country
  );
  
  if (filtered.length === 0) {
    container.innerHTML = '<p class="text-muted">No parcel lockers available for this carrier.</p>';
    return;
  }
  
  container.innerHTML = filtered.map(locker => `
    <div class="parcel-locker-card" onclick="selectParcelLocker('${locker.id}')" data-locker-id="${locker.id}">
      <div class="locker-info">
        <strong>${locker.name}</strong>
        <p>${locker.address}, ${locker.city}</p>
        <small>${locker.postal_code || ''}</small>
      </div>
    </div>
  `).join('');
}

window.filterParcelLockers = function() {
  const search = document.getElementById('lockerSearch').value.toLowerCase();
  document.querySelectorAll('.parcel-locker-card').forEach(card => {
    const text = card.textContent.toLowerCase();
    card.style.display = text.includes(search) ? 'block' : 'none';
  });
};

window.selectParcelLocker = async function(lockerId) {
  selectedParcelLocker = parcelLockers.find(l => l.id === lockerId);
  
  // Highlight selected locker
  document.querySelectorAll('.parcel-locker-card').forEach(card => {
    card.classList.toggle('selected', card.dataset.lockerId === lockerId);
  });
  
  await updateShippingCost();
};

// ============================
// Shipping Cost Calculation
// ============================
async function updateShippingCost() {
  if (selectedDeliveryMethod !== 'shipping' || !selectedShippingCarrier) {
    shippingCost = 0;
    document.getElementById('shippingCostDisplay').style.display = 'none';
    updateCheckoutTotal();
    return;
  }
  
  try {
    const country = document.getElementById('shippingCountry').value;
    
    const { data, error } = await supabase
      .from('shipping_rates')
      .select('price_eur, estimated_days_min, estimated_days_max')
      .eq('carrier', selectedShippingCarrier)
      .eq('service', selectedShippingService)
      .eq('from_country', 'LV')
      .eq('to_country', country)
      .eq('active', true)
      .single();
    
    if (error) throw error;
    
    shippingCost = parseFloat(data.price_eur);
    document.getElementById('shippingCostAmount').textContent = `€${shippingCost.toFixed(2)}`;
    document.getElementById('shippingCostDisplay').style.display = 'block';
    
    updateCheckoutTotal();
  } catch (error) {
    console.error('Error fetching shipping cost:', error);
    shippingCost = 5.00; // Default
    document.getElementById('shippingCostAmount').textContent = `€${shippingCost.toFixed(2)}`;
    document.getElementById('shippingCostDisplay').style.display = 'block';
    updateCheckoutTotal();
  }
}

window.updateShippingOptions = function() {
  updateShippingCost();
  if (selectedShippingCarrier && selectedShippingService === 'parcel_locker') {
    renderParcelLockers(selectedShippingCarrier);
  }
};

// ============================
// Update Total
// ============================
window.updateCheckoutTotal = function() {
  const quantity = parseInt(document.getElementById('checkoutQuantity')?.value || 1);
  const unitPrice = parseFloat(currentCheckoutProduct.price);
  const subtotal = unitPrice * quantity;
  const shipping = selectedDeliveryMethod === 'shipping' ? shippingCost : 0;
  const total = subtotal + shipping;
  
  document.getElementById('summarySubtotal').textContent = `€${subtotal.toFixed(2)}`;
  document.getElementById('summaryShipping').textContent = selectedDeliveryMethod === 'meetup' ? 'FREE' : `€${shipping.toFixed(2)}`;
  document.getElementById('summaryTotal').textContent = `€${total.toFixed(2)}`;
};

// ============================
// Proceed to Payment
// ============================
window.proceedToPayment = async function() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      await showInfoModal('Please log in to continue', 'Authentication Required');
      return;
    }

    // Validate inputs
    const quantity = parseInt(document.getElementById('checkoutQuantity').value);
    if (quantity < 1 || quantity > currentCheckoutProduct.stock) {
      await showInfoModal('Invalid quantity', 'Validation Error');
      return;
    }

    let deliveryDetails = { notes: '' };

    if (selectedDeliveryMethod === 'meetup') {
      const location = document.getElementById('meetupLocation').value;
      const date = document.getElementById('meetupDate').value;
      
      if (!location) {
        await showInfoModal('Please specify a meeting location', 'Validation Error');
        return;
      }
      
      deliveryDetails = {
        meetup_location: location,
        meetup_date: date || null,
        notes: document.getElementById('meetupNotes').value
      };
    } else {
      // Shipping
      if (!selectedShippingCarrier) {
        await showInfoModal('Please select a shipping carrier', 'Validation Error');
        return;
      }

      deliveryDetails = {
        carrier: selectedShippingCarrier,
        service: selectedShippingService,
        country: document.getElementById('shippingCountry').value
      };

      if (selectedShippingService === 'parcel_locker') {
        if (!selectedParcelLocker) {
          await showInfoModal('Please select a parcel locker', 'Validation Error');
          return;
        }
        deliveryDetails.parcel_locker_id = selectedParcelLocker.locker_id;
        deliveryDetails.parcel_locker_address = `${selectedParcelLocker.name}, ${selectedParcelLocker.address}, ${selectedParcelLocker.city}`;
        deliveryDetails.recipient_name = document.getElementById('recipientName')?.value || currentUser.email;
        deliveryDetails.recipient_phone = document.getElementById('recipientPhone')?.value || '';
      } else {
        // Courier
        const name = document.getElementById('recipientName').value;
        const phone = document.getElementById('recipientPhone').value;
        const address = document.getElementById('shippingAddress').value;
        const city = document.getElementById('shippingCity').value;
        const postal = document.getElementById('shippingPostalCode').value;

        if (!name || !phone || !address || !city || !postal) {
          await showInfoModal('Please fill in all shipping address fields', 'Validation Error');
          return;
        }

        deliveryDetails.recipient_name = name;
        deliveryDetails.recipient_phone = phone;
        deliveryDetails.address = address;
        deliveryDetails.city = city;
        deliveryDetails.postal_code = postal;
      }
    }

    // Show loading
    document.getElementById('checkoutPayBtn').disabled = true;
    document.getElementById('checkoutPayBtn').textContent = 'Creating order...';

    // Create order
    const { data, error } = await supabase.rpc('create_order_from_product', {
      p_product_id: currentCheckoutProduct.id,
      p_buyer_id: currentUser.id,
      p_quantity: quantity,
      p_delivery_method: selectedDeliveryMethod,
      p_delivery_details: deliveryDetails
    });

    if (error) throw error;

    if (data.success) {
      await showInfoModal('Order created successfully! Redirecting to payment...', 'Success');
      closeCheckoutModal();
      // Redirect to orders page to complete payment
      window.location.href = `orders.html`;
    } else {
      throw new Error(data.error || 'Failed to create order');
    }
  } catch (error) {
    console.error('Error creating order:', error);
    await showInfoModal('Failed to create order: ' + (error.message || 'Unknown error'), 'Error');
    document.getElementById('checkoutPayBtn').disabled = false;
    document.getElementById('checkoutPayBtn').textContent = 'Proceed to Payment';
  }
};

// ============================
// Close Modal
// ============================
window.closeCheckoutModal = function() {
  const modal = document.getElementById('checkoutModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
  
  // Reset state
  currentCheckoutProduct = null;
  selectedDeliveryMethod = 'meetup';
  selectedShippingCarrier = null;
  selectedShippingService = null;
  selectedParcelLocker = null;
  shippingCost = 0;
};
