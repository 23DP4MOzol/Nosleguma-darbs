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
    this._onChangeCallbacks = [];
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
      // Notify listeners (used by main.js to sync to Supabase account)
      this._onChangeCallbacks.forEach(cb => {
        try { cb(theme); } catch (e) { console.warn('Theme change callback error:', e); }
      });
    }
    
    this.updateToggleButton(theme);
  }

  // Register a callback that fires whenever the theme is changed by the user
  onChange(callback) {
    if (typeof callback === 'function') {
      this._onChangeCallbacks.push(callback);
    }
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

  // ============================
  // SUPABASE ACCOUNT SYNC
  // ============================

  /**
   * Load theme preference from the user's Supabase account and apply it.
   * Falls back gracefully if the `theme` column doesn't exist yet.
   */
  async loadFromAccount(supabaseClient, userId) {
    try {
      const { data, error } = await supabaseClient
        .from('users')
        .select('theme')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        // Column might not exist — silently ignore
        if (error.code === 'PGRST204' || (error.message && error.message.includes('theme'))) {
          console.log('ℹ️ users.theme column not available, using localStorage theme');
          return;
        }
        console.warn('Could not load theme from account:', error.message);
        return;
      }

      if (data && data.theme && (data.theme === THEME_LIGHT || data.theme === THEME_DARK)) {
        // Account theme takes priority over localStorage
        console.log('🎨 Loaded theme from account:', data.theme);
        this.applyTheme(data.theme, true);
      }
    } catch (e) {
      console.warn('Theme account sync (load) failed:', e.message || e);
    }
  }

  /**
   * Save current theme preference to the user's Supabase account.
   * Fails silently if the `theme` column doesn't exist.
   */
  async saveToAccount(supabaseClient, userId, theme) {
    try {
      const { error } = await supabaseClient
        .from('users')
        .update({ theme: theme || this.getTheme(), updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) {
        // Column might not exist — silently ignore
        if (error.code === 'PGRST204' || (error.message && error.message.includes('theme'))) {
          console.log('ℹ️ users.theme column not available, theme saved to localStorage only');
          return;
        }
        console.warn('Could not save theme to account:', error.message);
        return;
      }

      console.log('🎨 Theme saved to account:', theme || this.getTheme());
    } catch (e) {
      console.warn('Theme account sync (save) failed:', e.message || e);
    }
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
