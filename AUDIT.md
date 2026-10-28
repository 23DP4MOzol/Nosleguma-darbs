# Vendly application audit — 28 October 2026

The app is **not ready for real-money use**. This audit found and repaired several browser defects, but live database contract mismatches, public account data, and client-managed money remain blockers.

## What was checked

- Read the application modules for authentication, registration, listings, browsing, favorites, reservations, checkout, orders, escrow, balance, chat, support, settings, admin, translations, theme, uploads, and offline behavior.
- Opened all 13 application/build pages in Chromium against a production preview and the configured Supabase backend. Checked guest redirects, uncaught exceptions, and desktop/390px overflow. Protected pages were also opened with isolated mocked sessions.
- Used read-only Supabase requests to check authentication settings, table availability, expected columns, and limited anonymous visibility. No real account was created and no purchase, withdrawal, cancellation, role change, or database migration was executed.
- Exercised authenticated flows and failure cases with every Supabase request intercepted. These tests establish browser behavior; they do not establish that real writes pass RLS or commit correctly.
- Built the production bundle, checked every local link/asset in its 13 HTML pages, applied the hosting CSP in a local test server, and tested service worker installation and an offline homepage reload.
- Ran JavaScript syntax checks, translation key checks, focused unit tests, and `npm audit`.

## Remaining findings, ordered by urgency

