# Vendly Functionality Audit

## Scope and evidence

This audit covers the repository's static application code, page inventory, automated tests, JavaScript syntax, localization keys, and production build. It does not claim successful production or end-to-end testing without Supabase credentials, configured test data, or a browser runner.

The audit intentionally avoided real financial transactions, destructive database operations, and production data changes.

## Application inventory

### User-facing pages

- Marketplace: `index.html`, `product.html`
- Authentication: `login.html`, `register.html`, `resend-verification.html`
- Selling and account: `sell.html`, `balance.html`, `settings.html`
- Commerce: `orders.html`, `chat.html`
- Administration: `admin.html`
- Legal and carrier information: `terms.html`, `terms-lv.html`, carrier/network pages

### Shared modules

- `src/supabase.js`: authentication, profiles, balances, listings, orders, escrow, and storage integration
- `src/main.js`: shared page runtime, marketplace UI, navigation state, and modal rendering
- `src/navbar.js`: shared dropdown and notification interactions
- `src/pages/*.js`: page-specific workflows
- `src/i18n.js`: English and Latvian translations
- `css/styles.css`: global responsive styling

## Validation matrix

| Area | Result | Evidence |
|---|---|---|
| Existing automated tests | PASS | `npm test`: 10/10 tests passed |
| JavaScript syntax | PASS | `node --check` over all 27 `src/**/*.js` files |
| Localization completeness | PASS | `npm run audit:i18n`: no missing English or Latvian keys |
| Production bundle | PASS | `node node_modules/vite/bin/vite.js build` completed successfully |
| Standard `npm run build` command | BLOCKED | Local `node_modules/.bin/vite` is non-executable (`0666`); direct Vite invocation works |
| Browser/E2E workflows | NOT TESTED | Playwright, Puppeteer, Selenium, and browser executables are unavailable |
| Supabase RLS and database schema | BLOCKED | No migrations/schema/RLS policy source or isolated Supabase test project is available |
| Real payments/top-ups | NOT TESTED | Deliberately excluded to prevent financial side effects |
| Production deployment | NOT TESTED | No deployment credentials or deployment target was provided |

## Fixes applied during this audit

### Financial error visibility

- `getBalance()` and `updateBalance()` no longer convert database failures into a fake zero balance or a silent `false` result.
- Order creation and pending-order payment now check balance-query, transaction-insert, order-status, and stock-update errors.
- Escrow release and cancellation/refund flows now check balance, transaction, stock, and order-update errors.
- Pending-order payment refuses to process an order that is no longer pending.

These changes make failures visible to the existing error UI. They do not replace an atomic backend transaction and therefore do not eliminate concurrent-payment risks.

### Media URL hardening

- Added `safeMediaUrl()` to allow only `http:`, `https:`, and `blob:` media URLs.
- Applied protocol validation and HTML escaping to settings profile previews, order avatars, and admin product images.
- Escaped notification titles/bodies and admin support attachment labels/URLs before rendering.

### Shared navigation and authentication styling

- Preserved the shared Vendly logo treatment across the application navbar and increased its rendered mark size.
- Added consistent full-width, 52px minimum authentication controls and visible keyboard focus styling.
- Kept the responsive navbar breakpoints and mobile menu behavior aligned across the application pages.

## Findings requiring backend or browser verification

### High priority: financial operations are not atomic — BLOCKED

Several workflows still perform balance updates, transaction inserts, order updates, and stock changes as separate client-side requests. A failure between requests can leave partial state, and concurrent requests can race on the same balance or stock value. The durable fix should be a Supabase RPC or database transaction with authorization checks, idempotency, and row-level locking/conditional updates.

Affected workflows include checkout/payment, reservation, escrow release, cancellation/refund, listing fees, and renewal fees.

### High priority: server-side authorization/RLS — BLOCKED

The admin page performs client-side role checks, but repository source does not include Supabase RLS policies or migrations. It is not possible to verify that users cannot directly update balances, orders, products, audit records, or other users' data. This must be tested in the Supabase project and enforced server-side.

### Medium priority: browser workflows — NOT TESTED

The following need a configured browser test environment and test accounts:

- login, signup, email verification resend, and return-to-login navigation
- responsive navigation on every page
- listing creation and renewal fee behavior
- checkout, payment, shipping/locker selection, escrow release, and cancellation
- messaging, attachments, profile editing, avatar upload, and localization/theme controls
- admin access denial for non-admin users

### Medium priority: remaining dynamic media rendering

The primary audited profile/order/admin media paths are hardened. Other dynamic image paths remain distributed across legacy/shared rendering code and should be migrated to `safeMediaUrl()` as part of a follow-up hardening pass, with browser regression tests.

## Regression protection

The existing tests cover listing validation, duration fees, expiry calculation, HTML escaping, navigation/dropdowns, and renewal-vs-purchase behavior. The full audit validation reran these tests successfully after the changes above.

## Final status

The repository is source-valid and builds successfully with the direct Vite entry point. Authentication, navigation, renewal, and core UI behavior are not marked end-to-end PASS because the required browser and Supabase environments are unavailable. Financial atomicity and server-side authorization remain the most important production blockers.
