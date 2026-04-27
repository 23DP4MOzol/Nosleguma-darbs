import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const COUNTRY_FILES = [
  { country: 'LV', filePath: path.join(repoRoot, 'venipak-lv.html') },
  { country: 'LT', filePath: path.join(repoRoot, 'venipak-lt.html') },
  { country: 'EE', filePath: path.join(repoRoot, 'venipak-ee.html') }
];

const supabase = createClient(supabaseUrl, serviceRoleKey);

function normalizeCountry(value, fallback) {
  return String(value || fallback || '').trim().toUpperCase();
}

function parseNumber(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toLockerRow(point, fallbackCountry) {
  const country = normalizeCountry(point.country, fallbackCountry);
  const idPart = String(point.id || point.code || '').trim();
  const codePart = String(point.code || '').trim();
  const lockerId = `venipak-${country}-${idPart || codePart || Math.random().toString(36).slice(2)}`;

  return {
    carrier: 'venipak',
    locker_id: lockerId,
    name: String(point.display_name || point.name || '').trim(),
    address: String(point.address || '').trim(),
    city: String(point.city || '').trim(),
    country,
    postal_code: String(point.zip || '').trim() || null,
    latitude: parseNumber(point.lat),
    longitude: parseNumber(point.lng),
    active: true
  };
}

async function readVenipakPoints(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const match = content.match(/var\s+venipak_points\s*=\s*(\[[\s\S]*?\]);/);

  if (!match) {
    throw new Error(`Could not find venipak_points array in ${path.basename(filePath)}`);
  }

  const raw = JSON.parse(match[1]);
  if (!Array.isArray(raw)) {
    throw new Error(`venipak_points is not an array in ${path.basename(filePath)}`);
  }

  return raw;
}

async function run() {
  const allRows = [];

  for (const source of COUNTRY_FILES) {
    console.log(`Reading ${path.basename(source.filePath)}...`);
    const points = await readVenipakPoints(source.filePath);
    const rows = points
      .map((point) => toLockerRow(point, source.country))
      .filter((row) => row.name && row.address && row.city && row.country);

    console.log(`  Parsed ${rows.length} Venipak points for ${source.country}.`);
    allRows.push(...rows);
  }

  const deduped = new Map();
  for (const row of allRows) {
    deduped.set(row.locker_id, row);
  }

  const rows = Array.from(deduped.values());
  console.log(`Total unique Venipak points: ${rows.length}`);

  console.log('Removing existing Venipak lockers for LV/LT/EE...');
  const { error: deleteError } = await supabase
    .from('parcel_lockers')
    .delete()
    .eq('carrier', 'venipak')
    .in('country', ['LV', 'LT', 'EE']);

  if (deleteError) {
    throw deleteError;
  }

  const batchSize = 500;
  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = rows.slice(index, index + batchSize);
    const { error: insertError } = await supabase
      .from('parcel_lockers')
      .insert(batch);

    if (insertError) {
      throw insertError;
    }

    console.log(`Inserted ${Math.min(index + batch.length, rows.length)}/${rows.length}`);
  }

  console.log('Venipak Baltic locker sync complete.');
}

run().catch((error) => {
  console.error('Sync failed:', error.message);
  process.exit(1);
});
