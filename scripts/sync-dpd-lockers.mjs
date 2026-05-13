import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { JSDOM } from 'jsdom';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const DPD_LV_FILE = path.join(repoRoot, 'dpd-lv.html');

const supabase = createClient(supabaseUrl, serviceRoleKey);

function toLockerRow(lockerData) {
  const { name, address, city } = lockerData;
  const lockerId = `dpd-lv-${name.replace(/\s+/g, '-').toLowerCase()}`;

  return {
    carrier: 'dpd',
    locker_id: lockerId,
    name: name,
    address: address,
    city: city,
    country: 'LV',
    active: true
  };
}

async function readDpdPoints(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    const dom = new JSDOM(content);
    const { document } = dom.window;
    const lockerRows = [];
    
    const table = document.querySelector('table.table');
    if (!table) {
        console.warn("Could not find the DPD locker table. The HTML structure might have changed.");
        return lockerRows;
    }

    const tableRows = table.querySelectorAll('tbody tr');

    tableRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 3) {
            const lockerData = {
                name: cells[0].textContent.trim(),
                address: cells[2].textContent.trim(),
                city: cells[1].textContent.trim(),
            };
            // Sometimes the name is inside the address field
            if (lockerData.address.includes(lockerData.name)) {
                lockerData.address = lockerData.address.replace(lockerData.name, '').trim();
            }
            lockerRows.push(toLockerRow(lockerData));
        }
    });

    if (lockerRows.length === 0) {
        console.warn("Could not find any DPD lockers within the table. The HTML structure might have changed. Please check the selectors.");
    }

    return lockerRows;
}

async function run() {
  console.log(`Reading DPD LV lockers from ${path.basename(DPD_LV_FILE)}...`);
  const rows = await readDpdPoints(DPD_LV_FILE);
  console.log(`Parsed ${rows.length} DPD LV points.`);

  if (rows.length === 0) {
      console.log("No lockers to insert. Exiting.");
      return;
  }

  console.log('Removing existing DPD LV lockers...');
  const { error: deleteError } = await supabase
    .from('parcel_lockers')
    .delete()
    .eq('carrier', 'dpd')
    .eq('country', 'LV');

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

  console.log('DPD LV locker sync complete.');
}

run().catch((error) => {
  console.error('Sync failed:', error.message);
  process.exit(1);
});
