const fs = require('fs');

let sbJs = fs.readFileSync('src/supabase.js', 'utf8');

// Replace fee logc in listProduct
const feeRegex = /const listingFee = price >= 100 \? 1\.00 : Math\.max\(0\.50, 0\.50 \+ \(price \/ 100\) \* 0\.50\);/g;
sbJs = sbJs.replace(feeRegex, "const duration = productData.duration || 1;\n    const listingFee = 0.50 + ((duration - 1) * 0.50);");

// Insert expires_at in products 
const insertRegex = /listing_fee: listingFee,/;
sbJs = sbJs.replace(insertRegex, "listing_fee: listingFee,\n        valid_until: new Date(Date.now() + (duration * 30 * 24 * 60 * 60 * 1000)).toISOString(),");

// Also let's check renew logic. Is there an endpoint for it? No.
fs.writeFileSync('src/supabase.js', sbJs);
