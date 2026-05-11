const fs = require('fs');

let mainJs = fs.readFileSync('src/main.js', 'utf8');

// Replace settings that hide scroll
mainJs = mainJs.replace(/document\.body\.style\.overflow = 'hidden';/g, 
  "document.body.style.overflow = 'hidden'; document.documentElement.style.overflow = 'hidden';");

// Replace settings that restore scroll
mainJs = mainJs.replace(/document\.body\.style\.overflow = 'auto';/g, 
  "document.body.style.overflow = 'auto'; document.documentElement.style.overflow = '';");
mainJs = mainJs.replace(/document\.body\.style\.overflow = '';/g, 
  "document.body.style.overflow = ''; document.documentElement.style.overflow = '';");

fs.writeFileSync('src/main.js', mainJs);

let productModalJs = fs.readFileSync('src/product-modal.js', 'utf8');
productModalJs = productModalJs.replace(/document\.body\.style\.overflow = 'hidden';/g, 
  "document.body.style.overflow = 'hidden'; document.documentElement.style.overflow = 'hidden';");
productModalJs = productModalJs.replace(/document\.body\.style\.overflow = 'auto';/g, 
  "document.body.style.overflow = 'auto'; document.documentElement.style.overflow = '';");
fs.writeFileSync('src/product-modal.js', productModalJs);
