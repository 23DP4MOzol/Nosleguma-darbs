// Import necessary modules
import { supabase } from '../supabase.js';
import { i18n } from '../i18n.js';
import { themeManager } from '../theme.js';
import { showInfoModal } from '../ui/modal.js';

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
  if (productImageFileInput) {
    productImageFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          // Store the data URL for preview
          productImageFileInput.dataset.previewUrl = e.target.result;
          // Update preview with the uploaded image
          updatePreview();
        };
        reader.readAsDataURL(file);
      } else {
        delete productImageFileInput.dataset.previewUrl;
        updatePreview();
      }
    });
  }

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
    const listingFee = price >= 100 ? 1.00 : Math.max(0.50, 0.50 + (price / 100) * 0.50);
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
  ['productNameInput', 'productCategoryInput', 'productPriceInput', 'productConditionInput', 'productDescriptionInput', 'productImageInput'].forEach(id => {
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
        seller_postal_code: document.getElementById('sellerPostalInput')?.value || ''
      };

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

document.getElementById('hamburgerBtn').addEventListener('click', () => {
  document.querySelector('.navbar-links').classList.toggle('active');
});

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
