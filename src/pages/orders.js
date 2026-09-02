import { supabase, getCurrentUser } from '../supabase.js';
import { i18n } from '../i18n.js';
import { showToast } from '../main.js';
import { showInfoModal, showConfirmModal } from '../ui/modal.js';
import { fetchOmnivaBalticLockers } from '../lib/omniva-lockers.js';
import { getPlatformSettings } from '../platform-settings.js';
import { logAuditEvent } from '../audit.js';

// ============================
// State
// ============================
let currentUser = null;
let currentFilter = 'all';
let currentStatusFilter = 'all';
let currentDeliveryFilter = 'all';
let allOrders = [];

// Checkout state
let checkoutProduct = null;
let selectedDeliveryMethod = 'meetup';
let selectedCarrier = 'omniva';
let selectedAddressType = 'address';
let selectedLocker = null;
let computedShippingCost = 0;
let lockerMap = null;
let lockerMarkers = [];
let userLocationMarker = null;
let userCoordinates = null;
let lockerSearchQuery = '';

// Helper: translate with fallback
const t = (key) => (i18n && i18n.t ? i18n.t(key) : key);

// ============================
// Carriers — realistic Baltic pricing tables
// Based on official DPD, Omniva, Latvijas Pasts, Venipak rate cards 2024/2025
// ============================
const CARRIER_ICONS = {
  omniva: '\uD83D\uDCEE', dpd: '\uD83D\uDE9A', latvijas_pasts: '\u2709\uFE0F', venipak: '\uD83D\uDCE6'
};

// Official website URLs
const CARRIER_URLS = {
  omniva:         'https://www.omniva.lv',
  dpd:            'https://www.dpd.com/lv/lv/',
  latvijas_pasts: 'https://www.pasts.lv',
  venipak:        'https://www.venipak.com'
};

// Weight-based pricing tiers (EUR, incl. VAT) — modeled after real Baltic rates
// Each carrier has: parcel_locker & courier rates, per weight bracket, per country pair
const CARRIER_RATE_TABLES = {
  omniva: {
    name: 'Omniva',
    icon: '\uD83D\uDCEE',
    services: {
      parcel_locker: {
        label: 'Parcel Locker (Omniva paku skapis)',
        est: { LV_LV: '1-2', LV_LT: '2-3', LV_EE: '2-3' },
        // price by weight bracket (kg → EUR)
        rates: {
          LV_LV: [ [2, 2.49], [5, 3.49], [10, 4.49], [20, 5.99], [31.5, 7.49] ],
          LV_LT: [ [2, 3.99], [5, 4.99], [10, 6.49], [20, 8.49], [31.5, 10.49] ],
          LV_EE: [ [2, 3.99], [5, 4.99], [10, 6.49], [20, 8.49], [31.5, 10.49] ]
        }
      },
      courier: {
        label: 'Courier to door (Omniva kurjers)',
        est: { LV_LV: '1-3', LV_LT: '2-4', LV_EE: '2-4' },
        rates: {
          LV_LV: [ [2, 4.49], [5, 5.49], [10, 6.99], [20, 9.49], [31.5, 12.49] ],
          LV_LT: [ [2, 6.49], [5, 7.99], [10, 9.99], [20, 13.49], [31.5, 16.49] ],
          LV_EE: [ [2, 6.49], [5, 7.99], [10, 9.99], [20, 13.49], [31.5, 16.49] ]
        }
      }
    }
  },
  dpd: {
    name: 'DPD',
    icon: '\uD83D\uDE9A',
    services: {
      parcel_locker: {
        label: 'DPD Pickup Point / Locker',
        est: { LV_LV: '1-2', LV_LT: '2-3', LV_EE: '2-3' },
        rates: {
          LV_LV: [ [2, 2.99], [5, 3.79], [10, 4.99], [20, 6.49], [31.5, 8.49] ],
          LV_LT: [ [2, 4.49], [5, 5.49], [10, 7.29], [20, 9.49], [31.5, 11.99] ],
          LV_EE: [ [2, 4.49], [5, 5.49], [10, 7.29], [20, 9.49], [31.5, 11.99] ]
        }
      },
      courier: {
        label: 'DPD Courier to address',
        est: { LV_LV: '1-2', LV_LT: '2-3', LV_EE: '2-3' },
        rates: {
          LV_LV: [ [2, 4.99], [5, 5.99], [10, 7.99], [20, 10.99], [31.5, 14.49] ],
          LV_LT: [ [2, 7.49], [5, 8.99], [10, 11.49], [20, 15.49], [31.5, 19.49] ],
          LV_EE: [ [2, 7.49], [5, 8.99], [10, 11.49], [20, 15.49], [31.5, 19.49] ]
        }
      }
    }
  },
  latvijas_pasts: {
    name: 'Latvijas Pasts',
    icon: '\u2709\uFE0F',
    services: {
      parcel_locker: {
        label: 'Pasta paku skapis',
        est: { LV_LV: '2-4', LV_LT: '3-5', LV_EE: '3-5' },
        rates: {
          LV_LV: [ [2, 1.99], [5, 2.79], [10, 3.89], [20, 5.49], [31.5, 7.49] ],
          LV_LT: [ [2, 3.49], [5, 4.29], [10, 5.79], [20, 7.99], [31.5, 10.49] ],
          LV_EE: [ [2, 3.49], [5, 4.29], [10, 5.79], [20, 7.99], [31.5, 10.49] ]
        }
      },
      courier: {
        label: 'Latvijas Pasts kurjers',
        est: { LV_LV: '2-5', LV_LT: '4-7', LV_EE: '4-7' },
        rates: {
          LV_LV: [ [2, 3.99], [5, 4.99], [10, 6.49], [20, 8.99], [31.5, 11.99] ],
          LV_LT: [ [2, 5.99], [5, 7.49], [10, 9.99], [20, 13.99], [31.5, 17.99] ],
          LV_EE: [ [2, 5.99], [5, 7.49], [10, 9.99], [20, 13.99], [31.5, 17.99] ]
        }
      }
    }
  },
  venipak: {
    name: 'Venipak',
    icon: '\uD83D\uDCE6',
    services: {
      parcel_locker: {
        label: 'Venipak Pickup Point',
        est: { LV_LV: '1-2', LV_LT: '1-2', LV_EE: '2-3' },
        rates: {
          LV_LV: [ [2, 2.79], [5, 3.49], [10, 4.79], [20, 6.29], [31.5, 8.29] ],
          LV_LT: [ [2, 3.29], [5, 4.29], [10, 5.99], [20, 7.99], [31.5, 10.49] ],
          LV_EE: [ [2, 3.99], [5, 4.99], [10, 6.79], [20, 8.79], [31.5, 11.49] ]
        }
      },
      courier: {
        label: 'Venipak Courier',
        est: { LV_LV: '1-2', LV_LT: '1-3', LV_EE: '2-3' },
        rates: {
          LV_LV: [ [2, 4.49], [5, 5.49], [10, 7.49], [20, 10.49], [31.5, 13.49] ],
          LV_LT: [ [2, 5.99], [5, 7.49], [10, 9.99], [20, 13.49], [31.5, 16.99] ],
          LV_EE: [ [2, 6.49], [5, 7.99], [10, 10.49], [20, 14.49], [31.5, 17.99] ]
        }
      }
    }
  }
};

// Simplified CARRIERS lookup (for backward compat with order cards, etc.)
let CARRIERS = {};
(function buildCarrierDefaults() {
  Object.keys(CARRIER_RATE_TABLES).forEach(function(key) {
    var c = CARRIER_RATE_TABLES[key];
    CARRIERS[key] = { name: c.name, icon: c.icon, base: 0, est: '' };
  });
})();

let PARCEL_LOCKERS = {};

// DB-loaded shipping rates keyed by "carrier|service|country"
let shippingRatesMap = {};

// Load real shipping rates and parcel lockers from DB
async function loadShippingData(destCountry) {
  destCountry = destCountry || 'LV';
  try {
    // Load shipping rates
    var ratesRes = await supabase.from('shipping_rates').select('*').eq('active', true);
    if (!ratesRes.error && ratesRes.data && ratesRes.data.length > 0) {
      shippingRatesMap = {};
      var carrierMinPrices = {};
      ratesRes.data.forEach(function(r) {
        var key = r.carrier + '|' + r.service + '|' + r.from_country + '|' + r.to_country;
        shippingRatesMap[key] = r;

        // Track min price per carrier for display
        var cKey = r.carrier + '|' + r.to_country;
        if (!carrierMinPrices[cKey] || r.price_eur < carrierMinPrices[cKey].price_eur) {
          carrierMinPrices[cKey] = r;
        }
      });

      // Update CARRIERS with DB prices for the destination country
      Object.keys(CARRIERS).forEach(function(carrier) {
        var best = carrierMinPrices[carrier + '|' + destCountry] || carrierMinPrices[carrier + '|LV'];
        if (best) {
          CARRIERS[carrier].base = parseFloat(best.price_eur);
          CARRIERS[carrier].est = best.estimated_days_min + '-' + best.estimated_days_max;
        }
      });
    }
  } catch (e) {
    console.warn('Could not load shipping rates, using defaults:', e.message);
  }

  try {
    // Load parcel lockers from DB
    var lockRes = await supabase.from('parcel_lockers').select('*').eq('active', true).order('city');
    if (!lockRes.error && lockRes.data && lockRes.data.length > 0) {
      PARCEL_LOCKERS = {};
      lockRes.data.forEach(function(l) {
        if (!PARCEL_LOCKERS[l.carrier]) PARCEL_LOCKERS[l.carrier] = [];
        PARCEL_LOCKERS[l.carrier].push({
          id: l.locker_id,
          name: l.name,
          address: l.address + ', ' + l.city,
          city: l.city,
          country: l.country,
          postal_code: l.postal_code,
          latitude: l.latitude,
          longitude: l.longitude
        });
      });
    } else {
      // Fallback lockers if DB table doesn't exist yet
      PARCEL_LOCKERS = FALLBACK_LOCKERS;
    }
  } catch (e) {
    console.warn('Could not load parcel lockers, using defaults:', e.message);
    PARCEL_LOCKERS = FALLBACK_LOCKERS;
  }

  try {
    var omnivaBalticLockers = await fetchOmnivaBalticLockers({ countries: ['LV', 'LT', 'EE'] });
    if (omnivaBalticLockers.length > 0) {
      PARCEL_LOCKERS.omniva = omnivaBalticLockers.map(function(locker) {
        return {
          id: locker.locker_id,
          name: locker.name,
          address: locker.address,
          city: locker.city,
          country: locker.country,
          postal_code: locker.postal_code,
          latitude: locker.latitude,
          longitude: locker.longitude
        };
      });
    }
  } catch (e) {
    console.warn('Could not load full Omniva Baltic feed, using DB/fallback lockers:', e.message);
  }
}

