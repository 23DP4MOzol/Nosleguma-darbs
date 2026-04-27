import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const i18nPath = path.join(root, 'src', 'i18n.js');
const source = fs.readFileSync(i18nPath, 'utf8');

const enStart = source.indexOf('en: {');
const lvStart = source.indexOf('lv: {');
if (enStart === -1 || lvStart === -1 || lvStart <= enStart) {
  console.error('Could not locate en/lv blocks in src/i18n.js');
  process.exit(1);
}

function extractBlock(startIndex) {
  const openIndex = source.indexOf('{', startIndex);
  let depth = 0;
  let endIndex = -1;
  let inString = false;
  let quote = '';
  let escape = false;

  for (let i = openIndex; i < source.length; i++) {
    const ch = source[i];

    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === '\\') {
        escape = true;
      } else if (ch === quote) {
        inString = false;
      }
      continue;
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      inString = true;
      quote = ch;
      continue;
    }

    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) {
        endIndex = i;
        break;
      }
    }
  }

  if (endIndex === -1) throw new Error('Failed to parse object block');
  return source.slice(openIndex + 1, endIndex);
}

function extractKeys(blockText) {
  const keys = new Set();
  const keyRegex = /^\s*([A-Za-z0-9_]+)\s*:/gm;
  let match;
  while ((match = keyRegex.exec(blockText)) !== null) {
    keys.add(match[1]);
  }
  return keys;
}

const enKeys = extractKeys(extractBlock(enStart));
const lvKeys = extractKeys(extractBlock(lvStart));

const usedKeys = new Set();
const skipDirs = new Set(['node_modules', '.git', 'dist']);
const targetExt = new Set(['.html', '.js']);

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skipDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }

    if (!targetExt.has(path.extname(entry.name))) continue;
    const content = fs.readFileSync(full, 'utf8');

    const attrRegex = /data-i18n\s*=\s*"([^"]+)"/g;
    const tRegex = /i18n\.t\(\s*['"]([^'"]+)['"]\s*\)/g;

    let m;
    while ((m = attrRegex.exec(content)) !== null) usedKeys.add(m[1]);
    while ((m = tRegex.exec(content)) !== null) usedKeys.add(m[1]);
  }
}

walk(root);

const usedMissingInEn = [...usedKeys].filter((k) => !enKeys.has(k)).sort();
const usedMissingInLv = [...usedKeys].filter((k) => !lvKeys.has(k)).sort();
const enMissingInLv = [...enKeys].filter((k) => !lvKeys.has(k)).sort();

console.log(JSON.stringify({
  usedKeyCount: usedKeys.size,
  enKeyCount: enKeys.size,
  lvKeyCount: lvKeys.size,
  usedMissingInEn,
  usedMissingInLv,
  enMissingInLv
}, null, 2));
