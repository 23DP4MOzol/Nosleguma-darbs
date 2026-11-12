// Escape untrusted text before interpolating it into HTML or quoted attributes.
export function escapeHtml(value = '') {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

export function safeMediaUrl(value, fallback = '') {
  const candidate = String(value || '').trim();
  if (!candidate) return fallback;

  try {
    const origin = typeof window === 'undefined' ? 'http://localhost' : window.location.origin;
    const url = new URL(candidate, origin);
    if (['http:', 'https:', 'blob:'].includes(url.protocol)) return candidate;
  } catch {
    return fallback;
  }

  return fallback;
}