// Fallback parcel lockers (used if DB is not set up yet)
var FALLBACK_LOCKERS = {
  omniva: [
    { id: 'om1', name: 'Omniva Rīga - Alfa',       address: 'Brīvības gatve 372, Rīga' },
    { id: 'om2', name: 'Omniva Rīga - Domina',      address: 'Ieriķu iela 3, Rīga' },
    { id: 'om3', name: 'Omniva Rīga - Spice',       address: 'Lielirbes iela 29, Rīga' },
    { id: 'om4', name: 'Omniva Jelgava',             address: 'Pasta iela 47, Jelgava' },
    { id: 'om5', name: 'Omniva Liepāja',             address: 'Graudu iela 33, Liepāja' },
    { id: 'om6', name: 'Omniva Daugavpils',          address: 'Rīgas iela 22, Daugavpils' },
    { id: 'om7', name: 'Omniva Jūrmala - Majori',    address: 'Jomas iela 42, Jūrmala' },
    { id: 'om8', name: 'Omniva Ventspils',            address: 'Kuldīgas iela 1, Ventspils' },
    { id: 'om9', name: 'Omniva Valmiera',             address: 'Rīgas iela 29, Valmiera' }
  ],
  dpd: [
    { id: 'dp1', name: 'DPD Pickup Rīga - Akropole', address: 'Maskavas iela 257, Rīga' },
    { id: 'dp2', name: 'DPD Pickup Rīga - Domina',    address: 'Ieriķu iela 3, Rīga' },
    { id: 'dp3', name: 'DPD Pickup Rīga - Spice',     address: 'Lielirbes iela 29, Rīga' },
    { id: 'dp4', name: 'DPD Pickup Daugavpils',        address: 'Viestura iela 7, Daugavpils' },
    { id: 'dp5', name: 'DPD Pickup Liepāja',           address: 'Kuršu iela 11, Liepāja' },
    { id: 'dp6', name: 'DPD Pickup Jelgava',            address: 'Dobeles šoseja 7, Jelgava' }
  ],
  latvijas_pasts: [
    { id: 'lp1', name: 'Pasta nodaļa Rīga 50',  address: 'Brīvības iela 32, Rīga' },
    { id: 'lp2', name: 'Pasta nodaļa Rīga 67',  address: 'Mukusalas iela 41, Rīga' }
  ],
  venipak: [
    { id: 'vn1', name: 'Venipak Rīga - Maxima',  address: 'Vienības gatve 113, Rīga' },
    { id: 'vn2', name: 'Venipak Jūrmala',          address: 'Raiņa iela 110, Jūrmala' }
  ]
};

// Calculate shipping cost using weight-based rate tables
// Returns { price, est, label } for the given carrier, service, weight, route
function calculateShippingCost(carrier, service, weightKg, fromCountry, toCountry) {
  fromCountry = fromCountry || 'LV';
  toCountry = toCountry || 'LV';
  service = service || (selectedAddressType === 'locker' ? 'parcel_locker' : 'courier');
  weightKg = parseFloat(weightKg) || 1;

  var ct = CARRIER_RATE_TABLES[carrier];
  if (!ct || !ct.services[service]) {
    return { price: 5.00, est: '3-5', label: 'Standard' };
  }

  var svc = ct.services[service];
  var routeKey = fromCountry + '_' + toCountry;
  var rates = svc.rates[routeKey] || svc.rates['LV_LV'];
  var estDays = svc.est[routeKey] || svc.est['LV_LV'] || '2-5';

  // Find the rate bracket for the weight
  var price = rates[rates.length - 1][1]; // default to max
  for (var i = 0; i < rates.length; i++) {
    if (weightKg <= rates[i][0]) {
      price = rates[i][1];
      break;
    }
  }

  // Also check DB rate if available (overrides)
  var dbKey = carrier + '|' + service + '|' + fromCountry + '|' + toCountry;
  var dbRate = shippingRatesMap[dbKey];
  if (dbRate) {
    price = parseFloat(dbRate.price_eur);
    estDays = dbRate.estimated_days_min + '-' + dbRate.estimated_days_max;
  }

  return {
    price: price,
    est: estDays,
    label: svc.label
  };
}

// Backward-compat wrapper
function getShippingCost(carrier, service, destCountry) {
  var weight = parseFloat(document.getElementById('packageWeight') ? document.getElementById('packageWeight').value : 0) || 1;
  var result = calculateShippingCost(carrier, service, weight, 'LV', destCountry || 'LV');
  return result;
}

// Get currently selected shipping destination country
function getSelectedCountry() {
  var el = document.getElementById('shippingCountry');
  return el ? el.value : 'LV';
}

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

    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('product');

    // Admin toggle: disable buying/checkout
    try {
      const platform = await getPlatformSettings({ useCache: true });
      if (platform?.disable_buying && productId) {
        await logAuditEvent('checkout_blocked_admin_disabled', { productId });
        await showInfoModal('Buying is currently disabled by admin. Please try again later.', 'Unavailable');
        window.location.href = 'orders.html';
        return;
      }
    } catch (e) {
      // ignore
    }

    if (productId) {
      await initCheckout(productId);
    } else {
      document.getElementById('checkoutView').style.display = 'none';
      document.getElementById('ordersListView').style.display = 'block';
      await loadOrders();
      setupOrderListeners();
    }

    // Re-render dynamic content when language changes
    var langSelect = document.getElementById('langSelect');
    if (langSelect) {
      langSelect.addEventListener('change', function() {
        // Small delay to let i18n.setLang() finish translating static elements
        setTimeout(function() { filterOrders(); }, 100);
      });
    }
  } catch (error) {
    console.error('Error initializing orders page:', error);
    toast(t('co_error_generic'), 'error');
  }
});

function toast(msg, type = 'success') {
  if (typeof showToast === 'function') {
    showToast(msg, type);
  } else if (window.showToast) {
    window.showToast(msg, type);
  } else {
    showInfoModal(msg, type === 'error' ? 'Error' : 'Info');
  }
}

// ============================
// CHECKOUT FLOW
// ============================
async function initCheckout(productId) {
  document.getElementById('checkoutView').style.display = 'block';
  document.getElementById('ordersListView').style.display = 'none';

  const { data: product, error } = await supabase
    .from('products')
    .select('*, seller:seller_id(id, username, email, avatar_url)')
    .eq('id', productId)
    .maybeSingle();

  if (error || !product) {
    toast(t('co_product_not_found'), 'error');
    window.location.href = 'orders.html';
    return;
  }

  checkoutProduct = product;

  // Load shipping data from DB (rates + parcel lockers)
  await loadShippingData('LV');

  // Pre-fill weight from product if seller specified it
  var weightInput = document.getElementById('packageWeight');
  if (weightInput && product.weight_kg) {
    weightInput.value = product.weight_kg;
  }

  // Show seller's city in shipping origin info
  var sellerCityEl = document.getElementById('sellerCityDisplay');
  if (sellerCityEl) {
    var city = product.seller_city || product.location || 'Rīga';
    sellerCityEl.textContent = city;
  }

  renderProductSummary(product);
  renderCarriers();
  renderLockers();
  updateSummary();
  setupCheckoutListeners();

  // Load user balance
  const { data: userData } = await supabase
    .from('users')
    .select('balance')
    .eq('id', currentUser.id)
    .single();
  const balance = userData ? parseFloat(userData.balance || 0) : 0;
  document.getElementById('summaryBalance').textContent = '\u20AC' + balance.toFixed(2);

  // Set minimum meetup date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateInput = document.getElementById('meetupDate');
  if (dateInput) dateInput.min = tomorrow.toISOString().split('T')[0];
}

function renderProductSummary(product) {
  const img = getProductImageUrl(product, 'https://placehold.co/100x100/667eea/white?text=No+Image');
  const price = parseFloat(product.price || 0);
  const sellerName = product.seller ? (product.seller.username || product.seller.email) : t('co_unknown_seller');

  document.getElementById('checkoutProductSummary').innerHTML =
    '<img src="' + img + '" alt="' + esc(product.name) + '" class="checkout-product-image">' +
    '<div class="checkout-product-info">' +
      '<h4>' + esc(product.name) + '</h4>' +
      '<p style="color:var(--muted);margin:0.25rem 0;">' + esc(product.category || '') + '</p>' +
      '<p style="margin:0.25rem 0;">' + t('co_sold_by') + ': <strong>' + esc(sellerName) + '</strong></p>' +
      '<p class="checkout-product-price">\u20AC' + price.toFixed(2) + '</p>' +
    '</div>';
}

