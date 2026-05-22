// ============================
// Category-Specific Fields Configuration
// ============================
// Each category defines extra form fields and filter options.
// Used by: sell page (form inputs), index page (browse filters),
// product modal (detail display), and edit modal.

export const CATEGORY_TREE = [
  {
    id: 'job_business',
    emoji: '💼',
    label: { lv: 'Darbs un bizness', en: 'Jobs and Business' },
    children: [
      { id: 'job_business/vacancies', label: { lv: 'Vakances', en: 'Vacancies' } },
      { id: 'job_business/looking_for_job', label: { lv: 'Mekle darbu', en: 'Looking for a job' } },
      { id: 'job_business/courses_education', label: { lv: 'Kursi, izglitiba', en: 'Courses, education' } },
      { id: 'job_business/business_contacts', label: { lv: 'Biznesa kontakti', en: 'Business contacts' } },
      { id: 'job_business/legal_services', label: { lv: 'Juridiskie pakalpojumi', en: 'Legal services' } },
      { id: 'job_business/financial_services', label: { lv: 'Finansu pakalpojumi', en: 'Financial services' } },
      { id: 'job_business/text_translations', label: { lv: 'Tekstu tulkosana', en: 'Text translations' } },
      { id: 'job_business/internet_services', label: { lv: 'Interneta pakalpojumi', en: 'Internet services' } },
      { id: 'job_business/other', label: { lv: 'Cits', en: 'Other' } }
    ]
  },
  {
    id: 'transport',
    emoji: '🚗',
    label: { lv: 'Transports', en: 'Transport' },
    children: [
      { id: 'transport/cars', label: { lv: 'Vieglie auto', en: 'Cars' } },
      { id: 'transport/cargo_cars', label: { lv: 'Kravas automasinas', en: 'Cargo cars' } },
      { id: 'transport/moto', label: { lv: 'Moto transports', en: 'Moto transport' } },
      { id: 'transport/bicycles_scooters', label: { lv: 'Velosipedi, skuteri', en: 'Bicycles, scooters' } },
      { id: 'transport/car_exchange', label: { lv: 'Vieglo auto maina', en: 'Car exchange' } },
      { id: 'transport/repair_parts', label: { lv: 'Remonts un rezerves dalas', en: 'Repair and spare parts' } },
      { id: 'transport/transport_services', label: { lv: 'Kravu un pasazieru parvadajumi', en: 'Transportation of goods and people' } },
      { id: 'transport/rent', label: { lv: 'Transporta noma', en: 'Transport rent' } },
      { id: 'transport/other', label: { lv: 'Cits...', en: 'Other...' } }
    ]
  },
  {
    id: 'real_estate',
    emoji: '🏠',
    label: { lv: 'Nekustamais ipasums', en: 'Real estate' },
    children: [
      { id: 'real_estate/flats', label: { lv: 'Dzivokli', en: 'Flats' } },
      { id: 'real_estate/houses', label: { lv: 'Majas, vasarnicas', en: 'Houses, cottages' } },
      { id: 'real_estate/farms', label: { lv: 'Saimniecibas, muizas', en: 'Farms, estates' } },
      { id: 'real_estate/premises', label: { lv: 'Telpas', en: 'Premises' } },
      { id: 'real_estate/offices', label: { lv: 'Biroji', en: 'Offices' } },
      { id: 'real_estate/land', label: { lv: 'Zeme un zemesgabali', en: 'Land and plots' } },
      { id: 'real_estate/forest', label: { lv: 'Mezs', en: 'Forest' } },
      { id: 'real_estate/brokers', label: { lv: 'Brokeru pakalpojumi', en: 'Brokers services' } },
      { id: 'real_estate/other', label: { lv: 'Cits...', en: 'Other...' } }
    ]
  },
  {
    id: 'construction',
    emoji: '🏗️',
    label: { lv: 'Buvnieciba', en: 'Construction' },
    children: [
      { id: 'construction/materials', label: { lv: 'Buvmateriali', en: 'Building materials' } },
      { id: 'construction/works', label: { lv: 'Buvdarbi', en: 'Construction works' } },
      { id: 'construction/tools', label: { lv: 'Instrumenti un tehnika', en: 'Tools and technics' } },
      { id: 'construction/tools_rent', label: { lv: 'Instrumentu un tehnikas noma', en: 'Hire of tools and technics' } },
      { id: 'construction/plumbing', label: { lv: 'Santehnika', en: 'Plumbing' } },
      { id: 'construction/garden_technics', label: { lv: 'Darza tehnika', en: 'Garden technics' } },
      { id: 'construction/projects_design', label: { lv: 'Projekti, dizains', en: 'Projects, design' } },
      { id: 'construction/transport_loading', label: { lv: 'Transportesana un krausana', en: 'Transportation and loading' } },
      { id: 'construction/other', label: { lv: 'Cits', en: 'Other' } }
    ]
  },
  {
    id: 'electronics',
    emoji: '💻',
    label: { lv: 'Elektronika', en: 'Electronics' },
    children: [
      { id: 'electronics/phones', label: { lv: 'Telefoni', en: 'Phones' } },
      { id: 'electronics/home_appliances', label: { lv: 'Sadzives tehnika', en: 'Home appliances' } },
      { id: 'electronics/computers_office', label: { lv: 'Datori, biroja tehnika', en: 'Computers, office equipment' } },
      { id: 'electronics/audio_video', label: { lv: 'Audio, video, DVD, SAT', en: 'Audio, Video, DVD, SAT' } },
      { id: 'electronics/batteries', label: { lv: 'Baterijas', en: 'Batteries' } },
      { id: 'electronics/tv', label: { lv: 'Televizori', en: 'Televisions set' } },
      { id: 'electronics/photo_optics', label: { lv: 'Foto un optika', en: 'Photo and optics' } },
      { id: 'electronics/gps', label: { lv: 'GPS navigatori', en: 'GPS navigators' } },
      { id: 'electronics/other', label: { lv: 'Cits un remonts', en: 'Other and repair' } }
    ]
  },
  {
    id: 'clothing',
    emoji: '👕',
    label: { lv: 'Apgerbs, apavi', en: 'Clothes, footwear' },
    children: [
      { id: 'clothing/women', label: { lv: 'Sieviesu apgerbs', en: "Women's clothes" } },
      { id: 'clothing/men', label: { lv: 'Viriesu apgerbs', en: "Men's clothes" } },
      { id: 'clothing/kids', label: { lv: 'Bernu apgerbs, apavi', en: "Children's clothing, shoes" } },
      { id: 'clothing/footwear', label: { lv: 'Apavi', en: 'Footwear' } },
      { id: 'clothing/accessories', label: { lv: 'Brilles, jostas, somas', en: 'Glasses, belts, handbags' } },
      { id: 'clothing/jewelry', label: { lv: 'Aksesuari, rotas', en: 'Accessories, jewelry' } },
      { id: 'clothing/workwear', label: { lv: 'Darba apgerbs', en: 'Unionalls' } },
      { id: 'clothing/sewing', label: { lv: 'Susanas pakalpojumi un atelje', en: 'Sewing services and atelier' } },
      { id: 'clothing/other', label: { lv: 'Cits', en: 'Other' } }
    ]
  },
  {
    id: 'home',
    emoji: '🛋️',
    label: { lv: 'Majai', en: 'For home' },
    children: [
      { id: 'home/furniture', label: { lv: 'Mebeles, interjers', en: 'Furniture, interior' } },
      { id: 'home/health_beauty', label: { lv: 'Veseliba, skaistumkopsana', en: 'Health, beauty' } },
      { id: 'home/jewellery', label: { lv: 'Juvelierizstradajumi, dargakmeni', en: 'Jewellery, gems' } },
      { id: 'home/gifts', label: { lv: 'Davanas, suveniri', en: 'Gifts, souvenirs' } },
      { id: 'home/handmade', label: { lv: 'Rokdarbi', en: 'Handmade products' } },
      { id: 'home/antiques', label: { lv: 'Antikvariats, gleznas', en: 'Antiques, canvas' } },
      { id: 'home/plants', label: { lv: 'Telpaugi', en: 'Home plants' } },
      { id: 'home/other', label: { lv: 'Cits...', en: 'Other...' } }
    ]
  },
  {
    id: 'searches',
    emoji: '🧭',
    label: { lv: 'Meklejumi, atradumi', en: 'Searches, finds' },
    children: []
  },
  {
    id: 'production_work',
    emoji: '🏭',
    label: { lv: 'Razoshana, darbs', en: 'Production, work' },
    children: [
      { id: 'production_work/equipment', label: { lv: 'Iekartas', en: 'Equipment' } },
      { id: 'production_work/orders', label: { lv: 'Razoshana, pasutijumi', en: 'Production, orders' } },
      { id: 'production_work/household', label: { lv: 'Saimniecibas darbi', en: 'Household work' } },
      { id: 'production_work/construction_repair', label: { lv: 'Buvnieciba un remonts', en: 'Construction and repair' } },
      { id: 'production_work/transport_loading', label: { lv: 'Transportesana un krausana', en: 'Transportation and loading' } },
      { id: 'production_work/business_contacts', label: { lv: 'Biznesa kontakti', en: 'Business contacts' } },
      { id: 'production_work/foodstuffs', label: { lv: 'Partikas produkti', en: 'Foodstuffs' } },
      { id: 'production_work/firewood', label: { lv: 'Malka, briketes, granulas', en: 'Firewood, briquettes, pellets' } },
      { id: 'production_work/other', label: { lv: 'Cits...', en: 'Other...' } }
    ]
  },
  {
    id: 'children',
    emoji: '🧸',
    label: { lv: 'Berniem', en: 'For children' },
    children: [
      { id: 'children/school', label: { lv: 'Viss skolai', en: 'All for school' } },
      { id: 'children/clothing', label: { lv: 'Bernu apgerbs, apavi', en: "Children's clothing, shoes" } },
      { id: 'children/toys', label: { lv: 'Rotalietas, supoles', en: 'Toys, swings' } },
      { id: 'children/carriages', label: { lv: 'Ratinji', en: 'Carriages' } },
      { id: 'children/furniture', label: { lv: 'Bernu mebeles', en: 'Children furniture' } },
      { id: 'children/car_seats', label: { lv: 'Auto sedeklisi, parnesajamas somas', en: 'Car seats, bags carrying' } },
      { id: 'children/accessories_food', label: { lv: 'Aksesuari un partika', en: 'Accessories and food' } },
      { id: 'children/activities', label: { lv: 'Pulcini, bernudarzi, sekcijas', en: 'Mugs, kindergartens, sections' } },
      { id: 'children/child_activities', label: { lv: 'Bernu aktivitates', en: "Children's activities" } },
      { id: 'children/other', label: { lv: 'Cits', en: 'Other' } }
    ]
  }
];

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

