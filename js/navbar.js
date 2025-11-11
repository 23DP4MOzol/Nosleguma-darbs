// ============================
// NAVBAR FUNCTIONALITY
// ============================

// Import required modules
import { supabase } from "./supabase.js";
import { i18n } from "./i18n.js";

// Hamburger menu handled in main.js

// No dropdown

// Theme toggle handled in main.js

// Language switcher handled in main.js

// Dropdown toggle
document.addEventListener('click', (e) => {
  const dropdowns = document.querySelectorAll('.dropdown');
  dropdowns.forEach(dropdown => {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove('open');
    }
  });

  if (e.target.closest('.dropdown-btn')) {
    const dropdown = e.target.closest('.dropdown');
    dropdown.classList.toggle('open');
  }
});

// Auth handled in main.js
