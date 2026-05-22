import { supabase } from './supabase.js';

const SETTINGS_TABLE = 'platform_settings';
const SETTINGS_ROW_ID = 1;
const CACHE_KEY = 'vendly_platform_settings_cache';

export const DEFAULT_PLATFORM_SETTINGS = Object.freeze({
  warning_enabled: false,
  warning_text: '',
  disable_buying: false,
  disable_listing: false,
  updated_at: null
});

function normalizeSettings(row) {
  const src = row || {};
  return {
    warning_enabled: !!src.warning_enabled,
    warning_text: String(src.warning_text || ''),
    disable_buying: !!src.disable_buying,
    disable_listing: !!src.disable_listing,
    updated_at: src.updated_at || null
  };
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return normalizeSettings(parsed);
  } catch (e) {
    return null;
  }
}

function writeCache(settings) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(settings));
  } catch (e) {
    // ignore
  }
}

export async function getPlatformSettings({ useCache = true } = {}) {
  if (useCache) {
    const cached = readCache();
    if (cached) return cached;
  }

  try {
    const { data, error } = await supabase
      .from(SETTINGS_TABLE)
      .select('*')
      .eq('id', SETTINGS_ROW_ID)
      .maybeSingle();

    if (error) throw error;

    const settings = normalizeSettings(data);
    writeCache(settings);
    return settings;
  } catch (e) {
    const cached = readCache();
    return cached || { ...DEFAULT_PLATFORM_SETTINGS };
  }
}

export function applyPlatformSettingsToWindow(settings) {
  try {
    window.vendlyPlatformSettings = settings;
  } catch (e) {
    // ignore
  }
}

export function renderPlatformWarningBanner(settings) {
  const enabled = !!settings?.warning_enabled && String(settings?.warning_text || '').trim().length > 0;
  const existing = document.getElementById('platformWarningBanner');

  if (!enabled) {
    if (existing) existing.remove();
    return;
  }

  const banner = existing || document.createElement('div');
  banner.id = 'platformWarningBanner';
  banner.className = 'platform-warning-banner';

  // Use textContent to avoid HTML injection.
  banner.textContent = String(settings.warning_text || '').trim();

  if (!existing) {
    // Insert at the top of <body> (above navbar)
    const first = document.body.firstChild;
    if (first) document.body.insertBefore(banner, first);
    else document.body.appendChild(banner);
  }
}

export async function loadAndApplyPlatformSettings() {
  const settings = await getPlatformSettings({ useCache: true });
  applyPlatformSettingsToWindow(settings);
  try {
    renderPlatformWarningBanner(settings);
  } catch (e) {
    // ignore banner render errors
  }
  return settings;
}
