// =======================================
// MAIN.JS - Consolidated JavaScript for all pages
// =======================================

import { supabase, logoutUser } from './supabase.js';

// Expose to window for debugging convenience (best-effort)
try {
  if (typeof window !== 'undefined') {
    window.supabase = supabase;
    window.logoutUser = async () => {
      try {
        return await logoutUser();
      } catch (e) {
        console.error('window.logoutUser error', e);
        return { error: e };
      }
    };
  }
} catch (e) {
  // ignore
}
import { i18n } from './i18n.js';
import { themeManager } from './theme.js';
import './navbar.js';
import './app.js';
import './product-modal.js';
import './checkout-modal.js';
import './sw-register.js';
import { showConfirmModal, showInfoModal } from './ui/modal.js';
// AI widget disabled - requires Netlify functions setup
// import './ai-widget.js';

// ============================
// UTILITY FUNCTIONS
// ============================

export function showToast(message, type = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    Object.assign(container.style, {
      position: 'fixed',
      right: '20px',
      bottom: '20px',
      zIndex: '9999',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      maxWidth: '320px'
    });
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.textContent = message;
  Object.assign(toast.style, {
    background: type === 'error' ? '#fee2e2' : '#ecfdf5',
    color: type === 'error' ? '#991b1b' : '#065f46',
    padding: '12px 16px',
    borderRadius: '12px',
    boxShadow: '0 6px 18px rgba(0,0,0,0.1)',
    fontWeight: '600',
    fontSize: '14px',
    transition: 'transform 0.25s ease, opacity 0.25s ease',
    transform: 'translateY(8px)',
    opacity: '0'
  });

  container.appendChild(toast);

  // animate in
  requestAnimationFrame(() => {
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
  });

  // remove after 3s
  setTimeout(() => {
    toast.style.transform = 'translateY(8px)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 250);
  }, 3000);
}

/**
 * Safely escape HTML to prevent XSS.
 * Accepts null/undefined gracefully by converting to empty string.
 */
