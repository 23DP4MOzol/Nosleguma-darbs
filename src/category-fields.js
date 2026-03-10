// ============================
// Category-Specific Fields Configuration
// ============================
// Each category defines extra form fields and filter options.
// Used by: sell page (form inputs), index page (browse filters),
// product modal (detail display), and edit modal.

export const CATEGORY_FIELDS = {
  electronics: [
    { key: 'brand', label: 'Brand', emoji: '🏷️', type: 'text', placeholder: 'e.g. Apple, Samsung', required: false },
    { key: 'model', label: 'Model', emoji: '📱', type: 'text', placeholder: 'e.g. iPhone 15, Galaxy S24', required: false },
    { key: 'screen_size', label: 'Screen Size', emoji: '🖥️', type: 'text', placeholder: 'e.g. 6.1 inch', required: false },
    { key: 'storage', label: 'Storage', emoji: '💾', type: 'select', required: false, options: [
      { value: '16GB', label: '16 GB' },
      { value: '32GB', label: '32 GB' },
      { value: '64GB', label: '64 GB' },
      { value: '128GB', label: '128 GB' },
      { value: '256GB', label: '256 GB' },
      { value: '512GB', label: '512 GB' },
      { value: '1TB', label: '1 TB' },
      { value: '2TB', label: '2 TB' }
    ]},
    { key: 'color', label: 'Color', emoji: '🎨', type: 'text', placeholder: 'e.g. Black, Silver', required: false }
  ],

  clothing: [
    { key: 'brand', label: 'Brand', emoji: '🏷️', type: 'text', placeholder: 'e.g. Nike, Zara, H&M', required: false },
    { key: 'size', label: 'Size', emoji: '📏', type: 'select', required: true, options: [
      { value: 'XXS', label: 'XXS' },
      { value: 'XS', label: 'XS' },
      { value: 'S', label: 'S' },
      { value: 'M', label: 'M' },
      { value: 'L', label: 'L' },
      { value: 'XL', label: 'XL' },
      { value: 'XXL', label: 'XXL' },
      { value: 'XXXL', label: 'XXXL' }
    ]},
    { key: 'gender', label: 'Gender', emoji: '👤', type: 'select', required: false, options: [
      { value: 'men', label: 'Men' },
      { value: 'women', label: 'Women' },
      { value: 'unisex', label: 'Unisex' },
      { value: 'kids', label: 'Kids' }
    ]},
    { key: 'material', label: 'Material', emoji: '🧵', type: 'text', placeholder: 'e.g. Cotton, Polyester', required: false },
    { key: 'color', label: 'Color', emoji: '🎨', type: 'text', placeholder: 'e.g. Black, Blue', required: false }
  ],

  furniture: [
    { key: 'brand', label: 'Brand', emoji: '🏷️', type: 'text', placeholder: 'e.g. IKEA, Ashley', required: false },
    { key: 'material', label: 'Material', emoji: '🪵', type: 'select', required: false, options: [
      { value: 'wood', label: 'Wood' },
      { value: 'metal', label: 'Metal' },
      { value: 'plastic', label: 'Plastic' },
      { value: 'glass', label: 'Glass' },
      { value: 'fabric', label: 'Fabric' },
      { value: 'leather', label: 'Leather' },
      { value: 'mixed', label: 'Mixed' }
    ]},
    { key: 'dimensions', label: 'Dimensions (WxDxH)', emoji: '📐', type: 'text', placeholder: 'e.g. 120x60x75 cm', required: false },
    { key: 'color', label: 'Color', emoji: '🎨', type: 'text', placeholder: 'e.g. Oak, White', required: false },
    { key: 'room', label: 'Room', emoji: '🏠', type: 'select', required: false, options: [
      { value: 'living_room', label: 'Living Room' },
      { value: 'bedroom', label: 'Bedroom' },
      { value: 'kitchen', label: 'Kitchen' },
      { value: 'bathroom', label: 'Bathroom' },
      { value: 'office', label: 'Office' },
      { value: 'outdoor', label: 'Outdoor' }
    ]}
  ],

  books: [
    { key: 'author', label: 'Author', emoji: '✍️', type: 'text', placeholder: 'e.g. J.K. Rowling', required: true },
    { key: 'isbn', label: 'ISBN', emoji: '📖', type: 'text', placeholder: 'e.g. 978-3-16-148410-0', required: false },
    { key: 'pages', label: 'Pages', emoji: '📄', type: 'number', placeholder: 'e.g. 350', min: 1, required: false },
    { key: 'book_language', label: 'Language', emoji: '🌐', type: 'select', required: false, options: [
      { value: 'lv', label: 'Latviešu' },
      { value: 'en', label: 'English' },
      { value: 'ru', label: 'Русский' },
      { value: 'de', label: 'Deutsch' },
      { value: 'other', label: 'Other' }
    ]},
    { key: 'genre', label: 'Genre', emoji: '📚', type: 'select', required: false, options: [
      { value: 'fiction', label: 'Fiction' },
      { value: 'non_fiction', label: 'Non-Fiction' },
      { value: 'science', label: 'Science' },
      { value: 'history', label: 'History' },
      { value: 'children', label: 'Children' },
      { value: 'textbook', label: 'Textbook' },
      { value: 'comics', label: 'Comics' },
      { value: 'other', label: 'Other' }
    ]}
  ],

  sports: [
    { key: 'brand', label: 'Brand', emoji: '🏷️', type: 'text', placeholder: 'e.g. Nike, Adidas', required: false },
    { key: 'sport_type', label: 'Sport Type', emoji: '⚽', type: 'select', required: false, options: [
      { value: 'football', label: 'Football' },
      { value: 'basketball', label: 'Basketball' },
      { value: 'tennis', label: 'Tennis' },
      { value: 'cycling', label: 'Cycling' },
      { value: 'running', label: 'Running' },
      { value: 'swimming', label: 'Swimming' },
      { value: 'gym', label: 'Gym / Fitness' },
      { value: 'winter', label: 'Winter Sports' },
      { value: 'outdoor', label: 'Outdoor / Hiking' },
      { value: 'other', label: 'Other' }
    ]},
    { key: 'size', label: 'Size', emoji: '📏', type: 'text', placeholder: 'e.g. M, 42, One Size', required: false },
    { key: 'color', label: 'Color', emoji: '🎨', type: 'text', placeholder: 'e.g. Black, Red', required: false }
  ],

  home: [
    { key: 'brand', label: 'Brand', emoji: '🏷️', type: 'text', placeholder: 'e.g. Philips, Bosch', required: false },
    { key: 'room', label: 'Room', emoji: '🏠', type: 'select', required: false, options: [
      { value: 'living_room', label: 'Living Room' },
      { value: 'bedroom', label: 'Bedroom' },
      { value: 'kitchen', label: 'Kitchen' },
      { value: 'bathroom', label: 'Bathroom' },
      { value: 'garden', label: 'Garden' },
      { value: 'garage', label: 'Garage' },
      { value: 'other', label: 'Other' }
    ]},
    { key: 'material', label: 'Material', emoji: '🧱', type: 'text', placeholder: 'e.g. Ceramic, Stainless Steel', required: false },
    { key: 'color', label: 'Color', emoji: '🎨', type: 'text', placeholder: 'e.g. White, Silver', required: false }
  ],

  vehicles: [
    { key: 'make', label: 'Make', emoji: '🏭', type: 'text', placeholder: 'e.g. BMW, Toyota', required: true },
    { key: 'model', label: 'Model', emoji: '🚗', type: 'text', placeholder: 'e.g. 3 Series, Corolla', required: true },
    { key: 'year', label: 'Year', emoji: '📅', type: 'number', placeholder: 'e.g. 2020', min: 1900, required: false },
    { key: 'mileage', label: 'Mileage (km)', emoji: '🛣️', type: 'number', placeholder: 'e.g. 50000', min: 0, required: false },
    { key: 'fuel_type', label: 'Fuel Type', emoji: '⛽', type: 'select', required: false, options: [
      { value: 'petrol', label: 'Petrol' },
      { value: 'diesel', label: 'Diesel' },
      { value: 'electric', label: 'Electric' },
      { value: 'hybrid', label: 'Hybrid' },
      { value: 'lpg', label: 'LPG' },
      { value: 'other', label: 'Other' }
    ]},
    { key: 'transmission', label: 'Transmission', emoji: '⚙️', type: 'select', required: false, options: [
      { value: 'manual', label: 'Manual' },
      { value: 'automatic', label: 'Automatic' }
    ]},
    { key: 'color', label: 'Color', emoji: '🎨', type: 'text', placeholder: 'e.g. Black, Silver', required: false }
  ],

  other: [
    { key: 'brand', label: 'Brand', emoji: '🏷️', type: 'text', placeholder: 'Enter brand', required: false },
    { key: 'color', label: 'Color', emoji: '🎨', type: 'text', placeholder: 'Enter color', required: false }
  ]
};