const CATEGORY_FIELD_MAP = {
  electronics: 'electronics',
  clothing: 'clothing',
  furniture: 'furniture',
  books: 'books',
  sports: 'sports',
  home: 'home',
  vehicles: 'vehicles',
  transport: 'vehicles',
  clothing_accessories: 'clothing'
};

function getBaseCategoryId(categoryId) {
  if (!categoryId) return '';
  const raw = String(categoryId).toLowerCase();
  if (CATEGORY_FIELD_MAP[raw]) return CATEGORY_FIELD_MAP[raw];
  const root = raw.split('/')[0];
  return CATEGORY_FIELD_MAP[root] || root;
}

export function getCategoryFieldsFor(categoryId) {
  const key = getBaseCategoryId(categoryId);
  return CATEGORY_FIELDS[key] || [];
}

export function getCategoryLabelById(categoryId, lang = 'en') {
  if (!categoryId) return '';
  for (const group of CATEGORY_TREE) {
    if (group.id === categoryId) return group.label?.[lang] || group.label?.en || group.label?.lv || group.id;
    if (group.children && group.children.length) {
      const hit = group.children.find(child => child.id === categoryId);
      if (hit) return hit.label?.[lang] || hit.label?.en || hit.label?.lv || hit.id;
    }
  }
  return categoryId;
}