export function escapeHtml(input = '') {
  const str = String(input);
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return str.replace(/[&<>"']/g, (m) => map[m]);
}

// ============================
// THEME MANAGEMENT
// ============================
// Theme is now handled by centralized theme.js module
// Imported at the top of this file

// ============================
// LANGUAGE MANAGEMENT
// ============================

function initializeLanguage() {
  const savedLang = localStorage.getItem('lang') || 'en';
  if (i18n && typeof i18n.setLang === 'function') {
    i18n.setLang(savedLang);
  }

  // Initialize language selectors (might be selects or simple inputs)
  const selectors = document.querySelectorAll('#langSelect, #userLang');
  if (selectors && selectors.length) {
    selectors.forEach(select => {
      if (!select) return;
      try {
        select.value = savedLang;
      } catch (e) {
        // some elements may not have value property (graceful fallback)
      }
      select.addEventListener('change', (e) => {
        const lang = e.target.value;
        localStorage.setItem('lang', lang);
        if (i18n && typeof i18n.setLang === 'function') {
          i18n.setLang(lang);
        }
        // Sync all language selectors
        document.querySelectorAll('#langSelect, #userLang').forEach(s => {
          if (s) s.value = lang;
        });
      });
    });
  }
}

// ============================
// AUTHENTICATION MANAGEMENT
// ============================

export async function updateNavbarAuth(sessionParam) {
  console.log('🔐 updateNavbarAuth() called');
  
  // First check if navbar elements exist
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const balanceBadge = document.getElementById('balanceBadge');
  const sellBtn = document.getElementById('sellBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const adminBtn = document.getElementById('adminBtn');
  const footerAdmin = document.getElementById('footerAdmin');
  
  console.log('🎛️ Navbar elements check:', {
    loginBtnExists: !!loginBtn,
    logoutBtnExists: !!logoutBtn,
    balanceBadgeExists: !!balanceBadge,
    sellBtnExists: !!sellBtn,
    settingsBtnExists: !!settingsBtn,
    adminBtnExists: !!adminBtn
  });

  // No navbar elements at all on this page
  if (!loginBtn && !logoutBtn) {
    console.log('⚠️ No navbar elements found, skipping navbar update');
    return;
  }

  console.log('👤 loginBtn display before:', loginBtn?.style.display);
  console.log('👤 logoutBtn display before:', logoutBtn?.style.display);

  // Get current session first (allow session passed from onAuthStateChange to avoid races)
  console.log('🔄 Fetching session...');

  let user = null;
  if (sessionParam && sessionParam.user) {
    user = sessionParam.user;
    console.log('🔑 Using session passed from onAuthStateChange:', user?.email);
  }
  let userRole = 'user';
  let userData = null;
  
  try {
    if (!user) {
      const sessionResult = await supabase.auth.getSession();
      console.log('🔄 Session result:', sessionResult);
      const { data: { session }, error: sessionError } = sessionResult;

      if (sessionError) {
        console.error('Session error:', sessionError);
      }

      user = session?.user || null;
      console.log('👤 User from session:', user ? user.email : 'null');
    }
    
    // FORCE immediate navbar update regardless of user state
    console.log('🎯 About to check user state, user =', user ? 'truthy' : 'null/falsy');
    
  } catch (sessionErr) {
    console.error('❌ Session fetch error:', sessionErr);
    user = null;
    console.log('👤 No user (session fetch failed)');
  }

  console.log('🎯 Checking if user exists:', user !== null, 'user:', user?.email);
  
  if (user) {
    console.log('✅ User logged in, updating navbar...');
    const emailLooksAdmin = !!user?.email && /admin/i.test(user.email);
    const metadataRole = user?.user_metadata?.role;
    
    // CRITICAL: Immediately update navbar visibility
    if (loginBtn) {
      loginBtn.style.display = 'none';
      console.log('🔒 loginBtn hidden, display:', loginBtn.style.display);
    }
    
    if (logoutBtn) {
      logoutBtn.style.display = 'inline-block';
      console.log('🔓 logoutBtn shown, display:', logoutBtn.style.display);
    }
    
    console.log('👤 loginBtn display after:', loginBtn?.style.display);
    console.log('👤 logoutBtn display after:', logoutBtn?.style.display);

    // Get user role - try a simple query first
    userRole = 'user';
    userData = null;
    
    try {
      // First, try to read users row by id
      console.log('💰 [BALANCE DEBUG] Starting balance lookup for user id:', user.id);
      let usersRow = null;
      
      // Check if we have a cached balance from a successful query on this session
      const cachedBalance = sessionStorage.getItem('vendly_balance_cache');
      if (cachedBalance) {
        console.log('💰 [BALANCE DEBUG] Using cached balance from sessionStorage:', cachedBalance);
        try {
          const cached = JSON.parse(cachedBalance);
          // Only accept cached balances that belong to the current authenticated user
          if (cached && typeof cached.balance !== 'undefined' && cached.userId && cached.userId === user.id) {
            usersRow = { balance: cached.balance, role: cached.role || 'user' };
            console.log('💰 [BALANCE DEBUG] Loaded from cache (owner match):', usersRow);
          } else {
            console.log('💰 [BALANCE DEBUG] Cached balance exists but does not belong to this user; ignoring.');
          }
        } catch (e) {
          console.warn('💰 [BALANCE DEBUG] Could not parse cached balance');
        }
      }
      
      // If no cache, fire query in background (don't block UI)
      if (!usersRow) {
        console.log('💰 [BALANCE DEBUG] No cache, firing background query...');
        // Fire async query without awaiting - update UI when it completes
        (async () => {
          try {
            // Small delay to let Supabase settle
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Try id first with short timeout
            let result = await Promise.race([
              supabase.from('users').select('balance, role').eq('id', user.id).maybeSingle(),
              new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
            ]);
            
            if (result?.data) {
              usersRow = result.data;
              console.log('💰 [BALANCE DEBUG] Background query succeeded:', usersRow);
              
              // Cache it
              sessionStorage.setItem('vendly_balance_cache', JSON.stringify({
                userId: usersRow.id || user.id,
                balance: usersRow.balance,
                role: usersRow.role
              }));
              
              // Update navbar if balance changed
              if (balanceBadge) {
                const bal = parseFloat(usersRow.balance) || 0;
                const span = balanceBadge.querySelector('span');
                if (span) {
                  span.textContent = `€${bal.toFixed(2)}`;
                  console.log('💰 [BALANCE DEBUG] Updated balance display:', span.textContent);
                }
              }
              return;
            }
            
            // Try email as fallback
            if (user?.email) {
              result = await Promise.race([
                supabase.from('users').select('balance, role').eq('email', user.email).maybeSingle(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
              ]);
              
              if (result?.data) {
                usersRow = result.data;
                console.log('💰 [BALANCE DEBUG] Background email query succeeded:', usersRow);
                sessionStorage.setItem('vendly_balance_cache', JSON.stringify({
                  userId: usersRow.id || user.id,
                  balance: usersRow.balance,
                  role: usersRow.role
                }));
                
                if (balanceBadge) {
                  const bal = parseFloat(usersRow.balance) || 0;
                  const span = balanceBadge.querySelector('span');
                  if (span) {
                    span.textContent = `€${bal.toFixed(2)}`;
                    console.log('💰 [BALANCE DEBUG] Updated balance display:', span.textContent);
                  }
                }
              }
            }
          } catch (err) {
            console.warn('💰 [BALANCE DEBUG] Background query failed:', err?.message);
          }
        })();
      }

      if (usersRow) {
        userData = usersRow;
        userRole = usersRow.role || 'user';
        if (metadataRole === 'admin' || emailLooksAdmin) {
          userRole = 'admin';
        }
        console.log('💰 [BALANCE DEBUG] userData set from usersRow:', userData);
      } else {
        // No users row found; infer admin by email if necessary
        userRole = (metadataRole === 'admin' || emailLooksAdmin) ? 'admin' : 'user';
        console.log('💰 [BALANCE DEBUG] No usersRow found, userData is null');
      }

      console.log('User role:', userRole);

      // Determine balance from multiple sources: users table -> auth metadata -> localStorage
      console.log('💰 [BALANCE DEBUG] Determining balance from sources...');
      console.log('💰 [BALANCE DEBUG]   userData:', userData);
      console.log('💰 [BALANCE DEBUG]   user.user_metadata:', user?.user_metadata);
      console.log('💰 [BALANCE DEBUG]   localStorage vendly_balance:', localStorage.getItem('vendly_balance'));
      
      let bal = 0;
      if (userData && typeof userData.balance !== 'undefined' && userData.balance !== null) {
        console.log('💰 [BALANCE DEBUG] ✅ Using balance from userData:', userData.balance);
        bal = parseFloat(userData.balance) || 0;
      } else if (user?.user_metadata && (user.user_metadata.balance || user.user_metadata.wallet?.balance)) {
        const metaBal = user.user_metadata.balance || user.user_metadata.wallet.balance;
        console.log('💰 [BALANCE DEBUG] ✅ Using balance from user_metadata:', metaBal);
        bal = parseFloat(metaBal) || 0;
      } else if (localStorage.getItem('vendly_balance')) {
        const storageBal = localStorage.getItem('vendly_balance');
        console.log('💰 [BALANCE DEBUG] ✅ Using balance from localStorage:', storageBal);
        bal = parseFloat(storageBal) || 0;
      } else {
        console.log('💰 [BALANCE DEBUG] ⚠️ No balance found in any source, defaulting to 0');
      }

      console.log('💰 [BALANCE DEBUG] Final balance value:', bal, 'formatted:', `€${bal.toFixed(2)}`);

      if (balanceBadge) {
        console.log('💰 [BALANCE DEBUG] balanceBadge element found, updating display');
        balanceBadge.style.display = 'flex';
        const span = balanceBadge.querySelector('span');
        if (span) {
          span.textContent = `€${bal.toFixed(2)}`;
          console.log('💰 [BALANCE DEBUG] ✅ Balance badge updated with:', span.textContent);
        } else {
          console.log('💰 [BALANCE DEBUG] ⚠️ No span found inside balanceBadge');
        }
      } else {
        console.log('💰 [BALANCE DEBUG] ⚠️ balanceBadge element not found');
      }
    } catch (err) {
      console.warn('Error fetching user data for navbar, using defaults:', err?.message || err);
      if (metadataRole === 'admin' || emailLooksAdmin) {
        userRole = 'admin';
      }
      if (balanceBadge) {
        balanceBadge.style.display = 'flex';
        const span = balanceBadge.querySelector('span');
        if (span) span.textContent = '€0.00';
      }
    }
    
    // ============================
    // THEME ACCOUNT SYNC
    // ============================
    // Load the user's saved theme preference from their Supabase account.
    // This runs once per navbar update (login / page load) so the user
    // sees the same mode they chose on any device.
    try {
      await themeManager.loadFromAccount(supabase, user.id);
    } catch (themeSyncErr) {
      console.warn('Theme account sync skipped:', themeSyncErr?.message);
    }

    // Register a one-time onChange callback so every future toggle
    // automatically saves the preference to the user's account.
    if (!themeManager._accountSyncRegistered) {
      themeManager._accountSyncRegistered = true;
      themeManager.onChange((newTheme) => {
        // Fire-and-forget — don't block UI
        themeManager.saveToAccount(supabase, user.id, newTheme);
      });
    }

    console.log('Admin button element:', adminBtn);
    console.log('Setting admin button display for role:', userRole);

    if (sellBtn) {
      sellBtn.style.opacity = '1';
      sellBtn.style.pointerEvents = 'auto';
    }
    if (settingsBtn) {
      settingsBtn.style.display = 'inline-block';
      settingsBtn.style.opacity = '1';
      settingsBtn.style.pointerEvents = 'auto';
    }
    if (adminBtn) {
      if (userRole === 'admin') {
        adminBtn.style.display = 'block';
        console.log('✅ Admin button shown');
      } else {
        adminBtn.style.display = 'none';
      }
    }
    // Footer admin link visibility
    if (footerAdmin) {
      footerAdmin.style.display = (userRole === 'admin') ? 'inline' : 'none';
    }
  } else {
    console.log('ℹ️ No user logged in, resetting navbar...');
    
    if (loginBtn) {
      loginBtn.style.display = 'inline-block';
      console.log('   Setting loginBtn display to inline-block');
    }
    
    if (logoutBtn) {
      logoutBtn.style.display = 'none';
      console.log('   Setting logoutBtn display to none');
    }
    
    console.log('👤 loginBtn display after:', loginBtn?.style.display);
    console.log('👤 logoutBtn display after:', logoutBtn?.style.display);

    if (balanceBadge) balanceBadge.style.display = 'none';

    if (sellBtn) {
      sellBtn.style.opacity = '0.6';
      sellBtn.style.pointerEvents = 'none';
    }
    if (settingsBtn) {
      settingsBtn.style.display = 'none';
    }
    if (adminBtn) {
      adminBtn.style.display = 'none';
    }
    if (footerAdmin) footerAdmin.style.display = 'none';
  }
  
  console.log('✅ updateNavbarAuth() completed successfully');
}

function initializeAuth() {
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const sellBtn = document.getElementById('sellBtn');
  const settingsBtn = document.getElementById('settingsBtn');

  if (loginBtn) {
    console.log('Login button found, attaching listener');
    loginBtn.addEventListener('click', () => {
      console.log('Login button clicked');
      window.location.href = './login.html';
    });
  } else {
    console.log('Login button not found');
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        // Prefer centralized helper which also clears fallback storage
        let res;
        if (typeof logoutUser === 'function') {
          res = await logoutUser();
        } else {
          res = await supabase.auth.signOut();
        }

        if (res && res.error) throw res.error;

        // Ensure app-specific keys cleared
        try {
          localStorage.removeItem('vendly_balance');
          localStorage.removeItem('vendly_fallback_session');
          localStorage.removeItem('supabase.auth');
        } catch (e) {}

        await updateNavbarAuth();
        window.location.href = './index.html';
      } catch (error) {
        console.error('Error signing out:', error);
        showToast('Error signing out', 'error');
      }
    });
  }

  // Delegated logout handler (works if button is added later or listener missed)
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest && e.target.closest('#logoutBtn');
    if (!btn) return;
    console.log('Logout button (delegated) clicked');
    try {
      let res;
      if (typeof logoutUser === 'function') {
        res = await logoutUser();
      } else {
        res = await supabase.auth.signOut();
      }

      console.log('Logout result:', res);
      if (res && res.error) throw res.error;

      try {
        localStorage.removeItem('vendly_balance');
        localStorage.removeItem('vendly_fallback_session');
        localStorage.removeItem('supabase.auth');
      } catch (e) {}

      await updateNavbarAuth();
      window.location.href = './index.html';
    } catch (error) {
      console.error('Error signing out (delegated):', error);
      showToast('Error signing out', 'error');
    }
  });

  if (sellBtn) {
    sellBtn.addEventListener('click', async () => {
      const { data } = await supabase.auth.getUser();
      const user = data ? data.user : null;
      if (user) {
        window.location.href = './sell.html';
      } else {
        showToast(i18n.t ? i18n.t('loginFirst') : 'Please log in first', 'error');
        setTimeout(() => (window.location.href = 'login.html'), 1500);
      }
    });
  }

  if (settingsBtn) {
    settingsBtn.addEventListener('click', async () => {
      const { data } = await supabase.auth.getUser();
      const user = data ? data.user : null;
      if (user) {
        window.location.href = './settings.html';
      } else {
        showToast(i18n.t ? i18n.t('loginFirst') : 'Please log in first', 'error');
        setTimeout(() => (window.location.href = 'login.html'), 1500);
      }
    });
  }

  // Listen for auth state changes
  if (supabase && supabase.auth && typeof supabase.auth.onAuthStateChange === 'function') {
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);

      // Update navbar for all auth events. Pass session from the event to avoid storage race conditions.
      await updateNavbarAuth(session);
      
      // Only handle redirects for email confirmation callbacks, not for normal logins
      // Normal logins are handled by the login.js redirect
      if (event === 'SIGNED_IN' && session?.user) {
        // Check if this was from email confirmation
        const hash = window.location.hash;
        if (hash.includes('access_token') && (hash.includes('type=signup') || hash.includes('type=email_change'))) {
          // Clear the hash after processing
          window.history.replaceState(null, '', window.location.pathname);
          
          // Show success message
          if (session.user.email_confirmed_at) {
            showInfoModal('Email Verified Successfully!\n\nYour email address has been confirmed. You are now logged in.', 'Email Verified');
            // Redirect to home or stay on current page
            const currentPath = window.location.pathname;
            if (currentPath.includes('login.html') || currentPath.includes('register.html')) {
              window.location.href = 'index.html';
            }
          }
        }
      }
    });
  }

  // Check for hash-based session recovery (email confirmation)
  const hash = window.location.hash;
  if (hash.includes('access_token')) {
    console.log('🔑 Hash detected, recovering session...');
    setTimeout(async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (session) {
          console.log('✅ Session recovered successfully:', session.user.email);
          await updateNavbarAuth();
          window.history.replaceState(null, '', window.location.pathname);
          showInfoModal('Email Verified Successfully!', 'Email Verified');
          
          // Redirect if on login/register page
          const currentPath = window.location.pathname;
          if (currentPath.includes('login.html') || currentPath.includes('register.html')) {
            window.location.href = 'index.html';
          }
        } else if (error) {
          console.warn('Error recovering session:', error.message);
        }
      } catch (err) {
        console.warn('Session recovery failed:', err.message);
        await updateNavbarAuth();
      }
    }, 500);
  }

  // Also try to get session on every page load
  (async () => {
    console.log('🔍 Checking for existing session...');
    
    try {
      // Wait for Supabase auth to initialize - longer delay for cookie persistence
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // First try getSession which reads from storage/cookies
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.warn('Session error:', sessionError.message);
      }
      
      if (session) {
        console.log('✅ Existing session found:', session.user.email);
        console.log('📋 Session access token present:', !!session.access_token);
        console.log('📋 Session expires at:', session.expires_at ? new Date(session.expires_at * 1000) : 'none');
      } else {
        console.log('ℹ️ No session from getSession(), trying getUser()...');
        
        // Check for fallback session in localStorage
        const fallbackSessionStr = localStorage.getItem('vendly_fallback_session');
        if (fallbackSessionStr) {
          try {
            const fallbackSession = JSON.parse(fallbackSessionStr);
            console.log('📦 Found fallback session for:', fallbackSession.user?.email);
            
            // Clear fallback after reading
            localStorage.removeItem('vendly_fallback_session');
            
            // Set the session in Supabase
            if (fallbackSession.access_token) {
              // Create a session-like object for the navbar
              sessionStorage.setItem('supabase.auth', JSON.stringify({
                session_token: fallbackSession.access_token,
                user: fallbackSession.user
              }));
              
              console.log('📦 Fallback session restored from localStorage');
              
              // Update navbar with fallback user info
              await updateNavbarAuth();
              
              // Log final auth state
              console.log('👤 Current user (from fallback):', fallbackSession.user?.email || 'none');
              return; // Skip normal session check
            }
          } catch (parseError) {
            console.warn('Could not parse fallback session:', parseError.message);
            localStorage.removeItem('vendly_fallback_session');
          }
        }
        
        // Fallback: try getUser() which can recover session from expired tokens
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.warn('Get user error:', userError.message);
        }
        
        if (userData?.user) {
          console.log('✅ User recovered from getUser():', userData.user.email);
        } else {
          console.log('ℹ️ No user found - user is not logged in');
          
          // Check if there are any auth cookies/storage
          console.log('📋 Checking localStorage for supabase auth...');
          const supabaseAuth = localStorage.getItem('supabase.auth');
          if (supabaseAuth) {
            console.log('📋 Found supabase.auth in localStorage (may be expired or corrupted)');
          } else {
            console.log('📋 No supabase.auth found in localStorage');
          }
        }
      }
      
      // Update navbar with session info
      await updateNavbarAuth();
      
      // Log final auth state for debugging
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 Current user:', user ? user.email : 'none');
    } catch (err) {
      console.warn('Error checking session:', err.message);
      // Still try to update navbar
      try {
        await updateNavbarAuth();
      } catch (e) {
        console.error('Failed to update navbar:', e);
      }
    }
  })();
}

// ============================
// NAVIGATION MANAGEMENT
// ============================

function initializeNavigation() {
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const navbarLinks = document.querySelector('.navbar-links');

  if (hamburgerBtn && navbarLinks) {
    // Make hamburger accessible and lock body scroll when open
    hamburgerBtn.setAttribute('aria-controls', 'navbarLinks');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    navbarLinks.id = navbarLinks.id || 'navbarLinks';

    hamburgerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isActive = navbarLinks.classList.toggle('active');
      hamburgerBtn.setAttribute('aria-expanded', isActive ? 'true' : 'false');
      // Lock body scroll when menu open on small screens
      if (isActive && window.innerWidth <= 768) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    });
  }

  // Close navbar when clicking outside
  document.addEventListener('click', (e) => {
    if (navbarLinks && hamburgerBtn) {
      if (!navbarLinks.contains(e.target) && !hamburgerBtn.contains(e.target)) {
        navbarLinks.classList.remove('active');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    }
  });

  // Close navbar when resizing to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && navbarLinks) {
      navbarLinks.classList.remove('active');
      if (hamburgerBtn) hamburgerBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });
}

// ============================
// PAGE-SPECIFIC FUNCTIONS
// ============================

