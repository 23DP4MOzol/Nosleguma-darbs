// Import necessary modules
import { supabase } from '../supabase.js';
import { i18n } from '../i18n.js';
import { themeManager } from '../theme.js';
import { showInfoModal } from '../ui/modal.js';
import { CATEGORY_FIELDS, getCategoryDisplayName, parseProductAttrs } from '../category-fields.js';
import { getPlatformSettings } from '../platform-settings.js';
import { logAuditEvent } from '../audit.js';

let listingDisabledByAdmin = false;
let editingProductId = null;
let editingProduct = null;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png'];

const SELL_CATEGORY_OPTIONS = [
  { value: 'Electronics', key: 'electronics', emoji: '📱' },
  { value: 'Clothing', key: 'clothing', emoji: '👕' },
  { value: 'Furniture', key: 'furniture', emoji: '🪑' },
  { value: 'Books', key: 'books', emoji: '📚' },
  { value: 'Sports', key: 'sports', emoji: '⚽' },
  { value: 'Home', key: 'home', emoji: '🏠' },
  { value: 'Vehicles', key: 'vehicles', emoji: '🚗' },
  { value: 'Other', key: 'other', emoji: '📦' }
];

const CLEAN_CATEGORY_EMOJIS = {
  Electronics: '\uD83D\uDCF1',
  Clothing: '\uD83D\uDC55',
  Furniture: '\uD83E\uDE91',
  Books: '\uD83D\uDCDA',
  Sports: '\u26BD',
  Home: '\uD83C\uDFE0',
  Vehicles: '\uD83D\uDE97',
  Other: '\uD83D\uDCE6'
};

SELL_CATEGORY_OPTIONS.forEach((option) => {
  option.emoji = CLEAN_CATEGORY_EMOJIS[option.value] || option.emoji;
});

const EXTRA_FIELD_I18N = {
  brand: 'extra_brand',
  make: 'extra_make',
  model: 'extra_model',
  screen_size: 'extra_screen_size',
  storage: 'extra_storage',
  color: 'extra_color',
  size: 'extra_size',
  gender: 'extra_gender',
  material: 'extra_material',
  dimensions: 'extra_dimensions',
  room: 'extra_room',
  author: 'extra_author',
  isbn: 'extra_isbn',
  pages: 'extra_pages',
  book_language: 'extra_book_language',
  genre: 'extra_genre',
  sport_type: 'extra_sport_type',
  year: 'extra_year',
  mileage: 'extra_mileage',
  fuel_type: 'extra_fuel_type',
  transmission: 'extra_transmission'
};

function tFieldLabel(field) {
  const key = EXTRA_FIELD_I18N[field.key];
  return key ? i18n.t(key) : field.label;
}

function tFieldPlaceholder(field) {
  const baseKey = EXTRA_FIELD_I18N[field.key];
  if (!baseKey) return field.placeholder || '';
  const key = `${baseKey}_ph`;
  const translated = i18n.t(key);
  return translated !== key ? translated : (field.placeholder || '');
}

function readFilesAsDataUrls(files) {
  return Promise.all(files.map((file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  })));
}

