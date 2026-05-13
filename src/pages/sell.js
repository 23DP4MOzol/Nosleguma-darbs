// Import necessary modules
import { supabase } from '../supabase.js';
import { i18n } from '../i18n.js';
import { themeManager } from '../theme.js';
import { showInfoModal } from '../ui/modal.js';
import { CATEGORY_FIELDS } from '../category-fields.js';

// ============================
// Authentication Check - Redirect guests to login
// ============================
async function checkAuth() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // User is not logged in, redirect to login page with reason
    const redirectUrl = window.location.href;
    window.location.href = `login.html?redirect=${encodeURIComponent(redirectUrl)}&reason=sell`;
    return false;
  }
  return user;
}

// Form handling and preview functionality
document.addEventListener('DOMContentLoaded', async () => {
  // Check auth first
  const user = await checkAuth();
  if (!user) return;

  const form = document.getElementById('sellForm');
  const productPreview = document.getElementById('productPreview');

  // ============================
  // Dynamic Category-Specific Fields
  // ============================
  const categorySelect = document.getElementById('productCategoryInput');
  const extraContainer = document.getElementById('categoryExtraFields');
  const extraGrid = document.getElementById('categoryExtraFieldsGrid');
  const extraTitle = document.getElementById('categoryExtraTitle');

  function renderCategoryFields(categoryValue) {
    const cat = (categoryValue || '').toLowerCase();
    const fields = CATEGORY_FIELDS[cat];
    if (!fields || fields.length === 0) {
      if (extraContainer) extraContainer.style.display = 'none';
      if (extraGrid) extraGrid.innerHTML = '';
      return;
    }
    if (extraContainer) extraContainer.style.display = 'block';
    const catEmojis = { electronics:'📱', clothing:'👕', furniture:'🪑', books:'📚', sports:'⚽', home:'🏠', vehicles:'🚗', other:'📦' };
    if (extraTitle) {
      const emoji = catEmojis[cat] || '📋';
      extraTitle.innerHTML = `${emoji} <span data-i18n="sell_extra_details">Category Details</span>`;
    }
    if (extraGrid) {
      extraGrid.innerHTML = fields.map(f => {
        if (f.type === 'select') {
          const opts = f.options.map(o => `<option value="${o.value}">${o.label}</option>`).join('');
          return `<label class="form-field">
            <span class="form-label">${f.emoji || ''} ${f.label}${f.required ? ' *' : ''}</span>
            <select id="extra_${f.key}" class="form-select" ${f.required ? 'required' : ''}>
              <option value="">— ${i18n.t ? i18n.t('select') || 'Select' : 'Select'} —</option>
              ${opts}
            </select>
          </label>`;
        }
        return `<label class="form-field">
          <span class="form-label">${f.emoji || ''} ${f.label}${f.required ? ' *' : ''}</span>
          <input type="${f.type || 'text'}" id="extra_${f.key}" class="form-input"
            placeholder="${f.placeholder || ''}" ${f.min !== undefined ? `min="${f.min}"` : ''} ${f.step ? `step="${f.step}"` : ''}
            ${f.required ? 'required' : ''}>
        </label>`;
      }).join('');
    }
  }

  if (categorySelect) {
    categorySelect.addEventListener('change', () => renderCategoryFields(categorySelect.value));
    // Render on load if category is pre-selected
    if (categorySelect.value) renderCategoryFields(categorySelect.value);
  }

  // Image type radio buttons
  const imageTypeRadios = document.querySelectorAll('input[name="imageType"]');
  const productImageInput = document.getElementById('productImageInput');
  const productImageFileInput = document.getElementById('productImageFileInput');

  imageTypeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.value === 'url') {
        productImageInput.style.display = 'block';
        productImageFileInput.style.display = 'none';
        productImageFileInput.required = false;
        productImageInput.required = true;
        productImageFileInput.value = '';
      } else {
        productImageInput.style.display = 'none';
        productImageFileInput.style.display = 'block';
        productImageInput.required = false;
        productImageFileInput.required = true;
        productImageInput.value = '';
      }
    });
  });

  // File upload preview
  let cropper = null;
  const cropperModal = document.getElementById('cropperModal');
  const cropperImage = document.getElementById('cropperImage');
  const cancelCropBtn = document.getElementById('cancelCropBtn');
  const saveCropBtn = document.getElementById('saveCropBtn');

  if (productImageFileInput) {
    productImageFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          cropperImage.src = event.target.result;
          cropperModal.style.display = 'flex';
          if (cropper) cropper.destroy();
          cropper = new Cropper(cropperImage, {
            viewMode: 1
          });
        };
        reader.readAsDataURL(file);
      } else {
        delete productImageFileInput.dataset.previewUrl;
        updatePreview();
      }
    });
  }

  if (cancelCropBtn) {
    cancelCropBtn.addEventListener('click', (e) => {
      e.preventDefault();
      cropperModal.style.display = 'none';
      if (cropper) {
        cropper.destroy();
        cropper = null;
      }
      productImageFileInput.value = '';
      delete productImageFileInput.dataset.previewUrl;
      updatePreview();
    });
  }

  if (saveCropBtn) {
    saveCropBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (cropper) {
        const canvas = cropper.getCroppedCanvas({
          width: 800,
          height: 800
        });
        productImageFileInput.dataset.previewUrl = canvas.toDataURL(productImageFileInput.files[0].type || 'image/jpeg');
        cropperModal.style.display = 'none';
        cropper.destroy();
        cropper = null;
        updatePreview();
      }
    });
  }

  // ============================
  // Shipping Method & Locker Map
  // ============================
  const shippingMethodSelect = document.getElementById('shippingMethod');
  const sellerAddressSection = document.getElementById('sellerAddressSection');
  const parcelLockerSection = document.getElementById('parcelLockerSection');
  const mapElement = document.getElementById('map');
  const lockerListElement = document.getElementById('locker-list');
  const carrierFilterButtons = document.querySelectorAll('.carrier-filter-btn');
  const lockerSearchInput = document.getElementById('lockerSearchInput');
  const selectedLockerIdInput = document.getElementById('selectedLockerId');

  let map = null;
  let allLockers = [];
  let visibleMarkers = [];

  async function initializeLockerMap() {
    if (!mapElement) return;

    // Initialize map
    map = L.map(mapElement).setView([56.9496, 24.1052], 8); // Centered on Riga
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Fetch lockers
    const { data, error } = await supabase.from('parcel_lockers').select('*').eq('active', true);
    if (error) {
      console.error('Error fetching lockers:', error);
      lockerListElement.innerHTML = '<p>Could not load lockers.</p>';
      return;
    }
    allLockers = data;
    
    renderLockerList(allLockers);
    updateMapMarkers(allLockers);
  }

  function renderLockerList(lockers) {
    lockerListElement.innerHTML = '';
    if (lockers.length === 0) {
      lockerListElement.innerHTML = '<p style="padding: 1rem; text-align: center;">No lockers found.</p>';
      return;
    }
    lockers.forEach(locker => {
      const item = document.createElement('div');
      item.className = 'locker-item';
      item.dataset.lockerId = locker.id;
      item.innerHTML = `
        <strong>${locker.name}</strong>
        <p style="font-size: 0.8rem; color: var(--muted); margin: 0;">${locker.address}, ${locker.city}</p>
      `;
      item.addEventListener('click', () => {
        selectedLockerIdInput.value = locker.id;
        document.querySelectorAll('.locker-item').forEach(el => el.classList.remove('selected'));
        item.classList.add('selected');
        map.setView([locker.latitude, locker.longitude], 15);
        // Find and open the corresponding marker popup
        const marker = visibleMarkers.find(m => m.options.lockerId === locker.id);
        if (marker) {
            marker.openPopup();
        }
      });
      lockerListElement.appendChild(item);
    });
  }

  function updateMapMarkers(lockers) {
    // Clear existing markers
    visibleMarkers.forEach(marker => marker.removeFrom(map));
    visibleMarkers = [];

    const carrierLogos = {
        omniva: 'https://www.omniva.lv/assets/img/logo.svg',
        dpd: 'https://www.dpd.com/wp-content/themes/DPD_NoLogin/images/DPD_logo_redgrad_rgb_responsive.svg',
        pasts: 'https://www.pasts.lv/img/logo.svg',
        venipak: 'https://venipak.com/wp-content/uploads/2021/09/venipak-logo.svg'
    };

    lockers.forEach(locker => {
      if (locker.latitude && locker.longitude) {
        const iconHtml = `<div style="background-image: url(${carrierLogos[locker.carrier] || ''}); width: 30px; height: 30px; background-size: contain; background-repeat: no-repeat; background-position: center;"></div>`;
        const customIcon = L.divIcon({
            html: iconHtml,
            className: 'custom-map-icon',
            iconSize: [30, 30],
            iconAnchor: [15, 15],
            popupAnchor: [0, -15]
        });

        const marker = L.marker([locker.latitude, locker.longitude], { icon: customIcon, lockerId: locker.id })
          .addTo(map)
          .bindPopup(`<b>${locker.name}</b><br>${locker.address}`);
        visibleMarkers.push(marker);
      }
    });
  }
  
  function filterLockers() {
    const activeCarrier = document.querySelector('.carrier-filter-btn.active').dataset.carrier;
    const searchTerm = lockerSearchInput.value.toLowerCase();

    let filteredLockers = allLockers;

    if (activeCarrier !== 'all') {
      filteredLockers = filteredLockers.filter(locker => locker.carrier === activeCarrier);
    }

    if (searchTerm) {
      filteredLockers = filteredLockers.filter(locker => 
        locker.name.toLowerCase().includes(searchTerm) || 
        locker.address.toLowerCase().includes(searchTerm) ||
        locker.city.toLowerCase().includes(searchTerm)
      );
    }

    renderLockerList(filteredLockers);
    updateMapMarkers(filteredLockers);
  }

  shippingMethodSelect.addEventListener('change', (e) => {
    if (e.target.value === 'locker') {
      sellerAddressSection.style.display = 'none';
      parcelLockerSection.style.display = 'block';
      if (!map) {
        initializeLockerMap();
      } else {
        // Invalidate map size if it was hidden
        setTimeout(() => map.invalidateSize(), 10);
      }
    } else {
      sellerAddressSection.style.display = 'block';
      parcelLockerSection.style.display = 'none';
    }
  });

  carrierFilterButtons.forEach(button => {
    button.addEventListener('click', () => {
      carrierFilterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      filterLockers();
    });
  });

  lockerSearchInput.addEventListener('input', filterLockers);


  // Real-time preview update
  function updatePreview() {
    const name = document.getElementById('productNameInput').value || 'Product Name';
    const category = document.getElementById('productCategoryInput').value || 'Category';
    const price = parseFloat(document.getElementById('productPriceInput').value) || 0;
    const condition = document.getElementById('productConditionInput').value || '';
    const stock = parseInt(document.getElementById('productStockInput').value) || 1;
    const location = document.getElementById('productLocationInput').value || '';
    const description = document.getElementById('productDescriptionInput').value || 'Product description...';

    let imageUrl = 'https://placehold.co/300x200/667eea/white?text=Upload+Image';

    // Check if file is selected
    const fileRadio = document.querySelector('input[name="imageType"][value="file"]');
    if (fileRadio && fileRadio.checked && productImageFileInput.files[0]) {
      // Use a stored data URL if available, otherwise placeholder
      if (productImageFileInput.dataset.previewUrl) {
        imageUrl = productImageFileInput.dataset.previewUrl;
      }
    } else {
      imageUrl = document.getElementById('productImageInput').value || 'https://placehold.co/300x200/667eea/white?text=Upload+Image';
    }

    // Calculate and display listing fee (€0.50 to €1.00)
    const duration = parseInt(document.getElementById('productDurationInput')?.value || '1');
    const baseFee = 0.50;
    const listingFee = baseFee + ((duration - 1) * 0.50);
    const feeElement = document.getElementById('calculatedFee');
    if (feeElement) {
      feeElement.textContent = `Current fee: €${listingFee.toFixed(2)}`;
    }

    const conditionEmoji = {
      'new': '✨',
      'like_new': '🔄',
      'good': '👍',
      'fair': '😐',
      'poor': '⚠️'
    };

    const categoryEmoji = {
      'Electronics': '📱',
      'Clothing': '👕',
      'Furniture': '🪑',
      'Books': '📚',
      'Sports': '⚽',
      'Home': '🏠',
      'Vehicles': '🚗',
      'Other': '📦'
    };

    productPreview.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <div style="width: 100%; height: 250px; border-radius: 12px; overflow: hidden; background: var(--secondary); position: relative;">
          <img src="${imageUrl}" alt="${name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://placehold.co/300x200/667eea/white?text=Upload+Image'">
          ${stock > 0 ? '' : '<div style="position: absolute; top: 10px; left: 10px; background: #ef4444; color: white; padding: 0.25rem 0.75rem; border-radius: 100px; font-size: 0.75rem; font-weight: 600;">Out of Stock</div>'}
        </div>
        <div>
          <div style="display: inline-block; background: var(--secondary); color: var(--primary); padding: 0.25rem 0.75rem; border-radius: 6px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; margin-bottom: 0.75rem;">
            ${categoryEmoji[category] || '📦'} ${category}
          </div>
          <h4 style="margin: 0 0 1rem 0; color: var(--fg); font-size: 1.25rem; font-weight: 700;">${name}</h4>
          <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap;">
            ${condition ? `<span style="background: #dbeafe; color: #1e40af; padding: 0.375rem 0.75rem; border-radius: 6px; font-size: 0.8125rem; font-weight: 600;">${conditionEmoji[condition]} ${condition.replace('_', ' ')}</span>` : ''}
            ${location ? `<span style="color: var(--muted); font-size: 0.875rem;">📍 ${location}</span>` : ''}
            <span style="color: var(--muted); font-size: 0.875rem;">📦 ${stock} in stock</span>
          </div>
          <div style="padding: 1rem 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); margin-bottom: 1rem;">
            <div style="display: flex; align-items: baseline; gap: 0.25rem;">
              <span style="font-size: 1rem; font-weight: 700; color: var(--muted);">€</span>
              <span style="font-size: 2rem; font-weight: 900; color: var(--fg);">${parseFloat(price).toFixed(2)}</span>
            </div>
          </div>
          <p style="margin: 0; color: var(--muted); font-size: 0.875rem; line-height: 1.6;">${description.length > 150 ? description.substring(0, 150) + '...' : description}</p>
          <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border);">
            <button style="width: 100%; padding: 0.75rem; background: var(--gradient-primary); color: white; border: none; border-radius: 10px; font-weight: 700; font-size: 0.9375rem; cursor: not-allowed;" disabled>
              🛒 Buy Now - €${parseFloat(price).toFixed(2)}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Trigger initial preview
  updatePreview();

  // Update preview on input changes
  ['productNameInput', 'productCategoryInput', 'productPriceInput', 'productConditionInput', 'productDescriptionInput', 'productImageInput', 'productDurationInput'].forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('input', updatePreview);
      // Also trigger on keyup for immediate feedback
      if (id === 'productPriceInput') {
        element.addEventListener('keyup', updatePreview);
      }
    }
  });

  // Live preview updates automatically on input; no preview button needed

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '⏳ Listing...';
    submitBtn.disabled = true;

    try {
      const { data } = await supabase.auth.getUser();
      const user = data ? data.user : null;
      if (!user) {
        await showInfoModal('Please log in first', 'Authentication Required');
        return;
      }

      let imageUrl = null;

      // Check if file upload is selected
      const fileRadio = document.querySelector('input[name="imageType"][value="file"]');
      if (fileRadio && fileRadio.checked) {
        const fileInput = document.getElementById('productImageFileInput');
        if (fileInput && fileInput.files[0]) {
          // Use the data URL from the preview for file uploads
          imageUrl = fileInput.dataset.previewUrl || 'https://placehold.co/300x200/667eea/white?text=Upload+Image';
        }
      } else {
        // URL input
        imageUrl = document.getElementById('productImageInput').value;
      }

      const productData = {
        name: document.getElementById('productNameInput').value,
        category: document.getElementById('productCategoryInput').value.toLowerCase(),
        price: parseFloat(document.getElementById('productPriceInput').value),
        description: document.getElementById('productDescriptionInput').value,
        image_url: imageUrl,
        stock: parseInt(document.getElementById('productStockInput').value),
        condition: document.getElementById('productConditionInput').value,
        location: document.getElementById('productLocationInput').value,
        brand: document.getElementById('productBrandInput')?.value || '',
        color: document.getElementById('productColorInput')?.value || '',
        weight_kg: parseFloat(document.getElementById('productWeightInput')?.value) || null,
        seller_street: document.getElementById('sellerStreetInput')?.value || '',
        seller_city: document.getElementById('sellerCityInput')?.value || '',
        seller_postal_code: document.getElementById('sellerPostalInput')?.value || '',
        shipping_from_locker: document.getElementById('shippingMethod').value === 'locker' ? document.getElementById('selectedLockerId').value : null
      };

      // Collect category-specific extra attributes
      const cat = productData.category;
      const catFields = CATEGORY_FIELDS[cat] || [];
      if (catFields.length > 0) {
        const extraAttrs = {};
        catFields.forEach(f => {
          const el = document.getElementById(`extra_${f.key}`);
          if (el && el.value) {
            extraAttrs[f.key] = el.value;
            // Also populate top-level brand/color if the extra field overrides them
            if (f.key === 'brand' || f.key === 'make') productData.brand = productData.brand || el.value;
            if (f.key === 'color') productData.color = productData.color || el.value;
          }
        });
        if (Object.keys(extraAttrs).length > 0) {
          // Append structured attrs to description (hidden marker)
          productData.description = productData.description + '\n<!--vendly-attrs:' + JSON.stringify(extraAttrs) + '-->';
        }
      }

      const { listProduct } = await import('../supabase.js');
      const result = await listProduct(productData, user.id);

      if (result) {
        await showInfoModal('Product listed successfully!', 'Success');
        form.reset();
        updatePreview();
        // Redirect to home page
        setTimeout(() => window.location.href = './index.html', 1500);
      }
    } catch (error) {
      console.error('Error listing product:', error);
      await showInfoModal('Error listing product: ' + error.message, 'Error');
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });
});

