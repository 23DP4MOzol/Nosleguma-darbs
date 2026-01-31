import { supabase, loginUser } from '../supabase.js';
import { i18n } from '../i18n.js';
import '../main.js';

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
    const result = await loginUser(email, password);
    if (result.error) {
      showLoginError('Login failed', result.error);
      return;
    }

    // Success - redirect to home
    window.location.href = 'index.html';
  } catch (error) {
    showLoginError('Login failed', error);
  }
});
