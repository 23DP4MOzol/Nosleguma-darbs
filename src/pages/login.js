import { supabase } from '../supabase.js';
import { i18n } from '../i18n.js';
import { showInfoModal } from '../ui/modal.js';
import { logAuditEvent } from '../audit.js';

console.log('login.js module loaded');

const VERIFY_RESEND_UNLOCK_MS = 15 * 60 * 1000; // 15 minutes
const VERIFY_STATE_STORAGE_KEY = 'vendly_verify_email_state';

function clearFallbackSession() {
  try { localStorage.removeItem('vendly_fallback_session'); } catch (e) {}
}

function isEmailVerified(user) {
  return !!(user && user.email_confirmed_at);
}

function readVerifyState() {
  try {
    const raw = localStorage.getItem(VERIFY_STATE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (!parsed.email || !parsed.startedAt) return null;
    return parsed;
  } catch (e) {
    return null;
  }
}

function computeResendUnlockRemainingMs(email) {
  const state = readVerifyState();
  if (!state) return 0;
  if (String(state.email).toLowerCase() !== String(email || '').toLowerCase()) return 0;
  const startedAtMs = typeof state.startedAt === 'number' ? state.startedAt : Date.parse(state.startedAt);
  if (!Number.isFinite(startedAtMs)) return 0;
  const elapsed = Date.now() - startedAtMs;
  const remaining = VERIFY_RESEND_UNLOCK_MS - elapsed;
  return remaining > 0 ? remaining : 0;
}

function formatMmSs(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const ss = String(totalSeconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

// ============================
// Check if already logged in - redirect to home
// ============================
(async function checkAlreadyLoggedIn() {
  // Check for existing session immediately
  const { data: { session } } = await supabase.auth.getSession();
  if (session && session.user) {
    console.log('Already logged in as:', session.user.email);
    // Only allow verified users to remain logged in
    if (isEmailVerified(session.user)) {
      window.location.href = 'index.html';
      return;
    }

    console.warn('Unverified user had a session; signing out and requiring verification');
    try { logAuditEvent('auth_session_unverified_logout', { email: session.user.email || null }); } catch (e) {}
    await supabase.auth.signOut();
    clearFallbackSession();
    window.location.href = 'login.html?reason=verify_required&blocked=1&email=' + encodeURIComponent(session.user.email || '');
    return;
  }
  console.log('Not logged in, showing login form');
})();

// ============================
// Password Visibility Toggle
// ============================
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('passwordInput');

if (togglePassword && passwordInput) {
  togglePassword.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    togglePassword.textContent = type === 'password' ? '👁️' : '🙈';
  });
}

// ============================
// Check for redirect reason and show message/form
// ============================
(function checkRedirectReason() {
  console.log('checkRedirectReason running');
  const urlParams = new URLSearchParams(window.location.search);
  const reason = urlParams.get('reason');
  const redirect = urlParams.get('redirect');
  
  if (reason === 'verify_required') {
    // Hide login form, show resend verification form
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('resendVerificationForm').style.display = 'flex';
    
    // If email was passed in redirect, pre-fill it
    const redirectEmail = urlParams.get('email');
    if (redirectEmail) {
      document.getElementById('verificationEmailInput').value = decodeURIComponent(redirectEmail);
    }

    // Gate resending for 15 minutes after registration when we have a timestamp
    try {
      const email = (document.getElementById('verificationEmailInput')?.value || '').trim();
      if (email) {
        const remainingMs = computeResendUnlockRemainingMs(email);
        setResendUnlockRemainingMs(remainingMs);
      } else {
        setResendUnlockRemainingMs(0);
      }
    } catch (e) {
      setResendUnlockRemainingMs(0);
    }
    
    // Show the message after a short delay
    setTimeout(async () => {
      const blocked = urlParams.get('blocked') === '1';
      const msg = blocked
        ? 'You must verify your email address before you can log in.\n\nPlease check your inbox (and spam folder) for the verification link.'
        : 'Please verify your email address to log in.\n\nIf you have not received the email after 15 minutes, you will be able to resend a new verification link.';
      await showInfoModal(msg, 'Email Verification Required');
    }, 500);
    return;
  }
  
  if (reason) {
    const messages = {
      'chat': 'You must be logged in to access the chat feature.',
      'settings': 'You must be logged in to access your settings.',
      'products': 'You must be logged in to view your products.',
      'password_reset': 'Password reset link sent. Please check your email.',
      'password_changed': 'Password changed successfully. Please log in with your new password.'
    };
    
    const message = messages[reason] || 'You must be logged in to access this page.';
    
    // Show the message after a short delay to let the page load
    setTimeout(async () => {
      await showInfoModal(message, 'Login Required');
    }, 100);
  }
})();

// Helper function to show error with details
async function showLoginError(message, error) {
  const errorMessage = error?.message || error || 'Unknown error';
  console.error('Login Error:', errorMessage);
  
  // Check for common Supabase errors
  if (errorMessage.includes('Invalid API key')) {
    await showInfoModal('Your Supabase credentials are incorrect.\n\nPlease check your .env file has the correct:\n- VITE_SUPABASE_URL\n- VITE_SUPABASE_ANON_KEY\n\nSee .env.example for the correct format.', 'Invalid API Key');
  } else if (errorMessage.includes('auth')) {
    await showInfoModal('Authentication Error: ' + errorMessage, 'Error');
  } else {
    await showInfoModal(message + ': ' + errorMessage, 'Error');
  }
}

// ============================
// Resend Verification Email with Countdown
// ============================
let resendCooldown = 0;
let resendUnlockRemainingMs = 0;
let resendUnlockInterval = null;

function setResendUnlockRemainingMs(ms) {
  resendUnlockRemainingMs = Math.max(0, ms || 0);
  if (resendUnlockInterval) {
    clearInterval(resendUnlockInterval);
    resendUnlockInterval = null;
  }

  // If locked, start ticking down
  if (resendUnlockRemainingMs > 0) {
    resendUnlockInterval = setInterval(() => {
      resendUnlockRemainingMs = Math.max(0, resendUnlockRemainingMs - 1000);
      updateResendUi();
      if (resendUnlockRemainingMs <= 0) {
        clearInterval(resendUnlockInterval);
        resendUnlockInterval = null;
      }
    }, 1000);
  }
  updateResendUi();
}

function startResendCooldown() {
  const resendLink = document.getElementById('resendVerificationLink');
  if (!resendLink) return;
  
  resendCooldown = 60;
  updateResendUi();
  
  const interval = setInterval(() => {
    resendCooldown--;
    updateResendUi();
    
    if (resendCooldown <= 0) {
      clearInterval(interval);
    }
  }, 1000);
}

function updateResendButton() {
  const resendLink = document.getElementById('resendVerificationLink');
  if (!resendLink) return;
  
  if (resendCooldown > 0) {
    resendLink.textContent = `Resend in ${resendCooldown}s`;
    resendLink.classList.add('cooldown');
    resendLink.style.pointerEvents = 'none';
    resendLink.style.opacity = '0.6';
  } else {
    resendLink.textContent = 'Resend verification email';
    resendLink.classList.remove('cooldown');
    resendLink.style.pointerEvents = '';
    resendLink.style.opacity = '';
  }
}

function updateResendUi() {
  // Update both the inline link (if present) and the main resend button
  updateResendButton();

  const btn = document.getElementById('resendVerificationBtn');
  if (!btn) return;

  const locked = resendUnlockRemainingMs > 0;
  const cooling = resendCooldown > 0;

  if (locked) {
    btn.disabled = true;
    btn.textContent = `Resend available in ${formatMmSs(resendUnlockRemainingMs)}`;
    return;
  }

  if (cooling) {
    btn.disabled = true;
    btn.textContent = `Resend in ${resendCooldown}s`;
    return;
  }

  btn.disabled = false;
  btn.textContent = 'Resend Verification Email';
}

// Initialize cooldown on page load if coming from verify_required
(function initResendCooldown() {
  const urlParams = new URLSearchParams(window.location.search);
  const reason = urlParams.get('reason');
  
  if (reason === 'verify_required') {
    // Don't auto-start cooldown; only start after an actual resend.
    // Just ensure UI reflects current lock/cooldown states.
    setTimeout(() => updateResendUi(), 250);
  }
})();

// Resend verification button (in resend verification form)
document.getElementById('resendVerificationBtn')?.addEventListener('click', async () => {
  const email = document.getElementById('verificationEmailInput').value.trim();
  
  if (!email) {
    await showInfoModal('Please enter your email address.', 'Info');
    document.getElementById('verificationEmailInput').focus();
    return;
  }
  
  if (resendUnlockRemainingMs > 0) {
    await showInfoModal(`For security reasons, you can request a new verification email in ${formatMmSs(resendUnlockRemainingMs)}.\n\nPlease also check your spam folder.`, 'Info');
    return;
  }

  if (resendCooldown > 0) {
    await showInfoModal(`Please wait ${resendCooldown} seconds before requesting another verification email.`, 'Info');
    return;
  }
  
  // Disable button during send
  const btn = document.getElementById('resendVerificationBtn');
  btn.disabled = true;
  btn.textContent = 'Sending...';
  
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email
    });
    
    if (error) {
      await showInfoModal('Error resending verification email.\n\n' + (error.message || 'Unknown error') + '\n\nPlease try again.', 'Error');
    } else {
      try { logAuditEvent('auth_resend_verification', { email }); } catch (e) {}
      await showInfoModal('Please check your email inbox and click the verification link.\n\nIf you don\'t see the email, check your spam folder.\n\nYou can request another email in 60 seconds.', 'Verification Email Sent');
      startResendCooldown();
    }
  } catch (error) {
    await showInfoModal('Error resending verification email.\n\n' + (error.message || 'Unknown error') + '\n\nPlease try again.', 'Error');
  } finally {
    // Button enabled/disabled depends on cooldown + unlock timer
    updateResendUi();
  }
});