function renderCarriers() {
  const container = document.getElementById('carrierList');
  if (!container) return;
  var destCountry = getSelectedCountry();
  var weight = parseFloat(document.getElementById('packageWeight') ? document.getElementById('packageWeight').value : 0) || 1;
  var service = selectedAddressType === 'locker' ? 'parcel_locker' : 'courier';

  let html = '';
  for (const [key, ct] of Object.entries(CARRIER_RATE_TABLES)) {
    var quote = calculateShippingCost(key, service, weight, 'LV', destCountry);
    html += '<div class="carrier-card ' + (key === selectedCarrier ? 'selected' : '') + '" data-carrier="' + key + '">' +
      '<div class="carrier-logo">' + ct.icon + '</div>' +
      '<div class="carrier-info">' +
        '<strong>' + ct.name + '</strong>' +
        '<p class="carrier-price">\u20AC' + quote.price.toFixed(2) + '</p>' +
        '<p class="carrier-time">' + quote.est + ' ' + t('co_days') + '</p>' +
      '</div></div>';
  }
  container.innerHTML = html;

  container.querySelectorAll('.carrier-card').forEach(function(card) {
    card.addEventListener('click', function() {
      container.querySelectorAll('.carrier-card').forEach(function(c) { c.classList.remove('selected'); });
      card.classList.add('selected');
      selectedCarrier = card.dataset.carrier;
      showCarrierDetail(selectedCarrier);
      renderLockers();
      updateSummary();
    });
  });

  // If a carrier is already selected, show its detail
  if (selectedCarrier) {
    showCarrierDetail(selectedCarrier);
  }
}

// Show the detailed quote panel when a carrier is clicked
function showCarrierDetail(carrierKey) {
  var panel = document.getElementById('carrierDetailPanel');
  var content = document.getElementById('carrierDetailContent');
  if (!panel || !content) return;

  var ct = CARRIER_RATE_TABLES[carrierKey];
  if (!ct) { panel.style.display = 'none'; return; }

  var destCountry = getSelectedCountry();
  var weight = parseFloat(document.getElementById('packageWeight') ? document.getElementById('packageWeight').value : 0) || 1;
  var sellerCity = 'R\u012Bga';
  if (checkoutProduct && checkoutProduct.seller_city) sellerCity = checkoutProduct.seller_city;
  else if (checkoutProduct && checkoutProduct.location) sellerCity = checkoutProduct.location;

  // Build service options
  var servicesHtml = '';
  Object.keys(ct.services).forEach(function(svcKey) {
    var svc = ct.services[svcKey];
    var quote = calculateShippingCost(carrierKey, svcKey, weight, 'LV', destCountry);
    var isSelected = (selectedAddressType === 'locker' ? 'parcel_locker' : 'courier') === svcKey;
    servicesHtml += '<div class="carrier-service-option ' + (isSelected ? 'selected' : '') + '" data-service="' + svcKey + '">' +
      '<input type="radio" name="carrierService" ' + (isSelected ? 'checked' : '') + '>' +
      '<div class="carrier-service-label"><strong>' + svc.label + '</strong>' +
      '<span>' + quote.est + ' ' + t('co_business_days') + '</span></div>' +
      '<div class="carrier-service-price">\u20AC' + quote.price.toFixed(2) + '</div></div>';
  });

  // Current best quote
  var currentService = selectedAddressType === 'locker' ? 'parcel_locker' : 'courier';
  var currentQuote = calculateShippingCost(carrierKey, currentService, weight, 'LV', destCountry);

  var html = '<div class="carrier-detail-header">' +
    '<div class="carrier-logo">' + ct.icon + '</div>' +
    '<h4>' + ct.name + '</h4>' +
    '<a href="' + (CARRIER_URLS[carrierKey] || '#') + '" target="_blank" rel="noopener">\uD83D\uDD17 ' + t('co_visit_carrier_site') + '</a>' +
    '</div>';

  html += '<div class="carrier-quote-grid">' +
    '<div class="carrier-quote-item">' +
      '<label>' + t('co_estimated_cost') + '</label>' +
      '<div class="quote-value">\u20AC' + currentQuote.price.toFixed(2) + '</div>' +
    '</div>' +
    '<div class="carrier-quote-item">' +
      '<label>' + t('co_delivery_time') + '</label>' +
      '<div class="quote-value time">' + currentQuote.est + ' ' + t('co_business_days') + '</div>' +
    '</div>' +
  '</div>';

  // Route info
  html += '<div style="display:flex;gap:1rem;align-items:center;margin-bottom:1rem;font-size:0.875rem;color:var(--muted);">' +
    '<span>\uD83D\uDCE4 ' + esc(sellerCity) + '</span>' +
    '<span>\u2192</span>' +
    '<span>\uD83D\uDCE5 ' + getCountryName(destCountry) + '</span>' +
    '<span style="margin-left:auto;">\u2696\uFE0F ' + weight.toFixed(2) + ' kg</span>' +
  '</div>';

  // Service options
  html += '<div class="carrier-services">' + servicesHtml + '</div>';

  // Weight bracket info
  var routeKey = 'LV_' + destCountry;
  var brackets = ct.services[currentService] ? ct.services[currentService].rates[routeKey] || ct.services[currentService].rates['LV_LV'] : [];
  if (brackets.length > 0) {
    html += '<details style="margin-bottom:1rem;"><summary style="cursor:pointer;color:var(--muted);font-size:0.8125rem;">\uD83D\uDCCA ' + t('co_shipping_cost') + ' — ' + ct.name + ' (' + getCountryName(destCountry) + ')</summary>' +
      '<table style="width:100%;font-size:0.8125rem;margin-top:0.5rem;border-collapse:collapse;">';
    html += '<tr style="border-bottom:1px solid var(--border);"><th style="text-align:left;padding:0.25rem 0;">Max kg</th><th style="text-align:right;padding:0.25rem 0;">Price</th></tr>';
    brackets.forEach(function(b) {
      var isActive = weight <= b[0] && (brackets.indexOf(b) === 0 || weight > brackets[brackets.indexOf(b) - 1][0]);
      html += '<tr style="' + (isActive ? 'font-weight:700;color:var(--primary);' : '') + 'border-bottom:1px solid var(--border);">' +
        '<td style="padding:0.25rem 0;">\u2264 ' + b[0] + ' kg</td>' +
        '<td style="text-align:right;padding:0.25rem 0;">\u20AC' + b[1].toFixed(2) + '</td></tr>';
    });
    html += '</table></details>';
  }

  html += '<div class="carrier-detail-footer">' +
    '<small>\u2139\uFE0F ' + t('co_price_includes_vat') + '</small>' +
  '</div>';

  content.innerHTML = html;
  panel.style.display = 'block';

  // Attach service option click handlers
  content.querySelectorAll('.carrier-service-option').forEach(function(opt) {
    opt.addEventListener('click', function() {
      content.querySelectorAll('.carrier-service-option').forEach(function(o) {
        o.classList.remove('selected');
        o.querySelector('input[type=radio]').checked = false;
      });
      opt.classList.add('selected');
      opt.querySelector('input[type=radio]').checked = true;

      var svcKey = opt.dataset.service;
      // Toggle address type based on selected service
      if (svcKey === 'parcel_locker') {
        switchAddressType('locker');
      } else {
        switchAddressType('address');
      }
      // Re-render with updated service
      showCarrierDetail(carrierKey);
      updateSummary();
    });
  });
}

function renderLockers() {
  const container = document.getElementById('lockerList');
  if (!container) return;
  const country = getSelectedCountry();
  const allCarrierLockers = PARCEL_LOCKERS[selectedCarrier] || [];
  let lockers = allCarrierLockers.filter(function(l) {
    return !l.country || l.country === country;
  });

  if (lockerSearchQuery) {
    const q = lockerSearchQuery.toLowerCase();
    lockers = lockers.filter(function(l) {
      return (l.name || '').toLowerCase().includes(q)
        || (l.address || '').toLowerCase().includes(q)
        || (l.city || '').toLowerCase().includes(q)
        || (l.postal_code || '').toLowerCase().includes(q);
    });
  }

  if (userCoordinates) {
    lockers = lockers
      .map(function(l) {
        var dist = calculateDistanceKm(userCoordinates.lat, userCoordinates.lng, parseFloat(l.latitude), parseFloat(l.longitude));
        return Object.assign({}, l, { distanceKm: dist });
      })
      .sort(function(a, b) {
        var da = Number.isFinite(a.distanceKm) ? a.distanceKm : Number.MAX_VALUE;
        var db = Number.isFinite(b.distanceKm) ? b.distanceKm : Number.MAX_VALUE;
        return da - db;
      });
  }

  if (selectedLocker && !lockers.some(function(l) { return l.id === selectedLocker.id; })) {
    selectedLocker = null;
  }

  renderNearestHint(lockers);
  renderLockerMap(lockers);

  let html = '';
  for (const l of lockers) {
    var distanceLabel = Number.isFinite(l.distanceKm) ? '<small>📍 ' + l.distanceKm.toFixed(1) + ' km</small>' : '';
    var isSelected = selectedLocker && selectedLocker.id === l.id;
    html += '<div class="parcel-locker-card ' + (isSelected ? 'selected' : '') + '" data-locker-id="' + l.id + '" data-locker-address="' + esc(l.address) + '">' +
      '<div class="locker-info"><strong>' + esc(l.name) + '</strong><p>' + esc(l.address) + '</p>' + distanceLabel + '</div></div>';
  }

  if (!lockers.length) {
    html = '<div class="parcel-locker-empty">No lockers found for selected country/search.</div>';
  }

  container.innerHTML = html;

  container.querySelectorAll('.parcel-locker-card').forEach(function(card) {
    card.addEventListener('click', function() {
      container.querySelectorAll('.parcel-locker-card').forEach(function(c) { c.classList.remove('selected'); });
      card.classList.add('selected');
      var chosen = lockers.find(function(l) { return l.id === card.dataset.lockerId; });
      selectedLocker = {
        id: card.dataset.lockerId,
        address: card.dataset.lockerAddress,
        name: chosen ? chosen.name : null,
        city: chosen ? chosen.city : null,
        country: chosen ? chosen.country : null,
        latitude: chosen ? chosen.latitude : null,
        longitude: chosen ? chosen.longitude : null
      };
      highlightLockerMarker(selectedLocker.id);
    });
  });
}

