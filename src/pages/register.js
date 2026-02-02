import { supabase } from '../supabase.js';
import { i18n } from '../i18n.js';

// ============================
// Language Setup
// ============================
document.getElementById('langSelect').addEventListener('change', e => {
  i18n.setLang(e.target.value);
});

// ============================
// Dark/Light Mode Toggle
// ============================
// Initialize theme on page load
const savedTheme = localStorage.getItem("theme") || "light";
document.documentElement.classList.add(savedTheme);
document.documentElement.setAttribute("data-theme", savedTheme);
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
  themeToggle.textContent = savedTheme === "dark" ? "☀️" : "🌙";
  themeToggle.addEventListener('click', () => {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.classList.remove('dark', 'light');
    html.classList.add(newTheme);
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
  });
}

// ============================
// Hamburger Mobile Menu
// ============================
document.getElementById('hamburgerBtn').addEventListener('click', () => {
  document.querySelector('.navbar-links').classList.toggle('active');
});

// ============================
// Supabase Auth
// ============================
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const balanceBadge = document.getElementById('balanceBadge');

async function loadUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if(user) {
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'flex';
    const { data } = await supabase.from('users').select('balance').eq('id', user.id).single();
    balanceBadge.querySelector('span').innerText = `€${parseFloat(data.balance).toFixed(2)}`;
    balanceBadge.style.display = 'flex';
  } else {
    loginBtn.style.display = 'flex';
    logoutBtn.style.display = 'none';
    balanceBadge.style.display = 'none';
  }
}

loginBtn.addEventListener('click', async () => {
  window.location.href = 'login.html';
});

logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
  window.location.href = 'index.html';
});

loadUser();

// ============================
// Registration Form Submission
// ============================
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('usernameInput').value.trim();
  const email = document.getElementById('emailInput').value.trim();
  const password = document.getElementById('passwordInput').value;
  const confirmPassword = document.getElementById('confirmPasswordInput').value;
  const acceptTerms = document.getElementById('acceptTerms').checked;
  const termsError = document.getElementById('termsError');

  // Validation
  if (password !== confirmPassword) {
    alert(i18n.t('passwords_not_match') || 'Passwords do not match');
    return;
  }

  if (password.length < 6) {
    alert(i18n.t('password_too_short') || 'Password must be at least 6 characters');
    return;
  }

  // Terms acceptance validation
  if (!acceptTerms) {
    termsError.classList.add('show');
    alert('⚠️ ANTI-SCAM POLICY ACKNOWLEDGMENT REQUIRED\n\nYou must read and accept the Terms of Service and Anti-Scam Policy to create an account.\n\nScamming activities are illegal and may result in criminal prosecution.');
    return;
  }
  termsError.classList.remove('show');

  // Anti-scam warning before final submission
  const confirmScamWarning = confirm(
    '⚠️ IMPORTANT ANTI-SCAM WARNING\n\n' +
    'By proceeding, you acknowledge that:\n' +
    '• Scamming is a serious crime\n' +
    '• You may face criminal prosecution\n' +
    '• You may be sued civilly\n' +
    '• We cooperate with law enforcement\n\n' +
    'Do you acknowledge and agree?'
  );
  
  if (!confirmScamWarning) {
    return;
  }

  try {
    // Register user with Supabase
    const result = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
          accepted_terms_at: new Date().toISOString(),
          accepted_terms_version: '2026-01'
        }
      }
    });

    if (result.error) throw result.error;

    alert('✅ Registration Successful!\n\n📧 Please check your email inbox for the verification link.\n\n⚠️ You must verify your email before you can log in and use the platform.');
    window.location.href = 'login.html';

  } catch (error) {
    console.error('Registration error:', error);
    alert(error.message || 'Registration failed. Please try again.');
  }
});