// If user edits the email on the verify screen, recompute the 15-min unlock window
document.getElementById('verificationEmailInput')?.addEventListener('input', () => {
  try {
    const email = (document.getElementById('verificationEmailInput')?.value || '').trim();
    const remainingMs = computeResendUnlockRemainingMs(email);
    setResendUnlockRemainingMs(remainingMs);
  } catch (e) {
    setResendUnlockRemainingMs(0);
  }
});

// Inline "Resend verification email" link from login form
document.getElementById('resendVerificationLink')?.addEventListener('click', (e) => {
  e.preventDefault();
  // Show the resend verification form and hide the login form
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('resendVerificationForm').style.display = 'flex';

  // Pre-fill email if available
  const email = document.getElementById('emailInput')?.value.trim();
  if (email) document.getElementById('verificationEmailInput').value = email;

  // Apply 15-minute unlock gating if we have a timestamp
  const remainingMs = computeResendUnlockRemainingMs(email);
  setResendUnlockRemainingMs(remainingMs);
  updateResendUi();
});

// ============================
// Forgot Password Functionality
// ============================

// Toggle to forgot password form
document.getElementById('forgotPasswordLink')?.addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('forgotPasswordForm').style.display = 'flex';
  
  // If email was entered in login form, copy it to reset form
  const email = document.getElementById('emailInput').value.trim();
  if (email) {
    document.getElementById('resetEmailInput').value = email;
  }
});

