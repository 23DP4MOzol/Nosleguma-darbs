// ============================
// NAVBAR FUNCTIONALITY
// ============================

// Import required modules
import { supabase } from "./supabase.js";
import { i18n } from "./i18n.js";

// Hamburger menu handled in main.js

// No dropdown

// Theme toggle handled in main.js

// Language switcher handled in main.js

// Dropdown toggle
document.addEventListener('click', (e) => {
  const dropdowns = document.querySelectorAll('.dropdown');
  dropdowns.forEach(dropdown => {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove('open');
    }
  });

  if (e.target.closest('.dropdown-btn')) {
    const dropdown = e.target.closest('.dropdown');
    dropdown.classList.toggle('open');
  }
});

// Auth handled in main.js

// ============================
// Notifications (in-page + browser)
// ============================

const notifState = {
  unread: 0,
  list: []
};

function updateNotifBadge() {
  const badge = document.getElementById('notifBadge');
  if (!badge) return;
  if (notifState.unread > 0) {
    badge.style.display = 'inline-block';
    badge.textContent = notifState.unread > 99 ? '99+' : String(notifState.unread);
  } else {
    badge.style.display = 'none';
    badge.textContent = '0';
  }
}

function addInPageNotification(item) {
  notifState.list.unshift(item);
  // keep last 50
  notifState.list = notifState.list.slice(0, 50);
  notifState.unread += 1;
  updateNotifBadge();

  const list = document.getElementById('notificationsList');
  if (!list) return;
  const li = document.createElement('li');
  li.className = 'notification-item';
  li.innerHTML = `<div class="notification-title">${item.title}</div><div class="notification-body">${item.body}</div><div class="notification-date">${new Date(item.created_at).toLocaleString()}</div>`;
  list.prepend(li);
}

function showBrowserNotification(title, body, data = {}) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      const n = new Notification(title, { body, data, badge: '/assets/vendly-logo.svg' });
      n.onclick = () => { window.focus(); /* could navigate to related page */ };
    } catch (e) {
      console.warn('Could not show browser notification', e);
    }
  }
}

