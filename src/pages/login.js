import { supabase } from '../supabase.js';
import { i18n } from '../i18n.js';

console.log('login.js module loaded');

// ============================
// Check if already logged in - redirect to home
// ============================
(async function checkAlreadyLoggedIn() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session && session.user) {
    console.log('Already logged in as:', session.user.email);
    window.location.href = 'index.html';
    return;
  }
  console.log('Not logged in, showing login form');
})();

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
    
    // Start the cooldown timer
    startResendCooldown();
    
    // Show the message after a short delay
    setTimeout(() => {
      alert('📧 Email Verification Required\n\nPlease verify your email address to log in.\n\nEnter your email and click "Resend Verification Email" if you need a new verification link.');
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
    setTimeout(() => {
      alert('🔐 ' + message);
    }, 100);
  }
})();

// Helper function to show error with details
function showLoginError(message, error) {
  const errorMessage = error?.message || error || 'Unknown error';
  console.error('Login Error:', errorMessage);
  
  // Check for common Supabase errors
  if (errorMessage.includes('Invalid API key')) {
    alert('❌ Invalid API Key\n\nYour Supabase credentials are incorrect.\n\nPlease check your .env file has the correct:\n- VITE_SUPABASE_URL\n- VITE_SUPABASE_ANON_KEY\n\nSee .env.example for the correct format.');
  } else if (errorMessage.includes('auth')) {
    alert('🔐 Authentication Error: ' + errorMessage);
  } else {
    alert(message + ': ' + errorMessage);
  }
}

// ============================
// Resend Verification Email with Countdown
// ============================
let resendCooldown = 0;

function startResendCooldown() {
  const resendLink = document.getElementById('resendVerificationLink');
  if (!resendLink) return;
  
  resendCooldown = 60;
  updateResendButton();
  
  const interval = setInterval(() => {
    resendCooldown--;
    updateResendButton();
    
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

// Initialize cooldown on page load if coming from verify_required
(function initResendCooldown() {
  const urlParams = new URLSearchParams(window.location.search);
  const reason = urlParams.get('reason');
  
  if (reason === 'verify_required') {
    // Start the cooldown timer automatically
    setTimeout(() => {
      const email = document.getElementById('emailInput')?.value.trim();
      if (!email) {
        // If email not entered yet, enable immediately
        resendCooldown = 0;
        updateResendButton();
      } else {
        startResendCooldown();
      }
    }, 1000);
  }
})();

// Resend verification button (in resend verification form)
document.getElementById('resendVerificationBtn')?.addEventListener('click', async () => {
  const email = document.getElementById('verificationEmailInput').value.trim();
  
  if (!email) {
    alert('Please enter your email address.');
    document.getElementById('verificationEmailInput').focus();
    return;
  }
  
  if (resendCooldown > 0) {
    alert(`Please wait ${resendCooldown} seconds before requesting another verification email.`);
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
      alert('❌ Error Resending Verification Email\n\n' + (error.message || 'Unknown error') + '\n\nPlease try again.');
    } else {
      alert('✅ Verification Email Sent!\n\nPlease check your email inbox and click the verification link.\n\nIf you don\'t see the email, check your spam folder.\n\nYou can request another email in 60 seconds.');
      startResendCooldown();
    }
  } catch (error) {
    alert('❌ Error Resending Verification Email\n\n' + (error.message || 'Unknown error') + '\n\nPlease try again.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Resend Verification Email';
  }
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
    alert('Please enter your email address.');
    return;
  }
  
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/login.html?reason=password_reset'
    });
    
    if (error) {
      alert('❌ Error Sending Reset Link\n\n' + (error.message || 'Unknown error') + '\n\nPlease try again.');
    } else {
      alert('✅ Reset Link Sent!\n\nCheck your email inbox for the password reset link.\n\nIf you don\'t see the email, check your spam folder.\n\nThe link will expire in 24 hours.');
      // Switch back to login form
      document.getElementById('loginForm').style.display = 'flex';
      document.getElementById('forgotPasswordForm').style.display = 'none';
    }
  } catch (error) {
    alert('❌ Error Sending Reset Link\n\n' + (error.message || 'Unknown error') + '\n\nPlease try again.');
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
  console.log('📝 Login form submitted');

  const email = document.getElementById('emailInput').value.trim();
  const password = document.getElementById('passwordInput').value;

  if (!email || !password) {
    console.log('❌ Missing email or password');
    alert('Please fill in all fields');
    return;
  }

  console.log('🔐 Attempting login for:', email);
  loginHandled = false;

  try {
    // Make the login call directly
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      loginHandled = true;
      console.log('❌ Auth error:', error.message);
      showLoginError('Login failed', error);
      return;
    }
    
    if (data.session) {
      console.log('✅ Login successful for:', data.session.user.email);
      loginHandled = true;
      
      // Force a small delay to let the browser render the navbar update
      // Use requestAnimationFrame + setTimeout to ensure the DOM updates
      await new Promise(resolve => requestAnimationFrame(resolve));
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Redirect to index
      console.log('🔄 Redirecting to index.html...');
      window.location.href = 'index.html';
    }
  } catch (err) {
    console.error('❌ Login error:', err);
    showLoginError('Login failed', err);
    loginHandled = true;
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
        alert('✅ Password Reset Link Valid!\n\nYour password reset link is valid.\n\nPlease enter your new password below.\n\nAfter changing your password, you will need to log in again.');
        window.location.href = 'settings.html?tab=password';
        return;
      }
      
      document.body.removeChild(loadingMsg);
      alert('⚠️ Password Reset Issue\n\nUnable to process the password reset link.\n\nPlease try again or request a new reset link.');
      window.location.href = 'login.html';
      
    } catch (error) {
      console.error('Error processing password reset:', error);
      document.body.removeChild(loadingMsg);
      alert('⚠️ Password Reset Error\n\n' + (error.message || 'Unknown error') + '\n\nPlease try again.');
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
          alert('✅ Email Verified Successfully!\n\nYour email address has been confirmed. You are now logged in.\n\nWelcome to Vendly!');
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
          alert('⚠️ Verification in Progress\n\nThe verification link was received, but there was a network issue processing it.\n\nPlease try logging in with your email and password.');
        } else {
          alert('⚠️ Verification Issue\n\n' + (exchangeError.message || 'Unable to verify email.') + '\n\nPlease try logging in or request a new verification email.');
        }
        window.location.href = 'login.html?reason=verify_required';
        return;
      }
      
      if (data.user && data.user.email_confirmed_at) {
        document.body.removeChild(loadingMsg);
        alert('✅ Email Verified Successfully!\n\nYour email address has been confirmed. You are now logged in.\n\nWelcome to Vendly!');
        window.location.href = 'index.html';
      } else {
        document.body.removeChild(loadingMsg);
        alert('⚠️ Verification Pending\n\nYour verification link is being processed.\n\nIf your email is not confirmed yet, please wait a moment and refresh the page.');
        window.location.href = 'login.html?reason=verify_required';
      }
      
    } catch (error) {
      console.error('Error processing auth callback:', error);
      document.body.removeChild(loadingMsg);
      
      alert('⚠️ Verification Error\n\nThere was an error processing your verification link.\n\nError: ' + (error.message || 'Unknown error'));
      window.location.href = 'login.html?reason=verify_required';
    }
  }
})();
