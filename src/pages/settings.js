import { supabase, getCurrentUser, logoutUser, uploadAvatar } from '../supabase.js';
import { i18n } from '../i18n.js';
import { themeManager } from '../theme.js';
import { showInfoModal } from '../ui/modal.js';

// ============================
// Authentication Check - Redirect guests to login
// ============================
async function checkAuth() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // User is not logged in, redirect to login page
    const redirectUrl = window.location.href;
    const reason = 'settings';
    window.location.href = `login.html?redirect=${encodeURIComponent(redirectUrl)}&reason=${reason}`;
    return false;
  }
  return user;
}

// ============================
// Language and Theme Setup
// ============================
document.getElementById('langSelect').addEventListener('change', e => {
  i18n.setLang(e.target.value);
});

// Theme toggle is handled by centralized theme.js

// ============================
// Hamburger Mobile Menu
// ============================
// ============================
// Load User Profile
// ============================
async function loadUserProfile() {
  const currentUser = await checkAuth();
  if (!currentUser) return;

  try {
    // Get user data from custom users table
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', currentUser.id)
      .single();

    let resolvedUserData = userData || null;

    if (error) {
      console.warn('Error loading user profile from users table by id:', error);
    }

    // If no users row by id, try by email (useful when rows were seeded with different UUIDs)
    if (!resolvedUserData && currentUser?.email) {
      try {
        const { data: emailUser, error: emailError } = await supabase
          .from('users')
          .select('*')
          .eq('email', currentUser.email)
          .maybeSingle();

        if (emailError) {
          console.warn('Error loading user profile from users table by email:', emailError);
        } else if (emailUser) {
          resolvedUserData = emailUser;
          console.log('Loaded users row by email for settings page');
        }
      } catch (e) {
        console.warn('Exception querying users by email:', e.message || e);
      }
    }

    // Update UI with available user data (fallback to auth metadata/localStorage)
    const displayName = (resolvedUserData && resolvedUserData.username) || currentUser.user_metadata?.full_name || 'User';
    document.getElementById('userName').textContent = displayName;
    document.getElementById('userEmailDisplay').textContent = currentUser.email || '—';
    document.getElementById('userEmail').value = currentUser.email || '';
    document.getElementById('userAvatarText').textContent = ((resolvedUserData && resolvedUserData.username) || (displayName) || 'U').charAt(0).toUpperCase();

    // Determine balance from users table, auth metadata, or localStorage
    let profileBalance = 0;
    if (resolvedUserData && typeof resolvedUserData.balance !== 'undefined' && resolvedUserData.balance !== null) {
      profileBalance = parseFloat(resolvedUserData.balance) || 0;
    } else if (currentUser.user_metadata && (currentUser.user_metadata.balance || currentUser.user_metadata.wallet?.balance)) {
      profileBalance = parseFloat(currentUser.user_metadata.balance || currentUser.user_metadata.wallet.balance) || 0;
    } else if (localStorage.getItem('vendly_balance')) {
      profileBalance = parseFloat(localStorage.getItem('vendly_balance')) || 0;
    }

    document.getElementById('userBalanceDisplay').textContent = `€${profileBalance.toFixed(2)}`;
    
    // Load additional profile fields
    const usernameInput = document.getElementById('usernameInput');
    if (usernameInput && resolvedUserData?.username) {
      usernameInput.value = resolvedUserData.username;
    }
    
    const bioInput = document.getElementById('bioInput');
    if (bioInput && resolvedUserData?.bio) {
      bioInput.value = resolvedUserData.bio;
    }
    
    const whatISellInput = document.getElementById('whatISellInput');
    if (whatISellInput && resolvedUserData?.what_i_sell) {
      whatISellInput.value = resolvedUserData.what_i_sell;
    }

    // Load notification preferences (server-side preferred)
    try {
      let prefs = null;
      if (resolvedUserData && resolvedUserData.notification_preferences) {
        prefs = typeof resolvedUserData.notification_preferences === 'string' ? JSON.parse(resolvedUserData.notification_preferences) : resolvedUserData.notification_preferences;
      } else {
        // fallback to individual columns
        prefs = {
          orders: resolvedUserData?.notify_orders !== undefined ? !!resolvedUserData.notify_orders : undefined,
          reviews: resolvedUserData?.notify_reviews !== undefined ? !!resolvedUserData.notify_reviews : undefined,
          comments: resolvedUserData?.notify_comments !== undefined ? !!resolvedUserData.notify_comments : undefined
        };
      }

      // apply prefs if defined, otherwise fall back to localStorage defaults handled elsewhere
      if (prefs) {
        if (typeof prefs.orders !== 'undefined') document.getElementById('notifOrders').checked = !!prefs.orders;
        if (typeof prefs.reviews !== 'undefined') document.getElementById('notifReviews').checked = !!prefs.reviews;
        if (typeof prefs.comments !== 'undefined') document.getElementById('notifComments').checked = !!prefs.comments;
      }
    } catch (e) {
      console.warn('Could not load notification prefs from server', e);
    }

    const avatarImg = document.getElementById('userAvatar');
    const avatarText = document.getElementById('userAvatarText');
    const avatarUrlInput = document.getElementById('avatarUrlInput');
    const avatarUrl = resolvedUserData?.avatar_url || currentUser.user_metadata?.avatar_url || '';

    if (avatarUrl) {
      if (avatarImg) {
        avatarImg.src = avatarUrl;
        avatarImg.style.display = 'block';
      }
      if (avatarText) avatarText.style.display = 'none';
      if (avatarUrlInput) avatarUrlInput.value = avatarUrl;
    } else {
      if (avatarImg) avatarImg.style.display = 'none';
      if (avatarText) avatarText.style.display = 'inline';
    }

    // Update navbar balance (use same fallback)
    const balanceBadge = document.getElementById('balanceBadge');
    if (balanceBadge) {
      balanceBadge.style.display = 'flex';
      balanceBadge.querySelector('span').textContent = `€${profileBalance.toFixed(2)}`;
      // ensure it links to balance page
      if (balanceBadge.tagName.toLowerCase() !== 'a') {
        // replace with anchor preserving id/class
        const a = document.createElement('a');
        a.id = balanceBadge.id;
        a.className = balanceBadge.className;
        a.href = 'balance.html';
        a.innerHTML = balanceBadge.innerHTML;
        balanceBadge.replaceWith(a);
      }
    }

    // Show user stats
    document.getElementById('userProductCount').textContent = '0';
    document.getElementById('userSalesCount').textContent = '0';
    document.getElementById('userRating').textContent = '0.0';

    // Load user products count
    try {
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', currentUser.id);
      document.getElementById('userProductCount').textContent = count || 0;
    } catch (e) {
      console.warn('Could not load product count');
    }

    // Load user sales count
    try {
      const { count: salesCount } = await supabase
        .from('user_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUser.id)
        .eq('transaction_type', 'sale');
      document.getElementById('userSalesCount').textContent = salesCount || 0;
    } catch (e) {
      console.warn('Could not load sales count');
    }

  } catch (error) {
    console.error('Error loading profile:', error);
  }
}

// ============================
// Save Profile
// ============================
document.getElementById('saveProfileBtn')?.addEventListener('click', async () => {
  const currentUser = await checkAuth();
  if (!currentUser) return;

  const username = document.getElementById('usernameInput')?.value?.trim();
  const bio = document.getElementById('bioInput')?.value?.trim();
  const whatISell = document.getElementById('whatISellInput')?.value?.trim();
  let avatarUrl = document.getElementById('avatarUrlInput')?.value?.trim() || '';

  try {
    const fileRadio = document.querySelector('input[name="avatarType"][value="file"]');
    if (fileRadio?.checked) {
      const fileInput = document.getElementById('avatarFileInput');
      const file = fileInput?.files?.[0];
      if (file) {
        avatarUrl = await uploadAvatar(file, currentUser.id);
      }
    }

    let updates = {
      username: username,
      bio: bio,
      what_i_sell: whatISell,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString()
    };

    // Include notification preferences (will be removed automatically by save logic if column missing)
    try {
      const prefs = {
        orders: !!document.getElementById('notifOrders')?.checked,
        reviews: !!document.getElementById('notifReviews')?.checked,
        comments: !!document.getElementById('notifComments')?.checked
      };
      updates.notification_preferences = prefs; // attempt to save JSON/object
      // also set legacy boolean columns for compatibility
      updates.notify_orders = prefs.orders;
      updates.notify_reviews = prefs.reviews;
      updates.notify_comments = prefs.comments;
    } catch (e) { /* ignore if DOM missing */ }

    // Try adding theme to update — but don't break the save if column doesn't exist
    // Theme is also synced via themeManager.saveToAccount() on every toggle
    try {
      updates.theme = themeManager.getTheme();
    } catch (e) { /* ignore */ }

    // Prefer updating the row by auth user id; if absent, fallback to auth email.
    // This avoids duplicate email conflicts caused by legacy rows with a different id.
    let targetColumn = 'id';
    let targetValue = currentUser.id;

    try {
      const { data: rowById } = await supabase
        .from('users')
        .select('id')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (!rowById && currentUser.email) {
        const { data: rowByEmail } = await supabase
          .from('users')
          .select('id')
          .eq('email', currentUser.email)
          .maybeSingle();

        if (rowByEmail) {
          targetColumn = 'email';
          targetValue = currentUser.email;
        }
      }
    } catch (lookupErr) {
      console.warn('Could not resolve safest users row target, defaulting to id:', lookupErr?.message || lookupErr);
    }

    let error = null;
    for (let attempt = 0; attempt < 6; attempt++) {
      const result = await supabase
        .from('users')
        .update(updates)
        .eq(targetColumn, targetValue);

      error = result.error || null;
      if (!error) break;

      // Remove missing columns dynamically for older schemas
      // Handles PostgREST PGRST204 and PostgreSQL 42703 (undefined_column)
      if (error.code === 'PGRST204' || error.code === '42703' || (error.message && error.message.includes('column'))) {
        const missingColumn = (error.message || '').match(/'([^']+)' column/)?.[1]
          || (error.message || '').match(/column ['"]?([^'"]+)['"]?/i)?.[1];
        if (missingColumn && Object.prototype.hasOwnProperty.call(updates, missingColumn)) {
          delete updates[missingColumn];
          console.warn(`users.${missingColumn} column missing; retrying profile save without it`);
          continue;
        }
      }

      break;
    }

    if (error) throw error;

    if (avatarUrl) {
      try {
        await supabase.auth.updateUser({ data: { avatar_url: avatarUrl } });
      } catch (metadataErr) {
        console.warn('Could not save avatar in auth metadata:', metadataErr?.message || metadataErr);
      }
    }

    await showInfoModal('Profile saved successfully!', 'Success');
    loadUserProfile();

  } catch (error) {
    console.error('Error saving profile:', error);
    await showInfoModal('Error saving profile: ' + error.message, 'Error');
  }
});