// Toggle back to login form
document.getElementById('backToLoginLink')?.addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('loginForm').style.display = 'flex';
  document.getElementById('forgotPasswordForm').style.display = 'none';
});

// Forgot password form submission
document.getElementById('forgotPasswordForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('resetEmailInput').value.trim();
  
  if (!email) {
    await showInfoModal('Please enter your email address.', 'Info');
    return;
  }
  
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/login.html?reason=password_reset'
    });
    
    if (error) {
      await showInfoModal('Error sending reset link.\n\n' + (error.message || 'Unknown error') + '\n\nPlease try again.', 'Error');
    } else {
      await showInfoModal('Check your email inbox for the password reset link.\n\nIf you don\'t see the email, check your spam folder.\n\nThe link will expire in 24 hours.', 'Reset Link Sent');
      // Switch back to login form
      document.getElementById('loginForm').style.display = 'flex';
      document.getElementById('forgotPasswordForm').style.display = 'none';
    }
  } catch (error) {
    await showInfoModal('Error sending reset link.\n\n' + (error.message || 'Unknown error') + '\n\nPlease try again.', 'Error');
  }
});

// ============================
// Login Form Submission
// ============================
console.log('🎯 Setting up login form listener...');

// Track if we've already handled this login
let loginHandled = false;

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Prevent duplicate submissions - check if already logged in
  if (loginHandled) {
    console.log('Login already handled, ignoring duplicate submit');
    return;
  }
  
  // Double-check: if already logged in, redirect to home
  const { data: { session } } = await supabase.auth.getSession();
  if (session && session.user) {
    console.log('Already logged in as:', session.user.email);
    if (isEmailVerified(session.user)) {
      loginHandled = true;
      window.location.href = 'index.html';
      return;
    }

    await supabase.auth.signOut();
    clearFallbackSession();
    window.location.href = 'login.html?reason=verify_required&blocked=1&email=' + encodeURIComponent(session.user.email || '');
    return;
  }
  
  console.log('📝 Login form submitted');

  const email = document.getElementById('emailInput').value.trim();
  const password = document.getElementById('passwordInput').value;

  if (!email || !password) {
    console.log('❌ Missing email or password');
    loginHandled = false;
    await showInfoModal('Please fill in all fields.', 'Info');
    return;
  }

  console.log('🔐 Attempting login for:', email);
  loginHandled = true;

  // Disable the submit button to prevent double submissions
  const submitBtn = document.getElementById('loginForm').querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';
  }

  try {
    // Make the login call directly
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      loginHandled = false; // Reset on error so user can try again
      console.log('❌ Auth error:', error.message);
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
      }
      await showLoginError('Login failed', error);
      return;
    }
    
    if (data.session) {
      console.log('✅ Login successful for:', data.session.user.email);

      // Block unverified accounts from proceeding
      if (!isEmailVerified(data.session.user)) {
        console.warn('Login blocked: email not verified');
        try { logAuditEvent('auth_login_blocked_unverified', { email }); } catch (e) {}
        try { await supabase.auth.signOut(); } catch (e) {}
        clearFallbackSession();
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Login';
        }
        loginHandled = false;
        window.location.href = 'login.html?reason=verify_required&blocked=1&email=' + encodeURIComponent(email);
        return;
      }

      try { logAuditEvent('auth_login_success', { email }); } catch (e) {}
      
      // Store session in localStorage as a fallback
      // This helps on static hosting where cookies might not persist immediately
      try {
        const sessionData = {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
          user: {
            id: data.session.user.id,
            email: data.session.user.email,
            email_confirmed_at: data.session.user.email_confirmed_at
          }
        };
        localStorage.setItem('vendly_fallback_session', JSON.stringify(sessionData));
        console.log('📦 Session stored in localStorage fallback');
      } catch (storageError) {
        console.warn('Could not store session in localStorage:', storageError.message);
      }
      
      // Redirect to index
      console.log('🔄 Redirecting to index.html...');
      window.location.href = 'index.html';
    }
  } catch (err) {
    loginHandled = false; // Reset on error so user can try again
    console.error('❌ Login error:', err);
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Login';
    }
    await showLoginError('Login failed', err);
  }
});

