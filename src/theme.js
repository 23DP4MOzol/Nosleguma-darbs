// ============================
// CENTRALIZED THEME MANAGEMENT
// ============================

const THEME_KEY = 'theme';
const THEME_LIGHT = 'light';
const THEME_DARK = 'dark';

// Apply theme immediately on script load (before DOM fully renders)
// This prevents flash of wrong colors
(function() {
  try {
    const savedTheme = localStorage.getItem(THEME_KEY) || THEME_LIGHT;
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(savedTheme);
  } catch (e) {
    // localStorage might not be available
    document.documentElement.setAttribute('data-theme', THEME_LIGHT);
  }
})();

class ThemeManager {
  constructor() {
    this.initialized = false;
  }

  // Initialize theme on page load
  init() {
    if (this.initialized) return;
    
    const savedTheme = this.getTheme();
    this.applyTheme(savedTheme, false);
    this.attachListeners();
    this.initialized = true;
  }

  // Get current theme from localStorage
  getTheme() {
    return localStorage.getItem(THEME_KEY) || THEME_LIGHT;
  }

  // Apply theme to document
  applyTheme(theme, save = true) {
    const html = document.documentElement;
    
    // Remove any conflicting classes (defensive cleanup)
    html.classList.remove('light', 'dark');
    
    // Set data-theme attribute (our single source of truth)
    html.setAttribute('data-theme', theme);
    
    // Also add the class so html.dark / html.light CSS selectors work
    html.classList.add(theme);
    
    if (save) {
      localStorage.setItem(THEME_KEY, theme);
    }
    
    this.updateToggleButton(theme);
  }

  // Toggle between light and dark
  toggle() {
    const currentTheme = this.getTheme();
    const newTheme = currentTheme === THEME_DARK ? THEME_LIGHT : THEME_DARK;
    this.applyTheme(newTheme);
    
    // Force browser to recalculate all styles
    // This ensures all CSS variables are updated immediately
    document.body.offsetHeight;
  }

  // Update the toggle button text
  updateToggleButton(theme) {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.textContent = theme === THEME_DARK ? '☀️' : '🌙';
    }

    const userThemeToggle = document.getElementById('userThemeToggle');
    if (userThemeToggle) {
      userThemeToggle.textContent = theme === THEME_DARK ? '☀️ Light Mode' : '🌙 Dark Mode';
    }
  }

  // Attach event listeners (only once)
  attachListeners() {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle && !themeToggle.dataset.themeListener) {
      themeToggle.addEventListener('click', () => this.toggle());
      themeToggle.dataset.themeListener = 'true';
    }

    const userThemeToggle = document.getElementById('userThemeToggle');
    if (userThemeToggle && !userThemeToggle.dataset.themeListener) {
      userThemeToggle.addEventListener('click', () => this.toggle());
      userThemeToggle.dataset.themeListener = 'true';
    }
  }
}

// Create singleton instance
const themeManager = new ThemeManager();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => themeManager.init());
} else {
  themeManager.init();
}

// Export for use in other modules
export { themeManager };