// ============================
// Preview Profile
// ============================
document.getElementById('previewProfileBtn')?.addEventListener('click', async () => {
  const currentUser = await checkAuth();
  if (!currentUser) return;

  const username = document.getElementById('usernameInput')?.value?.trim() || 'User';
  const bio = document.getElementById('bioInput')?.value?.trim();
  const whatISell = document.getElementById('whatISellInput')?.value?.trim();
  const avatarUrl = document.getElementById('avatarUrlInput')?.value?.trim();

  // Get user's current products and stats for preview (each query independently try-caught like index.html)
  const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  let products = [];
  try {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(10);
    products = data || [];
  } catch (e) {
    console.warn('Could not load products for preview:', e);
  }

  let reviews = [];
  try {
    const { data } = await supabase
      .from('reviews')
      .select('rating, comment, created_at, buyer_id, users!buyer_id(username)')
      .eq('seller_id', currentUser.id)
      .order('created_at', { ascending: false });
    reviews = data || [];
  } catch (e) {
    console.warn('Could not load reviews for preview:', e);
  }

  let averageRating = 0;
  if (reviews.length > 0) {
    averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  }

  const profileHtml = `
    <div class="profile-header">
      <div class="profile-avatar">
        ${avatarUrl ? `<img src="${avatarUrl}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">` : username.charAt(0).toUpperCase()}
      </div>
      <h2 class="profile-name">${escapeHtml(username)}</h2>
      ${bio ? `<p class="profile-bio">${escapeHtml(bio)}</p>` : ''}
      ${whatISell ? `<p class="profile-bio" style="font-style: italic;">🏷️ ${escapeHtml(whatISell)}</p>` : ''}
      <div class="profile-stats">
        <div class="profile-stat">
          <div class="profile-stat-value">${products.length}</div>
          <div class="profile-stat-label">Products</div>
        </div>
        <div class="profile-stat">
          <div class="profile-stat-value">${averageRating.toFixed(1)} ⭐</div>
          <div class="profile-stat-label">Rating (${reviews.length} reviews)</div>
        </div>
      </div>
    </div>

    <div class="profile-section">
      <h3>Recent Products</h3>
      <div class="profile-products">
        ${products.length > 0 ? products.map(product => `
          <div class="profile-product-card">
            <img src="${product.image_url || 'https://placehold.co/200x150/667eea/white?text=No+Image'}" alt="${escapeHtml(product.name)}" class="profile-product-image">
            <div class="profile-product-info">
              <h4 class="profile-product-name">${escapeHtml(product.name)}</h4>
              <div class="profile-product-price">€${parseFloat(product.price).toFixed(2)}</div>
            </div>
          </div>
        `).join('') : '<p style="grid-column:1/-1; text-align:center; color:var(--muted);">No products yet.</p>'}
      </div>
    </div>

    <div class="profile-section">
      <h3>Reviews & Comments</h3>
      <div class="profile-reviews">
        ${reviews.length > 0 ? reviews.map(review => `
          <div class="profile-review">
            <div class="profile-review-header">
              <span class="profile-review-buyer">${escapeHtml(review.users?.username || 'Anonymous')}</span>
              <span class="profile-review-rating">⭐ ${review.rating}/5</span>
              <span class="profile-review-date">${new Date(review.created_at).toLocaleDateString()}</span>
            </div>
            <p class="profile-review-comment">${escapeHtml(review.comment || 'No comment')}</p>
          </div>
        `).join('') : '<p style="text-align:center; color:var(--muted);">No reviews yet.</p>'}
      </div>
    </div>
  `;

  document.getElementById('profilePreviewContent').innerHTML = profileHtml;
  document.getElementById('profilePreviewModal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
});

// ============================
// Avatar Type Toggle
// ============================
document.querySelectorAll('input[name="avatarType"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    const urlInput = document.getElementById('avatarUrlInput');
    const fileInput = document.getElementById('avatarFileInput');
    
    if (e.target.value === 'url') {
      urlInput.style.display = 'block';
      fileInput.style.display = 'none';
    } else {
      urlInput.style.display = 'none';
      fileInput.style.display = 'block';
    }
  });
});