// Global function for showing user profiles
async function showUserProfile(userId) {
  try {
    // Get current user
    const { data: currentUserData } = await supabase.auth.getUser();
    const currentUser = currentUserData?.user;

    // Get user profile
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (!user) return;

    // Get user's products
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get seller reviews
    let reviews = [];
    try {
      const { data: reviewData } = await supabase
        .from('reviews')
        .select('rating, comment, created_at, buyer_id, users!buyer_id(username)')
        .eq('seller_id', userId)
        .order('created_at', { ascending: false });
      reviews = reviewData || [];
    } catch (e) {
      console.warn('Could not load reviews:', e);
    }

    let averageRating = 0;
    if (reviews.length > 0) {
      averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    }

    // Check if current user can review
    let canReview = false;
    let hasReviewed = false;
    if (currentUser && currentUser.id !== userId) {
      try {
        const { data: existingReview } = await supabase
          .from('reviews')
          .select('id')
          .eq('buyer_id', currentUser.id)
          .eq('seller_id', userId)
          .maybeSingle();
        hasReviewed = !!existingReview;
        canReview = !hasReviewed;
      } catch (e) {
        console.warn('Could not check existing review:', e);
        // If reviews table doesn't exist yet, allow review attempt (insert will fail with clear error)
        canReview = true;
      }
    }

    // Build profile HTML
    const profileHtml = `
      <div class="profile-header">
        <div class="profile-avatar">
          ${user.username?.charAt(0).toUpperCase() || 'U'}
        </div>
        <h2 class="profile-name">${user.username || 'Unknown User'}</h2>
        ${user.bio ? `<p class="profile-bio">${escapeHtml(user.bio)}</p>` : ''}
        <div class="profile-stats">
          <div class="profile-stat">
            <div class="profile-stat-value">${products?.length || 0}</div>
            <div class="profile-stat-label">Products</div>
          </div>
          <div class="profile-stat">
            <div class="profile-stat-value">${averageRating.toFixed(1)} ⭐</div>
            <div class="profile-stat-label">Rating (${reviews?.length || 0} reviews)</div>
          </div>
        </div>
      </div>

      <div class="profile-section">
        <h3>Recent Products</h3>
        <div class="profile-products">
          ${products?.map(product => `
            <div class="profile-product-card">
              <img src="${product.image_url || 'https://placehold.co/200x150/667eea/white?text=No+Image'}" alt="${product.name}" class="profile-product-image">
              <div class="profile-product-info">
                <h4 class="profile-product-name">${escapeHtml(product.name)}</h4>
                <div class="profile-product-price">€${parseFloat(product.price).toFixed(2)}</div>
                <button class="btn-buy-now" style="width:100%; padding:0.5rem; margin-top:0.5rem;" data-product-id="${product.id}">View Product</button>
              </div>
            </div>
          `).join('') || '<p style="grid-column:1/-1; text-align:center; color:var(--muted);">No products yet.</p>'}
        </div>
      </div>

      <div class="profile-section">
        <h3>Reviews & Comments</h3>
        <div class="profile-reviews">
          ${reviews?.map(review => `
            <div class="profile-review">
              <div class="profile-review-header">
                <span class="profile-review-buyer">${escapeHtml(review.users?.username || 'Anonymous')}</span>
                <span class="profile-review-rating">⭐ ${review.rating}/5</span>
                <span class="profile-review-date">${new Date(review.created_at).toLocaleDateString()}</span>
              </div>
              <p class="profile-review-comment">${escapeHtml(review.comment || 'No comment')}</p>
            </div>
          `).join('') || '<p style="text-align:center; color:var(--muted);">No reviews yet.</p>'}
        </div>
      </div>

      ${canReview ? `
        <div class="profile-section">
          <h3>Leave a Review</h3>
          <form id="reviewForm" class="profile-review-form">
            <label>Rating *</label>
            <select id="reviewRating" required>
              <option value="">Select rating</option>
              <option value="5">⭐⭐⭐⭐⭐ 5 stars</option>
              <option value="4">⭐⭐⭐⭐ 4 stars</option>
              <option value="3">⭐⭐⭐ 3 stars</option>
              <option value="2">⭐⭐ 2 stars</option>
              <option value="1">⭐ 1 star</option>
            </select>
            <label>Comment</label>
            <textarea id="reviewComment" rows="3" placeholder="Share your experience with this seller..."></textarea>
            <button type="submit" id="reviewSubmitBtn">Submit Review</button>
          </form>
        </div>
      ` : hasReviewed ? '<p style="text-align:center; color:var(--muted); margin-top:1rem;">✅ You have already reviewed this seller.</p>' : ''}
    `;

    document.getElementById('profileModalContent').innerHTML = profileHtml;
    document.getElementById('userProfileModal').style.display = 'flex';

    // Add event listeners for product buttons in modal
    document.querySelectorAll('#profileModalContent .btn-buy-now').forEach(btn => {
      btn.addEventListener('click', () => {
        const productId = btn.dataset.productId;
        document.getElementById('userProfileModal').style.display = 'none';
        document.body.style.overflow = 'auto';
        showProductModal(productId);
      });
    });

    // Add review form handler
    if (canReview) {
      const reviewForm = document.getElementById('reviewForm');
      if (reviewForm) {
        reviewForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const rating = parseInt(document.getElementById('reviewRating').value);
          const comment = document.getElementById('reviewComment').value.trim();
          if (!rating || rating < 1 || rating > 5) {
            showToast('Please select a valid rating', 'error');
            return;
          }
          const submitBtn = document.getElementById('reviewSubmitBtn');
          if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Submitting...'; }
          try {
            const { error } = await supabase
              .from('reviews')
              .insert({
                buyer_id: currentUser.id,
                seller_id: userId,
                rating,
                comment: comment || null
              });
            if (error) {
              // Handle unique constraint violation (already reviewed)
              if (error.code === '23505' || error.message?.includes('unique') || error.message?.includes('duplicate')) {
                showToast('You have already reviewed this seller', 'error');
              } else {
                throw error;
              }
            } else {
              showToast('Review submitted successfully!', 'success');
            }
            // Refresh profile
            document.getElementById('userProfileModal').style.display = 'none';
            document.body.style.overflow = 'auto';
            showUserProfile(userId);
          } catch (error) {
            console.error('Error submitting review:', error);
            showToast('Failed to submit review: ' + (error.message || 'Unknown error'), 'error');
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Submit Review'; }
          }
        });
      }
    }

  } catch (error) {
    console.error('Error loading user profile:', error);
  }
}

