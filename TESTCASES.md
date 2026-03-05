# Test Cases (minimum 5)

1) User Registration & Login
   - Steps: register new user, verify email flow (if enabled), login with credentials.
   - Expected: account created in `users` table, verified session returned, navbar shows authenticated state.

2) CRUD: Product Listing and Management
   - Steps: create product via `sell.html`, edit product details, delete product.
   - Expected: product appears in `products` table, updates reflected on `product.html`, deletion removes it.

3) Data Validation and Security
   - Steps: attempt to submit invalid product data (missing required `condition`, negative price); attempt XSS payload in text fields.
   - Expected: inputs rejected with validation messages; output is escaped in UI (no XSS execution).

4) Authentication & Roles (User vs Admin)
   - Steps: sign in as normal user and as admin (admin row with role=`admin`), try admin-only actions.
   - Expected: admin actions allowed only for admin; regular user forbidden; role-based UI elements shown/hidden.

5) PWA Install & Offline Basic
   - Steps: open site in supported browser, check install prompt, go offline and refresh homepage.
   - Expected: site can be installed (manifest recognized), homepage served from cache when offline.

Optional: Accessibility (WCAG) tests
   - Steps: run Lighthouse accessibility audit; keyboard-only navigation; verify `alt` and `aria-*` attributes.
   - Expected: no critical accessibility issues; key interactive elements reachable by keyboard.