// ============================
// Theme Toggle
// ============================
// User theme toggle button in settings - triggers centralized theme toggle
document.getElementById('userThemeToggle')?.addEventListener('click', () => {
  themeManager.toggle();
});

// ============================

// ============================
// Notification Preferences
// ============================

function loadNotificationPrefs() {
  document.getElementById('notifOrders').checked = true;
  document.getElementById('notifReviews').checked = true;
  document.getElementById('notifComments').checked = true;
}

async function saveNotificationPrefs() {
  const prefs = {
    orders: !!document.getElementById('notifOrders')?.checked,
    reviews: !!document.getElementById('notifReviews')?.checked,
    comments: !!document.getElementById('notifComments')?.checked
  };

  // Persist server-side when user is signed in
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('users').update({
      notification_preferences: prefs,
      notify_orders: prefs.orders,
      notify_reviews: prefs.reviews,
      notify_comments: prefs.comments,
      updated_at: new Date().toISOString()
    }).eq('id', user.id);
  } catch (e) {
    // Ignore server save errors (older schemas may not have columns)
    console.warn('Could not persist notification prefs to server', e?.message || e);
  }
}

document.getElementById('notifOrders')?.addEventListener('change', () => saveNotificationPrefs().catch(()=>{}));
document.getElementById('notifReviews')?.addEventListener('change', () => saveNotificationPrefs().catch(()=>{}));
document.getElementById('notifComments')?.addEventListener('change', () => saveNotificationPrefs().catch(()=>{}));

