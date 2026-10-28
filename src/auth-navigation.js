// Capture callback intent before Supabase consumes and clears the URL fragment.
export const isPasswordRecovery = typeof window !== 'undefined' && (
  new URLSearchParams(window.location.hash.slice(1)).get('type') === 'recovery' ||
  new URLSearchParams(window.location.search).get('type') === 'recovery' ||
  new URLSearchParams(window.location.search).get('reason') === 'password_reset'
);

export function getLoginDestination() {
  if (isPasswordRecovery) return 'settings.html?tab=password';
  try {
    const target = new URL(new URLSearchParams(window.location.search).get('redirect') || 'index.html', window.location.href);
    if (target.origin === window.location.origin && !/(?:login|register|resend-verification)\.html$/.test(target.pathname)) {
      return target.pathname + target.search + target.hash;
    }
  } catch {}
  return 'index.html';
}
