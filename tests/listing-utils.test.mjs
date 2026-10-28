import test from 'node:test';
import assert from 'node:assert/strict';
import { validateListingData, getListingExpiryInfo, isListingExpired } from '../src/listing-utils.js';
import { escapeHtml } from '../src/html.js';
import { renderAttrBadges } from '../src/category-fields.js';

test('Reject invalid prices before creating or updating a listing', () => {
  for (const price of [-1, NaN, Infinity, 'invalid']) assert.throws(() => validateListingData({ price }));
  for (const price of [0, 0.01, 100]) assert.doesNotThrow(() => validateListingData({ price }));
});
test('Stock must be a finite non-negative integer', () => {
  for (const stock of [-1, 1.5, Infinity, NaN]) assert.throws(() => validateListingData({ stock }));
  for (const stock of [0, 1, 10]) assert.doesNotThrow(() => validateListingData({ stock }));
});
test('Empty listing names are rejected', () => {
  assert.throws(() => validateListingData({ name: '  ' }));
});
test('Listings expire at their exact deadline', () => {
  const now = Date.parse('2026-10-28T12:00:00Z');
  assert.equal(isListingExpired({ valid_until: new Date(now).toISOString() }, now), true);
  assert.equal(getListingExpiryInfo(new Date(now + 1).toISOString(), now).isExpired, false);
  assert.equal(getListingExpiryInfo('invalid', now).hasExpiry, false);
});
test('HTML escaping preserves text and protects quoted attributes', () => {
  assert.equal(escapeHtml('<img src="x" onerror=\'bad()\'>&'), '&lt;img src=&quot;x&quot; onerror=&#39;bad()&#39;&gt;&amp;');
});
test('Custom attribute values and unknown attribute labels cannot inject markup', () => {
  const html = renderAttrBadges('electronics', { '<img src=x>': '<script>bad()</script>' });
  assert(!html.includes('<script>'));
  assert(!html.includes('<img'));
  assert(html.includes('&lt;script&gt;'));
});