document.getElementById('requestNotifPermissionBtn')?.addEventListener('click', async () => {
  if (!('Notification' in window)) {
    await showInfoModal('Browser does not support notifications', 'Unsupported');
    return;
  }
  try {
    const p = await Notification.requestPermission();
    if (p === 'granted') {
      await showInfoModal(i18n.t ? i18n.t('notifications_enabled') : 'Notifications enabled', i18n.t ? i18n.t('notifications_title') : 'Success');
    } else {
      await showInfoModal(i18n.t ? i18n.t('notifications_blocked') : 'Notifications blocked or dismissed', i18n.t ? i18n.t('notifications_title') : 'Notice');
    }
  } catch (e) {
    console.warn('Notification permission request failed', e);
  }
});

document.getElementById('testNotifBtn')?.addEventListener('click', () => {
  try {
    // add an in-page test notification and browser notification if permitted
    const title = i18n.t ? i18n.t('test_notification') : 'Test notification';
    const body = i18n.t ? i18n.t('test_notification') : 'This is a test notification from Vendly.';
    // Add to in-page list
    try { window.dispatchEvent(new CustomEvent('vendly_test_notification', { detail: { title, body } })); } catch (e) {}
    if (Notification && Notification.permission === 'granted') {
      new Notification(title, { body });
    } else {
      showInfoModal(i18n.t ? i18n.t('notifications_blocked') : 'Notifications not granted. Use "Request Browser Permission" first.', i18n.t ? i18n.t('notifications_title') : 'Info');
    }
  } catch (e) {
    console.warn('Test notification failed', e);
  }
});

