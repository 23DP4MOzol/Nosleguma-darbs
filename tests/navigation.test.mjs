import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('Renewing a listing only invokes renewal, while buying still opens checkout', async () => {
  const source = read('../src/pages/product.js');
  const classes = source.match(/class="([^"]*btn-renew-listing[^"]*)"/)[1].split(' ');
  const makeButton = classes => ({
    classes, dataset: { productId: 'listing-123', mode: 'renew' }, listeners: [],
    classList: { contains: name => classes.includes(name) },
    addEventListener(event, listener) { this.listeners.push(listener); }
  });
  const renewal = makeButton(classes);
  const purchase = makeButton(['btn-buy-now']);
  const buttons = [renewal, purchase];
  const calls = [];
  const context = {
    document: { querySelectorAll: selector => buttons.filter(btn => selector.split(',').some(part => btn.classes.includes(part.trim().slice(1)))) },
    handleProductAction: (...args) => calls.push(['checkout', ...args]),
    handleRenewListing: async (...args) => calls.push(['renew', ...args])
  };
  const start = source.indexOf('function attachProductEventListeners()');
  const end = source.indexOf('// Toggle favorite status', start);
  vm.runInNewContext(source.slice(start, end) + '\nattachProductEventListeners();', context);
  for (const listener of renewal.listeners) await listener({ stopPropagation() {} });
  assert.deepEqual(calls, [['renew', 'listing-123', 'renew']]);
  calls.length = 0;
  for (const listener of purchase.listeners) await listener({ stopPropagation() {} });
  assert.deepEqual(calls, [['checkout', 'listing-123', 'buy']]);
});

test('Dropdown toggles from its icon, closes outside and on Escape, and updates aria-expanded', () => {
  const listeners = {};
  let open = false;
  let expanded = 'false';
  let focused = false;
  const button = {
    closest: selector => selector === '.dropdown' ? dropdown : null,
    setAttribute: (name, value) => { if (name === 'aria-expanded') expanded = value; },
    focus: () => { focused = true; }
  };
  const icon = { closest: selector => selector === '.dropdown-btn' ? button : null };
  const outside = { closest: () => null };
  const dropdown = {
    classList: { contains: () => open, toggle: (name, value) => { open = value; } },
    querySelector: () => button,
    contains: target => target === icon || target === button
  };
  const document = {
    getElementById: () => null,
    addEventListener: (name, listener) => { listeners[name] = listener; },
    querySelectorAll: selector => selector === '.dropdown.open' ? (open ? [dropdown] : []) : [dropdown]
  };
  const source = read('../src/navbar.js');
  vm.runInNewContext(source.slice(source.indexOf('function setDropdownOpen'), source.indexOf('// Auth handled')), { document });
  listeners.click({ target: icon });
  assert.equal(open, true);
  assert.equal(expanded, 'true');
  listeners.click({ target: icon });
  assert.equal(open, false);
  listeners.click({ target: icon });
  listeners.click({ target: outside });
  assert.equal(open, false);
  assert.equal(expanded, 'false');
  listeners.click({ target: icon });
  listeners.keydown({ key: 'Escape' });
  assert.equal(open, false);
  assert.equal(expanded, 'false');
  assert.equal(focused, true);
});

test('Every marketplace navigation has the same complete dropdown', () => {
  const pages = ['index', 'admin', 'balance', 'chat', 'login', 'product', 'register', 'sell', 'settings', 'orders', 'resend-verification'];
  const menus = pages.map(page => {
    const html = read(`../${page}.html`);
    const menu = html.match(/<div class="dropdown" id="pagesDropdown">[\s\S]*?<\/button>\s*<div class="dropdown-menu"[\s\S]*?<\/div>\s*<\/div>/)?.[0];
    assert.ok(menu, `${page}: complete dropdown`);
    assert.match(menu, /href="product.html"[^>]*data-i18n="myProducts"/);
    assert.match(menu, /href="orders.html"/);
    assert.doesNotMatch(menu, /<span data-i18n="pages_menu">/);
    return menu;
  });
  assert.equal(new Set(menus).size, 1);
});
