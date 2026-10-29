# Vendly responsive audit

Audit date: 2026-10-29. Changes are local in the existing Vite/Vanilla JS project.

## Scope and page inventory

All 13 production entry points in `vite.config.js` were opened in Chromium:

- `index.html`: catalog, filters, product details and checkout dialogs.
- `product.html`: own listings, renewal controls and product cards.
- `sell.html`: new listing, edit mode and live preview.
- `login.html`, `register.html`, `resend-verification.html`: authentication forms.
- `settings.html`: profile, preferences, listing management and profile preview.
- `balance.html`: balance, transactions, payment controls and own listings.
- `orders.html`: purchase history, order details, meetup/shipping checkout, tracking and cancellation dialogs.
- `chat.html`: conversation list, messages, composer, new conversation dialog and support thread.
- `admin.html`: dashboard, users, products, transactions, orders, chats, support tickets, analytics, settings, user details and product details.
- `terms.html`, `terms-lv.html`: legal content and compact navigation.

Also inspected the seven root HTML reference captures: `dpd-lt.html`, `dpd-lv.html`, `pasts-home.html`, `pasts-postal-network.html`, `venipak-ee.html`, `venipak-lt.html`, `venipak-lv.html`. These are copies of carrier websites used as delivery-data sources, not Vendly application routes; they are not included in the Vite production build. Their third-party layouts were not rewritten or counted as Vendly browser-tested pages.

## Problems and fixes

| Finding | Fix |
| --- | --- |
| Grid/flex children forced sell, settings and order content beyond narrow screens; global horizontal clipping concealed it. | Allow intrinsic grid/flex children to shrink, wrap long values, constrain tracks and remove page-wide horizontal clipping. |
| Desktop navigation crowded at tablet/landscape sizes; the icon group occupied a full desktop row. | Use the compact navigation through 1024px, keep desktop controls together, and make the expanded menu scroll within the available viewport. |
| Notification popovers could leave the screen; Escape and expanded state were inconsistent. | Bound popovers to the viewport, measure header height, close them on Escape and synchronize `aria-expanded`. |
| Chat and legal-page headers had an unclosed icon-row container. | Correct the HTML nesting; load shared functionality on legal pages. |
| Long product names, usernames, email addresses and messages exceeded their containers. | Apply wrapping and shrinkable content tracks without truncating essential information. |
| Preview cards, forms and controls consumed too much mobile space. | Reduce mobile padding, collapse columns, keep fields within their containers and maintain 44px mobile control heights. |
| Balance and profile grids had minimum tracks wider than the available space. | Bound minimum track sizes by the container; stack own-listing rows on smaller screens. |
| Admin detail tables lacked local scroll wrappers, and detail tabs overflowed in landscape. | Add keyboard-focusable scroll regions for generated tables and local horizontal scrolling for detail tabs at every width. |
| Admin analytics/detail grids could not fit small viewports. | Use container-bounded grid minimums and constrain dialog height to the available viewport. |
| Chat panes did not reliably shrink, and changing into a narrow layout could leave no conversation selected and no list visible. | Give message/list panes their own scrolling, preserve composer space and show the conversation list when entering mobile layout without an active thread. |
| Dialogs and chat did not consistently account for shortened viewports. | Track `visualViewport.height`, use it for chat/dialog sizing, allow internal vertical scrolling and retain safe-area padding. |
| Shared confirmation dialogs injected global theme colors. | Use the project's existing theme variables so light/dark preferences stay consistent. |
| Carrier quote columns split prices across lines on small screens. | Stack quote cards when needed, keep prices together, wrap carrier headers/routes and preserve checkout image proportions. |
| Product grids could stretch a few cards across very wide screens. | Keep bounded grid tracks, allow more columns on large screens and cap catalog/dashboard content width at 1600px. |

Existing branding, color variables, animations, authentication, Supabase client and database structure were retained. Product details use `object-fit: contain`; card images retain their existing cover presentation. Earlier navigation/renewal fixes in the working tree were preserved.

## Browser verification

The test fixture intercepts remote requests and supplies deterministic authenticated/admin data. It includes long product titles, an unbroken long username, long message content, descriptions, orders and transactions. No real account, payment or database write is used.

The main page matrix covers **320, 375, 430, 600, 768, 1024, 1280, 1440, 1920, 2560 and 3440px**, plus **844x390 and 1024x600** landscape viewports. Narrow portrait height is 844px; larger widths use 1000px height.