// Theme is handled by centralized theme.js

// ============================
// Initialize Language from localStorage
// ============================
function initializeLanguage() {
  const savedLang = localStorage.getItem('lang') || 'en';
  const langSelect = document.getElementById('langSelect');
  if (langSelect) {
    langSelect.value = savedLang;
  }
  i18n.setLang(savedLang);
}

// ============================
// Initialize on page load
// ============================
initializeLanguage();

// ============================
// Language Change Handler
// ============================
document.getElementById('langSelect').addEventListener('change', e => {
  const lang = e.target.value;
  localStorage.setItem('lang', lang);
  i18n.setLang(lang);
});

// Theme toggle is handled by theme.js

// Auth handling
async function updateAuth() {
  const { data } = await supabase.auth.getUser();
  const user = data ? data.user : null;

  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const balanceBadge = document.getElementById('balanceBadge');

  if (user) {
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-block';

    // Update balance
    const { data: userData } = await supabase.from('users').select('balance').eq('id', user.id).single();
    if (userData && balanceBadge) {
      balanceBadge.querySelector('span').textContent = `€${parseFloat(userData.balance).toFixed(2)}`;
    }
  } else {
    loginBtn.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
  }
}

document.getElementById('loginBtn').addEventListener('click', () => {
  window.location.href = 'login.html';
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await supabase.auth.signOut();
  updateAuth();
});

updateAuth();