const LEGACY_CATEGORY_LABELS = {
  electronics: { en: 'Electronics', lv: 'Elektronika' },
  clothing: { en: 'Clothing', lv: 'Apģērbs' },
  furniture: { en: 'Furniture', lv: 'Mēbeles' },
  books: { en: 'Books', lv: 'Grāmatas' },
  sports: { en: 'Sports', lv: 'Sports' },
  home: { en: 'Home & Garden', lv: 'Māja un dārzs' },
  vehicles: { en: 'Vehicles', lv: 'Transports' },
  other: { en: 'Other', lv: 'Cits' }
};

export function getCategoryDisplayName(categoryId, lang = 'en') {
  if (!categoryId) return '';
  const normalized = String(categoryId).trim().toLowerCase();
  const treeLabel = getCategoryLabelById(normalized, lang);
  if (treeLabel && treeLabel !== normalized) return treeLabel;
  return LEGACY_CATEGORY_LABELS[normalized]?.[lang] ||
    LEGACY_CATEGORY_LABELS[normalized]?.en ||
    categoryId;
}

export function buildCategoryOptions(lang = 'en', includeTopOption = true) {
  return CATEGORY_TREE.map(group => {
    const groupLabel = group.label?.[lang] || group.label?.en || group.label?.lv || group.id;
    const topOption = includeTopOption ? `<option value="${group.id}">${groupLabel}</option>` : '';
    const childOptions = (group.children || [])
      .map(child => `<option value="${child.id}">${child.label?.[lang] || child.label?.en || child.label?.lv || child.id}</option>`)
      .join('');
    return `<optgroup label="${groupLabel}">${topOption}${childOptions}</optgroup>`;
  }).join('');
}

export function buildCategoryTabs(lang = 'en') {
  return CATEGORY_TREE.map(group => {
    const label = group.label?.[lang] || group.label?.en || group.label?.lv || group.id;
    return `<button class="filter-tab" data-category="${group.id}">${group.emoji ? `${group.emoji} ` : ''}${label}</button>`;
  }).join('');
}

export function isCategoryMatch(productCategory, filterCategory) {
  if (!filterCategory || filterCategory === 'all') return true;
  const productValue = (productCategory || '').toLowerCase();
  const filterValue = String(filterCategory).toLowerCase();
  if (!productValue) return false;
  if (productValue === filterValue) return true;
  if (productValue.startsWith(`${filterValue}/`)) return true;
  if (filterValue === 'transport' && productValue === 'vehicles') return true;
  return false;
}

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