- **676 page checks:** 13 pages x 13 viewports x EN/LV x light/dark.
- **598 component/state checks:** 23 open UI states x 13 viewports x EN/light and LV/dark.
- **77 navigation interaction checks:** 11 full-navigation pages at 320, 600, 768, 844, 1024, 1280 and 1440px; real hamburger/dropdown clicks, translated listing label, notification bounds and Escape handling.
- **169 additional overlap checks:** all 13 pages and all 13 viewports in EN/light; bounding-box intersections of sibling navigation, grid, form and chat controls.
- **52 additional mobile Chromium checks:** touch/mobile contexts on all 13 pages at 375x844, 430x844, 844x390 and 1024x600.
- **78 delivery rechecks** after the final quote-layout adjustment: checkout dialog, meetup and shipping in EN/light and LV/dark at every matrix viewport.
- Chat composer checked at **375x500**, including input focus and return to conversations.

Checks detect document overflow, content beyond the viewport, clipped controls, unexpected dialog horizontal scrolling, selected sibling overlaps and uncaught JavaScript errors. Deliberately scrollable table/tab contents and closed off-canvas panels are treated separately.

Screenshots were captured for all pages at 320, 768 and 1440px in EN/light and LV/dark, and for open component states at 320 and 1440px. Representative mobile forms, settings, chat, navigation and admin dialogs were visually inspected.

The final page, component and navigation runs passed without detected overflow, clipped controls, selected sibling overlaps or uncaught JavaScript errors. Earlier failures in admin dialogs were fixed and retested.

Machine-readable reports and screenshots:

- `.cache/responsive-audit/`: full page matrix.
- `.cache/responsive-states/`: open components and navigation interactions.
- `.cache/responsive-overlap-check/`: additional geometry checks.
- `.cache/responsive-touch/`: mobile/touch contexts.
- `.cache/responsive-delivery-recheck/`: final delivery-layout checks and screenshots.

## Build and regression checks

- `npm run build`: passed. Existing informational warnings about Browserslist data age and mixed static/dynamic Supabase imports remain.
- `npm test`: 9 tests passed.
- `node scripts/audit-flows.mjs`: 22 isolated functional browser regressions passed, including authentication redirects, authorization, listing editing, checkout rejection rules and wallet handler behavior.
- `npm run audit:i18n`: 468 used keys checked; no missing English or Latvian keys.

## Changed files

Responsive implementation:

- `css/styles.css`
- `admin.html`, `chat.html`, `terms.html`, `terms-lv.html`
- `src/main.js`, `src/navbar.js`
- `src/pages/admin.js`, `src/pages/chat.js`, `src/pages/product.js`, `src/pages/orders.js`
- `src/ui/modal.js`

Reusable audit tooling:

- `scripts/audit-responsive.mjs`
- `scripts/audit-responsive-states.mjs`
- `scripts/responsive-fixture.mjs`
- `scripts/responsive-measure.mjs`
- `tests/navigation.test.mjs` updated for notification handling.
- `RESPONSIVE-AUDIT.md`

The production build also refreshed tracked generated pages in `dist/`: `admin.html`, `balance.html`, `chat.html`, `index.html`, `login.html`, `product.html`, `register.html`, `sell.html` and `settings.html`.

Previously authorized navigation changes remain in `index.html`, `balance.html`, `login.html`, `orders.html`, `product.html`, `register.html`, `resend-verification.html`, `sell.html`, `settings.html` and `src/pages/sell.js` as well.

Run the browser scripts with the same `PLAYWRIGHT_PATH` convention used by the project's existing audit scripts, pointing to an installed Playwright package, with Chromium installed. Start the local Vite server separately. `AUDIT_BASE_URL` changes the default `http://127.0.0.1:5173` target. `RESPONSIVE_TOUCH=1` selects mobile/touch contexts; `RESPONSIVE_STATE_FILTER` limits component reruns. No runtime dependency was added.

## Verification limits

This is Chromium viewport/touch emulation, not physical iPhone/Android, Safari or Firefox certification. The shortened viewport checks exercise layout behavior; actual OS keyboard panning, native pickers and browser zoom still require device testing. External maps, CDN-based cropping libraries, production image delivery, live payments, email delivery and realtime server events were not exercised against production services. The fixtures validate populated UI layouts and selected empty states, not every possible database record or every combination of permissions and order statuses. Screenshot review is representative, not a manual review of every pixel in every generated image.