// Listen for programmatic test events to add to in-page list (navbar listens for realtime but test uses this)
window.addEventListener('vendly_test_notification', (e) => {
  try {
    const { title, body } = e.detail || {};
    const list = document.getElementById('notificationsList');
    if (list) {
      const li = document.createElement('li');
      li.className = 'notification-item';
      li.innerHTML = `<div class="notification-title">${title}</div><div class="notification-body">${body}</div><div class="notification-date">${new Date().toLocaleString()}</div>`;
      list.prepend(li);
      // update badge via DOM directly
      const badge = document.getElementById('notifBadge');
      if (badge) {
        const current = parseInt(badge.textContent || '0', 10) || 0;
        badge.style.display = 'inline-block';
        badge.textContent = String(current + 1);
      }
    }
  } catch (e) {}
});

// initialize preferences UI
loadNotificationPrefs();

// Logout from Settings
// ============================
document.getElementById('settingsLogoutBtn')?.addEventListener('click', async (e) => {
  if (e) e.preventDefault();
  try {
    const res = await logoutUser();
    if (res?.error) {
      console.warn('Settings logout returned error, continuing redirect:', res.error.message || res.error);
    }
  } catch (err) {
    console.warn('Settings logout threw, continuing redirect:', err?.message || err);
  }
  window.location.href = 'index.html';
});

// ============================
// Change Password Functionality
// ============================

// Show/hide password change section
document.getElementById('showChangePasswordBtn')?.addEventListener('click', () => {
  document.getElementById('changePasswordBtnContainer').style.display = 'none';
  document.getElementById('changePasswordSection').style.display = 'block';
});

document.getElementById('cancelPasswordBtn')?.addEventListener('click', () => {
  document.getElementById('changePasswordBtnContainer').style.display = 'block';
  document.getElementById('changePasswordSection').style.display = 'none';
  // Clear inputs
  document.getElementById('newPasswordInput').value = '';
  document.getElementById('confirmNewPasswordInput').value = '';
});

// Save new password
document.getElementById('savePasswordBtn')?.addEventListener('click', async () => {
  const currentUser = await checkAuth();
  if (!currentUser) return;
  
  const newPassword = document.getElementById('newPasswordInput').value;
  const confirmPassword = document.getElementById('confirmNewPasswordInput').value;
  
  // Validation
  if (!newPassword || !confirmPassword) {
    await showInfoModal('Please fill in both password fields.', 'Validation Error');
    return;
  }
  
  if (newPassword.length < 6) {
    await showInfoModal('Password must be at least 6 characters long.', 'Validation Error');
    return;
  }
  
  if (newPassword !== confirmPassword) {
    await showInfoModal('Passwords do not match. Please try again.', 'Validation Error');
    return;
  }
  
  try {
    // Update password using Supabase
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) {
      await showInfoModal('Error Changing Password\n\n' + (error.message || 'Unknown error') + '\n\nPlease try again.', 'Error');
    } else {
      await showInfoModal('Password Changed Successfully!\n\nYour password has been updated.\n\nFor security reasons, please log in again.', 'Success');
      
      // Clear inputs
      document.getElementById('newPasswordInput').value = '';
      document.getElementById('confirmNewPasswordInput').value = '';
      
      // Hide the form
      document.getElementById('changePasswordBtnContainer').style.display = 'block';
      document.getElementById('changePasswordSection').style.display = 'none';
      
      // Sign out and redirect to login
      await supabase.auth.signOut();
      window.location.href = 'login.html?reason=password_changed';
    }
  } catch (error) {
    await showInfoModal('Error Changing Password\n\n' + (error.message || 'Unknown error') + '\n\nPlease try again.', 'Error');
  }
});

// ============================
// Check for password reset tab parameter
// ============================
(function checkPasswordResetTab() {
  const urlParams = new URLSearchParams(window.location.search);
  const tab = urlParams.get('tab');
  
  if (tab === 'password') {
    // Show the password change section
    setTimeout(() => {
      document.getElementById('showChangePasswordBtn')?.click();
    }, 500);
    
    showInfoModal('Password Reset\n\nPlease enter your new password below.\n\nAfter saving, you will need to log in again.', 'Password Reset');
  }
})();

// ============================
// Initialize Page
// ============================
async function initializePage() {
  await loadUserProfile();
}

// Run initialization
initializePage();