function updateSummary() {
  const price = parseFloat(checkoutProduct ? checkoutProduct.price : 0);
  const isShipping = selectedDeliveryMethod === 'shipping';
  var q = getShippingCost(selectedCarrier, selectedAddressType === 'locker' ? 'parcel_locker' : 'courier', getSelectedCountry());
  const shipping = isShipping ? q.price : 0;
  computedShippingCost = shipping;
  const total = price + shipping;

  document.getElementById('summaryItemPrice').textContent = '\u20AC' + price.toFixed(2);
  document.getElementById('summaryShippingRow').style.display = isShipping ? 'flex' : 'none';
  document.getElementById('summaryShippingCost').textContent = '\u20AC' + shipping.toFixed(2);
  document.getElementById('summaryTotal').textContent = '\u20AC' + total.toFixed(2);

  var shipCostEl = document.getElementById('shippingCostDisplay');
  if (shipCostEl) {
    shipCostEl.style.display = isShipping ? 'block' : 'none';
    document.getElementById('shippingCostValue').textContent = '\u20AC' + shipping.toFixed(2);
  }
}

function setupCheckoutListeners() {
  var tabMeetup = document.getElementById('tabMeetup');
  var tabShipping = document.getElementById('tabShipping');
  var tabAddress = document.getElementById('tabAddress');
  var tabLocker = document.getElementById('tabLocker');
  var placeBtn = document.getElementById('placeOrderBtn');
  var countrySelect = document.getElementById('shippingCountry');
  var lockerSearchInput = document.getElementById('lockerSearchInput');
  var useMyLocationBtn = document.getElementById('useMyLocationBtn');

  if (tabMeetup) tabMeetup.addEventListener('click', function() { switchDelivery('meetup'); });
  if (tabShipping) tabShipping.addEventListener('click', function() { switchDelivery('shipping'); });
  if (tabAddress) tabAddress.addEventListener('click', function() { switchAddressType('address'); });
  if (tabLocker) tabLocker.addEventListener('click', function() { switchAddressType('locker'); });
  if (placeBtn) placeBtn.addEventListener('click', placeOrder);

  // Re-calculate prices when destination country changes
  if (countrySelect) {
    countrySelect.addEventListener('change', function() {
      renderCarriers();
      renderLockers();
      updateSummary();
    });
  }

  if (lockerSearchInput) {
    lockerSearchInput.addEventListener('input', function(e) {
      lockerSearchQuery = (e.target.value || '').trim();
      renderLockers();
    });
  }

  if (useMyLocationBtn) {
    useMyLocationBtn.addEventListener('click', function() {
      requestUserLocation();
    });
  }

  // Re-calculate when package weight changes
  var weightInput = document.getElementById('packageWeight');
  if (weightInput) {
    var weightDebounce = null;
    weightInput.addEventListener('input', function() {
      clearTimeout(weightDebounce);
      weightDebounce = setTimeout(function() {
        renderCarriers();
        updateSummary();
      }, 300);
    });
  }
}

function switchDelivery(method) {
  selectedDeliveryMethod = method;
  document.getElementById('tabMeetup').classList.toggle('active', method === 'meetup');
  document.getElementById('tabShipping').classList.toggle('active', method === 'shipping');
  document.getElementById('meetupOptions').style.display = method === 'meetup' ? 'block' : 'none';
  document.getElementById('shippingOptions').style.display = method === 'shipping' ? 'block' : 'none';
  updateSummary();
}

function switchAddressType(type) {
  selectedAddressType = type;
  document.getElementById('tabAddress').classList.toggle('active', type === 'address');
  document.getElementById('tabLocker').classList.toggle('active', type === 'locker');
  document.getElementById('addressFields').style.display = type === 'address' ? 'block' : 'none';
  document.getElementById('lockerFields').style.display = type === 'locker' ? 'block' : 'none';
  // Recalculate: courier vs parcel_locker rates differ
  renderCarriers();
  if (type === 'locker') {
    renderLockers();
    setTimeout(function() {
      if (lockerMap && typeof lockerMap.invalidateSize === 'function') {
        lockerMap.invalidateSize();
      }
    }, 50);
  }
  updateSummary();
}

// ============================
// PLACE ORDER
// ============================
async function placeOrder() {
  var btn = document.getElementById('placeOrderBtn');
  if (!checkoutProduct || !currentUser) return;

  var product = checkoutProduct;
  var price = parseFloat(product.price || 0);
  var notes = (document.getElementById('buyerNotes') ? document.getElementById('buyerNotes').value.trim() : '') || '';

  var orderData = {
    product_id: product.id,
    buyer_id: currentUser.id,
    seller_id: product.seller_id || (product.seller ? product.seller.id : null),
    delivery_method: selectedDeliveryMethod,
    order_status: 'pending',
    status: 'pending',
    unit_price: price,
    quantity: 1,
    buyer_notes: notes,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (selectedDeliveryMethod === 'meetup') {
    var location = document.getElementById('meetupLocation') ? document.getElementById('meetupLocation').value.trim() : '';
    var dateVal = document.getElementById('meetupDate') ? document.getElementById('meetupDate').value : '';
    var timeVal = document.getElementById('meetupTime') ? document.getElementById('meetupTime').value : '';

    if (!location) { toast(t('co_err_meetup_location'), 'error'); return; }
    if (!dateVal) { toast(t('co_err_meetup_date'), 'error'); return; }

    var meetupDatetime = timeVal ? (dateVal + 'T' + timeVal + ':00') : (dateVal + 'T12:00:00');
    orderData.meetup_location = location;
    orderData.meetup_date = meetupDatetime;
    orderData.shipping_cost = 0;
    orderData.total_amount = price;
  } else {
    var recipientName = document.getElementById('recipientName') ? document.getElementById('recipientName').value.trim() : '';
    var recipientPhone = document.getElementById('recipientPhone') ? document.getElementById('recipientPhone').value.trim() : '';

    if (!recipientName) { toast(t('co_err_recipient_name'), 'error'); return; }

    orderData.shipping_carrier = selectedCarrier;
    orderData.shipping_service = selectedAddressType === 'locker' ? 'parcel_locker' : 'courier';
    orderData.shipping_cost = computedShippingCost;
    orderData.total_amount = price + computedShippingCost;
    orderData.recipient_name = recipientName;
    orderData.recipient_phone = recipientPhone || '';
    // Save package weight for reference
    var pkgWeight = parseFloat(document.getElementById('packageWeight') ? document.getElementById('packageWeight').value : 0) || 0;
    if (pkgWeight > 0) orderData.package_weight_kg = pkgWeight;

    if (selectedAddressType === 'locker') {
      if (!selectedLocker) { toast(t('co_err_select_locker'), 'error'); return; }
      orderData.parcel_locker_id = selectedLocker.id;
      orderData.parcel_locker_address = selectedLocker.address;
      orderData.shipping_address = selectedLocker.address;
    } else {
      var street = document.getElementById('shippingStreet') ? document.getElementById('shippingStreet').value.trim() : '';
      var city = document.getElementById('shippingCity') ? document.getElementById('shippingCity').value.trim() : '';
      var postal = document.getElementById('shippingPostal') ? document.getElementById('shippingPostal').value.trim() : '';
      var country = document.getElementById('shippingCountry') ? document.getElementById('shippingCountry').value : 'LV';

      if (!street || !city) { toast(t('co_err_address'), 'error'); return; }

      orderData.shipping_address = street;
      orderData.shipping_city = city;
      orderData.shipping_postal_code = postal;
      orderData.shipping_country = country;
    }
  }

  // Check balance
  var ubRes = await supabase.from('users').select('balance').eq('id', currentUser.id).single();
  var balance = parseFloat(ubRes.data ? ubRes.data.balance : 0);
  var totalAmount = parseFloat(orderData.total_amount);

  if (balance < totalAmount) {
    toast(t('co_err_insufficient_balance') + ' (\u20AC' + totalAmount.toFixed(2) + ')', 'error');
    return;
  }

  btn.disabled = true;
  btn.textContent = t('co_processing');

  try {
    orderData.order_number = 'VND-' + Date.now().toString(36).toUpperCase();

    // 1. Create order
    var insertRes = await supabase.from('orders').insert(orderData).select().single();
    if (insertRes.error) throw insertRes.error;
    var order = insertRes.data;

    // 2. Deduct buyer balance (escrow hold)
    var newBalance = balance - totalAmount;
    var balRes = await supabase.from('users').update({ balance: newBalance }).eq('id', currentUser.id);
    if (balRes.error) throw balRes.error;

    // 3. Record buyer transaction
    await supabase.from('user_transactions').insert({
      user_id: currentUser.id,
      amount: -totalAmount,
      transaction_type: 'escrow_hold',
      description: 'Escrow hold: ' + product.name + ' (' + (selectedDeliveryMethod === 'meetup' ? 'meetup' : 'shipping') + ')',
      reference_id: order.id,
      created_at: new Date().toISOString()
    });

    // 4. Update order status
    //    Meetup: escrow (both parties must confirm)
    //    Shipping: paid (seller processes & ships, buyer confirms delivery to release)
    var nextStatus = selectedDeliveryMethod === 'meetup' ? 'escrow' : 'paid';
    var paymentStatus = selectedDeliveryMethod === 'meetup' ? 'escrowed' : 'paid';
    await supabase.from('orders').update({
      order_status: nextStatus,
      status: nextStatus,
      payment_status: paymentStatus,
      escrow_amount: totalAmount,
      escrow_released: false,
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).eq('id', order.id);

    // 5. Decrease product stock and set sold_at if fully sold
    if (product.stock !== undefined && product.stock !== null) {
      var newStock = Math.max(0, (product.stock || 1) - 1);
      var stockUpdate = {
        stock: newStock,
        updated_at: new Date().toISOString()
      };
      if (newStock === 0) {
        stockUpdate.sold_at = new Date().toISOString();
        stockUpdate.status = 'sold';
      }
      await supabase.from('products').update(stockUpdate).eq('id', product.id);
    }

    toast(t('co_order_created'), 'success');
    setTimeout(function() { window.location.href = 'orders.html'; }, 1500);

  } catch (err) {
    console.error('Order creation error:', err);
    toast(err.message || t('co_error_generic'), 'error');
    btn.disabled = false;
    btn.textContent = t('co_place_order');
  }
}

// ============================
// ORDERS LIST
// ============================
function setupOrderListeners() {
  document.querySelectorAll('.filter-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.filter-tab').forEach(function(t) { t.classList.remove('active'); });
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      filterOrders();
    });
  });

  var sf = document.getElementById('statusFilter');
  if (sf) sf.addEventListener('change', function(e) { currentStatusFilter = e.target.value; filterOrders(); });

  var df = document.getElementById('deliveryFilter');
  if (df) df.addEventListener('change', function(e) { currentDeliveryFilter = e.target.value; filterOrders(); });
}