// ============================
// Utility: Parse extra attributes from product description
// ============================
const ATTRS_MARKER = '<!--vendly-attrs:';
const ATTRS_END = '-->';

/**
 * Extract extra attributes embedded in the product description.
 * Returns { description: cleanDescription, attrs: { key: value, ... } }
 */
export function parseProductAttrs(rawDescription) {
  if (!rawDescription || typeof rawDescription !== 'string') {
    return { description: rawDescription || '', attrs: {} };
  }
  const idx = rawDescription.indexOf(ATTRS_MARKER);
  if (idx === -1) {
    return { description: rawDescription, attrs: {} };
  }
  const endIdx = rawDescription.indexOf(ATTRS_END, idx + ATTRS_MARKER.length);
  if (endIdx === -1) {
    return { description: rawDescription, attrs: {} };
  }
  const jsonStr = rawDescription.substring(idx + ATTRS_MARKER.length, endIdx);
  let attrs = {};
  try {
    attrs = JSON.parse(jsonStr);
  } catch (e) {
    console.warn('Failed to parse product attrs:', e);
  }
  const cleanDesc = rawDescription.substring(0, idx).trimEnd();
  return { description: cleanDesc, attrs };
}

/**
 * Get the displayable label for an attribute value, looking up select option labels.
 */
