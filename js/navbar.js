// ============================
// NAVBAR FUNCTIONALITY
// ============================

// --- HAMBURGER MENU TOGGLE ---
const hamburgerBtn = document.getElementById("hamburgerBtn");
const navbarLinks = document.querySelector(".navbar-links");

if (hamburgerBtn && navbarLinks) {
  hamburgerBtn.addEventListener("click", () => {
    navbarLinks.classList.toggle("active");
    if (navbarLinks.style.display === "flex") {
      navbarLinks.style.display = "none";
    } else if (window.innerWidth <= 768) {
      navbarLinks.style.display = "flex";
      navbarLinks.style.flexDirection = "column";
    }
  });
}

// Close navbar when resizing to desktop
window.addEventListener("resize", () => {
  if (window.innerWidth > 768) {
    navbarLinks.style.display = "flex";
  } else {
    navbarLinks.style.display = "none";
  }
});

// ============================
// THEME TOGGLE (DARK / LIGHT)
// ============================
const themeToggle = document.getElementById("themeToggle");
const html = document.documentElement;

if (themeToggle) {
  // Apply saved theme
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    html.classList.add("dark");
    themeToggle.textContent = "☀️";
  } else {
    html.classList.remove("dark");
    themeToggle.textContent = "🌙";
  }

  themeToggle.addEventListener("click", () => {
    html.classList.toggle("dark");
    const isDark = html.classList.contains("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    themeToggle.textContent = isDark ? "☀️" : "🌙";
  });
}

// ============================
// LANGUAGE SWITCHER
// ============================
import i18next from "i18next";
import { initTranslations, applyTranslations } from "./i18n.js";

const langSelect = document.getElementById("langSelect");

if (langSelect) {
  langSelect.value = localStorage.getItem("lang") || "en";
  langSelect.addEventListener("change", (e) => {
    const lang = e.target.value;
    localStorage.setItem("lang", lang);
    i18next.changeLanguage(lang, applyTranslations);
  });
}

// Initialize translations on load
initTranslations();

// ============================
// SUPABASE AUTH MANAGEMENT
// ============================
import { supabase } from "./supabase.js";

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const balanceBadge = document.getElementById("balanceBadge");

async function updateNavbarAuth() {
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (user) {
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    if (balanceBadge) balanceBadge.style.display = "flex";
  } else {
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    if (balanceBadge) balanceBadge.style.display = "none";
  }
}

logoutBtn?.addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "login.html";
});

updateNavbarAuth();
supabase.auth.onAuthStateChange(updateNavbarAuth);