async function loadOrders() {
  try {
    var res = await supabase
      .from('orders')
      .select('*, buyer:buyer_id(id, username, email, avatar_url), seller:seller_id(id, username, email, avatar_url), product:product_id(id, name, price, images, image_url, category)')
      .or('buyer_id.eq.' + currentUser.id + ',seller_id.eq.' + currentUser.id)
      .order('created_at', { ascending: false });

    if (res.error) throw res.error;
    allOrders = res.data || [];
    filterOrders();
  } catch (error) {
    console.error('Error loading orders:', error);
    toast(t('co_err_load_orders'), 'error');
  }
}

function filterOrders() {
  var filtered = allOrders.slice();

  if (currentFilter === 'buying') {
    filtered = filtered.filter(function(o) { return o.buyer_id === currentUser.id; });
  } else if (currentFilter === 'selling') {
    filtered = filtered.filter(function(o) { return o.seller_id === currentUser.id; });
  }

  if (currentStatusFilter !== 'all') {
    filtered = filtered.filter(function(o) {
      return (o.status === currentStatusFilter) || (o.order_status === currentStatusFilter);
    });
  }

  if (currentDeliveryFilter !== 'all') {
    filtered = filtered.filter(function(o) { return o.delivery_method === currentDeliveryFilter; });
  }

  displayOrders(filtered);
}

function displayOrders(orders) {
  var container = document.getElementById('ordersContainer');
  var emptyState = document.getElementById('emptyState');

  if (!orders || orders.length === 0) {
    container.innerHTML = '';
    emptyState.style.display = 'flex';
    return;
  }

  emptyState.style.display = 'none';
  container.innerHTML = orders.map(function(order) { return createOrderCard(order); }).join('');
}

function createOrderCard(order) {
  var isBuyer = order.buyer_id === currentUser.id;
  var otherUser = isBuyer ? order.seller : order.buyer;
  var productImage = getProductImageUrl(order.product, 'https://placehold.co/150x150/667eea/white?text=No+Image');
  var status = order.status || order.order_status || 'pending';
  var deliveryIcon = order.delivery_method === 'meetup' ? '\uD83E\uDD1D' : '\uD83D\uDCE6';
  var total = parseFloat(order.total_amount || order.unit_price || 0);
  var productName = order.product ? order.product.name : t('co_unknown_product');
  var otherName = otherUser ? (otherUser.username || otherUser.email) : t('co_unknown');

  var html = '<div class="order-card" data-order-id="' + order.id + '">' +
    '<div class="order-header">' +
      '<div class="order-number"><strong>' + (order.order_number || '\u2014') + '</strong>' +
      '<span class="order-date">' + formatDate(order.created_at) + '</span></div>' +
      getStatusBadgeHTML(status) +
    '</div>' +
    '<div class="order-body">' +
      '<div class="order-product">' +
        '<img src="' + productImage + '" alt="' + esc(productName) + '" class="order-product-image">' +
        '<div class="order-product-info">' +
          '<h3>' + esc(productName) + '</h3>' +
          '<p class="order-role">' + (isBuyer ? '\uD83D\uDED2 ' + t('orders_buying_from') : '\uD83D\uDCB0 ' + t('orders_selling_to')) + ' <strong>' + esc(otherName) + '</strong></p>' +
          '<p class="order-quantity">' + t('orders_quantity') + ': ' + (order.quantity || 1) + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="order-details">' +
        '<div class="order-detail-row"><span>' + deliveryIcon + ' ' + t('orders_delivery') + ':</span>' +
        '<strong>' + (order.delivery_method === 'meetup' ? t('orders_delivery_meetup') : t('orders_delivery_shipping')) + '</strong></div>';

  if (order.delivery_method === 'shipping' && order.shipping_carrier) {
    html += '<div class="order-detail-row"><span>\uD83D\uDCEE ' + t('orders_carrier') + ':</span><strong>' + getCarrierName(order.shipping_carrier) + '</strong></div>';
    if (order.tracking_number) {
      html += '<div class="order-detail-row"><span>\uD83D\uDD22 ' + t('orders_tracking') + ':</span><strong>' + order.tracking_number + '</strong></div>';
    }
  }

  if (order.delivery_method === 'meetup' && order.meetup_location) {
    html += '<div class="order-detail-row"><span>\uD83D\uDCCD ' + t('orders_location') + ':</span><strong>' + esc(order.meetup_location) + '</strong></div>';
    if (order.meetup_date) {
      html += '<div class="order-detail-row"><span>\uD83D\uDCC5 ' + t('orders_date') + ':</span><strong>' + formatDateTime(order.meetup_date) + '</strong></div>';
    }
  }

  html += '<div class="order-detail-row order-total"><span>' + t('co_total') + ':</span><strong>\u20AC' + total.toFixed(2) + '</strong></div>';

  // Show escrow status if funds are held
  if (order.escrow_amount && parseFloat(order.escrow_amount) > 0 && !order.escrow_released) {
    html += '<div class="order-detail-row"><span>\uD83D\uDD12 Escrow:</span><strong>\u20AC' + parseFloat(order.escrow_amount).toFixed(2) + '</strong></div>';
  } else if (order.escrow_released) {
    html += '<div class="order-detail-row"><span>\u2705 Escrow:</span><strong>' + t('orders_escrow_released') + '</strong></div>';
  }

  html += '</div></div>';

  // Actions
  html += '<div class="order-actions">' +
    '<button class="btn btn-secondary" onclick="viewOrderDetails(\'' + order.id + '\')">' + t('orders_view_details') + '</button>';

  if (isBuyer && status === 'pending') {
    html += '<button class="btn btn-sell" onclick="payOrder(\'' + order.id + '\')">' + t('orders_pay_now') + '</button>';
    html += '<button class="btn btn-danger" onclick="cancelOrder(\'' + order.id + '\')">' + t('btn_cancel') + '</button>';
  }

  // Allow buyer to cancel before shipping starts (paid/escrow not yet processing)
  if (isBuyer && (status === 'paid' || status === 'escrow')) {
    html += '<button class="btn btn-danger" onclick="cancelOrder(\'' + order.id + '\')">' + t('btn_cancel') + '</button>';
  }

  if (status === 'escrow') {
    html += '<button class="btn btn-warning" style="pointer-events:none;">\uD83D\uDD12 ' + t('orders_in_escrow') + '</button>';
    html += '<button class="btn btn-sell" onclick="confirmMeetup(\'' + order.id + '\')">' + t('orders_confirm_meetup') + '</button>';
  }

  if (!isBuyer && status === 'paid') {
    html += '<button class="btn btn-sell" onclick="markAsProcessing(\'' + order.id + '\')">' + t('orders_start_processing') + '</button>';
  }

  if (!isBuyer && status === 'processing' && order.delivery_method === 'meetup') {
    html += '<button class="btn btn-sell" onclick="markReadyForPickup(\'' + order.id + '\')">' + t('orders_ready_pickup') + '</button>';
  }

  if (!isBuyer && status === 'processing' && order.delivery_method === 'shipping') {
    html += '<button class="btn btn-sell" onclick="addTrackingNumber(\'' + order.id + '\')">' + t('orders_add_tracking') + '</button>';
  }

  if (isBuyer && (status === 'shipped' || status === 'ready_for_pickup' || status === 'in_transit' || status === 'delivered')) {
    html += '<button class="btn btn-sell" onclick="confirmDelivery(\'' + order.id + '\')">' + t('orders_confirm_yes') + '</button>';
  }

  if (order.tracking_number) {
    html += '<button class="btn btn-secondary" onclick="trackShipment(\'' + order.id + '\')">' + t('orders_track_shipment') + '</button>';
  }

  html += '</div></div>';
  return html;
}