| Severity | Area | Evidence and consequence | Required follow-up |
| --- | --- | --- | --- |
| Critical | Account privacy | An anonymous `users?select=email,balance,role&limit=1` request returned a populated record. Actual values were not printed or saved. | Restrict private profile columns through database grants/RLS and expose a separate public profile view. Removing fields from frontend queries alone does not prevent access. |
| Critical | Wallet funding and withdrawal | `src/pages/balance.js` calls `addBalance` directly. Payment-method selection only changes UI/transaction text; no provider checkout or verified payment webhook runs. Withdrawal subtracts a balance and writes a transaction without a payout integration. | Implement payment-provider sessions and verified, idempotent server webhooks. Implement actual payouts before claiming a withdrawal succeeded. If database policies currently block these writes, the flow fails rather than becoming a valid payment flow. |
| Critical | Purchase, refunds, and escrow | `placeOrder`, `payForOrder`, `releaseEscrowToSeller`, and cancellation in `src/pages/orders.js` perform separate client-side balance, order, transaction, and stock writes. Multiple results are ignored. Concurrent requests or a failure between writes can produce inconsistent money/stock, duplicate releases, or duplicate refunds. `confirmMeetup` falls back to manual writes on **any** RPC failure, including authorization failures. | Move each financial state transition into an authorized database transaction/RPC. Derive actor, price, allowed status transition, and stock on the server; lock rows and make retry behavior idempotent. Remove the manual fallback. |
| High | Orders do not match the live schema | Read-only column probes confirmed `orders.order_status` and `orders.package_weight_kg` are missing. The primary checkout insert includes `order_status`; subsequent status writes also include it. | Reconcile the application with a versioned database schema before live checkout testing. The audit leaves these as explicit backend contract failures. |
| High | Support requests and reports | `support_tickets.issue_type` and `support_tickets.description` are missing. Both primary and fallback ticket inserts use them. `chat_messages.is_read` is also missing and support messages/reports insert it. | Update the support schema and policies, then test ticket creation, admin assignment, reports, messages, and resolution with buyer/admin accounts. Ordinary `messages` attachment columns checked successfully. |
| High | Free listing/renewal touches wallets | `listProduct` and `renewProductListing` still read and rewrite user/admin balances and create financial records even though listing fees are zero. A stale read can overwrite a concurrent balance change; failed inserts can leave partial side effects. | Remove wallet mutations for free listings. Any future paid listing should use a server transaction. The edit path repaired below bypasses this creation/fee code. |
| High | Backend authorization remains unverified | Admin controls, direct balance changes, ownership, verified-email checks, and platform buying/listing toggles are largely enforced in browser code. The removed metadata fallback was particularly unsafe. Public API schema access was denied, and no database policy definitions or migrations are present in this checkout. | Review actual RLS, grants, triggers, and RPC definitions. Test two unrelated users and an admin. An empty anonymous result for orders/messages/transactions does not prove that every policy is correct. |
| High | Dependency advisories | `npm audit` reported **15 advisories: 1 critical, 11 high, 2 moderate, 1 low** across the lockfile, including transitive tooling packages. This is an advisory count, not a claim that every issue is exploitable in the deployed browser. | Upgrade compatible dependencies in a separate controlled change, reinstall cleanly, rerun tests, and review production versus tooling exposure. No blanket `audit fix --force` was run. |
| Medium | Notification preference synchronization | `users.notification_preferences`, `notify_orders`, `notify_reviews`, and `notify_comments` are all absent. Settings writes these together and ignores the Supabase error result. Local preferences can appear saved without syncing to the account. | Add the intended persistence contract and surface failed saves. Verify notification delivery separately; saving a preference does not implement delivery. |
| Medium | Shipping selection and quoting | `orders.js` does not consume the seller's `vendly-delivery` marker to restrict delivery choices/package size. It defaults to meetup even for locker-only listings, uses editable client weight, and falls back to static carrier estimates. No carrier booking/label purchase is implemented here. | Honor seller delivery options, obtain/validate quotes on the server, and explicitly distinguish estimates from booked shipments. Test LV/LT/EE destinations and unavailable/oversized packages. |
| Medium | AI assistant backend | `src/ai-widget.js` posts to `/.netlify/functions/ai-chat`; no corresponding function source exists in this repository. Cloudflare hosting also has no implementation for that Netlify-specific path here. | Supply and test the actual backend endpoint, or show the feature as unavailable. An externally configured function was not verified. |
| Medium | Registration/profile provisioning | Email confirmation is enabled on the live project. Registration nevertheless attempts a public-profile upsert before a verified session is available and only warns on failure. No auth-to-profile trigger definition is included here. | Verify a database trigger provisions profiles from trusted auth records. Test the complete confirmation-email round trip, duplicate email, rate limiting, and first login. |
| Medium | Image handling | Listing files are validated as JPEG/PNG with a 5 MB limit, but creation stores a data URL in `image_url`; the multiple-file control ultimately persists one image. Chat files use the public `images` bucket without equivalent type/size validation in the upload helper. | Decide intended multi-image behavior, use durable storage for listing images, enforce storage limits/policies, and decide whether private chat attachments may be publicly accessible. Real storage policies were not inspected. |
| Medium | Admin account deletion | Frontend admin deletion removes public application data; it does not call the Supabase Auth admin API to remove/disable the login identity. Multi-table deletions are not transactional. | Implement authorized server-side account deletion with a clear data-retention policy and test partial failure. |
| Low | Observability and statistics | Guest page-view audit writes return HTTP 401; Supabase returns an error object which `logAuditEvent` ignores. `count_unique_sellers` returns HTTP 404; the homepage has a manual fallback. | Decide whether guest audit events are intended and implement an appropriate endpoint. Install the statistics RPC or remove the unnecessary failed request. |
| Low | Reproducible installs | Existing `node_modules` lacks declared `cropperjs` and `wrangler` packages. `node_modules` and `dist` are tracked despite ignore rules. The previous Node >=18 engine declaration did not match Vite 7. | Check a clean install in CI and consider removing generated/dependency directories from version control in a separate change. The Node engine requirement was corrected locally. |

## Repairs made in this audit

1. Login now honors a same-origin return destination, rejects external redirect destinations, and preserves password-recovery intent before Supabase clears the callback fragment. This fixes the reproduced recovery redirect to the homepage.
2. Removed duplicate legacy registration, balance, and settings initialization from `main.js`. A second registration handler could bypass terms; one deposit click could run two handlers.
3. Listing edit now updates its existing row, preserves seller delivery/package metadata and meetup city, and keeps internal delivery metadata out of the editable description. Creation now passes the selected publication duration instead of always falling back to one month.
4. Added shared HTML escaping and repaired reproduced injection in listing preview, the alternate product modal, and category attribute badges, plus product/profile rendering. This is targeted remediation, not a claim that every possible XSS sink has been formally proved safe.
5. Added finite/non-negative price validation and integer stock validation before listing creation/update side effects. Zero stock is no longer converted into one during creation.
6. Removed admin-role provisioning from user-editable auth metadata. Removed support-user guessing based on an email containing “admin”. Backend role policies still require review.
7. Added client checkout guards for own, sold-out, expired, and other-user-reserved listings. These guards improve UX; the server must independently enforce them.
8. Seller processing/pickup/tracking actions now inspect Supabase errors before displaying success. Other financial/status mutations still need the transactional repair described above.
9. Reapplying the same language no longer broadcasts another language-change event. This repairs the reproduced empty-catalog render recursion and offline stack overflow.
10. Production builds now include `service-worker.js` and `_headers`. Previously neither hosting file was emitted. The service worker now caches actual built assets, uses network-first HTML, avoids caching API responses, and supports activation messages. Registration is disabled in development and reload waits for controller activation.
11. The hosting CSP now permits the existing Leaflet/Cropper assets, Supabase realtime WebSockets, and the Omniva locker feed. It removes `unsafe-eval`; inline-script allowance remains because the existing app uses inline handlers.
12. Registration no longer labels every email-related error as “already registered”; verification email parameters are not decoded twice. Page-view audit URLs omit query/fragment credentials. Node engine requirements now match the Vite runtime requirement.

