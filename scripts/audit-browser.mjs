// Run with PLAYWRIGHT_PATH pointing to an installed playwright package, or install playwright locally.
import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
import { loadEnv } from 'vite';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const baseURL = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:5173';
const env = loadEnv('development', process.cwd(), 'VITE_');
const browser = await chromium.launch({ headless: true, ...(process.env.AUDIT_BROWSER_PATH ? { executablePath: process.env.AUDIT_BROWSER_PATH } : {}) });
const pages = ['index', 'login', 'register', 'sell', 'product', 'orders', 'balance', 'chat', 'settings', 'admin', 'terms', 'terms-lv', 'resend-verification'];
const results = [];
try {
  for (let start = 0; start < pages.length; start += 3) {
    await Promise.all(pages.slice(start, start + 3).map(async name => {
      const context = await browser.newContext({ serviceWorkers: 'block' });
      const page = await context.newPage();
      const result = { page: name, errors: [], failedRequests: [], httpErrors: [] };
      page.on('pageerror', error => result.errors.push(error.message));
      page.on('requestfailed', request => {
        if (!request.url().includes('placehold.co')) result.failedRequests.push({ url: request.url().split('?')[0], error: request.failure()?.errorText });
      });
      page.on('response', response => {
        if (response.status() >= 400) result.httpErrors.push({ url: response.url().split('?')[0], status: response.status() });
      });
      try {
        const response = await page.goto(`${baseURL}/${name}.html`, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForTimeout(2500);
        result.status = response.status();
        result.finalPath = new URL(page.url()).pathname;
        result.title = await page.title();
        result.horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
        await page.setViewportSize({ width: 390, height: 844 });
        await page.waitForTimeout(100);
        result.mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      } catch (error) { result.errors.push(error.message); }
      results.push(result);
      console.log(JSON.stringify(result));
      await context.close();
    }));
  }
  if (env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY) {
    for (const endpoint of ['/auth/v1/settings', '/rest/v1/']) {
      try {
        const response = await fetch(env.VITE_SUPABASE_URL + endpoint, {
          headers: { apikey: env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}` },
          signal: AbortSignal.timeout(10000)
        });
        const body = await response.json();
        const result = { endpoint, status: response.status };
        if (endpoint.includes('settings')) result.settings = body;
        else result.paths = Object.keys(body.paths || {});
        results.push(result);
        console.log(JSON.stringify(result));
      } catch (error) {
        results.push({ endpoint, error: error.message });
        console.log(JSON.stringify({ endpoint, error: error.message }));
      }
    }
  }
} finally {
  await browser.close();
  await writeFile(process.env.AUDIT_OUTPUT || 'audit-browser-results.json', JSON.stringify(results, null, 2) + '\n');
}