// ============================
// ORDER ACTIONS
// ============================

// View details
window.viewOrderDetails = async function(orderId) {
  try {
    var res = await supabase
      .from('orders')
      .select('*, buyer:buyer_id(id, username, email, avatar_url), seller:seller_id(id, username, email, avatar_url), product:product_id(id, name, description, price, images, image_url, category)')
      .eq('id', orderId)
      .single();

    if (res.error) throw res.error;
    displayOrderDetails(res.data);
  } catch (error) {
    console.error('Error loading order details:', error);
    toast(t('co_err_load_details'), 'error');
  }
};

function displayOrderDetails(order) {
  var isBuyer = order.buyer_id === currentUser.id;
  var otherUser = isBuyer ? order.seller : order.buyer;
  var productImage = getProductImageUrl(order.product, 'https://placehold.co/400x400/667eea/white?text=No+Image');
  var status = order.status || order.order_status || 'pending';
  var unitPrice = parseFloat(order.unit_price || (order.product ? order.product.price : 0) || 0);
  var qty = order.quantity || 1;
  var shippingCost = parseFloat(order.shipping_cost || 0);
  var totalAmount = parseFloat(order.total_amount || (unitPrice * qty + shippingCost));

  var content = '<div class="order-details-modal">' +
    '<h2>\uD83D\uDCE6 ' + t('orders_order') + ' ' + esc(order.order_number || '') + '</h2>' +
    '<div class="order-details-grid">';

  // Product
  content += '<div class="order-details-section"><h3>' + t('co_product_info') + '</h3>' +
    '<div class="order-product-detail">' +
    '<img src="' + productImage + '" alt="' + esc(order.product ? order.product.name : '') + '" class="order-detail-image">' +
    '<div><h4>' + esc(order.product ? order.product.name : '') + '</h4>' +
    '<p>' + esc(order.product ? (order.product.description || '') : '') + '</p>' +
    '<p><strong>' + t('orders_category') + ':</strong> ' + esc(order.product ? (order.product.category || 'N/A') : 'N/A') + '</p>' +
    '<p><strong>' + t('orders_unit_price') + ':</strong> \u20AC' + unitPrice.toFixed(2) + '</p>' +
    '<p><strong>' + t('orders_quantity') + ':</strong> ' + qty + '</p>' +
    '</div></div></div>';

  // Status timeline
  content += '<div class="order-details-section"><h3>' + t('orders_status') + '</h3>' +
    '<div class="status-timeline">' + getStatusTimeline(order) + '</div></div>';

  // Delivery
  content += '<div class="order-details-section"><h3>' + t('co_delivery_method') + '</h3>';
  if (order.delivery_method === 'meetup') {
    content += '<p><strong>' + t('orders_method') + ':</strong> \uD83E\uDD1D ' + t('orders_delivery_meetup') + '</p>';
    if (order.meetup_location) content += '<p><strong>' + t('orders_location') + ':</strong> ' + esc(order.meetup_location) + '</p>';
    if (order.meetup_date) content += '<p><strong>' + t('orders_date') + ':</strong> ' + formatDateTime(order.meetup_date) + '</p>';
    content += '<p><strong>' + t('orders_buyer_confirmed') + ':</strong> ' + (order.meetup_confirmed_by_buyer ? '\u2705' : '\u274C') + '</p>';
    content += '<p><strong>' + t('orders_seller_confirmed') + ':</strong> ' + (order.meetup_confirmed_by_seller ? '\u2705' : '\u274C') + '</p>';
  } else {
    content += '<p><strong>' + t('orders_method') + ':</strong> \uD83D\uDCE6 ' + t('orders_delivery_shipping') + '</p>';
    content += '<p><strong>' + t('orders_carrier') + ':</strong> ' + getCarrierName(order.shipping_carrier) + '</p>';
    if (order.tracking_number) content += '<p><strong>' + t('orders_tracking') + ':</strong> ' + order.tracking_number + '</p>';
    content += '<p><strong>' + t('co_shipping_cost') + ':</strong> \u20AC' + shippingCost.toFixed(2) + '</p>';
    content += '<div class="shipping-address" style="margin-top:1rem;"><h4>' + t('orders_shipping_address') + '</h4>';
    content += '<p>' + esc(order.recipient_name || '') + '</p>';
    content += '<p>' + esc(order.recipient_phone || '') + '</p>';
    if (order.parcel_locker_address) {
      content += '<p><strong>' + t('co_parcel_locker') + ':</strong></p><p>' + esc(order.parcel_locker_address) + '</p>';
    } else {
      content += '<p>' + esc(order.shipping_address || '') + '</p>';
      content += '<p>' + esc(order.shipping_city || '') + ', ' + esc(order.shipping_postal_code || '') + '</p>';
      content += '<p>' + getCountryName(order.shipping_country) + '</p>';
    }
    content += '</div>';
  }
  content += '</div>';

  // Payment
  content += '<div class="order-details-section"><h3>' + t('orders_payment_info') + '</h3>' +
    '<div class="order-pricing">' +
    '<p><strong>' + t('orders_subtotal') + ':</strong> \u20AC' + (unitPrice * qty).toFixed(2) + '</p>' +
    '<p><strong>' + t('co_shipping_cost') + ':</strong> \u20AC' + shippingCost.toFixed(2) + '</p>' +
    '<p class="order-total-line"><strong>' + t('co_total') + ':</strong> \u20AC' + totalAmount.toFixed(2) + '</p>' +
    '</div>';
  if (order.paid_at) content += '<p><strong>' + t('orders_paid_at') + ':</strong> ' + formatDateTime(order.paid_at) + '</p>';
  content += '</div>';

  // Other user info
  content += '<div class="order-details-section"><h3>' + (isBuyer ? t('orders_seller_info') : t('orders_buyer_info')) + '</h3>' +
    '<div class="user-info">';
  if (otherUser && otherUser.avatar_url) content += '<img src="' + otherUser.avatar_url + '" alt="Avatar" class="user-avatar">';
  content += '<div><p><strong>' + t('orders_username') + ':</strong> ' + esc(otherUser ? (otherUser.username || 'N/A') : 'N/A') + '</p>' +
    '<p><strong>' + t('orders_email') + ':</strong> ' + esc(otherUser ? (otherUser.email || 'N/A') : 'N/A') + '</p>' +
    '<a href="chat.html?seller=' + (otherUser ? otherUser.id : '') + '" class="btn btn-secondary">\uD83D\uDCAC ' + t('orders_message') + '</a>' +
    '</div></div></div>';

  // Notes
  if (order.buyer_notes || order.seller_notes) {
    content += '<div class="order-details-section"><h3>' + t('co_notes_title') + '</h3>';
    if (order.buyer_notes) content += '<p><strong>' + t('orders_buyer_notes') + ':</strong> ' + esc(order.buyer_notes) + '</p>';
    if (order.seller_notes) content += '<p><strong>' + t('orders_seller_notes') + ':</strong> ' + esc(order.seller_notes) + '</p>';
    content += '</div>';
  }

  content += '</div>'; // close grid

  // Modal actions
  content += '<div class="modal-actions">' +
    '<button class="btn btn-secondary" onclick="closeOrderModal()">' + t('orders_close') + '</button>';
  if (order.tracking_number) {
    content += '<button class="btn btn-sell" onclick="trackShipment(\'' + order.id + '\')">' + t('orders_track_shipment') + '</button>';
  }
  content += '</div></div>';

  document.getElementById('orderDetailsContent').innerHTML = content;
  document.getElementById('orderDetailsModal').style.display = 'flex';
}

window.closeOrderModal = function() {
  document.getElementById('orderDetailsModal').style.display = 'none';
};