// Index page functions
async function initializeIndexPage() {
  if (!document.querySelector('.product-grid-modern')) return;


  // Stats updater
  async function updateStats() {
    try {
      // Products count (use id only for lighter response)
      const productsResp = await supabase.from('products').select('id', { count: 'exact', head: true });
      
      // Users count - count rows in users table (use id only)
      const usersResp = await supabase.from('users').select('id', { count: 'exact', head: true });
      
      // Sellers count - count unique seller_id from products table
      // Using RPC to count distinct values
      const { data: sellerData, error: sellerError } = await supabase
        .rpc('count_unique_sellers');
      
      // Fallback: if RPC doesn't exist, count manually
      let sellersCount = 0;
      if (sellerError || !sellerData) {
        // Manual count of unique sellers
        const { data: products } = await supabase.from('products').select('seller_id');
        if (products) {
          const uniqueSellers = new Set(products.map(p => p.seller_id));
          sellersCount = uniqueSellers.size;
        }
      } else {
        sellersCount = sellerData || 0;
      }

      const productsCount = productsResp.count || 0;
      const usersCount = usersResp.count || 0;

      // Debug: log full responses for troubleshooting RLS / permission issues
      console.log('Stats full responses:', {
        productsResp,
        usersResp,
        sellerData,
        sellerError
      });

      const statsProductsEl = document.getElementById('statsProducts');
      const statsUsersEl = document.getElementById('statsUsers');
      const statsSellersEl = document.getElementById('statsSellers');

      if (statsProductsEl) statsProductsEl.textContent = productsCount.toString();
      if (statsUsersEl) statsUsersEl.textContent = usersCount.toString();
      if (statsSellersEl) statsSellersEl.textContent = sellersCount.toString();
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  }

  // Product rendering and filtering
  let allProducts = [];
  let currentCategory = 'all';
  let userFavoritesSet = new Set(); // Track user's liked products
  let currentFilters = {
    search: '',
    minPrice: '',
    maxPrice: '',
    location: '',
    condition: '',
    stock: '',
    availability: '',
    brand: '',
    color: '',
    date: '',
    sortBy: 'newest'
  };

  // Load user's favorites for heart icon state
  async function loadUserFavorites() {
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) return;
      const { data: favs } = await supabase
        .from('favorites')
        .select('product_id')
        .eq('user_id', authData.user.id);
      userFavoritesSet = new Set((favs || []).map(f => f.product_id));
    } catch (e) {
      userFavoritesSet = new Set();
    }
  }

  // Toggle favorite for a product
  async function toggleFavoriteIndex(productId) {
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        showToast('Please log in to like products', 'error');
        return;
      }
      const userId = authData.user.id;
      const isFav = userFavoritesSet.has(productId);
      if (isFav) {
        await supabase.from('favorites').delete().eq('user_id', userId).eq('product_id', productId);
        userFavoritesSet.delete(productId);
      } else {
        await supabase.from('favorites').insert({ user_id: userId, product_id: productId, created_at: new Date().toISOString() });
        userFavoritesSet.add(productId);
      }
      // Update button UI
      const btn = document.querySelector(`.product-like-btn[data-id="${productId}"]`);
      if (btn) {
        btn.classList.toggle('liked', !isFav);
        btn.textContent = !isFav ? '\u2764\ufe0f' : '\ud83e\udd0d';
      }
      // Update likes count in product data
      const prod = allProducts.find(p => String(p.id) === String(productId));
      if (prod) {
        prod.likes_count = (prod.likes_count || 0) + (isFav ? -1 : 1);
      }
    } catch (e) {
      console.error('Error toggling favorite:', e);
      showToast('Failed to update favorite', 'error');
    }
  }

  // Record a product view (per user, counted once)
  async function recordProductView(productId) {
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) return;
      await supabase.from('product_views').upsert(
        { user_id: authData.user.id, product_id: productId, created_at: new Date().toISOString() },
        { onConflict: 'user_id,product_id' }
      );
      // Update local count
      const prod = allProducts.find(p => String(p.id) === String(productId));
      if (prod) prod.views_count = (prod.views_count || 0) + 1;
    } catch (e) {
      // Silently fail - view tracking is optional
    }
  }

  async function loadProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, users!seller_id(username)')
        .order('created_at', { ascending: false });

      if (error) {
        // 401 errors are expected for unauthenticated users - don't show error toast
        if (error.status === 401 || error.message.includes('401')) {
          console.log('Products require authentication to view');
          allProducts = [];
          applyFiltersAndRender();
          return;
        }
        throw error;
      }
      allProducts = Array.isArray(data) ? data : [];
      await loadUserFavorites();
      applyFiltersAndRender();
      updateStats();

      // Check if URL has ?product= param to auto-open a product modal
      const urlParams = new URLSearchParams(window.location.search);
      const productParam = urlParams.get('product');
      if (productParam) {
        const targetProduct = allProducts.find(p => String(p.id) === String(productParam));
        if (targetProduct) {
          recordProductView(targetProduct.id);
          showProductModal(targetProduct);
        }
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      // Only show toast for non-401 errors
      if (error.status !== 401) {
        showToast(i18n.t ? i18n.t('error_loading_products') || 'Error loading products' : 'Error loading products', 'error');
      }
    }
  }

  function applyFiltersAndRender() {
    let filteredProducts = [...allProducts];

    // Category filter
    if (currentCategory !== 'all') {
      filteredProducts = filteredProducts.filter(p => (p.category || '').toLowerCase() === currentCategory.toLowerCase());
    }

    // Search filter
    if (currentFilters.search) {
      const searchTerm = currentFilters.search.toLowerCase();
      filteredProducts = filteredProducts.filter(p =>
        (p.name || '').toLowerCase().includes(searchTerm) ||
        (p.description || '').toLowerCase().includes(searchTerm) ||
        (p.category || '').toLowerCase().includes(searchTerm)
      );
    }

    // Price filters
    if (currentFilters.minPrice) {
      const minPrice = parseFloat(currentFilters.minPrice);
      filteredProducts = filteredProducts.filter(p => parseFloat(p.price || 0) >= minPrice);
    }
    if (currentFilters.maxPrice) {
      const maxPrice = parseFloat(currentFilters.maxPrice);
      filteredProducts = filteredProducts.filter(p => parseFloat(p.price || 0) <= maxPrice);
    }

    // Location filter
    if (currentFilters.location) {
      filteredProducts = filteredProducts.filter(p =>
        (p.location || '').toLowerCase().includes(currentFilters.location.toLowerCase())
      );
    }

    // Condition filter
    if (currentFilters.condition) {
      filteredProducts = filteredProducts.filter(p => (p.condition || '') === currentFilters.condition);
    }

    // Stock filter
    if (currentFilters.stock) {
      filteredProducts = filteredProducts.filter(p => {
        const stock = parseInt(p.stock || 0);
        switch (currentFilters.stock) {
          case 'in_stock':
            return stock > 0;
          case 'low_stock':
            return stock >= 1 && stock <= 5;
          case 'high_stock':
            return stock >= 10;
          case 'out_of_stock':
            return stock === 0;
          default:
            return true;
        }
      });
    }

    // Availability filter
    if (currentFilters.availability) {
      filteredProducts = filteredProducts.filter(p => {
        if (currentFilters.availability === 'available') {
          return !p.is_reserved && (p.stock || 0) > 0;
        } else if (currentFilters.availability === 'reserved') {
          return p.is_reserved;
        }
        return true;
      });
    }

    // Brand filter
    if (currentFilters.brand) {
      const brandTerm = currentFilters.brand.toLowerCase();
      filteredProducts = filteredProducts.filter(p =>
        (p.brand || '').toLowerCase().includes(brandTerm)
      );
    }

    // Color filter
    if (currentFilters.color) {
      const colorTerm = currentFilters.color.toLowerCase();
      filteredProducts = filteredProducts.filter(p =>
        (p.color || '').toLowerCase().includes(colorTerm)
      );
    }

    // Date filter
    if (currentFilters.date) {
      const now = new Date();
      filteredProducts = filteredProducts.filter(p => {
        const createdDate = new Date(p.created_at);
        const diffTime = now - createdDate;
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        
        switch (currentFilters.date) {
          case 'today':
            return diffDays < 1;
          case 'week':
            return diffDays < 7;
          case 'month':
            return diffDays < 30;
          case '3months':
            return diffDays < 90;
          default:
            return true;
        }
      });
    }

    // Sorting
    switch (currentFilters.sortBy) {
      case 'oldest':
        filteredProducts.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case 'price_low':
        filteredProducts.sort((a, b) => parseFloat(a.price || 0) - parseFloat(b.price || 0));
        break;
      case 'price_high':
        filteredProducts.sort((a, b) => parseFloat(b.price || 0) - parseFloat(a.price || 0));
        break;
      case 'name':
        filteredProducts.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'name_desc':
        filteredProducts.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
        break;
      case 'popular':
        filteredProducts.sort((a, b) => {
          const viewsA = parseInt(a.views_count || 0);
          const viewsB = parseInt(b.views_count || 0);
          return viewsB - viewsA;
        });
        break;
      case 'most_liked':
        filteredProducts.sort((a, b) => {
          const likesA = parseInt(a.likes_count || 0);
          const likesB = parseInt(b.likes_count || 0);
          return likesB - likesA;
        });
        break;
      case 'newest':
      default:
        filteredProducts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
    }

    renderProducts(filteredProducts);
  }

  async function renderProducts(products = null) {
    const grid = document.getElementById('productGrid');
    if (!grid) return;

    const productsToRender = products || allProducts;

    if (!productsToRender || productsToRender.length === 0) {
      grid.innerHTML = `<div style="padding:40px;text-align:center;grid-column:1/-1;color:var(--muted);">
        <div style="font-size: 3rem; margin-bottom: 1rem;">📦</div>
        <span data-i18n="no_products">No products found</span>
        <p style="margin-top: 0.5rem; font-size: 0.875rem;">Try adjusting your filters or search terms</p>
      </div>`;
      if (i18n && typeof i18n.setLang === 'function') i18n.setLang(i18n.lang || 'en');
      return;
    }

    // Get current user info for permission checks
    const { data } = await supabase.auth.getUser();
    const currentUser = data?.user;
    let userRole = 'user';
    
    if (currentUser) {
      try {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', currentUser.id)
          .single();
        userRole = userData?.role || 'user';
      } catch (err) {
        console.error('Error fetching user role:', err);
      }
    }

    grid.innerHTML = '';

    productsToRender.forEach(product => {
      const imageUrl = product.image_url || 'https://placehold.co/300x200/667eea/white?text=No+Image';
      const price = Number.isFinite(Number(product.price)) ? parseFloat(product.price).toFixed(2) : '0.00';
      const stock = product.stock != null ? product.stock : 0;
      const categoryText = escapeHtml(product.category || 'other');
      const nameText = escapeHtml(product.name || 'Unnamed Product');
      const locationText = escapeHtml(product.location || '');
      const conditionText = product.condition ? product.condition.replace('_', ' ') : '';
      const likesCount = parseInt(product.likes_count || 0);
      const viewsCount = parseInt(product.views_count || 0);
      const isLiked = userFavoritesSet.has(product.id);

      // Check if product was sold in the last 5 minutes
      const isSoldRecently = product.sold_at && (Date.now() - new Date(product.sold_at).getTime()) < 5 * 60 * 1000;
      const isSold = stock === 0 && product.sold_at;

      const conditionEmoji = {
        'new': '\u2728',
        'like_new': '\ud83d\udd04',
        'good': '\ud83d\udc4d',
        'fair': '\ud83d\ude10',
        'poor': '\u26a0\ufe0f'
      };
      
      // Check if user can manage this product
      const canManage = currentUser && (userRole === 'admin' || product.seller_id === currentUser.id);

      // Skip sold products unless sold in last 5 minutes
      if (isSold && !isSoldRecently && !canManage) return;

      const card = document.createElement('div');
      card.className = 'product-card-modern';
      card.style.cursor = 'pointer';
      card.setAttribute('data-product-id', product.id);
      if (isSoldRecently) card.style.opacity = '0.7';
      
      // Add click handler to open modal and record view
      card.addEventListener('click', (e) => {
        // Don't open modal if clicking action buttons or like button
        if (!e.target.closest('.btn-buy-now') && !e.target.closest('.btn-reserve') && !e.target.closest('.product-like-btn')) {
          recordProductView(product.id);
          showProductModal(product);
        }
      });
      
      card.innerHTML = `
        <div class="product-image-container">
          <img src="${escapeHtml(imageUrl)}" alt="${nameText}" class="product-image" onerror="this.src='https://placehold.co/300x200/667eea/white?text=No+Image'">
          <button class="product-like-btn ${isLiked ? 'liked' : ''}" data-id="${escapeHtml(product.id)}" aria-label="Like">${isLiked ? '\u2764\ufe0f' : '\ud83e\udd0d'}</button>
          ${isSoldRecently ? `<span class="product-badge-new" style="background: #ef4444;">SOLD</span>` : ''}
          ${!isSoldRecently && product.is_reserved ? `<span class="product-badge-new" data-i18n="reserved">Reserved</span>` : ''}
          <div class="product-overlay">
            <button class="btn-quick-view" data-id="${escapeHtml(product.id)}" data-i18n="quickView">\ud83d\udc41 Quick View</button>
          </div>
        </div>
        <div class="product-info">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
            <span class="product-category">${categoryText}</span>
            ${conditionText ? `<span style="background: #dbeafe; color: #1e40af; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 500;">${conditionEmoji[product.condition]} ${conditionText}</span>` : ''}
          </div>
          <h3 class="product-name">${nameText}</h3>
          <div class="product-seller" style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.5rem;">
            <div class="seller-avatar" style="width:24px; height:24px; border-radius:50%; background:linear-gradient(135deg,#667eea,#764ba2); display:flex; align-items:center; justify-content:center; font-size:12px; color:white; font-weight:600; cursor:pointer;" onclick="event.stopPropagation(); showUserProfile('${product.seller_id}')">
              \ud83d\udc64
            </div>
            <span class="seller-name" style="font-size:0.875rem; color:var(--muted); cursor:pointer;" onclick="event.stopPropagation(); showUserProfile('${product.seller_id}')">
              ${escapeHtml(product.users?.username || 'Unknown')}
            </span>
          </div>
          <div class="product-meta" style="display:flex; gap:1rem; align-items:center;">
            <span style="font-size:0.8rem; color:var(--muted);">\u2764\ufe0f ${likesCount}</span>
            <span style="font-size:0.8rem; color:var(--muted);">\ud83d\udc41 ${viewsCount}</span>
            ${locationText ? `<span style="font-size:0.8rem; color:var(--muted);">\ud83d\udccd ${locationText}</span>` : ''}
            <span style="font-size:0.8rem; color:var(--muted);">\ud83d\udce6 ${escapeHtml(stock)}</span>
          </div>
          <div class="product-footer">
            <div class="product-price">
              ${product.original_price && product.original_price > product.price ?
                `<span class="price-original">\u20ac${parseFloat(product.original_price).toFixed(2)}</span>` : ''}
              <span class="price-currency">\u20ac</span>
              <span class="price-amount">${price}</span>
            </div>
            <div class="product-actions">
              ${isSoldRecently ? `<span style="color:#ef4444; font-weight:700; font-size:0.875rem;">SOLD</span>` : 
                `<button class="btn-buy-now" data-id="${escapeHtml(product.id)}" data-i18n="buyNow">\ud83d\uded2 Buy Now</button>`}
            </div>
          </div>
          ${canManage ? `
            <div class="product-management-actions" style="display: flex; gap: 0.5rem; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--border);">
              <button class="btn-edit-product" data-product-id="${escapeHtml(product.id)}" style="flex: 1; padding: 0.5rem; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 0.875rem; cursor: pointer; font-weight: 500; transition: background 0.2s;">
                \u270f\ufe0f Edit
              </button>
              <button class="btn-delete-product" data-product-id="${escapeHtml(product.id)}" style="flex: 1; padding: 0.5rem; background: #ef4444; color: white; border: none; border-radius: 6px; font-size: 0.875rem; cursor: pointer; font-weight: 500; transition: background 0.2s;">
                \ud83d\uddd1\ufe0f Delete
              </button>
            </div>
          ` : ''}
        </div>
      `;
      grid.appendChild(card);
      
      // Add management button handlers
      if (canManage) {
        const editBtn = card.querySelector('.btn-edit-product');
        const deleteBtn = card.querySelector('.btn-delete-product');
        
        if (editBtn) {
          editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showEditProductModal(product);
          });
        }
        
        if (deleteBtn) {
          deleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const confirmed = await showConfirmModal({ title: 'Delete Product', message: `Are you sure you want to delete "${product.name}"?`, okText: 'Delete', cancelText: 'Cancel' });
            if (confirmed) {
              await handleDeleteProduct(product.id);
            }
          });
        }
      }
    });

    // Apply translations to newly rendered elements (if i18n supports it)
    if (i18n && typeof i18n.setLang === 'function') i18n.setLang(i18n.lang || 'en');

    // Add event listeners for newly created product elements
    addProductEventListeners();
  }

  function addProductEventListeners() {
    // Like buttons
    document.querySelectorAll('.product-like-btn').forEach(btn => {
      btn.replaceWith(btn.cloneNode(true));
    });
    document.querySelectorAll('.product-like-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const productId = e.currentTarget.dataset.id;
        await toggleFavoriteIndex(productId);
      });
    });

    // Buy Now buttons
    document.querySelectorAll('.btn-buy-now:not([disabled])').forEach(btn => {
      btn.replaceWith(btn.cloneNode(true)); // remove duplicate listeners by cloning
    });
    document.querySelectorAll('.btn-buy-now:not([disabled])').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const productId = e.currentTarget.dataset.id;
        await handlePurchase(productId);
      });
    });

    // Reserve buttons (cart icon)
    document.querySelectorAll('.btn-add-cart').forEach(btn => {
      btn.replaceWith(btn.cloneNode(true));
    });
    document.querySelectorAll('.btn-add-cart').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const productId = e.currentTarget.dataset.id;
        await handleReserve(productId);
      });
    });

    // Remove Reserve buttons
    document.querySelectorAll('.btn-remove-reserve').forEach(btn => {
      btn.replaceWith(btn.cloneNode(true));
    });
    document.querySelectorAll('.btn-remove-reserve').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const productId = e.currentTarget.dataset.id;
        await handleRemoveReserve(productId);
      });
    });

    // Quick View buttons
    document.querySelectorAll('.btn-quick-view').forEach(btn => {
      btn.replaceWith(btn.cloneNode(true));
    });
    document.querySelectorAll('.btn-quick-view').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const productId = e.currentTarget.dataset.id;
        const product = allProducts.find(p => String(p.id) === String(productId));
        if (product) {
          showProductModal(product);
        }
      });
    });
  }

  async function handlePurchase(productId) {
    try {
      const { data } = await supabase.auth.getUser();
      const user = data ? data.user : null;
      if (!user) {
        showToast(i18n.t ? i18n.t('loginFirst') : 'Please log in first', 'error');
        setTimeout(() => (window.location.href = 'login.html'), 1500);
        return;
      }
      // Instead of performing the purchase immediately, redirect the user
      // to the Orders page so they can finish the order there.
      const params = new URLSearchParams();
      params.set('product', productId);
      // preserve intent so orders page can open checkout UI
      window.location.href = `orders.html?${params.toString()}`;
    } catch (error) {
      console.error('Purchase error:', error);
      showToast(error.message || 'Purchase failed', 'error');
    }
  }

  async function handleReserve(productId) {
    try {
      const { data } = await supabase.auth.getUser();
      const user = data ? data.user : null;
      if (!user) {
        showToast(i18n.t ? i18n.t('loginFirst') : 'Please log in first', 'error');
        setTimeout(() => (window.location.href = './login.html'), 1500);
        return;
      }

      const mod = await import('./supabase.js');
      if (mod && typeof mod.reserveProduct === 'function') {
        // example reservation fee of 0.20
        await mod.reserveProduct(productId, user.id, 0.20);
        showToast(i18n.t ? i18n.t('reserved_success') || 'Product reserved successfully!' : 'Product reserved successfully!', 'success');
        await loadProducts();
        await updateNavbarAuth();
      } else {
        throw new Error('Reserve function not available');
      }
    } catch (error) {
      console.error('Reserve error:', error);
      showToast(error.message || 'Reservation failed', 'error');
    }
  }

  async function handleRemoveReserve(productId) {
    try {
      const { data } = await supabase.auth.getUser();
      const user = data ? data.user : null;
      if (!user) {
        showToast(i18n.t ? i18n.t('loginFirst') : 'Please log in first', 'error');
        setTimeout(() => (window.location.href = './login.html'), 1500);
        return;
      }

      const mod = await import('./supabase.js');
      if (mod && typeof mod.removeReserve === 'function') {
        await mod.removeReserve(productId, user.id);
        showToast('Reservation removed successfully!', 'success');
        await loadProducts();
        await updateNavbarAuth();
      } else {
        throw new Error('Remove reserve function not available');
      }
    } catch (error) {
      console.error('Remove reserve error:', error);
      showToast(error.message || 'Failed to remove reservation', 'error');
    }
  }

  async function showProductModal(product) {
    const modal = document.getElementById('productModal');
    if (!modal) return;
    
    const modalBody = modal.querySelector('.modal-body');
    
    // Get seller information
    let sellerData = null;
    let sellerRating = 0;
    let sellerReviews = 0;
    
    if (product.seller_id) {
      const { data: seller } = await supabase
        .from('users')
        .select('id, username, email, created_at')
        .eq('id', product.seller_id)
        .single();
      
      sellerData = seller;
      
      // Get real seller rating from reviews table
      try {
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('rating')
          .eq('seller_id', product.seller_id);
        if (reviewsData && reviewsData.length > 0) {
          sellerReviews = reviewsData.length;
          sellerRating = (reviewsData.reduce((sum, r) => sum + r.rating, 0) / sellerReviews).toFixed(1);
        }
      } catch (e) { /* reviews table may not exist yet */ }
    }
    
    // Get real product stats from favorites
    let productLikes = parseInt(product.likes_count || 0);
    try {
      const { count } = await supabase.from('favorites').select('*', { count: 'exact', head: true }).eq('product_id', product.id);
      productLikes = count || productLikes;
    } catch (e) { /* favorites may not exist */ }
    const productViews = parseInt(product.views_count || 0);
    
    const conditionEmoji = {
      'new': '✨',
      'like_new': '🔄',
      'good': '👍',
      'fair': '😐',
      'poor': '⚠️'
    };
    
    const conditionText = product.condition ? product.condition.replace('_', ' ') : '';
    const imageUrl = product.image_url || 'https://placehold.co/600x400/667eea/white?text=No+Image';
    const price = Number.isFinite(Number(product.price)) ? parseFloat(product.price).toFixed(2) : '0.00';
    
    modalBody.innerHTML = `
      <div class="modal-product-grid">
        <div>
          <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(product.name)}" class="modal-product-image">
        </div>
        
        <div class="modal-product-info">
          <h1>${escapeHtml(product.name)}</h1>
          <div class="modal-product-price">€${price}</div>
          
          <div class="modal-product-meta">
            <span class="modal-badge" style="background: #dbeafe; color: #1e40af;">
              ${conditionEmoji[product.condition] || '📦'} ${escapeHtml(conditionText)}
            </span>
            <span class="modal-badge" style="background: #fef3c7; color: #92400e;">
              📍 ${escapeHtml(product.location) || 'Not specified'}
            </span>
            <span class="modal-badge" style="background: #f3e8ff; color: #6b21a8;">
              📦 ${escapeHtml(product.category) || 'other'}
            </span>
            ${product.stock > 0 
              ? `<span class="modal-badge" style="background: #d1fae5; color: #065f46;">✓ ${product.stock} in stock</span>`
              : `<span class="modal-badge" style="background: #fee2e2; color: #991b1b;">✗ Out of stock</span>`
            }
          </div>
          
          <div class="modal-description">
            <h3 style="margin-bottom: 0.75rem; font-size: 1.125rem;">Description</h3>
            <p>${escapeHtml(product.description) || 'No description provided.'}</p>
          </div>
          
          <!-- Product Stats -->
          <div class="modal-stats">
            <div class="modal-stat">
              <div class="modal-stat-value">❤️ ${productLikes}</div>
              <div class="modal-stat-label">Likes</div>
            </div>
            <div class="modal-stat">
              <div class="modal-stat-value">👁️ ${productViews}</div>
              <div class="modal-stat-label">Views</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Seller Information -->
      <div class="modal-seller-card">
        <div class="modal-seller-header">
          <div class="modal-seller-avatar">
            ${sellerData?.username ? sellerData.username.charAt(0).toUpperCase() : '?'}
          </div>
          <div class="modal-seller-info">
            <h3 style="cursor:pointer; color:#3b82f6;">${escapeHtml(sellerData?.username) || 'Unknown Seller'}</h3>
            <div class="modal-seller-rating">
              ${'⭐'.repeat(Math.floor(sellerRating))} ${sellerRating}/5 (${sellerReviews} reviews)
            </div>
            <div style="font-size: 0.875rem; color: var(--muted); margin-top: 0.25rem;">
              Member since ${sellerData?.created_at ? new Date(sellerData.created_at).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        </div>
        
        ${sellerData ? `
          <button class="modal-btn modal-btn-secondary" style="width: 100%; margin-top: 1rem;" id="chatSellerBtn" data-seller="${product.seller_id}" data-product="${product.id}">
            💬 Chat with Seller
          </button>
        ` : ''}
      </div>
      
      <!-- Action Buttons -->
      <div class="modal-actions">
        <button class="modal-btn modal-btn-secondary" id="likeProductBtn">
          ❤️ Like Product
        </button>
        ${product.stock > 0 ? `
          <button class="modal-btn modal-btn-primary" id="modalBuyBtn" data-id="${product.id}">
            🛒 Buy Now - €${price}
          </button>
        ` : ''}
      </div>
    `;
    
    // Show modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Add click handler for seller name
    const sellerNameEl = modal.querySelector('.modal-seller-info h3');
    if (sellerNameEl) {
      sellerNameEl.addEventListener('click', () => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        showUserProfile(product.seller_id);
      });
    }
    
    // Close modal handlers
    const closeModal = () => {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    };
    
    const closeBtn = document.getElementById('modalClose');
    const overlay = document.getElementById('modalOverlay');
    if (closeBtn) closeBtn.onclick = closeModal;
    if (overlay) overlay.onclick = closeModal;
    
    // Action button handlers
    const chatBtn = document.getElementById('chatSellerBtn');
    if (chatBtn) {
      const sellerUsername = sellerData?.username || '';
      chatBtn.onclick = () => {
        window.location.href = `chat.html?seller=${encodeURIComponent(sellerUsername)}&product=${encodeURIComponent(product.id)}`;
      };
    }

    const likeBtn = document.getElementById('likeProductBtn');
    if (likeBtn) {
      const isCurrentlyLiked = userFavoritesSet.has(product.id);
      likeBtn.textContent = isCurrentlyLiked ? '💔 Unlike' : '❤️ Like Product';
      likeBtn.onclick = async () => {
        await toggleFavoriteIndex(product.id);
        const nowLiked = userFavoritesSet.has(product.id);
        likeBtn.textContent = nowLiked ? '💔 Unlike' : '❤️ Like Product';
        showToast(nowLiked ? 'Product liked!' : 'Product unliked', 'success');
      };
    }

    const modalBuyBtn = document.getElementById('modalBuyBtn');
    if (modalBuyBtn) {
      modalBuyBtn.onclick = async () => {
        await handlePurchase(product.id);
        closeModal();
      };
    }
  }

  // Filter tabs
  const filterTabs = document.querySelectorAll('.filter-tab');
  if (filterTabs && filterTabs.length) {
    filterTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentCategory = tab.dataset.category || 'all';
        applyFiltersAndRender();
      });
    });
  }

  // Advanced filters
  const applyFiltersBtn = document.getElementById('applyFilters');
  const clearFiltersBtn = document.getElementById('clearFilters');

  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', () => {
      currentFilters.search = document.getElementById('searchInput')?.value || '';
      currentFilters.minPrice = document.getElementById('minPrice')?.value || '';
      currentFilters.maxPrice = document.getElementById('maxPrice')?.value || '';
      currentFilters.location = document.getElementById('locationFilter')?.value || '';
      currentFilters.condition = document.getElementById('conditionFilter')?.value || '';
      currentFilters.stock = document.getElementById('stockFilter')?.value || '';
      currentFilters.availability = document.getElementById('availabilityFilter')?.value || '';
      currentFilters.brand = document.getElementById('brandFilter')?.value || '';
      currentFilters.color = document.getElementById('colorFilter')?.value || '';
      currentFilters.date = document.getElementById('dateFilter')?.value || '';
      currentFilters.sortBy = document.getElementById('sortFilter')?.value || 'newest';

      applyFiltersAndRender();
      updateActiveFilters();
      showToast('Filters applied successfully!', 'success');
    });
  }

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
      currentFilters = {
        search: '',
        minPrice: '',
        maxPrice: '',
        location: '',
        condition: '',
        stock: '',
        availability: '',
        brand: '',
        color: '',
        date: '',
        sortBy: 'newest'
      };

      // Clear form inputs
      const inputs = ['searchInput', 'minPrice', 'maxPrice', 'brandFilter', 'colorFilter'];
      inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });

      const selects = ['locationFilter', 'conditionFilter', 'stockFilter', 'availabilityFilter', 'dateFilter', 'sortFilter'];
      selects.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = id === 'sortFilter' ? 'newest' : '';
      });

      // Clear category filter
      const catFilter = document.getElementById('categoryFilter');
      if (catFilter) catFilter.value = '';

      // Reset category to all
      currentCategory = 'all';
      filterTabs.forEach(t => t.classList.remove('active'));
      const allTab = document.querySelector('[data-category="all"]');
      if (allTab) allTab.classList.add('active');

      applyFiltersAndRender();
      updateActiveFilters();
      showToast('Filters cleared!', 'success');
    });
  }

  // Update active filters display
  function updateActiveFilters() {
    const activeFiltersDiv = document.getElementById('activeFilters');
    const filterTagsDiv = document.getElementById('filterTags');
    if (!activeFiltersDiv || !filterTagsDiv) return;

    filterTagsDiv.innerHTML = '';
    let hasFilters = false;

    const filterLabels = {
      search: '🔍 Search',
      minPrice: '💰 Min',
      maxPrice: '💸 Max',
      location: '📍 Location',
      condition: '⭐ Condition',
      stock: '📊 Stock',
      availability: '🔖 Status',
      brand: '🏷️ Brand',
      color: '🎨 Color',
      date: '📅 Date',
      sortBy: '🔄 Sort'
    };

    Object.keys(currentFilters).forEach(key => {
      if (currentFilters[key] && currentFilters[key] !== 'newest') {
        hasFilters = true;
        const tag = document.createElement('div');
        tag.className = 'filter-tag';
        tag.innerHTML = `
          ${filterLabels[key]}: ${currentFilters[key]}
          <span class="remove-tag">×</span>
        `;
        tag.onclick = () => {
          currentFilters[key] = key === 'sortBy' ? 'newest' : '';
          const inputId = {
            search: 'searchInput',
            minPrice: 'minPrice',
            maxPrice: 'maxPrice',
            location: 'locationFilter',
            condition: 'conditionFilter',
            stock: 'stockFilter',
            availability: 'availabilityFilter',
            brand: 'brandFilter',
            color: 'colorFilter',
            date: 'dateFilter',
            sortBy: 'sortFilter'
          }[key];
          const el = document.getElementById(inputId);
          if (el) el.value = key === 'sortBy' ? 'newest' : '';
          applyFiltersAndRender();
          updateActiveFilters();
        };
        filterTagsDiv.appendChild(tag);
      }
    });

    activeFiltersDiv.style.display = hasFilters ? 'block' : 'none';
  }

  // Real-time search
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        currentFilters.search = searchInput.value;
        applyFiltersAndRender();
      }, 300);
    });
  }

  // Toggle advanced filters
  const toggleFiltersBtn = document.getElementById('toggleFiltersBtn');
  const advancedFiltersContainer = document.getElementById('advancedFiltersContainer');
  const filterArrow = document.getElementById('filterArrow');
  let filtersVisible = false;

  if (toggleFiltersBtn && advancedFiltersContainer) {
    toggleFiltersBtn.addEventListener('click', () => {
      filtersVisible = !filtersVisible;
      
      if (filtersVisible) {
        advancedFiltersContainer.style.display = 'block';
        filterArrow.style.transform = 'rotate(180deg)';
        toggleFiltersBtn.querySelector('[data-i18n]').setAttribute('data-i18n', 'hide_filters');
        toggleFiltersBtn.querySelector('[data-i18n]').textContent = i18n.t('hide_filters');
      } else {
        advancedFiltersContainer.style.display = 'none';
        filterArrow.style.transform = 'rotate(0deg)';
        toggleFiltersBtn.querySelector('[data-i18n]').setAttribute('data-i18n', 'show_filters');
        toggleFiltersBtn.querySelector('[data-i18n]').textContent = i18n.t('show_filters');
      }
    });
  }

  // Hero buttons
  document.querySelector('.btn-hero-primary')?.addEventListener('click', () => {
    document.querySelector('.main-container')?.scrollIntoView({ behavior: 'smooth' });
  });

  document.querySelector('.btn-hero-secondary')?.addEventListener('click', () => {
    document.querySelector('.features-section')?.scrollIntoView({ behavior: 'smooth' });
  });

  // Delete product handler
  async function handleDeleteProduct(productId) {
    try {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user) {
        showToast('Please log in first', 'error');
        return;
      }

      const { deleteProduct } = await import('./supabase.js');
      await deleteProduct(productId, user.id);
      
      showToast('Product deleted successfully!', 'success');
      loadProducts(); // Reload products
    } catch (error) {
      console.error('Error deleting product:', error);
      showToast(error.message || 'Failed to delete product', 'error');
    }
  }

  // Show edit product modal
  function showEditProductModal(product) {
    // Create modal
    const modalHtml = `
      <div id="editProductModal" class="product-modal" style="display: flex;">
        <div class="modal-overlay" onclick="closeEditModal()"></div>
        <div class="modal-content" style="max-width: 800px;">
          <button class="modal-close" onclick="closeEditModal()">×</button>
          <div class="modal-body">
            <h2 style="margin-bottom: 1.5rem; color: var(--text-primary);">Edit Product</h2>
            <form id="editProductForm" style="display: flex; flex-direction: column; gap: 1rem;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div>
                  <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Product Name</label>
                  <input type="text" id="editName" value="${escapeHtml(product.name)}" required style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px;">
                </div>
                <div>
                  <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Price (€)</label>
                  <input type="number" id="editPrice" value="${product.price}" required min="0" step="0.01" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px;">
                </div>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div>
                  <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Category</label>
                  <select id="editCategory" required style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px;">
                    <option value="electronics" ${product.category === 'electronics' ? 'selected' : ''}>Electronics</option>
                    <option value="clothing" ${product.category === 'clothing' ? 'selected' : ''}>Clothing</option>
                    <option value="furniture" ${product.category === 'furniture' ? 'selected' : ''}>Furniture</option>
                    <option value="books" ${product.category === 'books' ? 'selected' : ''}>Books</option>
                    <option value="sports" ${product.category === 'sports' ? 'selected' : ''}>Sports</option>
                    <option value="home" ${product.category === 'home' ? 'selected' : ''}>Home</option>
                    <option value="vehicles" ${product.category === 'vehicles' ? 'selected' : ''}>Vehicles</option>
                    <option value="other" ${product.category === 'other' ? 'selected' : ''}>Other</option>
                  </select>
                </div>
                <div>
                  <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Condition</label>
                  <select id="editCondition" required style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px;">
                    <option value="new" ${product.condition === 'new' ? 'selected' : ''}>New</option>
                    <option value="like_new" ${product.condition === 'like_new' ? 'selected' : ''}>Like New</option>
                    <option value="good" ${product.condition === 'good' ? 'selected' : ''}>Good</option>
                    <option value="fair" ${product.condition === 'fair' ? 'selected' : ''}>Fair</option>
                    <option value="poor" ${product.condition === 'poor' ? 'selected' : ''}>Poor</option>
                  </select>
                </div>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div>
                  <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Stock</label>
                  <input type="number" id="editStock" value="${product.stock}" required min="0" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px;">
                </div>
                <div>
                  <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Location</label>
                  <input type="text" id="editLocation" value="${escapeHtml(product.location || '')}" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px;">
                </div>
              </div>
              
              <div>
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Description</label>
                <textarea id="editDescription" required rows="4" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px;">${escapeHtml(product.description || '')}</textarea>
              </div>
              
              <div>
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Image URL</label>
                <input type="url" id="editImageUrl" value="${escapeHtml(product.image_url || '')}" required style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px;">
              </div>
              
              <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                <button type="submit" style="flex: 1; padding: 0.75rem; background: #3b82f6; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                  💾 Save Changes
                </button>
                <button type="button" onclick="closeEditModal()" style="flex: 1; padding: 0.75rem; background: #e5e7eb; color: #374151; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                  ✖️ Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('editProductModal');
    if (existingModal) existingModal.remove();
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.body.style.overflow = 'hidden';
    
    // Add form submit handler
    document.getElementById('editProductForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleUpdateProduct(product.id);
    });
  }
  
  // Close edit modal
  window.closeEditModal = function() {
    const modal = document.getElementById('editProductModal');
    if (modal) {
      modal.remove();
      document.body.style.overflow = 'auto';
    }
  };
  
  // Update product handler
  async function handleUpdateProduct(productId) {
    try {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user) {
        showToast('Please log in first', 'error');
        return;
      }

      const productData = {
        name: document.getElementById('editName').value,
        price: parseFloat(document.getElementById('editPrice').value),
        category: document.getElementById('editCategory').value,
        condition: document.getElementById('editCondition').value,
        stock: parseInt(document.getElementById('editStock').value),
        location: document.getElementById('editLocation').value,
        description: document.getElementById('editDescription').value,
        image_url: document.getElementById('editImageUrl').value
      };

      const { updateProduct } = await import('./supabase.js');
      await updateProduct(productId, user.id, productData);
      
      showToast('Product updated successfully!', 'success');
      closeEditModal();
      loadProducts(); // Reload products
    } catch (error) {
      console.error('Error updating product:', error);
      showToast(error.message || 'Failed to update product', 'error');
    }
  }

  // Load products on page load
  loadProducts();
  
  // Listen for purchase/reserve events from modal
  document.addEventListener('purchaseProduct', async (e) => {
    await handlePurchase(e.detail.productId);
    // Close modal
    document.getElementById('productModal').style.display = 'none';
    document.body.style.overflow = 'auto';
  });
  
  document.addEventListener('reserveProduct', async (e) => {
    await handleReserve(e.detail.productId);
    // Close modal
    document.getElementById('productModal').style.display = 'none';
    document.body.style.overflow = 'auto';
  });
}

// Settings page functions
function initializeSettingsPage() {
   if (!document.getElementById('userEmail')) return;

   async function loadUserSettings() {
     try {
       const { data } = await supabase.auth.getUser();
       let user = data ? data.user : null;

       // If no user yet, wait briefly for auth to initialize (handle storage race on SIGNED_IN)
       if (!user) {
         console.log('No user found yet in loadUserSettings(), waiting for auth event...');
         // Subscribe to auth state change and load once signed in
         const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
           if (event === 'SIGNED_IN' && session?.user) {
             try {
               sub.subscription.unsubscribe();
             } catch (e) {}
             user = session.user;
             await loadUserSettings(); // retry now that we have user
           } else if (event === 'SIGNED_OUT') {
             try {
               sub.subscription.unsubscribe();
             } catch (e) {}
             // If user signs out, redirect to login
             showToast('You must be logged in to access settings.', 'error');
             setTimeout(() => (window.location.href = 'login.html'), 1200);
           }
         });
         return;
       }

       const resp = await supabase.from('users').select('*').eq('id', user.id).single();
       if (resp.error) {
         console.error('Error loading user settings:', resp.error);
         return;
       }
       const userData = resp.data;
       const metadataAvatar = user?.user_metadata?.avatar_url || null;
       
       // Update email fields
       const emailEl = document.getElementById('userEmail');
       const emailDisplayEl = document.getElementById('userEmailDisplay');
       if (emailEl) emailEl.value = userData.email || '';
       if (emailDisplayEl) emailDisplayEl.textContent = userData.email || '';
       
       // Update balance display
       const balanceDisplayEl = document.getElementById('userBalanceDisplay');
       if (balanceDisplayEl) balanceDisplayEl.textContent = `€${Number.isFinite(Number(userData.balance)) ? parseFloat(userData.balance).toFixed(2) : '0.00'}`;
       
       // Update username
       const userNameEl = document.getElementById('userName');
       const usernameInput = document.getElementById('usernameInput');
       if (userNameEl) userNameEl.textContent = userData.username || 'User';
       if (usernameInput) usernameInput.value = userData.username || '';
       
       // Update avatar
       const avatarImg = document.getElementById('userAvatar');
       const avatarText = document.getElementById('userAvatarText');
       const avatarUrlInput = document.getElementById('avatarUrlInput');
       if (userData.avatar_url || metadataAvatar) {
         const finalAvatarUrl = userData.avatar_url || metadataAvatar;
         if (avatarImg) {
           avatarImg.src = finalAvatarUrl;
           avatarImg.style.display = 'block';
         }
         if (avatarText) avatarText.style.display = 'none';
         if (avatarUrlInput) avatarUrlInput.value = finalAvatarUrl;
       } else {
         if (avatarText) avatarText.textContent = (userData.username || 'U').charAt(0).toUpperCase();
       }
       
       // Update bio
       const bioInput = document.getElementById('bioInput');
       if (bioInput) bioInput.value = userData.bio || '';
       
       // Update what I sell
       const whatISellInput = document.getElementById('whatISellInput');
       if (whatISellInput) whatISellInput.value = userData.what_i_sell || '';

       // Update language
       const userLangSelect = document.getElementById('userLang');
       if (userLangSelect) userLangSelect.value = userData.language || 'en';

       // Update theme preference
       const userTheme = userData.theme || 'light';
       const userThemeToggle = document.getElementById('userThemeToggle');
       if (userThemeToggle) {
         userThemeToggle.textContent = i18n.t('toggle_theme');
       }

       // Load user stats
       loadUserStats(user.id);
     } catch (error) {
       console.error('Error in loadUserSettings:', error);
     }
   }
   
   // Load user statistics
   async function loadUserStats(userId) {
     try {
       // Count user's products
       const { count: productsCount } = await supabase
         .from('products')
         .select('*', { count: 'exact', head: true })
         .eq('seller_id', userId);

       // Count user's sales
       const { count: salesCount } = await supabase
         .from('user_transactions')
         .select('*', { count: 'exact', head: true })
         .eq('user_id', userId)
         .eq('transaction_type', 'sale');

       const productCountEl = document.getElementById('userProductCount');
       const salesCountEl = document.getElementById('userSalesCount');

       if (productCountEl) productCountEl.textContent = productsCount || 0;
       if (salesCountEl) salesCountEl.textContent = salesCount || 0;

       // Load detailed data
       loadUserProducts(userId);
       loadUserReviews(userId);
       loadUserSales(userId);
     } catch (error) {
       console.error('Error loading user stats:', error);
     }
   }

   // Load user's products
   async function loadUserProducts(userId) {
     try {
       const { data: products } = await supabase
         .from('products')
         .select('*')
         .eq('seller_id', userId)
         .order('created_at', { ascending: false })
         .limit(10);

       const container = document.getElementById('userProducts');
       if (!container) return;

       if (products && products.length > 0) {
         container.innerHTML = products.map(product => `
           <div class="product-card-modern" style="margin:0; display:flex; align-items:center; gap:1rem; padding:1rem;">
             <img src="${product.image_url || 'https://placehold.co/80x60/667eea/white?text=No+Image'}" alt="${product.name}" style="width:80px; height:60px; object-fit:cover; border-radius:8px;">
             <div style="flex:1;">
               <h4 style="margin:0 0 0.5rem 0; font-size:1rem;">${product.name}</h4>
               <div style="font-size:0.875rem; color:var(--muted);">€${parseFloat(product.price).toFixed(2)} • ${product.stock} in stock</div>
             </div>
             <button class="btn-edit-product" data-product-id="${product.id}" style="padding:0.5rem; background:#3b82f6; color:white; border:none; border-radius:6px; cursor:pointer;">Edit</button>
           </div>
         `).join('');
       } else {
         container.innerHTML = `
           <div style="text-align: center; padding: 2rem; color: var(--muted);">
             <div style="font-size: 2rem; margin-bottom: 0.5rem;">📦</div>
             <span data-i18n="no_listings">No products listed yet</span>
           </div>
         `;
       }
     } catch (error) {
       console.error('Error loading user products:', error);
     }
   }

   // Load user's reviews
   async function loadUserReviews(userId) {
     try {
       const { data: reviews } = await supabase
         .from('reviews')
         .select('rating, comment, created_at, buyer_id, users!buyer_id(username)')
         .eq('seller_id', userId)
         .order('created_at', { ascending: false })
         .limit(5);

       const container = document.getElementById('userReviews');
       if (!container) return;

       if (reviews && reviews.length > 0) {
         container.innerHTML = reviews.map(review => `
           <div style="padding:1rem; background:var(--secondary); border-radius:8px; margin-bottom:1rem;">
             <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.5rem;">
               <span style="font-weight:600;">${escapeHtml(review.users?.username || 'Anonymous')}</span>
               <span>⭐ ${review.rating}/5</span>
               <span style="font-size:0.875rem; color:var(--muted);">${new Date(review.created_at).toLocaleDateString()}</span>
             </div>
             <p style="margin:0; font-size:0.875rem;">${escapeHtml(review.comment || 'No comment')}</p>
           </div>
         `).join('');
       } else {
         container.innerHTML = `
           <div style="text-align: center; padding: 2rem; color: var(--muted);">
             <div style="font-size: 2rem; margin-bottom: 0.5rem;">⭐</div>
             <span data-i18n="no_reviews">No reviews yet</span>
           </div>
         `;
       }
     } catch (error) {
       console.error('Error loading user reviews:', error);
     }
   }

   // Load user's sales
   async function loadUserSales(userId) {
     try {
       const { data: sales } = await supabase
         .from('user_transactions')
         .select('*')
         .eq('user_id', userId)
         .eq('transaction_type', 'sale')
         .order('created_at', { ascending: false })
         .limit(10);

       const container = document.getElementById('userSales');
       if (!container) return;

       if (sales && sales.length > 0) {
         container.innerHTML = sales.map(sale => `
           <div style="padding:1rem; background:var(--secondary); border-radius:8px; margin-bottom:1rem;">
             <div style="display:flex; justify-content:space-between; align-items:center;">
               <div>
                 <div style="font-weight:600;">€${Math.abs(sale.amount).toFixed(2)}</div>
                 <div style="font-size:0.875rem; color:var(--muted);">${new Date(sale.created_at).toLocaleDateString()}</div>
               </div>
               <div style="font-size:0.875rem; color:var(--muted);">Sale</div>
             </div>
           </div>
         `).join('');
       } else {
         container.innerHTML = `
           <div style="text-align: center; padding: 2rem; color: var(--muted);">
             <div style="font-size: 2rem; margin-bottom: 0.5rem;">💰</div>
             <span data-i18n="no_sales">No sales yet</span>
           </div>
         `;
       }
     } catch (error) {
       console.error('Error loading user sales:', error);
     }
   }
   
   // Save profile button
   const saveProfileBtn = document.getElementById('saveProfileBtn');
   if (saveProfileBtn) {
     saveProfileBtn.addEventListener('click', async () => {
       try {
         const { data } = await supabase.auth.getUser();
         const user = data?.user;
         if (!user) {
           showToast('Please log in first', 'error');
           return;
         }

         const username = document.getElementById('usernameInput')?.value;
         const bio = document.getElementById('bioInput')?.value;
         const whatISell = document.getElementById('whatISellInput')?.value;
         const language = document.getElementById('userLang')?.value;

         let avatarUrl = null;

         // Check if file upload is selected
         const fileRadio = document.querySelector('input[name="avatarType"][value="file"]');
         if (fileRadio && fileRadio.checked) {
           const fileInput = document.getElementById('avatarFileInput');
           if (fileInput && fileInput.files[0]) {
             const { uploadAvatar } = await import('./supabase.js');
             avatarUrl = await uploadAvatar(fileInput.files[0], user.id);
           }
         } else {
           // URL input
           avatarUrl = document.getElementById('avatarUrlInput')?.value || null;
         }

         let updatePayload = {
           username: username || null,
           avatar_url: avatarUrl,
           bio: bio || null,
           what_i_sell: whatISell || null,
           language: language || 'en',
           updated_at: new Date().toISOString()
         };

         let error = null;
         for (let attempt = 0; attempt < 6; attempt++) {
           const result = await supabase
             .from('users')
             .update(updatePayload)
             .eq('id', user.id);

           error = result.error || null;
           if (!error) break;

           // Remove missing columns dynamically for older schemas
           if (error.code === 'PGRST204') {
             const missingColumn = (error.message || '').match(/'([^']+)' column/)?.[1];
             if (missingColumn && Object.prototype.hasOwnProperty.call(updatePayload, missingColumn)) {
               delete updatePayload[missingColumn];
               console.warn(`users.${missingColumn} column missing; retrying profile update without it`);
               continue;
             }
           }

           break;
         }

         if (error) throw error;

         if (avatarUrl) {
           try {
             await supabase.auth.updateUser({
               data: { avatar_url: avatarUrl }
             });
           } catch (metadataErr) {
             console.warn('Could not persist avatar in auth metadata:', metadataErr?.message || metadataErr);
           }
         }

         showToast(i18n.t('profile_updated'), 'success');
         loadUserSettings();
       } catch (error) {
         console.error('Error updating profile:', error);
         showToast(i18n.t('profile_update_failed'), 'error');
       }
     });
   }
   
   // Avatar type radio buttons
   const avatarTypeRadios = document.querySelectorAll('input[name="avatarType"]');
   const avatarUrlInput = document.getElementById('avatarUrlInput');
   const avatarFileInput = document.getElementById('avatarFileInput');

   avatarTypeRadios.forEach(radio => {
     radio.addEventListener('change', (e) => {
       if (e.target.value === 'url') {
         avatarUrlInput.style.display = 'block';
         avatarFileInput.style.display = 'none';
         avatarFileInput.value = '';
       } else {
         avatarUrlInput.style.display = 'none';
         avatarFileInput.style.display = 'block';
         avatarUrlInput.value = '';
       }
     });
   });

   // Change avatar button
   const changeAvatarBtn = document.getElementById('changeAvatarBtn');
   if (changeAvatarBtn) {
     changeAvatarBtn.addEventListener('click', () => {
       const urlRadio = document.querySelector('input[name="avatarType"][value="url"]');
       if (urlRadio && urlRadio.checked) {
         avatarUrlInput.focus();
         avatarUrlInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
       } else {
         avatarFileInput.click();
       }
     });
   }

   // Real-time avatar preview for URL
   if (avatarUrlInput) {
     avatarUrlInput.addEventListener('input', () => {
       const url = avatarUrlInput.value;
       const avatarImg = document.getElementById('userAvatar');
       const avatarText = document.getElementById('userAvatarText');

       if (url) {
         if (avatarImg) {
           avatarImg.src = url;
           avatarImg.style.display = 'block';
           avatarImg.onerror = () => {
             avatarImg.style.display = 'none';
             if (avatarText) avatarText.style.display = 'flex';
           };
         }
         if (avatarText) avatarText.style.display = 'none';
       } else {
         if (avatarImg) avatarImg.style.display = 'none';
         if (avatarText) avatarText.style.display = 'flex';
       }
     });
   }

   // File upload preview
   if (avatarFileInput) {
     avatarFileInput.addEventListener('change', (e) => {
       const file = e.target.files[0];
       if (file) {
         const reader = new FileReader();
         reader.onload = (e) => {
           const avatarImg = document.getElementById('userAvatar');
           const avatarText = document.getElementById('userAvatarText');
           if (avatarImg) {
             avatarImg.src = e.target.result;
             avatarImg.style.display = 'block';
           }
           if (avatarText) avatarText.style.display = 'none';
         };
         reader.readAsDataURL(file);
       }
     });
   }

   // Theme toggle functionality
   const userThemeToggle = document.getElementById('userThemeToggle');
   if (userThemeToggle) {
     userThemeToggle.addEventListener('click', async () => {
       const html = document.documentElement;
       const currentTheme = html.getAttribute('data-theme') || 'light';
       const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

       html.classList.remove('dark', 'light');
       html.classList.add(newTheme);
       html.setAttribute('data-theme', newTheme);
       localStorage.setItem('theme', newTheme);

       // Update button text with proper i18n
       userThemeToggle.textContent = i18n.t('toggle_theme');

       // Also update navbar theme toggle
       const navThemeToggle = document.getElementById('themeToggle');
       if (navThemeToggle) {
         navThemeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
       }

       // Save theme preference to user profile
       try {
         const { data } = await supabase.auth.getUser();
         const user = data?.user;
         if (user) {
           await supabase
             .from('users')
             .update({
               theme: newTheme,
               updated_at: new Date().toISOString()
             })
             .eq('id', user.id);
         }
       } catch (error) {
         console.error('Error saving theme preference:', error);
       }

       showToast(i18n.t(newTheme === 'dark' ? 'switched_to_dark' : 'switched_to_light'), 'success');
     });
   }

   // Language change handler
   const userLangSelect = document.getElementById('userLang');
   if (userLangSelect) {
     userLangSelect.addEventListener('change', async (e) => {
       const lang = e.target.value;
       localStorage.setItem('lang', lang);
       if (i18n && typeof i18n.setLang === 'function') {
         i18n.setLang(lang);
       }

       // Update theme button text after language change
       const userThemeToggle = document.getElementById('userThemeToggle');
       if (userThemeToggle) {
         userThemeToggle.textContent = i18n.t('toggle_theme');
       }

       // Save language preference to user profile
       try {
         const { data } = await supabase.auth.getUser();
         const user = data?.user;
         if (user) {
           await supabase
             .from('users')
             .update({
               language: lang,
               updated_at: new Date().toISOString()
             })
             .eq('id', user.id);
         }
       } catch (error) {
         console.error('Error saving language preference:', error);
       }

       showToast(i18n.t('language_changed'), 'success');
     });
   }

   // Logout button in settings
   const settingsLogoutBtn = document.getElementById('settingsLogoutBtn');
   if (settingsLogoutBtn) {
     settingsLogoutBtn.addEventListener('click', async () => {
       try {
         await supabase.auth.signOut();
         showToast('Logged out successfully', 'success');
         setTimeout(() => (window.location.href = 'index.html'), 1000);
       } catch (error) {
         console.error('Error signing out:', error);
         showToast('Error signing out', 'error');
       }
     });
   }

   // Delete account functionality
   const deleteAccountBtn = document.getElementById('deleteAccountBtn');
   if (deleteAccountBtn) {
     deleteAccountBtn.addEventListener('click', async () => {
      const confirmed = await showConfirmModal({ title: 'Delete Account', message: i18n.t ? i18n.t('delete_account_confirm') || 'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.' : 'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.', okText: 'Delete', cancelText: 'Cancel' });
      if (!confirmed) return;

       try {
         const { data } = await supabase.auth.getUser();
         const user = data ? data.user : null;
         if (!user) return;

         // Delete user profile first
         await supabase.from('users').delete().eq('id', user.id);

         // Note: supabase.auth.admin.deleteUser requires admin privileges and can't be called from client
         // The user record deletion is sufficient for now

         showToast('Account deleted successfully', 'success');
         setTimeout(() => (window.location.href = 'index.html'), 1000);
       } catch (error) {
         console.error('Error deleting account:', error);
         showToast('Error deleting account', 'error');
       }
     });
   }

   // Preview profile button
   const previewProfileBtn = document.getElementById('previewProfileBtn');
   if (previewProfileBtn) {
     previewProfileBtn.addEventListener('click', () => {
       showProfilePreview();
     });
   }

   loadUserSettings();
 }

 // Function to show profile preview
 function showProfilePreview() {
   const username = document.getElementById('usernameInput')?.value || 'User';
   const bio = document.getElementById('bioInput')?.value || '';
   const whatISell = document.getElementById('whatISellInput')?.value || '';
   const email = document.getElementById('userEmail')?.value || '';

   // Get avatar
   let avatarUrl = '';
   const fileRadio = document.querySelector('input[name="avatarType"][value="file"]');
   if (fileRadio && fileRadio.checked && document.getElementById('avatarFileInput').files[0]) {
     // Use the preview data URL
     avatarUrl = document.getElementById('avatarFileInput').dataset.previewUrl || '';
   } else {
     avatarUrl = document.getElementById('avatarUrlInput')?.value || '';
   }

   // Create preview modal
   const modalHtml = `
     <div id="profilePreviewModal" class="product-modal" style="display: flex;">
       <div class="modal-overlay" onclick="closeProfilePreview()"></div>
       <div class="modal-content" style="max-width: 600px;">
         <button class="modal-close" onclick="closeProfilePreview()">×</button>
         <div class="modal-body">
           <h2 style="margin-bottom: 1.5rem; color: var(--text-primary); text-align: center;">Profile Preview</h2>
           <div style="text-align: center; padding: 2rem;">
             <div style="position: relative; width: 120px; margin: 0 auto 1rem;">
               <div style="width: 120px; height: 120px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; font-size: 3rem; color: white; font-weight: 700; overflow: hidden; margin: 0 auto;">
                 ${avatarUrl ? `<img src="${avatarUrl}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover;">` : `<span>${username.charAt(0).toUpperCase()}</span>`}
               </div>
             </div>
             <h3 style="margin: 0 0 0.5rem 0; font-size: 1.5rem; font-weight: 700; color: var(--fg);">${username}</h3>
             <p style="margin: 0 0 1rem 0; color: var(--muted); font-size: 0.875rem;">${email}</p>
             ${bio ? `<p style="margin: 0 0 1rem 0; color: var(--fg); font-size: 0.875rem;">${bio}</p>` : ''}
             ${whatISell ? `<p style="margin: 0 0 1rem 0; color: var(--muted); font-size: 0.875rem;"><strong>What I sell:</strong> ${whatISell}</p>` : ''}
             <div style="margin-top: 2rem; padding: 1rem; background: var(--secondary); border-radius: 12px;">
               <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary);">€0.00</div>
               <div style="font-size: 0.875rem; color: var(--muted);">Current Balance</div>
             </div>
           </div>
         </div>
       </div>
     </div>
   `;

   // Remove existing modal if any
   const existingModal = document.getElementById('profilePreviewModal');
   if (existingModal) existingModal.remove();

   // Add modal to body
   document.body.insertAdjacentHTML('beforeend', modalHtml);
   document.body.style.overflow = 'hidden';
 }

 // Make closeProfilePreview global
 window.closeProfilePreview = function() {
   const modal = document.getElementById('profilePreviewModal');
   if (modal) {
     modal.remove();
     document.body.style.overflow = 'auto';
   }
 };

// Sell page functions - MOVED TO src/pages/sell.js
function initializeSellPage() {
  // Sell page is now handled by src/pages/sell.js to avoid conflicts
  // This function is kept for reference but does nothing
  if (document.getElementById('sellForm')) {
    console.log('initializeSellPage() - Sell page is handled by src/pages/sell.js');
  }
}

// ============================
// Login page functions - MOVED TO src/pages/login.js
// ============================
// The login form handler is now in src/pages/login.js to avoid conflicts
function initializeLoginPage() {
  // Login page is now handled by src/pages/login.js
  // This function is kept for reference but does nothing
  console.log('initializeLoginPage() - Login is handled by src/pages/login.js');
}

// Register page functions
function initializeRegisterPage() {
  if (!document.getElementById('registerForm')) return;

  const registerForm = document.getElementById('registerForm');
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('usernameInput')?.value.trim() || '';
    const email = document.getElementById('emailInput')?.value.trim() || '';
    const password = document.getElementById('passwordInput')?.value || '';
    const confirmPassword = document.getElementById('confirmPasswordInput')?.value || '';

    if (password !== confirmPassword) {
      showToast(i18n.t ? i18n.t('passwords_not_match') || 'Passwords do not match' : 'Passwords do not match', 'error');
      return;
    }

    if (password.length < 6) {
      showToast(i18n.t ? i18n.t('password_too_short') || 'Password must be at least 6 characters' : 'Password must be at least 6 characters', 'error');
      return;
    }

    try {
      const result = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username
          }
        }
      });

      // supabase v2 returns error property on result
      if (result.error) throw result.error;

      showToast(i18n.t ? i18n.t('registration_success') || 'Registration successful! Please check your email to verify your account.' : 'Registration successful! Please check your email to verify your account.');
      window.location.href = 'login.html';
    } catch (error) {
      console.error('Registration error:', error);
      showToast(error.message || 'Registration failed. Please try again.', 'error');
    }
  });
}

// Balance page functions
function initializeBalancePage() {
  if (!document.getElementById('currentBalance')) return;

  async function loadUserBalance() {
    try {
      const { data } = await supabase.auth.getUser();
      const user = data ? data.user : null;
      if (!user) return;

      const resp = await supabase.from('users').select('balance').eq('id', user.id).single();
      const el = document.getElementById('currentBalance');
      if (!resp.error && resp.data) {
        const balance = parseFloat(resp.data.balance || 0);
        if (el) el.innerText = `€${balance.toFixed(2)}`;
      } else {
        if (el) el.innerText = '€0.00';
      }
      loadTransactions(user.id);
    } catch (error) {
      console.error('Error loading user balance:', error);
    }
  }

  const addFundsBtn = document.getElementById('addFundsBtn');
  if (addFundsBtn) {
    addFundsBtn.addEventListener('click', async () => {
      const amountInput = document.getElementById('fundAmount');
      const amount = parseFloat(amountInput?.value || '0');
      if (isNaN(amount) || amount <= 0) {
        showToast('Enter a valid amount', 'error');
        return;
      }

      const { data } = await supabase.auth.getUser();
      const user = data ? data.user : null;
      if (!user) {
        showToast('Please login first', 'error');
        return;
      }

      try {
        const mod = await import('./supabase.js');
        if (mod && typeof mod.addBalance === 'function') {
          await mod.addBalance(user.id, amount);
          await loadUserBalance();
          if (amountInput) amountInput.value = '';
          showToast('Funds added successfully!', 'success');
        } else {
          throw new Error('addBalance helper not found');
        }
      } catch (error) {
        console.error('Failed to add funds:', error);
        showToast('Failed to add funds', 'error');
      }
    });
  }

  async function loadTransactions(userId) {
    try {
      const { data, error } = await supabase.from('user_transactions').select().eq('user_id', userId).order('created_at', { ascending: false });
      const container = document.getElementById('transactionHistory');
      if (!container) return;
      container.innerHTML = '';
      if (!error && data && data.length) {
        data.forEach(tx => {
          const div = document.createElement('div');
          div.className = 'transaction-item';
          const typeIcon = tx.transaction_type === 'deposit' ? '➕' : '➖';
          const amt = Number.isFinite(Number(tx.amount)) ? Math.abs(Number(tx.amount)).toFixed(2) : '0.00';
          const when = tx.created_at ? new Date(tx.created_at).toLocaleString() : '';
          div.innerHTML = `<span>${typeIcon} €${amt}</span> <span>${when}</span>`;
          container.appendChild(div);
        });
      } else {
        container.innerHTML = `<p data-i18n="no_tx">No transactions yet.</p>`;
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  }

  loadUserBalance();
}

// ============================
// INITIALIZATION
// ============================

document.addEventListener('DOMContentLoaded', () => {
  // Initialize common functionality
  initializeNavigation();
  initializeAuth();
  // Theme is initialized automatically by theme.js
  themeManager.init(); // Ensure it's initialized
  initializeLanguage();

  // Initialize page-specific functionality
  // These functions already guard by checking for page-specific elements
  initializeIndexPage();
  initializeSettingsPage();
  initializeSellPage();
  initializeLoginPage();
  initializeRegisterPage();
  initializeBalancePage();
  });
