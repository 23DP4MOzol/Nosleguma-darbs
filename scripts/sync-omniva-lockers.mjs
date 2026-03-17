import { createClient } from '@supabase/supabase-js';
import { fetchOmnivaBalticLockers } from '../src/lib/omniva-lockers.js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

function toInsertRow(locker) {
  return {
    carrier: locker.carrier,
    locker_id: locker.locker_id,
    name: locker.name,
    address: locker.address,
    city: locker.city,
    country: locker.country,
    postal_code: locker.postal_code,
    latitude: locker.latitude,
    longitude: locker.longitude,
    active: true
  };
}

async function run() {
  console.log('Fetching full Omniva Baltic parcel locker feed...');
  const lockers = await fetchOmnivaBalticLockers({ countries: ['LV', 'LT', 'EE'] });
  console.log(`Fetched ${lockers.length} lockers.`);

  console.log('Removing existing Omniva lockers for LV/LT/EE...');
  const { error: deleteError } = await supabase
    .from('parcel_lockers')
    .delete()
    .eq('carrier', 'omniva')
    .in('country', ['LV', 'LT', 'EE']);

  if (deleteError) {
    throw deleteError;
  }

  const rows = lockers.map(toInsertRow);
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

  console.log('Omniva Baltic locker sync complete.');
}

run().catch((error) => {
  console.error('Sync failed:', error.message);
  process.exit(1);
});