export function getAttrLabel(category, key, value) {
  const fields = CATEGORY_FIELDS[(category || '').toLowerCase()] || [];
  const field = fields.find(f => f.key === key);
  if (!field) return value;
  if (field.type === 'select' && field.options) {
    const opt = field.options.find(o => o.value === value);
    if (opt) return opt.label;
  }
  return value;
}

/**
 * Get the field definition for a given category and key.
 */
export function getFieldDef(category, key) {
  const fields = CATEGORY_FIELDS[(category || '').toLowerCase()] || [];
  return fields.find(f => f.key === key) || null;
}

/**
 * Build an HTML snippet showing extra attributes as badges/tags.
 */
export function renderAttrBadges(category, attrs) {
  if (!attrs || Object.keys(attrs).length === 0) return '';
  const fields = CATEGORY_FIELDS[(category || '').toLowerCase()] || [];
  return Object.entries(attrs).map(([key, value]) => {
    if (!value) return '';
    const field = fields.find(f => f.key === key);
    const label = field ? field.label : key;
    const emoji = field ? (field.emoji || '') : '';
    const displayValue = field && field.type === 'select' && field.options
      ? (field.options.find(o => o.value === value)?.label || value)
      : value;
    return `<span style="display:inline-flex;align-items:center;gap:0.25rem;background:var(--secondary,#f3f4f6);color:var(--fg,#374151);padding:0.25rem 0.5rem;border-radius:6px;font-size:0.75rem;font-weight:500;border:1px solid var(--border,#e5e7eb);">${emoji} ${label}: ${displayValue}</span>`;
  }).filter(Boolean).join(' ');
}

/**
 * Generate filter controls HTML for the browse page extra filters section.
 */
export function buildBrowseFilters(category) {
  const fields = CATEGORY_FIELDS[(category || '').toLowerCase()];
  if (!fields || fields.length === 0) return '';
  // Only generate filters for select-type fields + a few key text fields
  return fields.map(f => {
    const filterId = `extraFilter_${f.key}`;
    if (f.type === 'select' && f.options) {
      const opts = f.options.map(o => `<option value="${o.value}">${o.label}</option>`).join('');
      return `<div class="filter-group">
        <label style="display:block;font-weight:600;color:var(--fg);margin-bottom:0.5rem;font-size:0.875rem;">
          <span>${f.emoji || ''} </span><span>${f.label}</span>
        </label>
        <select id="${filterId}" style="width:100%;padding:0.75rem;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:0.875rem;background:var(--bg);color:var(--fg);cursor:pointer;transition:var(--transition);">
          <option value="">All</option>
          ${opts}
        </select>
      </div>`;
    }
    // Text/number fields become text inputs for filtering
    return `<div class="filter-group">
      <label style="display:block;font-weight:600;color:var(--fg);margin-bottom:0.5rem;font-size:0.875rem;">
        <span>${f.emoji || ''} </span><span>${f.label}</span>
      </label>
      <input type="text" id="${filterId}" placeholder="${f.placeholder || `Filter by ${f.label.toLowerCase()}...`}"
        style="width:100%;padding:0.75rem;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:0.875rem;background:var(--bg);color:var(--fg);transition:var(--transition);">
    </div>`;
  }).join('');
}