// ============================
// Check for email confirmation hash and auto-login
// ============================
(async function checkEmailConfirmation() {
  const hash = window.location.hash;
  const search = window.location.search;
  const urlParams = new URLSearchParams(search);
  
  // Check for password reset callback first
  if (hash.includes('access_token') && (urlParams.get('type') === 'recovery' || hash.includes('type=recovery'))) {
    console.log('Password reset callback detected, processing...');
    
    // Show loading indicator
    const loadingMsg = document.createElement('div');
    loadingMsg.id = 'authLoading';
    loadingMsg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.8);color:white;padding:20px 40px;border-radius:10px;z-index:9999;font-size:18px;';
    loadingMsg.textContent = '🔐 Processing password reset...';
    document.body.appendChild(loadingMsg);
    
    try {
      // Wait for Supabase to process the URL
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if session is active
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session && session.user) {
        console.log('Password reset session recovered');
        
        // Clear the URL
        window.history.replaceState(null, '', window.location.pathname);
        
        // Show success and redirect to login
        document.body.removeChild(loadingMsg);
        await showInfoModal('Your password reset link is valid.\n\nPlease enter your new password below.\n\nAfter changing your password, you will need to log in again.', 'Password Reset Link Valid');
        window.location.href = 'settings.html?tab=password';
        return;
      }
      
      document.body.removeChild(loadingMsg);
      await showInfoModal('Unable to process the password reset link.\n\nPlease try again or request a new reset link.', 'Password Reset Issue');
      window.location.href = 'login.html';
      
    } catch (error) {
      console.error('Error processing password reset:', error);
      document.body.removeChild(loadingMsg);
      await showInfoModal('Password reset error.\n\n' + (error.message || 'Unknown error') + '\n\nPlease try again.', 'Password Reset Error');
      window.location.href = 'login.html';
    }
    return;
  }
  
  // Check for email confirmation
  if (hash.includes('access_token') || search.includes('access_token') || 
      hash.includes('token') || search.includes('token') ||
      hash.includes('type=signup') || search.includes('type=signup')) {
    console.log('Auth callback detected, processing...');
    
    // Show loading indicator
    const loadingMsg = document.createElement('div');
    loadingMsg.id = 'authLoading';
    loadingMsg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.8);color:white;padding:20px 40px;border-radius:10px;z-index:9999;font-size:18px;';
    loadingMsg.textContent = '🔐 Verifying your email...';
    document.body.appendChild(loadingMsg);
    
    try {
      // Wait for Supabase to process the URL
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Try to get the session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session && session.user) {
        console.log('Session recovered from auth callback', session.user.email);
        
        // Clear the URL
        window.history.replaceState(null, '', window.location.pathname);
        
        if (session.user.email_confirmed_at) {
          // Email is verified - redirect to index (home page)
          document.body.removeChild(loadingMsg);
          await showInfoModal('Your email address has been confirmed. You are now logged in.\n\nWelcome to Vendly!', 'Email Verified Successfully');
          window.location.href = 'index.html';
          return;
        }
      }
      
      // If no session yet, try to exchange the code/token
      const { data, error: exchangeError } = await supabase.auth.getUser();
      
      if (exchangeError) {
        console.error('Error exchanging auth code:', exchangeError);
        document.body.removeChild(loadingMsg);
        
        // Check if it's a network error
        if (exchangeError.message.includes('network') || exchangeError.message.includes('fetch')) {
          await showInfoModal('The verification link was received, but there was a network issue processing it.\n\nPlease try logging in with your email and password.', 'Verification in Progress');
        } else {
          await showInfoModal((exchangeError.message || 'Unable to verify email.') + '\n\nPlease try logging in or request a new verification email.', 'Verification Issue');
        }
        window.location.href = 'login.html?reason=verify_required';
        return;
      }
      
      if (data.user && data.user.email_confirmed_at) {
        document.body.removeChild(loadingMsg);
        await showInfoModal('Your email address has been confirmed. You are now logged in.\n\nWelcome to Vendly!', 'Email Verified Successfully');
        window.location.href = 'index.html';
      } else {
        document.body.removeChild(loadingMsg);
        await showInfoModal('Your verification link is being processed.\n\nIf your email is not confirmed yet, please wait a moment and refresh the page.', 'Verification Pending');
        window.location.href = 'login.html?reason=verify_required';
      }
      
    } catch (error) {
      console.error('Error processing auth callback:', error);
      document.body.removeChild(loadingMsg);
      
      await showInfoModal('There was an error processing your verification link.\n\nError: ' + (error.message || 'Unknown error'), 'Verification Error');
      window.location.href = 'login.html?reason=verify_required';
    }
  }
})();