async function getValidImageDataUrls(fileInput) {
  const files = Array.from(fileInput?.files || []);
  if (!files.length) return [];

  if (files.some((file) => !ALLOWED_IMAGE_TYPES.includes(file.type))) {
    throw new Error(i18n.t('image_type_invalid'));
  }

  if (files.some((file) => file.size > MAX_IMAGE_SIZE_BYTES)) {
    throw new Error(i18n.t('image_too_large'));
  }

  return readFilesAsDataUrls(files);
}

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

  try {
    const platform = await getPlatformSettings({ useCache: true });
    listingDisabledByAdmin = !!platform?.disable_listing;
    if (listingDisabledByAdmin) {
      await logAuditEvent('listing_blocked_admin_disabled', { page: 'sell' });
      await showInfoModal('Listing is currently disabled by admin. Please try again later.', 'Unavailable');

      const submitBtn = document.querySelector('#sellForm button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Listing Disabled';
      }
    }
  } catch (e) {
    listingDisabledByAdmin = false;
  }

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
          const label = tFieldLabel(f);
          const opts = f.options.map(o => `<option value="${o.value}">${o.label}</option>`).join('');
          return `<label class="form-field">
            <span class="form-label">${f.emoji || ''} ${label}${f.required ? ' *' : ''}</span>
            <select id="extra_${f.key}" class="form-select" ${f.required ? 'required' : ''}>
              <option value="">— ${i18n.t ? i18n.t('select') || 'Select' : 'Select'} —</option>
              ${opts}
            </select>
          </label>`;
        }
        const label = tFieldLabel(f);
        return `<label class="form-field">
          <span class="form-label">${f.emoji || ''} ${label}${f.required ? ' *' : ''}</span>
          <input type="${f.type || 'text'}" id="extra_${f.key}" class="form-input"
            placeholder="${tFieldPlaceholder(f)}" ${f.min !== undefined ? `min="${f.min}"` : ''} ${f.step ? `step="${f.step}"` : ''}
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
    productImageFileInput.addEventListener('change', async (e) => {
      let imageDataUrls = [];
      try {
        imageDataUrls = await getValidImageDataUrls(productImageFileInput);
        if (imageDataUrls.length) {
          productImageFileInput.dataset.previewUrl = imageDataUrls[0];
          productImageFileInput.dataset.imageUrls = JSON.stringify(imageDataUrls);
        }
      } catch (error) {
        await showInfoModal(error.message || i18n.t('image_upload_failed'), i18n.t('admin_error') || 'Error');
        productImageFileInput.value = '';
        delete productImageFileInput.dataset.previewUrl;
        delete productImageFileInput.dataset.imageUrls;
        updatePreview();
        return;
      }

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
        delete productImageFileInput.dataset.imageUrls;
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
      delete productImageFileInput.dataset.imageUrls;
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
        productImageFileInput.dataset.imageUrls = JSON.stringify([productImageFileInput.dataset.previewUrl]);
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
  const meetupCityInput = document.getElementById('meetupCityInput');
  const packageSizeSection = document.getElementById('packageSizeSection');
  const packageSizeInput = document.getElementById('packageSizeInput');

  function renderCategorySelectOptions() {
    if (!categorySelect) return;
    const currentValue = categorySelect.value;
    const placeholder = i18n.t('sell_select_category');
    categorySelect.innerHTML = [
      `<option value="">${placeholder}</option>`,
      ...SELL_CATEGORY_OPTIONS.map(option => (
        `<option value="${option.value}">${option.emoji} ${i18n.t(option.key)}</option>`
      ))
    ].join('');
    categorySelect.value = currentValue;
  }

  function updatePublicationPeriodOptions() {
    const durationSelect = document.getElementById('productDurationInput');
    if (!durationSelect) return;
    const labels = ['publication_period_1', 'publication_period_2', 'publication_period_3'].map((key) => i18n.t(key));
    Array.from(durationSelect.options).forEach((option, index) => {
      if (labels[index]) option.textContent = labels[index];
    });
  }

  function updatePackageSizeOptions() {
    if (!packageSizeInput) return;
    Array.from(packageSizeInput.options).forEach((option) => {
      if (option.dataset.i18n) option.textContent = i18n.t(option.dataset.i18n);
    });
  }

  function updateShippingMethodUI() {
    if (!shippingMethodSelect) return;
    const isMeetup = shippingMethodSelect.value === 'meetup';
    const includesMeetup = shippingMethodSelect.value === 'meetup' || shippingMethodSelect.value === 'both';
    const includesLocker = shippingMethodSelect.value === 'locker' || shippingMethodSelect.value === 'both';
    if (sellerAddressSection) sellerAddressSection.style.display = includesMeetup ? 'block' : 'none';
    if (packageSizeSection) packageSizeSection.style.display = includesLocker ? 'block' : 'none';
    if (meetupCityInput) {
      meetupCityInput.required = includesMeetup;
      if (!includesMeetup) meetupCityInput.value = '';
    }
    if (packageSizeInput) {
      packageSizeInput.required = includesLocker;
      if (!includesLocker) packageSizeInput.value = '';
    }
  }

  renderCategorySelectOptions();
  updatePublicationPeriodOptions();
  updatePackageSizeOptions();

  if (shippingMethodSelect) {
    shippingMethodSelect.value = 'locker';
    shippingMethodSelect.addEventListener('change', updateShippingMethodUI);
  }
  updateShippingMethodUI();


  // Real-time preview update
  function updatePreview() {
    const name = document.getElementById('productNameInput').value || 'Product Name';
    const category = document.getElementById('productCategoryInput').value || 'Category';
    const categoryLabel = getCategoryDisplayName(category, i18n.lang);
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
            ${categoryEmoji[category] || '📦'} ${categoryLabel}
          </div>
          <h4 style="margin: 0 0 1rem 0; color: var(--fg); font-size: 1.25rem; font-weight: 700;">${name}</h4>
          <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap;">
            ${condition ? `<span style="background: #dbeafe; color: #1e40af; padding: 0.375rem 0.75rem; border-radius: 6px; font-size: 0.8125rem; font-weight: 600;">${conditionEmoji[condition]} ${i18n.t(`condition_${condition}_text`)}</span>` : ''}
            ${location ? `<span style="color: var(--muted); font-size: 0.875rem;">📍 ${location}</span>` : ''}
            <span style="color: var(--muted); font-size: 0.875rem;">📦 ${stock} ${i18n.t('in_stock_label')}</span>
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

  window.addEventListener('vendly:languagechange', () => {
    renderCategorySelectOptions();
    updatePublicationPeriodOptions();
    updatePackageSizeOptions();
    renderCategoryFields(categorySelect?.value || '');
    updatePreview();
  });

  async function loadEditProductIfNeeded() {
    const editId = new URLSearchParams(window.location.search).get('edit');
    if (!editId) return;

    editingProductId = editId;
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', editId)
      .maybeSingle();

    if (error || !product) {
      await showInfoModal(i18n.t('co_product_not_found'), i18n.t('admin_error') || 'Error');
      return;
    }

    if (product.seller_id !== user.id) {
      await showInfoModal(i18n.t('product_delete_failed'), i18n.t('admin_error') || 'Error');
      return;
    }

    editingProduct = product;
    const parsed = parseProductAttrs(product.description || '');
    const categoryValue = product.category
      ? product.category.charAt(0).toUpperCase() + product.category.slice(1)
      : '';

    document.getElementById('productNameInput').value = product.name || '';
    document.getElementById('productCategoryInput').value = categoryValue;
    document.getElementById('productPriceInput').value = product.price || '';
    document.getElementById('productConditionInput').value = product.condition || '';
    document.getElementById('productStockInput').value = product.stock || 1;
    document.getElementById('productLocationInput').value = product.location || '';
    document.getElementById('productDescriptionInput').value = parsed.description || '';
    document.getElementById('productImageInput').value = product.image_url || '';

    renderCategoryFields(categoryValue);
    Object.entries(parsed.attrs || {}).forEach(([key, value]) => {
      const el = document.getElementById(`extra_${key}`);
      if (el) el.value = value;
    });

    const submitText = form.querySelector('button[type="submit"] span');
    if (submitText) submitText.textContent = i18n.t('save_listing_changes');
    updatePreview();
  }

  await loadEditProductIfNeeded();

  // Update preview on input changes
  ['productNameInput', 'productCategoryInput', 'productPriceInput', 'productConditionInput', 'productDescriptionInput', 'productImageInput', 'productDurationInput', 'packageSizeInput'].forEach(id => {
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

    if (listingDisabledByAdmin) {
      await showInfoModal('Listing is currently disabled by admin. Please try again later.', 'Unavailable');
      return;
    }

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

      // Re-check server-side setting (best-effort) in case it changed while the page was open
      try {
        const platform = await getPlatformSettings({ useCache: false });
        if (platform?.disable_listing) {
          listingDisabledByAdmin = true;
          await showInfoModal('Listing is currently disabled by admin. Please try again later.', 'Unavailable');
          return;
        }
      } catch (e) {}

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
        brand: '',
        color: '',
        weight_kg: null,
        seller_street: '',
        seller_city: ['meetup', 'both'].includes(shippingMethodSelect?.value) ? (meetupCityInput?.value || '').trim() : '',
        seller_postal_code: '',
        shipping_method: shippingMethodSelect?.value || 'locker',
        package_size: packageSizeInput?.value || ''
      };

      if (['meetup', 'both'].includes(shippingMethodSelect?.value) && !productData.seller_city) {
        await showInfoModal(i18n.t('sell_meetup_city_required'), i18n.t('sell_meetup_city'));
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        return;
      }

      if (['locker', 'both'].includes(shippingMethodSelect?.value) && !productData.package_size) {
        await showInfoModal(i18n.t('sell_package_size_required'), i18n.t('sell_package_size'));
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        return;
      }

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

      productData.description += '\n<!--vendly-delivery:' + JSON.stringify({
        shipping_method: productData.shipping_method,
        package_size: productData.package_size || null
      }) + '-->';

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
      if (listingDisabledByAdmin) {
        submitBtn.textContent = 'Listing Disabled';
        submitBtn.disabled = true;
      } else {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
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
