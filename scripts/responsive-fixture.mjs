// Browser-only fixtures. All remote requests are intercepted; no live account or database is changed.
import { loadEnv } from 'vite';
export const baseURL = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:5173';
const env = loadEnv('development', process.cwd(), 'VITE_');
const supabaseURL = new URL(env.VITE_SUPABASE_URL || 'https://responsive-audit.supabase.co');
const project = supabaseURL.hostname.split('.')[0];
export const user = { id: '11111111-1111-4111-8111-111111111111', email: 'responsive.audit@example.test', email_confirmed_at: '2026-01-01T00:00:00Z', user_metadata: { username: 'Responsive audit' }, aud: 'authenticated', role: 'authenticated' };
export const profile = { ...user, username: 'IlgsLietotajvards'.repeat(4), balance: 12345.67, role: 'admin', created_at: '2026-01-01T00:00:00Z', bio: 'Long profile description '.repeat(12), city: 'Riga', language: 'en' };
export const product = { id: '22222222-2222-4222-8222-222222222222', seller_id: user.id, name: 'Garš preces nosaukums / Long product title '.repeat(4), category: 'Electronics', price: 1234.56, stock: 2, condition: 'good', location: 'Riga', seller_city: 'Riga', shipping_method: 'both', package_size: 'M', description: 'Readable product description '.repeat(25) + '\n<!--vendly-delivery:{"shipping_method":"both","package_size":"M"}-->', image_url: '/assets/vendly-logo.svg', valid_until: '2099-01-01T00:00:00Z', seller: profile, created_at: '2026-01-01T00:00:00Z' };
export const conversation = { id: '33333333-3333-4333-8333-333333333333', buyer_id: user.id, seller_id: '44444444-4444-4444-8444-444444444444', buyer: profile, seller: { id: '44444444-4444-4444-8444-444444444444', username: 'LongSellerName'.repeat(5) }, product, status: 'active', last_message: 'Long message preview '.repeat(8), last_message_at: '2026-10-01T12:00:00Z' };
const token = `${Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')}.${Buffer.from(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now()/1000)+7200, role: 'authenticated' })).toString('base64url')}.test`;
const session = { access_token: token, refresh_token: 'audit-refresh', expires_at: Math.floor(Date.now()/1000)+7200, expires_in: 7200, token_type: 'bearer', user };
export async function fixture(browser, { signedIn = true, lang = 'en', theme = 'light', mobile = false } = {}) {
  const context = await browser.newContext({ serviceWorkers: 'block', isMobile: mobile, hasTouch: mobile, viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  await context.addInitScript(({ project, session, signedIn, lang, theme }) => {
    localStorage.setItem('lang', lang); localStorage.setItem('language', lang);
    localStorage.setItem('theme', theme);
    if (signedIn) localStorage.setItem(`sb-${project}-auth-token`, JSON.stringify(session));
  }, { project, session, signedIn, lang, theme });
  await context.route('**/*', async route => {
    const req = route.request(); const url = new URL(req.url());
    if (url.origin === new URL(baseURL).origin) return route.continue();
    if (url.origin !== supabaseURL.origin) return route.fulfill({ status: 200, contentType: 'text/plain', body: '' });
    let data = [];
    const table = url.pathname.split('/').at(-1);
    if (url.pathname.endsWith('/user')) data = user;
    else if (url.pathname.endsWith('/token')) data = session;
    else if (table === 'users') data = [{ ...profile, language: lang, theme }];
    else if (table === 'products') data = [product, { ...product, id: '55555555-5555-4555-8555-555555555555', seller_id: conversation.seller_id }];
    else if (table === 'platform_settings') data = [{ id: 1, disable_listing: false, disable_buying: false }];
    else if (table === 'conversations') data = [conversation];
    else if (table === 'messages') data = [{ id: 'message-1', conversation_id: conversation.id, sender_id: conversation.seller_id, sender: conversation.seller, content: 'LongUnbrokenMessage'.repeat(30), created_at: '2026-10-01T12:00:00Z' }];
    else if (['transactions', 'user_transactions'].includes(table)) data = [{ id: 'tx-1', user_id: user.id, amount: 1234.56, type: 'deposit', transaction_type: 'deposit', description: 'Transaction description '.repeat(20), created_at: '2026-10-01T12:00:00Z', status: 'completed', user: profile }];
    else if (table === 'orders') data = [{ id: '66666666-6666-4666-8666-666666666666', buyer_id: user.id, seller_id: conversation.seller_id, product_id: product.id, product, buyer: profile, seller: conversation.seller, status: 'processing', order_status: 'processing', delivery_method: 'meetup', quantity: 1, total_amount: 1234.56, total_price: 1234.56, created_at: '2026-10-01T12:00:00Z' }];
    else if (table.startsWith('count_')) data = 2;
    if (table === 'products' && url.searchParams.get('id')?.startsWith('eq.')) data = data.filter(row => row.id === url.searchParams.get('id').slice(3));
    if (Array.isArray(data) && req.headers().accept?.includes('application/vnd.pgrst.object+json')) data = data[0] || null;
    await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'content-range': '0-1/2' }, body: JSON.stringify(data) });
  });
  const page = await context.newPage(); const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  return { context, page, errors };
}
