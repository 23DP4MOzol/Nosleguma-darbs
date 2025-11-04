// ============================
// NAVBAR FUNCTIONALITY
// ============================

// Import required modules
import { supabase } from "./supabase.js";
import { i18n } from "./i18n.js";

// --- HAMBURGER MENU TOGGLE ---
const hamburgerBtn = document.getElementById("hamburgerBtn");
const navbarLinks = document.querySelector(".navbar-links");

if (hamburgerBtn && navbarLinks) {
  hamburgerBtn.addEventListener("click", () => {
    navbarLinks.classList.toggle("active");
  });
}

// Close navbar when clicking outside
document.addEventListener("click", (e) => {
  if (navbarLinks && hamburgerBtn) {
    if (!navbarLinks.contains(e.target) && !hamburgerBtn.contains(e.target)) {
      navbarLinks.classList.remove("active");
    }
  }
});

// Close navbar when resizing to desktop
window.addEventListener("resize", () => {
  if (window.innerWidth > 768 && navbarLinks) {
    navbarLinks.classList.remove("active");
  }
});

// ============================
// THEME TOGGLE (DARK / LIGHT)
// ============================
const themeToggle = document.getElementById("themeToggle");
const html = document.documentElement;

function applyTheme(theme) {
  html.classList.remove("dark", "light");
  html.classList.add(theme);
  html.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);

  // Update all theme toggle buttons across the page
  document.querySelectorAll('#themeToggle, #userThemeToggle').forEach(btn => {
    if (btn) btn.textContent = theme === "dark" ? "☀️" : "🌙";
  });
}

if (themeToggle) {
  // Apply saved theme on page load
  const savedTheme = localStorage.getItem("theme") || "light";
  applyTheme(savedTheme);

  // Toggle theme on button click
  themeToggle.addEventListener("click", () => {
    const currentTheme = html.getAttribute("data-theme") || "light";
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(newTheme);
  });
}

// ============================
// LANGUAGE SWITCHER
// ============================
const langSelect = document.getElementById("langSelect");

if (langSelect) {
  // Set initial language from localStorage or default to 'en'
  const savedLang = localStorage.getItem("lang") || "en";
  langSelect.value = savedLang;
  i18n.setLang(savedLang);

  // Handle language change
  langSelect.addEventListener("change", (e) => {
    const lang = e.target.value;
    localStorage.setItem("lang", lang);
    i18n.setLang(lang);

    // Sync all language selectors on the page
    document.querySelectorAll('#langSelect, #userLang').forEach(select => {
      select.value = lang;
    });
  });
}

// ============================
// SUPABASE AUTH MANAGEMENT
// ============================
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const balanceBadge = document.getElementById("balanceBadge");
const sellBtn = document.getElementById("sellBtn");

async function updateNavbarAuth() {
   try {
     const { data: { user } } = await supabase.auth.getUser();

     // Get navbar links container
     const navbarLinks = document.querySelector('.navbar-links');

     if (user) {
       // User is logged in - fetch user role
       let userRole = 'user';
       try {
         const { data: userData, error } = await supabase
           .from("users")
           .select("balance, role")
           .eq("id", user.id)
           .single();

         if (userData && !error) {
           userRole = userData.role || 'user';
           balanceBadge.querySelector("span").textContent = `€${parseFloat(userData.balance || 0).toFixed(2)}`;
         } else {
           balanceBadge.querySelector("span").textContent = "€0.00";
         }
       } catch (err) {
         console.error("Error fetching user data:", err);
         balanceBadge.querySelector("span").textContent = "€0.00";
       }

       // Show logged-in elements
       if (loginBtn) loginBtn.style.display = "none";
       if (logoutBtn) logoutBtn.style.display = "inline-block";
       if (balanceBadge) balanceBadge.style.display = "flex";

       // Enable sell button and settings button
       if (sellBtn) {
         sellBtn.style.opacity = "1";
         sellBtn.style.pointerEvents = "auto";
       }
       if (settingsBtn) {
         settingsBtn.style.opacity = "1";
         settingsBtn.style.pointerEvents = "auto";
       }

       // Add chat link if not exists
       if (navbarLinks && !document.getElementById('chatLink')) {
         const chatLink = document.createElement('a');
         chatLink.href = 'chat.html';
         chatLink.className = 'btn-nav';
         chatLink.id = 'chatLink';
         chatLink.setAttribute('data-i18n', 'chat');
         chatLink.textContent = 'Chat';
         navbarLinks.insertBefore(chatLink, settingsBtn);
       }

       // Add admin link only for admin users
       if (userRole === 'admin' && navbarLinks && !document.getElementById('adminLink')) {
         const adminLink = document.createElement('a');
         adminLink.href = 'admin.html';
         adminLink.className = 'btn-nav';
         adminLink.id = 'adminLink';
         adminLink.setAttribute('data-i18n', 'admin');
         adminLink.textContent = 'Admin';
         navbarLinks.insertBefore(adminLink, settingsBtn);
       }

       // Add balance link for all logged-in users
       if (navbarLinks && !document.getElementById('balanceLink')) {
         const balanceLink = document.createElement('a');
         balanceLink.href = 'balance.html';
         balanceLink.className = 'btn-nav';
         balanceLink.id = 'balanceLink';
         balanceLink.setAttribute('data-i18n', 'balance');
         balanceLink.textContent = 'Balance';
         navbarLinks.insertBefore(balanceLink, settingsBtn);
       }

     } else {
       // User is not logged in
       if (loginBtn) loginBtn.style.display = "inline-block";
       if (logoutBtn) logoutBtn.style.display = "none";
       if (balanceBadge) balanceBadge.style.display = "none";

       // Disable sell button and settings button visually
       if (sellBtn) {
         sellBtn.style.opacity = "0.6";
         sellBtn.style.pointerEvents = "none";
       }
       if (settingsBtn) {
         settingsBtn.style.opacity = "0.6";
         settingsBtn.style.pointerEvents = "none";
       }

       // Remove chat, admin, and balance links
       const chatLink = document.getElementById('chatLink');
       const adminLink = document.getElementById('adminLink');
       const balanceLink = document.getElementById('balanceLink');
       if (chatLink) chatLink.remove();
       if (adminLink) adminLink.remove();
       if (balanceLink) balanceLink.remove();
     }
   } catch (error) {
     console.error("Error updating navbar auth:", error);
   }
}

// Handle login button click
if (loginBtn) {
  loginBtn.addEventListener("click", () => {
    window.location.href = "login.html";
  });
}

// Handle logout button click
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = "index.html";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  });
}

// Handle sell button click
if (sellBtn) {
  sellBtn.addEventListener("click", async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      window.location.href = "sell.html";
    } else {
      alert(i18n.t("loginFirst"));
      window.location.href = "login.html";
    }
  });
}

// Handle settings button click
const settingsBtn = document.getElementById("settingsBtn");
if (settingsBtn) {
  settingsBtn.addEventListener("click", async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      window.location.href = "settings.html";
    } else {
      alert(i18n.t("loginFirst"));
      window.location.href = "login.html";
    }
  });
}

// Initialize auth state
updateNavbarAuth();

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  updateNavbarAuth();
});

// Export for use in other modules
export { updateNavbarAuth };