// ============================
// PAY ORDER (for pending orders)
// ============================
window.payOrder = async function(orderId) {
  const confirmed = await showConfirmModal({ title: t('orders_confirm_payment'), message: t('orders_confirm_payment'), okText: 'OK', cancelText: 'Cancel' });
  if (!confirmed) return;

  try {
    var order = allOrders.find(function(o) { return o.id === orderId; });
    if (!order) throw new Error('Order not found');

    var totalAmount = parseFloat(order.total_amount || 0);
    var ubRes = await supabase.from('users').select('balance').eq('id', currentUser.id).single();
    var balance = parseFloat(ubRes.data ? ubRes.data.balance : 0);

    if (balance < totalAmount) {
      toast(t('co_err_insufficient_balance') + ' \u2014 \u20AC' + totalAmount.toFixed(2), 'error');
      return;
    }

    await supabase.from('users').update({ balance: balance - totalAmount }).eq('id', currentUser.id);

    await supabase.from('user_transactions').insert({
      user_id: currentUser.id,
      amount: -totalAmount,
      transaction_type: 'escrow_hold',
      description: 'Payment: Order ' + (order.order_number || ''),
      reference_id: order.product_id,
      created_at: new Date().toISOString()
    });

    var nextStatus = order.delivery_method === 'meetup' ? 'escrow' : 'paid';
    await supabase.from('orders').update({
      status: nextStatus,
      order_status: nextStatus,
      payment_status: 'paid',
      escrow_amount: totalAmount,
      escrow_released: false,
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).eq('id', orderId);

    if (order.product_id) {
      const { data: product } = await supabase
        .from('products')
        .select('id, stock')
        .eq('id', order.product_id)
        .maybeSingle();

      if (product) {
        const newStock = Math.max(0, parseInt(product.stock || 0, 10) - (order.quantity || 1));
        const productUpdate = {
          stock: newStock,
          updated_at: new Date().toISOString()
        };
        if (newStock === 0) {
          productUpdate.sold_at = new Date().toISOString();
          productUpdate.status = 'sold';
        }
        await supabase.from('products').update(productUpdate).eq('id', order.product_id);
      }
    }

    toast(t('orders_payment_success'), 'success');
    await loadOrders();
  } catch (error) {
    console.error('Payment error:', error);
    toast(error.message || t('orders_payment_failed'), 'error');
  }
};

// ============================
// SELLER ACTIONS
// ============================
window.markAsProcessing = async function(orderId) {
  try {
    await supabase.from('orders').update({
      status: 'processing', order_status: 'processing', updated_at: new Date().toISOString()
    }).eq('id', orderId);
    toast(t('orders_marked_processing'), 'success');
    await loadOrders();
  } catch (error) {
    console.error('Error:', error);
    toast(t('orders_update_failed'), 'error');
  }
};

window.markReadyForPickup = async function(orderId) {
  try {
    await supabase.from('orders').update({
      status: 'ready_for_pickup', order_status: 'ready_for_pickup', updated_at: new Date().toISOString()
    }).eq('id', orderId);
    toast(t('orders_marked_ready'), 'success');
    await loadOrders();
  } catch (error) {
    console.error('Error:', error);
    toast(t('orders_update_failed'), 'error');
  }
};

window.addTrackingNumber = function(orderId) {
  window.currentTrackingOrderId = orderId;
  document.getElementById('trackingModal').style.display = 'flex';
};

window.closeTrackingModal = function() {
  document.getElementById('trackingModal').style.display = 'none';
  document.getElementById('trackingNumberInput').value = '';
  window.currentTrackingOrderId = null;
};

var trackBtn = document.getElementById('confirmTrackingBtn');
if (trackBtn) {
  trackBtn.addEventListener('click', async function() {
    var orderId = window.currentTrackingOrderId;
    if (!orderId) return;

    var trackingNumber = document.getElementById('trackingNumberInput') ? document.getElementById('trackingNumberInput').value.trim() : '';
    if (!trackingNumber) { toast(t('orders_err_tracking_empty'), 'error'); return; }

    try {
      await supabase.from('orders').update({
        status: 'shipped', order_status: 'shipped',
        tracking_number: trackingNumber,
        updated_at: new Date().toISOString()
      }).eq('id', orderId);

      toast(t('orders_shipped_success'), 'success');
      closeTrackingModal();
      await loadOrders();
    } catch (error) {
      console.error('Error:', error);
      toast(t('orders_update_failed'), 'error');
    }
  });
}

// ============================
// BUYER ACTIONS
// ============================
window.confirmDelivery = function(orderId) {
  window.currentConfirmOrderId = orderId;
  document.getElementById('confirmDeliveryModal').style.display = 'flex';
};

window.closeConfirmDeliveryModal = function() {
  document.getElementById('confirmDeliveryModal').style.display = 'none';
  window.currentConfirmOrderId = null;
};

var confDelBtn = document.getElementById('confirmDeliveryBtn');
if (confDelBtn) {
  confDelBtn.addEventListener('click', async function() {
    if (!window.currentConfirmOrderId) return;

    try {
      var order = allOrders.find(function(o) { return o.id === window.currentConfirmOrderId; });
      if (!order) throw new Error('Order not found');

      await releaseEscrowToSeller(order);

      await supabase.from('orders').update({
        status: 'completed', order_status: 'completed',
        escrow_released: true,
        escrow_released_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }).eq('id', window.currentConfirmOrderId);

      toast(t('orders_delivery_confirmed'), 'success');
      closeConfirmDeliveryModal();
      await loadOrders();
    } catch (error) {
      console.error('Error confirming delivery:', error);
      toast(t('orders_confirm_failed'), 'error');
    }
  });
}

// Confirm meetup (escrow: both buyer + seller must confirm)
window.confirmMeetup = async function(orderId) {
  try {
    var order = allOrders.find(function(o) { return o.id === orderId; });
    if (!order) throw new Error('Order not found');

    var isBuyer = order.buyer_id === currentUser.id;

    // Try RPC first
    try {
      var rpcRes = await supabase.rpc('release_escrow', {
        p_order_id: orderId,
        p_confirmed_by: currentUser.id
      });
      if (rpcRes.error) throw rpcRes.error;

      if (rpcRes.data && rpcRes.data.completed) {
        toast(t('orders_escrow_released'), 'success');
      } else {
        toast(t('orders_meetup_waiting'), 'success');
      }
    } catch (rpcErr) {
      // Fallback: manual confirmation
      var updateData = {};
      if (isBuyer) {
        updateData.meetup_confirmed_by_buyer = true;
      } else {
        updateData.meetup_confirmed_by_seller = true;
      }
      updateData.updated_at = new Date().toISOString();

      await supabase.from('orders').update(updateData).eq('id', orderId);

      var refreshRes = await supabase.from('orders')
        .select('meetup_confirmed_by_buyer, meetup_confirmed_by_seller, seller_id, total_amount, product_id, order_number, buyer_id')
        .eq('id', orderId).single();

      var refreshed = refreshRes.data;
      if (refreshed && refreshed.meetup_confirmed_by_buyer && refreshed.meetup_confirmed_by_seller) {
        await releaseEscrowToSeller(Object.assign({}, order, refreshed));
        await supabase.from('orders').update({
          status: 'completed', order_status: 'completed',
          escrow_released: true,
          escrow_released_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }).eq('id', orderId);
        toast(t('orders_escrow_released'), 'success');
      } else {
        toast(t('orders_meetup_waiting'), 'success');
      }
    }

    await loadOrders();
  } catch (error) {
    console.error('Error confirming meetup:', error);
    toast(t('orders_confirm_failed'), 'error');
  }
};

// Release escrow funds to seller
async function releaseEscrowToSeller(order) {
  var sellerId = order.seller_id;
  // Prefer escrow_amount (exact held amount), fall back to total_amount
  var releaseAmount = parseFloat(order.escrow_amount || order.total_amount || 0);
  if (!sellerId || releaseAmount <= 0) return;

  const { data: latestOrder } = await supabase
    .from('orders')
    .select('escrow_released, status, order_status')
    .eq('id', order.id)
    .maybeSingle();

  if (latestOrder?.escrow_released) return;

  var selRes = await supabase.from('users').select('balance').eq('id', sellerId).single();
  var sellerBalance = parseFloat(selRes.data ? selRes.data.balance : 0);

  await supabase.from('users').update({ balance: sellerBalance + releaseAmount }).eq('id', sellerId);

  await supabase.from('user_transactions').insert({
    user_id: sellerId,
    amount: releaseAmount,
    transaction_type: 'escrow_release',
    description: 'Sale completed: Order ' + (order.order_number || ''),
    reference_id: order.id || order.product_id,
    created_at: new Date().toISOString()
  });

  // Also update local caches
  try {
    localStorage.removeItem('vendly_balance');
    sessionStorage.removeItem('vendly_balance');
  } catch (e) { /* ignore */ }
}

// Cancel order
window.cancelOrder = function(orderId) {
  window.currentCancelOrderId = orderId;
  document.getElementById('cancelOrderModal').style.display = 'flex';
};

window.closeCancelOrderModal = function() {
  document.getElementById('cancelOrderModal').style.display = 'none';
  if (document.getElementById('cancelReason')) document.getElementById('cancelReason').value = '';
  window.currentCancelOrderId = null;
};

var cancelBtn = document.getElementById('confirmCancelBtn');
if (cancelBtn) {
  cancelBtn.addEventListener('click', async function() {
    if (!window.currentCancelOrderId) return;

    try {
      var order = allOrders.find(function(o) { return o.id === window.currentCancelOrderId; });
      var reason = document.getElementById('cancelReason') ? document.getElementById('cancelReason').value : '';

      var status = order ? (order.status || order.order_status) : '';
      if (order && (status === 'paid' || status === 'escrow')) {
        var totalAmount = parseFloat(order.total_amount || 0);
        if (totalAmount > 0) {
          // Refund buyer
          var buyerRes = await supabase.from('users').select('balance').eq('id', order.buyer_id).single();
          var buyerBalance = parseFloat(buyerRes.data ? buyerRes.data.balance : 0);

          await supabase.from('users').update({ balance: buyerBalance + totalAmount }).eq('id', order.buyer_id);

          await supabase.from('user_transactions').insert({
            user_id: order.buyer_id,
            amount: totalAmount,
            transaction_type: 'refund',
            description: 'Refund: Order ' + (order.order_number || '') + ' cancelled',
            reference_id: order.product_id,
            created_at: new Date().toISOString()
          });

          // Restore stock and clear sold_at
          if (order.product_id) {
            var prodRes = await supabase.from('products').select('stock').eq('id', order.product_id).single();
            if (prodRes.data) {
              await supabase.from('products').update({
                stock: (prodRes.data.stock || 0) + (order.quantity || 1),
                sold_at: null,
                status: 'active'
              }).eq('id', order.product_id);
            }
          }
        }
      }

      await supabase.from('orders').update({
        status: 'cancelled', order_status: 'cancelled',
        buyer_notes: reason || t('orders_cancelled_by_buyer'),
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }).eq('id', window.currentCancelOrderId);

      toast(t('orders_cancelled_success'), 'success');
      closeCancelOrderModal();
      await loadOrders();
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast(t('orders_cancel_failed'), 'error');
    }
  });
}

// ============================
// TRACKING
// ============================
window.trackShipment = function(orderId) {
  var order = allOrders.find(function(o) { return o.id === orderId; });
  if (!order || !order.tracking_number) {
    toast(t('orders_no_tracking'), 'error');
    return;
  }

  var urls = {
    'omniva': 'https://www.omniva.lv/private/track_and_trace?barcode=' + order.tracking_number,
    'dpd': 'https://www.dpd.com/lv/en/tracking/?query=' + order.tracking_number,
    'latvijas_pasts': 'https://www.pasts.lv/lv/palidziba/sut-ijumu-mekle-ana/?number=' + order.tracking_number,
    'venipak': 'https://www.venipak.com/tracking/?shipmentNumber=' + order.tracking_number
  };

  var url = urls[order.shipping_carrier];
  if (url) {
    window.open(url, '_blank');
  } else {
    toast(t('orders_tracking') + ': ' + order.tracking_number, 'success');
  }
};

// ============================
// STATUS HELPERS
// ============================
function getStatusBadgeHTML(status) {
  var map = {
    'pending':          { cls: 'badge-warning', key: 'orders_status_pending' },
    'paid':             { cls: 'badge-success', key: 'orders_status_paid' },
    'escrow':           { cls: 'badge-info',    key: 'orders_status_escrow' },
    'processing':       { cls: 'badge-info',    key: 'orders_status_processing' },
    'ready_for_pickup': { cls: 'badge-info',    key: 'orders_status_ready_pickup' },
    'shipped':          { cls: 'badge-primary', key: 'orders_status_shipped' },
    'in_transit':       { cls: 'badge-primary', key: 'orders_status_shipped' },
    'delivered':        { cls: 'badge-success', key: 'orders_status_delivered' },
    'completed':        { cls: 'badge-success', key: 'orders_status_completed' },
    'cancelled':        { cls: 'badge-danger',  key: 'orders_status_cancelled' },
    'refunded':         { cls: 'badge-warning', key: 'orders_status_refunded' },
    'disputed':         { cls: 'badge-danger',  key: 'orders_status_disputed' }
  };
  var info = map[status] || { cls: '', key: status };
  return '<span class="badge ' + info.cls + '">' + t(info.key) + '</span>';
}

function getStatusTimeline(order) {
  var isMeetup = order.delivery_method === 'meetup';
  var status = order.status || order.order_status || 'pending';

  var meetupSteps = [
    { key: 'pending',          label: t('orders_tl_order_placed'), icon: '\uD83D\uDCDD' },
    { key: 'escrow',           label: t('orders_tl_escrow'),       icon: '\uD83D\uDD12' },
    { key: 'ready_for_pickup', label: t('orders_tl_ready_meetup'), icon: '\uD83E\uDD1D' },
    { key: 'completed',        label: t('orders_tl_completed'),    icon: '\u2705' }
  ];

  var shippingSteps = [
    { key: 'pending',    label: t('orders_tl_order_placed'), icon: '\uD83D\uDCDD' },
    { key: 'paid',       label: t('orders_tl_payment'),      icon: '\uD83D\uDCB0' },
    { key: 'processing', label: t('orders_tl_processing'),   icon: '\u2699\uFE0F' },
    { key: 'shipped',    label: t('orders_tl_shipped'),      icon: '\uD83D\uDCE6' },
    { key: 'completed',  label: t('orders_tl_completed'),    icon: '\u2705' }
  ];

  var steps = isMeetup ? meetupSteps : shippingSteps;
  var statusOrder = steps.map(function(s) { return s.key; });
  var currentIdx = statusOrder.indexOf(status);

  return steps.map(function(s, i) {
    var isDone = currentIdx >= i;
    var isCurrent = status === s.key;
    var extra = '';

    if (s.key === 'escrow' && isCurrent) {
      extra = '<small style="color:var(--warning);">' +
        (order.meetup_confirmed_by_buyer ? '\u2713 ' + t('orders_buyer_confirmed_short') : '\u25CB ' + t('orders_buyer_pending')) +
        ' | ' +
        (order.meetup_confirmed_by_seller ? '\u2713 ' + t('orders_seller_confirmed_short') : '\u25CB ' + t('orders_seller_pending')) +
        '</small>';
    }

    return '<div class="timeline-item ' + (isDone ? 'active' : '') + ' ' + (isCurrent ? 'current' : '') + '">' +
      '<div class="timeline-icon">' + s.icon + '</div>' +
      '<div class="timeline-content"><strong>' + s.label + '</strong>' + extra + '</div></div>';
  }).join('');
}

// ============================
// UTILITY HELPERS
// ============================
function getCarrierName(carrier) {
  var ct = CARRIER_RATE_TABLES[carrier];
  if (ct) return ct.name;
  return (CARRIERS[carrier] ? CARRIERS[carrier].name : carrier) || 'N/A';
}

function getCountryName(code) {
  var names = { 'LV': 'Latvia', 'LT': 'Lithuania', 'EE': 'Estonia' };
  return names[code] || code || '';
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

function esc(str) {
  if (!str) return '';
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function getProductImageUrl(product, fallback) {
  if (!product) return fallback;
  if (Array.isArray(product.images) && product.images.length > 0 && product.images[0]) {
    return product.images[0];
  }
  if (typeof product.images === 'string' && product.images.trim()) {
    try {
      var parsed = JSON.parse(product.images);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]) {
        return parsed[0];
      }
    } catch (e) {
      return product.images;
    }
  }
  if (product.image_url) return product.image_url;
  return fallback;
}

function calculateDistanceKm(lat1, lng1, lat2, lng2) {
  if (![lat1, lng1, lat2, lng2].every(function(v) { return Number.isFinite(v); })) {
    return Number.NaN;
  }
  var toRad = function(d) { return d * Math.PI / 180; };
  var R = 6371;
  var dLat = toRad(lat2 - lat1);
  var dLng = toRad(lng2 - lng1);
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2))
    * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function renderNearestHint(lockers) {
  var hintEl = document.getElementById('nearestLockersHint');
  if (!hintEl) return;

  if (!userCoordinates) {
    hintEl.style.display = 'none';
    hintEl.textContent = '';
    return;
  }

  var nearest = lockers.filter(function(l) { return Number.isFinite(l.distanceKm); }).slice(0, 3);
  if (!nearest.length) {
    hintEl.style.display = 'block';
    hintEl.textContent = 'Location enabled, but no lockers with coordinates were found in this filter.';
    return;
  }

  hintEl.style.display = 'block';
  hintEl.textContent = 'Closest lockers: ' + nearest.map(function(l) {
    return l.name + ' (' + l.distanceKm.toFixed(1) + ' km)';
  }).join(', ');
}

