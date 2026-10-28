import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, readdir } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { createServer } from 'node:http';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const directory = resolve(process.env.AUDIT_BUILD_DIR || 'dist');
const files = await readdir(directory);
const broken = [];
for (const name of files.filter(name => name.endsWith('.html'))) {
  const html = await readFile(resolve(directory, name), 'utf8');
  for (const [, reference] of html.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/g)) {
    if (/^(?:https?:|data:|blob:|mailto:|tel:|#)/.test(reference)) continue;
    const path = reference.split(/[?#]/)[0];
    if (!path) continue;
    try { await readFile(resolve(directory, path.replace(/^\//, ''))); }
    catch { broken.push({ name, reference }); }
  }
}
assert.deepEqual(broken, [], 'Built HTML has missing local files');
const headers = await readFile(resolve(directory, '_headers'), 'utf8');
const csp = headers.match(/Content-Security-Policy: (.+)/)?.[1];
assert(csp, 'Hosting CSP missing');
assert((await readFile(resolve(directory, 'service-worker.js'), 'utf8')).includes('vendly-static-v2'));
console.log(`PASS ${files.filter(name => name.endsWith('.html')).length} built pages have valid local asset and page links`);
const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.json': 'application/json' };
const server = createServer(async (request, response) => {
  try {
    const path = new URL(request.url, 'http://localhost').pathname;
    const target = resolve(directory, '.' + (path === '/' ? '/index.html' : path));
    if (!target.startsWith(directory)) { response.writeHead(403).end(); return; }
    const body = await readFile(target);
    response.writeHead(200, { 'Content-Type': types[extname(target)] || 'application/octet-stream', 'Content-Security-Policy': csp, 'Cache-Control': 'no-cache' });
    response.end(body);
  } catch { response.writeHead(404).end('Not found'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.AUDIT_BROWSER_PATH ? { executablePath: process.env.AUDIT_BROWSER_PATH } : {}) });
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.stack || error.message));
  await page.goto(`${base}/index.html`);
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, { timeout: 15000 });
  await page.waitForTimeout(1500);
  console.log('PASS production service worker installs and controls the page under the hosting CSP');
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  assert.match(await page.title(), /Vendly/);
  await page.waitForTimeout(500);
  const compiledScripts = await page.locator('script[type=module][src]').count();
  assert(compiledScripts > 0);
  assert.deepEqual(errors, []);
  console.log('PASS previously visited homepage loads offline without uncaught JavaScript errors');
  await context.close();
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
