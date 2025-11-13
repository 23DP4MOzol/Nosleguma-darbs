# AGENTS.md - Marketplace Project

## Build & Development Commands
- `npm run dev` - Start Vite dev server on port 5173 (auto-opens browser)
- `npm run build` - Build for production (outputs to dist/)
- `npm run preview` - Preview production build locally

## Architecture
- **Framework**: Vite + Vanilla JS (ES modules)
- **Backend**: Supabase (authentication, database, storage)
- **Styling**: TailwindCSS v4 with PostCSS
- **Multi-page app**: 9 HTML pages (index, admin, balance, chat, login, product, register, sell, settings)
- **i18n**: i18next with browser language detection (EN/LV support)

## File Structure
- `/js/` - JavaScript modules (supabase.js, main.js, navbar.js, app.js, i18n.js, ai-widget.js)
- `/css/` - Global styles (styles.css)
- `/assets/` - Static assets
- Root HTML files map to pages in vite.config.js rollupOptions

## Code Conventions
- ES6 modules with `type: "module"` in package.json
- Class-based dark mode via `data-theme` attribute
- Use existing Supabase client from js/supabase.js
- Follow existing i18n patterns with data-i18n attributes
- CSS uses custom properties (--card-bg, --text-primary, etc.)