function ensureLockerMap() {
  if (lockerMap) return lockerMap;
  var mapEl = document.getElementById('lockerMap');
  if (!mapEl || typeof window === 'undefined' || !window.L) return null;

  lockerMap = window.L.map(mapEl, { zoomControl: true }).setView([56.95, 24.1], 7);
  window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(lockerMap);
  return lockerMap;
}

function renderLockerMap(lockers) {
  var map = ensureLockerMap();
  if (!map) return;

  lockerMarkers.forEach(function(m) { map.removeLayer(m); });
  lockerMarkers = [];

  var points = [];
  lockers.forEach(function(l) {
    var lat = parseFloat(l.latitude);
    var lng = parseFloat(l.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    var marker = window.L.marker([lat, lng]).addTo(map);
    marker._lockerId = l.id;
    marker.bindPopup('<strong>' + esc(l.name) + '</strong><br>' + esc(l.address));
    marker.on('click', function() {
      var card = document.querySelector('.parcel-locker-card[data-locker-id="' + l.id + '"]');
      if (card) card.click();
    });
    lockerMarkers.push(marker);
    points.push([lat, lng]);
  });

  if (userCoordinates) {
    if (userLocationMarker) {
      map.removeLayer(userLocationMarker);
      userLocationMarker = null;
    }
    userLocationMarker = window.L.circleMarker([userCoordinates.lat, userCoordinates.lng], {
      radius: 7,
      color: '#2563eb',
      fillColor: '#2563eb',
      fillOpacity: 0.85
    }).addTo(map);
    userLocationMarker.bindPopup('Your location');
    points.push([userCoordinates.lat, userCoordinates.lng]);
  }

  if (points.length > 0) {
    map.fitBounds(points, { padding: [24, 24], maxZoom: 13 });
  }

  setTimeout(function() {
    if (lockerMap && typeof lockerMap.invalidateSize === 'function') {
      lockerMap.invalidateSize();
    }
  }, 30);
}

function highlightLockerMarker(lockerId) {
  if (!lockerMap || !lockerId) return;
  var marker = lockerMarkers.find(function(m) { return m._lockerId === lockerId; });
  if (marker) {
    lockerMap.setView(marker.getLatLng(), Math.max(lockerMap.getZoom(), 12));
    marker.openPopup();
  }
}

function requestUserLocation() {
  if (!navigator.geolocation) {
    toast('Geolocation is not supported in this browser.', 'error');
    return;
  }

  navigator.geolocation.getCurrentPosition(function(pos) {
    userCoordinates = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude
    };
    renderLockers();
    toast('Location detected. Showing closest parcel lockers first.', 'success');
  }, function(err) {
    console.warn('Geolocation error:', err);
    toast('Could not get your location. Please allow location access.', 'error');
  }, {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 300000
  });
}
