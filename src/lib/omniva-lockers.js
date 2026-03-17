const OMNIVA_LOCATIONS_URL = 'https://www.omniva.lt/locations.json';

function normalizeCountry(countryCode) {
  return String(countryCode || '').trim().toUpperCase();
}

function buildAddress(parts) {
  return parts
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .join(', ');
}

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function makeLockerId(item) {
  const country = normalizeCountry(item.A0_NAME);
  const zip = String(item.ZIP || '').trim();
  const nameSlug = slugify(item.NAME);
  const x = String(item.X_COORDINATE || '').trim();
  const y = String(item.Y_COORDINATE || '').trim();
  return `omniva-${country}-${zip}-${nameSlug}-${x}-${y}`;
}

export function mapOmnivaLocationToLocker(item) {
  const address = buildAddress([item.A5_NAME, item.A6_NAME, item.A7_NAME, item.A8_NAME]);
  const city = String(item.A3_NAME || item.A2_NAME || '').trim();
  const country = normalizeCountry(item.A0_NAME);
  const latitude = Number.parseFloat(item.Y_COORDINATE);
  const longitude = Number.parseFloat(item.X_COORDINATE);

  return {
    carrier: 'omniva',
    locker_id: makeLockerId(item),
    name: String(item.NAME || '').trim(),
    address,
    city,
    country,
    postal_code: String(item.ZIP || '').trim() || null,
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
    active: true
  };
}

export async function fetchOmnivaBalticLockers(options = {}) {
  const countries = (options.countries || ['LV', 'LT', 'EE']).map(normalizeCountry);
  const includePostOffices = Boolean(options.includePostOffices);

  const response = await fetch(OMNIVA_LOCATIONS_URL, {
    headers: { Accept: 'application/json' }
  });

  if (!response.ok) {
    throw new Error(`Omniva feed request failed (${response.status})`);
  }

  const items = await response.json();
  if (!Array.isArray(items)) {
    throw new Error('Omniva feed returned unexpected format');
  }

  const filtered = items
    .filter((item) => countries.includes(normalizeCountry(item.A0_NAME)))
    .filter((item) => includePostOffices || String(item.TYPE) === '0')
    .map(mapOmnivaLocationToLocker)
    .filter((locker) => locker.name && locker.address && locker.city && locker.country);

  const deduped = new Map();
  filtered.forEach((locker) => {
    deduped.set(locker.locker_id, locker);
  });

  return Array.from(deduped.values());
}
