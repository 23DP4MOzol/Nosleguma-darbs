import { supabase, getCurrentUser, logoutUser, uploadAvatar } from '../supabase.js';
import { i18n } from '../i18n.js';

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

document.getElementById('themeToggle').addEventListener('click', () => {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  html.classList.remove('dark', 'light');
  html.classList.add(newTheme);
  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  document.getElementById('themeToggle').textContent = newTheme === 'dark' ? '☀️' : '🌙';
});

// ============================
// Hamburger Mobile Menu
// ============================
document.getElementById('hamburgerBtn').addEventListener('click', () => {
  document.querySelector('.navbar-links').classList.toggle('active');
});

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
      if (error.code === 'PGRST204') {
        const missingColumn = (error.message || '').match(/'([^']+)' column/)?.[1];
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

    alert('Profile saved successfully!');
    loadUserProfile();

  } catch (error) {
    console.error('Error saving profile:', error);
    alert('Error saving profile: ' + error.message);
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
  const avatarUrl = document.getElementById('avatarUrlInput')?.value?.trim();

  alert(`Profile Preview:\n\nUsername: ${username}\nBio: ${bio || 'Not set'}\nAvatar URL: ${avatarUrl || 'Not set'}`);
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
document.getElementById('userThemeToggle')?.addEventListener('click', () => {
  document.getElementById('themeToggle').click();
});

// ============================
// Logout from Settings
// ============================
document.getElementById('settingsLogoutBtn')?.addEventListener('click', async () => {
  await logoutUser();
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
    alert('Please fill in both password fields.');
    return;
  }
  
  if (newPassword.length < 6) {
    alert('Password must be at least 6 characters long.');
    return;
  }
  
  if (newPassword !== confirmPassword) {
    alert('Passwords do not match. Please try again.');
    return;
  }
  
  try {
    // Update password using Supabase
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) {
      alert('❌ Error Changing Password\n\n' + (error.message || 'Unknown error') + '\n\nPlease try again.');
    } else {
      alert('✅ Password Changed Successfully!\n\nYour password has been updated.\n\nFor security reasons, please log in again.');
      
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
    alert('❌ Error Changing Password\n\n' + (error.message || 'Unknown error') + '\n\nPlease try again.');
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
    
    alert('🔐 Password Reset\n\nPlease enter your new password below.\n\nAfter saving, you will need to log in again.');
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
