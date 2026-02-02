import { supabase } from '../supabase.js';
import { i18n } from '../i18n.js';
import '../main.js';

// ============================
// Check for redirect reason and show message
// ============================
(function checkRedirectReason() {
  const urlParams = new URLSearchParams(window.location.search);
  const reason = urlParams.get('reason');
  const redirect = urlParams.get('redirect');
  
  if (reason) {
    const messages = {
      'chat': 'You must be logged in to access the chat feature.',
      'settings': 'You must be logged in to access your settings.',
      'products': 'You must be logged in to view your products.'
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
// Resend Verification Email
// ============================
document.getElementById('resendVerificationLink')?.addEventListener('click', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('emailInput').value.trim();
  
  if (!email) {
    alert('Please enter your email address first, then click the resend link.');
    return;
  }
  
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email
    });
    
    if (error) {
      alert('Error resending verification email: ' + error.message);
    } else {
      alert('✅ Verification email sent!\n\nPlease check your email inbox and click the verification link.\n\nIf you don\'t see the email, check your spam folder.');
    }
  } catch (error) {
    alert('Error resending verification email: ' + error.message);
  }
});

// ============================
// Login Form Submission
// ============================
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('emailInput').value.trim();
  const password = document.getElementById('passwordInput').value;

  if (!email || !password) {
    alert('Please fill in all fields');
    return;
  }

  try {
    // First authenticate the user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (authError) {
      showLoginError('Login failed', authError);
      return;
    }
    
    // Check if email is confirmed
    if (authData.user && !authData.user.email_confirmed_at) {
      alert('🔐 Email Verification Required\n\nYour email address has not been verified yet.\n\nPlease check your email inbox and click the verification link to activate your account.\n\nIf you did not receive the email, check your spam folder or request a new verification email.');
      await supabase.auth.signOut();
      return;
    }
    
    // Success - redirect to home
    window.location.href = 'index.html';
  } catch (error) {
    showLoginError('Login failed', error);
  }
});
