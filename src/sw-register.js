// Registers the service worker (if supported) and handles updates.
if (import.meta.env.PROD && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(new URL('service-worker.js', window.location.href).href)
      .then(reg => {
        console.log('Service Worker registered:', reg.scope);

        // If a waiting worker exists, activate it immediately
        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New SW ready — activate and reload to avoid stale content
              newWorker.postMessage({ type: 'SKIP_WAITING' });
              console.log('New Service Worker installed — reloading for update');
              // Reload after activation, when the new worker controls this page.
            }
          });
        });
      })
      .catch(err => console.warn('SW registration failed:', err));
  });
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });
}
