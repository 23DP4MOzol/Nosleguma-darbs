// Isolated browser regression checks: every Supabase request is mocked.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { loadEnv } from 'vite';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const env = loadEnv('development', process.cwd(), 'VITE_');
const baseURL = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:5173';
const project = new URL(env.VITE_SUPABASE_URL).hostname.split('.')[0];
const user = { id: '11111111-1111-4111-8111-111111111111', email: 'audit@example.test', email_confirmed_at: '2026-01-01T00:00:00Z', user_metadata: { username: 'Audit' }, aud: 'authenticated', role: 'authenticated' };
const profile = { ...user, username: 'Audit', balance: 100, role: 'user', created_at: '2026-01-01T00:00:00Z' };
const product = { id: '22222222-2222-4222-8222-222222222222', seller_id: user.id, name: 'Audit listing', category: 'electronics', price: 10, stock: 2, condition: 'good', location: 'Riga', seller_city: 'Riga', description: 'Original\n<!--vendly-delivery:{"shipping_method":"both","package_size":"M"}-->', image_url: '/assets/vendly-logo.svg', valid_until: '2099-01-01T00:00:00Z', seller: profile };
const token = `${Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')}.${Buffer.from(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600, role: 'authenticated' })).toString('base64url')}.test`;
const session = { access_token: token, refresh_token: 'audit-refresh', expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600, token_type: 'bearer', user };
const browser = await chromium.launch({ headless: true, ...(process.env.AUDIT_BROWSER_PATH ? { executablePath: process.env.AUDIT_BROWSER_PATH } : {}) });
let failures = 0;
async function fixture({ signedIn = true, failTable, fixtureProduct = product, orders = [] } = {}) {
  const context = await browser.newContext({ serviceWorkers: 'block' });
  const mutations = [];
  const errors = [];
  await context.addInitScript(({ project, session, signedIn }) => {
    localStorage.setItem('lang', 'en');
    if (signedIn) localStorage.setItem(`sb-${project}-auth-token`, JSON.stringify(session));
  }, { project, session, signedIn });
  await context.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin === new URL(baseURL).origin) return route.continue();
    if (!url.hostname.endsWith('.supabase.co')) return route.fulfill({ status: 200, body: '[]', contentType: 'application/json' });
    let data = [];
    let status = 200;
    const method = request.method();
    const table = url.pathname.split('/').at(-1);
    const isMutation = !['GET', 'HEAD', 'OPTIONS'].includes(method);
    const payload = request.postDataJSON();
    if (isMutation) mutations.push({ table, method, payload });
    if (url.pathname.endsWith('/user')) data = user;
    else if (url.pathname.endsWith('/token')) data = session;
    else if (table === 'users') data = [profile];
    else if (table === 'products') data = [fixtureProduct];
    else if (table === 'orders') data = orders;
    else if (table === 'platform_settings') data = [{ id: 1, disable_listing: false, disable_buying: false }];
    else if (table === 'count_unique_sellers') data = 1;
    if (isMutation && table === failTable) { status = 403; data = { code: '42501', message: 'Audit permission denied' }; }
    else if (isMutation && ['products', 'orders'].includes(table)) data = [{ ...fixtureProduct, ...(Array.isArray(payload) ? payload[0] : payload) }];
    if (Array.isArray(data) && request.headers().accept?.includes('application/vnd.pgrst.object+json')) data = data[0] || null;
    await route.fulfill({ status, contentType: 'application/json', headers: { 'content-range': '0-0/1' }, body: JSON.stringify(data) });
  });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  return { context, page, mutations, errors };
}
async function test(name, fn) {
  try { await fn(); console.log(`PASS ${name}`); }
  catch (error) { failures++; console.log(`FAIL ${name}: ${error.message}`); }
}
try {
  await test('Login honors a local return destination', async () => {
    const f = await fixture({ signedIn: false });
    try {
      await f.page.goto(`${baseURL}/login.html?redirect=${encodeURIComponent('/sell.html?edit=' + product.id)}`);
      await f.page.locator('#emailInput').fill(user.email);
      await f.page.locator('#passwordInput').fill('audit-password');
      await f.page.locator('#loginForm button[type=submit]').click();
      await f.page.waitForURL('**/sell.html?edit=*', { timeout: 5000 });
    } finally { await f.context.close(); }
  });
  await test('Recovery session opens password settings', async () => {
    const f = await fixture();
    try {
      await f.page.goto(`${baseURL}/login.html?reason=password_reset#access_token=${token}&refresh_token=audit-refresh&expires_in=3600&token_type=bearer&type=recovery`);
      await f.page.waitForURL('**/settings.html?tab=password', { timeout: 6000 });
    } finally { await f.context.close(); }
  });
  await test('Listing edit updates the existing row and preserves delivery', async () => {
    const f = await fixture();
    try {
      await f.page.goto(`${baseURL}/sell.html?edit=${product.id}`);
      await f.page.waitForFunction(() => document.querySelector('#productNameInput')?.value === 'Audit listing');
      assert.equal(await f.page.locator('#shippingMethod').inputValue(), 'both');
      assert.equal(await f.page.locator('#packageSizeInput').inputValue(), 'M');
      await f.page.locator('#productNameInput').fill('Edited listing');
      await f.page.locator('#sellForm').evaluate(form => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
      await f.page.waitForTimeout(800);
      assert(f.mutations.some(m => m.table === 'products' && m.method === 'PATCH'), 'No product update sent');
      assert(!f.mutations.some(m => m.table === 'products' && m.method === 'POST'), 'Edit created another listing');
      assert(!f.mutations.some(m => ['users', 'user_transactions'].includes(m.table)), 'Edit changed wallet');
    } finally { await f.context.close(); }
  });
  await test('Listing preview treats entered markup as text', async () => {
    const f = await fixture();
    try {
      await f.page.goto(`${baseURL}/sell.html`);
      await f.page.locator('#productNameInput').fill('<img src=x onerror="window.auditXss=true">');
      await f.page.waitForTimeout(200);
      assert.equal(await f.page.evaluate(() => !!window.auditXss), false);
    } finally { await f.context.close(); }
  });
  await test('Product modal treats listing and attribute markup as text', async () => {
    const f = await fixture();
    try {
      await f.page.goto(`${baseURL}/index.html`);
      await f.page.evaluate(async product => {
        const { showProductModal } = await import('/src/product-modal.js');
        await showProductModal({ ...product, name: '<img src=x onerror="window.auditXss=true">', description: 'Text\n<!--vendly-attrs:{"brand":"<img src=x onerror=window.auditXss=true>"}-->' });
      }, product);
      await f.page.waitForTimeout(200);
      assert.equal(await f.page.evaluate(() => !!window.auditXss), false);
    } finally { await f.context.close(); }
  });
  await test('Failed seller status update never reports success', async () => {
    const order = { id: '33333333-3333-4333-8333-333333333333', seller_id: user.id, buyer_id: 'buyer', order_status: 'paid', status: 'paid', total_amount: 10, product };
    const f = await fixture({ failTable: 'orders', orders: [order] });
    try {
      await f.page.goto(`${baseURL}/orders.html`);
      await f.page.waitForFunction(() => typeof window.markAsProcessing === 'function');
      await f.page.evaluate(id => window.markAsProcessing(id), order.id);
      const text = await f.page.locator('body').innerText();
      assert(!text.includes('Order marked as processing'), 'Displayed success after permission denial');
      assert.match(text, /failed|denied/i);
    } finally { await f.context.close(); }
  });
  for (const name of ['sell', 'product', 'orders', 'balance', 'chat', 'settings', 'admin']) {
    await test(`Authenticated ${name} page has no uncaught exceptions`, async () => {
      const f = await fixture();
      try {
        await f.page.goto(`${baseURL}/${name}.html`);
        await f.page.waitForTimeout(700);
        assert.deepEqual(f.errors, []);
        if (name === 'admin') {
          assert.match(await f.page.locator('#globalConfirmMessage').innerText(), /Access denied/);
          await f.page.locator('#globalConfirmOk').click();
          await f.page.waitForURL('**/index.html');
        }
      } finally { await f.context.close(); }
    });
  }
} finally { await browser.close(); }
process.exitCode = failures ? 1 : 0;