## Validation results

| Check | Result |
| --- | --- |
| Production build | Passed; 127 transformed modules. Existing dynamic/static import and old Browserslist-data warnings remain. |
| Focused unit tests | 6 passed: invalid prices, invalid stock, blank names, expiry boundary, escaping, attribute injection. |
| Isolated browser flow regressions | 22 passed: login redirects/recovery, forged admin metadata, four unavailable checkout cases, editing, injection, empty catalog/language change, terms validation, duplicate deposit handler, rejected status update, and seven authenticated page initialization checks. |
| Live-backed guest page smoke | All 13 pages returned HTTP 200 with no uncaught page exceptions; protected screens redirected to login. No horizontal overflow in the guest desktop/390px checks. Known API errors are listed above. |
| Production asset/page links | All local references in 13 built HTML pages resolved. |
| Production PWA/CSP | Worker installed and controlled the page under hosting CSP; a previously visited homepage reloaded offline without uncaught JS errors. Offline transactions and messages are not supported/tested. |
| EN/LV translation keys | 468 used keys; 757 keys per language; no missing keys. This checks key coverage, not every sentence's translation quality. |
| Source/script syntax | Passed for 36 modules at the time of the check. |
| Live backend contracts/privacy | Failed in the areas listed above. Table existence checks succeeded for the app's 16 queried tables. |
| Dependency security | Failed: 15 lockfile advisories. |

## Repeating the checks

Run `npm test`, `npm run audit:i18n`, `npm run build`, and `node scripts/audit-backend.mjs`. The backend script only performs reads and prints statuses/column names, never credentials or record values.

For Chromium checks, install `playwright` in a temporary tools directory and set `PLAYWRIGHT_PATH` to that installed package's absolute path. Install its Chromium browser with the Playwright CLI, or set `AUDIT_BROWSER_PATH` to an existing compatible executable. No browser-test package was added to the application's dependencies.

- `node scripts/audit-flows.mjs`: requires the Vite dev server at `http://127.0.0.1:5173`; mocks all external/backend requests. `AUDIT_BASE_URL` can override the server address. These development-source tests intentionally import source modules.
- `node scripts/audit-browser.mjs`: use `AUDIT_BASE_URL` to target dev/production preview. This makes live public backend reads and normal page-view audit attempts through the app. `AUDIT_OUTPUT` controls its JSON report path.
- `node scripts/audit-production.mjs`: reads a production build from `AUDIT_BUILD_DIR` (defaults to `dist`), starts/stops its own local server with the hosting CSP, and tests emitted assets/PWA/offline behavior.

## Verification still required before release

Use a disposable staging database with buyer, seller, unrelated-user, and admin test accounts. Test actual signup/verification/reset emails; successful/failed/retried provider payments and payouts; listing upload/edit/delete/renewal; concurrent last-item checkout; insufficient funds; reservation expiry; every authorized/unauthorized order transition; simultaneous meetup confirmation; duplicate delivery/cancellation requests; refunds and stock restoration; reviews tied to completed purchases; favorites; cross-account chat isolation, uploads, support/report lifecycle; settings persistence; and server enforcement of platform toggles.

The current tests do not certify real email delivery, payment processing, carrier booking, database write policies, or a complete real buyer-to-seller transaction. No deployment was performed.
