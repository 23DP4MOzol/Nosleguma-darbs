// Registers the service worker (if supported) and logs lifecycle events.
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => {
        console.log('Service Worker registered:', reg.scope);
        if (reg.waiting) {
          console.log('SW waiting to activate');
        }
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker.addEventListener('statechange', () => {
            console.log('SW state:', newWorker.state);
          });
        });
      })
      .catch(err => console.warn('SW registration failed:', err));
  });
}
