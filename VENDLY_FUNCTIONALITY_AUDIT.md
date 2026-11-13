# Vendly Functionality Audit

## Scope and evidence

This audit covers the repository's static application code, page inventory, automated tests, JavaScript syntax, localization keys, production build, and configured desktop/mobile browser smoke tests. It does not claim successful financial end-to-end testing without isolated test accounts and test data.

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
| Existing automated tests | PASS | `npm test`: 11/11 tests passed |
| JavaScript syntax | PASS | `node --check` over all 27 `src/**/*.js` files |
| Localization completeness | PASS | `npm run audit:i18n`: no missing English or Latvian keys |
| Production bundle | PASS | `node node_modules/vite/bin/vite.js build` completed successfully |
| Standard `npm run build` command | PASS | npm scripts invoke the local Vite entry point through Node, avoiding the non-executable local shim |
| Configured browser smoke test | PASS | Playwright checked all 13 pages at desktop and mobile widths; no page errors, HTTP errors, or horizontal overflow |
| Test-account authentication and role routing | PASS | `admin@example.com`, `user1@example.com`, and `user2@example.com` logged in successfully; admin control was shown only for the admin account; logout returned to the home page |
| Supabase connectivity and public schema | PASS | Read-only audit reached `/auth/v1/settings`; public table contracts responded; protected tables denied anonymous access |
| Supabase RLS and complete database schema | BLOCKED | Repository has no migrations/RLS source; protected-table behavior needs authenticated test accounts |
| Real payments/top-ups | NOT TESTED | Deliberately excluded to prevent financial side effects |
| Production deployment | PARTIALLY VERIFIED | `https://vendly.cc` is protected by Cloudflare; DNS-only `https://staging.vendly.cc` is reachable and serves the Vendly app |
| Local page smoke test | PASS | Local Vite server returned HTTP 200 for all application and legal pages; shared CSS/runtime assets loaded |
| Live listing/order test | BLOCKED | Staging listing creation reached Supabase but was rejected with `42501` during the balance/role operation; payment was not forced |

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
- Validated chat attachment URLs before inserting them into image/link attributes.
- Applied the same media URL validation to shared marketplace/profile image rendering.
- Added explicit error checks when confirming delivery or meetup completion.
- Commerce helpers now surface failed buyer/seller/reservation/listing-fee transaction inserts instead of logging and continuing.
- Pending-order payment now surfaces a failed buyer balance update before recording payment state.
- Withdrawal now surfaces a failed transaction insert instead of showing success after only changing the balance.
- Failed reservations now attempt to restore the user's balance and record a compensating refund when the reservation update cannot be saved.
- Direct purchase failures now attempt to restore buyer/seller balances and the original product stock/reservation state.
- Anonymous page-view audit events are skipped because the project's RLS correctly rejects unauthenticated audit inserts.
- Home-page seller statistics now use the available `products` table instead of calling an unavailable `count_unique_sellers` RPC.
- Missing Supabase configuration now keeps public pages renderable with a local placeholder client and a clear warning.
- Admin-page authorization now redirects non-admin users immediately instead of waiting indefinitely for an access-denied modal.
- Removed a stale seller-statistics debug reference discovered during the live browser listing attempt.

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

The supplied test account successfully authenticated, but listing creation could not complete because the project's RLS rejected the balance/role operation with `42501`. This is a backend policy/RPC configuration blocker, not a reason to bypass authorization in the client.

### Medium priority: browser workflows — PARTIALLY VERIFIED

Configured Playwright smoke tests verified all page loads, desktop/mobile overflow, runtime initialization, account login, role visibility, logout, and non-admin admin-page redirection. No page-level JavaScript errors or HTTP errors remained after removing unauthenticated audit inserts and the unavailable seller-count RPC.

The following need a configured browser test environment and test accounts:

- login, signup, email verification resend, and return-to-login navigation
- responsive navigation on every page
- listing creation and renewal fee behavior (blocked by the project's balance/role RLS operation)
- checkout, payment, shipping/locker selection, escrow release, and cancellation
- messaging, attachments, profile editing, avatar upload, and localization/theme controls
- admin access denial for non-admin users

### Medium priority: remaining dynamic media rendering

The primary audited profile/order/admin media paths are hardened. Other dynamic image paths remain distributed across legacy/shared rendering code and should be migrated to `safeMediaUrl()` as part of a follow-up hardening pass, with browser regression tests.

## Regression protection

The existing tests cover listing validation, duration fees, expiry calculation, HTML escaping, navigation/dropdowns, and renewal-vs-purchase behavior. The full audit validation reran these tests successfully after the changes above.

## Final status

The repository is source-valid, builds successfully, and passes configured browser smoke testing. Authentication, listing, renewal, checkout, and order workflows still require isolated test accounts and data for end-to-end verification. Financial atomicity and server-side authorization remain the most important production blockers.

The previously checked Netlify URL is not the deployment produced by this repository. The correct domain is reachable, but Cloudflare's browser challenge prevents automated page and account testing; the challenge must be made accessible to the test browser or temporarily relaxed for testing.

### Online staging verification

After creating `staging.vendly.cc` with DNS-only routing, the live staging deployment was tested online:

- All 13 expected pages loaded successfully after their deployed `.html` to clean-route redirects.
- Desktop/mobile overflow checks passed and no page-level JavaScript errors occurred.
- `admin@example.com`, `user1@example.com`, and `user2@example.com` logged in successfully.
- Admin visibility and logout worked; non-admin access still displayed the admin shell before its denial flow completed in the deployed build.
- Existing products were browsed and checkout navigation opened for a €300 test product without submitting payment.
- A low-value listing attempt was rejected by Supabase RLS (`42501`) while updating balance/role data.
- The deployed staging build still emits the older anonymous `audit_logs` 401 requests and missing `count_unique_sellers` RPC 404 requests, indicating it does not yet contain the latest repository fixes.
