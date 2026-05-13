import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// The public URL for Latvijas Pasts parcel machine data
const PASTS_LOCKERS_URL = 'https://manspasts.lv/files/parcel-machines-v2.json';

function toInsertRow(locker) {
  // Example locker format from the JSON:
  // {
  //   "ID": "9501",
  //   "PASTALA_NOSAUKUMS_LCASE": "Ādažu nov., Ādaži, Rīgas gatve 5, t/c Apelsīns",
  //   "ADRESE": "Rīgas gatve 5",
  //   "PILSETA": "Ādaži",
  //   "PASTA_INDEKSS": "LV-2164",
  //   "KOORDINATES_LAT": "57.073863",
  //   "KOORDINATES_LON": "24.332113",
  //   "DARBA_LAIKS_BRIIVDIENAAS": "00-24",
  //   "DARBA_LAIKS_DARBA_DIENAAS": "00-24",
  //   "APRAKSTS": "Pakomāts atrodas pie t/c Apelsīns galvenās ieejas.",
  //   "TIPS": "Pakomāts"
  // }
  return {
    carrier: 'pasts',
    locker_id: `pasts-lv-${locker.ID}`,
    name: locker.PASTALA_NOSAUKUMS_LCASE,
    address: locker.ADRESE,
    city: locker.PILSETA,
    country: 'LV',
    postal_code: locker.PASTA_INDEKSS,
    latitude: parseFloat(locker.KOORDINATES_LAT),
    longitude: parseFloat(locker.KOORDINATES_LON),
    active: true,
  };
}

async function run() {
  console.log('Fetching Latvijas Pasts parcel locker feed...');
  const response = await fetch(PASTS_LOCKERS_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch data: ${response.statusText}`);
  }
  const lockers = await response.json();
  console.log(`Fetched ${lockers.length} lockers.`);

  console.log('Removing existing Latvijas Pasts lockers for LV...');
  const { error: deleteError } = await supabase
    .from('parcel_lockers')
    .delete()
    .eq('carrier', 'pasts')
    .eq('country', 'LV');

  if (deleteError) {
    throw deleteError;
  }

  const rows = lockers.filter(l => l.TIPS === 'Pakomāts').map(toInsertRow);
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

  console.log('Latvijas Pasts locker sync complete.');
}

run().catch((error) => {
  console.error('Sync failed:', error.message);
  process.exit(1);
});
