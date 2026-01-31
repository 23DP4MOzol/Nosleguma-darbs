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

  // Validation
  if (password !== confirmPassword) {
    alert(i18n.t('passwords_not_match') || 'Passwords do not match');
    return;
  }

  if (password.length < 6) {
    alert(i18n.t('password_too_short') || 'Password must be at least 6 characters');
    return;
  }

  try {
    // Register user with Supabase
    const result = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username
        }
      }
    });

    if (result.error) throw result.error;

    alert(i18n.t('registration_success') || 'Registration successful! Please check your email to verify your account.');
    window.location.href = 'login.html';

  } catch (error) {
    console.error('Registration error:', error);
    alert(error.message || 'Registration failed. Please try again.');
  }
});
