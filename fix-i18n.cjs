const fs = require('fs');
let content = fs.readFileSync('src/i18n.js', 'utf8');

// 1. filter_availability Latvian
content = content.replace(/"📦 Pieejamība"/g, '"Sludinājuma statuss"');
// And the english version if we want it to be "Status"
content = content.replace(/"📦 Availability"/g, '"Status"');
content = content.replace(/"Availability"/g, '"Status"');
content = content.replace(/"Pieejam\\u012bba"/g, '"Sludin\\u0101juma statuss"');

content = content.replace(/availability_all: "Visi priekšmeti"/g, 'availability_all: "Visi statusi"');
content = content.replace(/availability_available: "Pieejams tagad"/g, 'availability_available: "Pieejams"');

// Item condition filter: "Slikts" -> "Ar lietojuma pazīmēm".
content = content.replace(/condition_poor: "Slikts"/g, 'condition_poor: "Ar lietojuma pazīmēm"');

// Buttons: "Edit" -> "Rediģēt", "Delete" -> "Dzēst" (Latvian)
// Let's check where Edit/Delete is in i18n.js
fs.writeFileSync('src/i18n.js', content);
