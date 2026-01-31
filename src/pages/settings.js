import { supabase, getCurrentUser, logoutUser } from '../supabase.js';
import { i18n } from '../i18n.js';

// ============================
// Authentication Check - Redirect guests to login
// ============================
async function checkAuth() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // User is not logged in, redirect to login page
    window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
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

    if (error) {
      console.error('Error loading user profile:', error);
      return;
    }

    // Update UI with user data
    document.getElementById('userName').textContent = userData.username || 'User';
    document.getElementById('userEmailDisplay').textContent = currentUser.email;
    document.getElementById('userEmail').value = currentUser.email;
    document.getElementById('userAvatarText').textContent = (userData.username || 'U').charAt(0).toUpperCase();
    document.getElementById('userBalanceDisplay').textContent = `€${parseFloat(userData.balance || 0).toFixed(2)}`;
    
    // Load additional profile fields
    const usernameInput = document.getElementById('usernameInput');
    if (usernameInput && userData.username) {
      usernameInput.value = userData.username;
    }
    
    const bioInput = document.getElementById('bioInput');
    if (bioInput && userData.bio) {
      bioInput.value = userData.bio;
    }
    
    const whatISellInput = document.getElementById('whatISellInput');
    if (whatISellInput && userData.what_i_sell) {
      whatISellInput.value = userData.what_i_sell;
    }

    // Update navbar balance
    const balanceBadge = document.getElementById('balanceBadge');
    if (balanceBadge) {
      balanceBadge.style.display = 'flex';
      balanceBadge.querySelector('span').textContent = `€${parseFloat(userData.balance || 0).toFixed(2)}`;
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
  const avatarUrl = document.getElementById('avatarUrlInput')?.value?.trim();

  try {
    const updates = {
      id: currentUser.id,
      username: username,
      bio: bio,
      what_i_sell: whatISell,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('users')
      .upsert(updates, { onConflict: 'id' });

    if (error) throw error;

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
// Initialize Page
// ============================
async function initializePage() {
  await loadUserProfile();
}

// Run initialization
initializePage();