async function initNotifications() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // not signed in — no personal notifications

    // Load saved in-page notifications from session to persist across reloads briefly
    try {
      const saved = JSON.parse(sessionStorage.getItem('vendly_notifications_list') || 'null');
      if (Array.isArray(saved)) {
        notifState.list = saved;
        notifState.unread = parseInt(sessionStorage.getItem('vendly_notifications_unread') || '0', 10) || 0;
      }
    } catch (e) {}

    // Render any existing items
    const list = document.getElementById('notificationsList');
    if (list && notifState.list.length) {
      list.innerHTML = '';
      notifState.list.forEach(item => {
        const li = document.createElement('li');
        li.className = 'notification-item';
        li.innerHTML = `<div class="notification-title">${item.title}</div><div class="notification-body">${item.body}</div><div class="notification-date">${new Date(item.created_at).toLocaleString()}</div>`;
        list.appendChild(li);
      });
    }
    updateNotifBadge();

    // Read user notification preferences from server-side users table (defaults to enabled)
    let prefs = { orders: true, reviews: true, comments: true };
    try {
      const { data: userPrefsRow } = await supabase
        .from('users')
        .select('notification_preferences, notify_orders, notify_reviews, notify_comments')
        .eq('id', user.id)
        .maybeSingle();

      if (userPrefsRow?.notification_preferences) {
        const parsed = typeof userPrefsRow.notification_preferences === 'string'
          ? JSON.parse(userPrefsRow.notification_preferences)
          : userPrefsRow.notification_preferences;
        prefs = {
          orders: parsed?.orders !== false,
          reviews: parsed?.reviews !== false,
          comments: parsed?.comments !== false
        };
      } else {
        prefs = {
          orders: userPrefsRow?.notify_orders !== false,
          reviews: userPrefsRow?.notify_reviews !== false,
          comments: userPrefsRow?.notify_comments !== false
        };
      }
    } catch (e) {
      console.warn('Could not load notification preferences from server, using defaults', e?.message || e);
    }

    // Subscribe to relevant tables via Realtime (Postgres changes)
    // Orders
    if (prefs.orders) {
      try {
        supabase.channel('public:orders')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, payload => {
            const record = payload.new || payload.record || payload;
            if (!record) return;
            // notify if current user is buyer or seller
            if (record.buyer_id === user.id || record.seller_id === user.id) {
              const title = i18n.t ? i18n.t('notification_orders') : 'Order update';
              const body = `${i18n.t ? i18n.t('notification_orders') : 'Order'}: ${record.product_id} — ${record.order_status || (i18n.t ? i18n.t('unknown') : 'created')}`;
              addInPageNotification({ title, body, created_at: new Date().toISOString(), type: 'order' });
              showBrowserNotification(title, body, { type: 'order', orderId: record.id });
            }
          })
          .subscribe();
      } catch (e) { console.warn('Orders realtime subscribe failed', e); }
    }

    // Reviews
    if (prefs.reviews) {
      try {
        supabase.channel('public:reviews')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reviews' }, payload => {
            const record = payload.new || payload.record || payload;
            if (!record) return;
            if (record.seller_id === user.id) {
              const title = i18n.t ? i18n.t('notification_reviews') : 'New review';
              const body = `${record.rating || '★'} ${i18n.t ? i18n.t('notification_reviews') : 'review'} for your product`;
              addInPageNotification({ title, body, created_at: new Date().toISOString(), type: 'review' });
              showBrowserNotification(title, body, { type: 'review', reviewId: record.id });
            }
          })
          .subscribe();
      } catch (e) { console.warn('Reviews realtime subscribe failed', e); }
    }

    // Comments (if table exists)
    if (prefs.comments) {
      try {
        supabase.channel('public:comments')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, payload => {
            const record = payload.new || payload.record || payload;
            if (!record) return;
            // comment may have target_user_id or seller_id
            if (record.target_user_id === user.id || record.seller_id === user.id) {
              const title = i18n.t ? i18n.t('notification_comments') : 'New comment';
              const body = `${record.author_name || (i18n.t ? i18n.t('unknown') : 'Someone')} ${i18n.t ? i18n.t('notification_comments') : 'commented'}: ${String(record.body || '').slice(0, 100)}`;
              addInPageNotification({ title, body, created_at: new Date().toISOString(), type: 'comment' });
              showBrowserNotification(title, body, { type: 'comment', commentId: record.id });
            }
          })
          .subscribe();
      } catch (e) { /* table may not exist - ignore */ }
    }

    // Persist lightweight cache
    window.addEventListener('beforeunload', () => {
      try { sessionStorage.setItem('vendly_notifications_list', JSON.stringify(notifState.list)); } catch (e) {}
      try { sessionStorage.setItem('vendly_notifications_unread', String(notifState.unread)); } catch (e) {}
    });

  } catch (e) {
    console.warn('initNotifications error', e);
  }
}

// Toggle notifications dropdown UI
document.addEventListener('click', (e) => {
  const btn = e.target.closest('#notificationsBtn');
  if (btn) {
    const dd = document.getElementById('notificationsDropdown');
    if (!dd) return;
    const open = dd.style.display === 'block';
    dd.style.display = open ? 'none' : 'block';
    if (!open) {
      // mark read
      notifState.unread = 0;
      updateNotifBadge();
      try { sessionStorage.setItem('vendly_notifications_unread', '0'); } catch (e) {}
    }
    return;
  }
  // click outside: close
  const dropdown = document.getElementById('notificationsDropdown');
  if (dropdown && !dropdown.contains(e.target) && !e.target.closest('#notificationsBtn')) {
    dropdown.style.display = 'none';
  }
});

// Clear notifications
document.addEventListener('click', (e) => {
  const clearBtn = e.target.closest('#clearNotifBtn');
  if (clearBtn) {
    notifState.list = [];
    notifState.unread = 0;
    updateNotifBadge();
    const list = document.getElementById('notificationsList');
    if (list) list.innerHTML = '';
    try { sessionStorage.removeItem('vendly_notifications_list'); sessionStorage.setItem('vendly_notifications_unread', '0'); } catch (e) {}
  }
});

// Listen for test notifications dispatched from settings or other parts
window.addEventListener('vendly_test_notification', (e) => {
  try {
    const { title, body } = e.detail || {};
    addInPageNotification({ title, body, created_at: new Date().toISOString(), type: 'test' });
  } catch (e) {}
});

// Initialize when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNotifications);
} else {
  initNotifications();
}
