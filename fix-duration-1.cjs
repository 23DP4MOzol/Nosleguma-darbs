const fs = require('fs');

let html = fs.readFileSync('sell.html', 'utf8');

const durationHtml = `
            <label class="form-field">
              <span class="form-label" data-i18n="listingDuration">Listing Duration *</span>
              <select id="productDurationInput" class="form-select" required>
                <option value="1">1 Month - Base Fee</option>
                <option value="2">2 Months - +\u20ac0.50</option>
                <option value="3">3 Months - +\u20ac1.00</option>
              </select>
            </label>
`;

html = html.replace(/<label class="form-field">\s*<span class="form-label" data-i18n="sell_condition">/, durationHtml + '\n            <label class="form-field">\n              <span class="form-label" data-i18n="sell_condition">');

fs.writeFileSync('sell.html', html);

let js = fs.readFileSync('src/pages/sell.js', 'utf8');

// Replace listing fee calculation
js = js.replace(/const listingFee = .*?;/g, "const duration = parseInt(document.getElementById('productDurationInput')?.value || '1');\n    const baseFee = 0.50;\n    const listingFee = baseFee + ((duration - 1) * 0.50);");
js = js.replace(/const listingFee = price >= 100 \? 1\.00 : Math\.max\(0\.50, 0\.50 \+ \(price \/ 100\) \* 0\.50\);/g, "");

// Pass duration to listProduct
js = js.replace(/image_url: finalImageUrl/g, "image_url: finalImageUrl,\n        duration: parseInt(document.getElementById('productDurationInput')?.value || '1')");

// Add listener
js = js.replace(/productImageInput'\].forEach\(id => {/g, "productImageInput', 'productDurationInput'].forEach(id => {");

fs.writeFileSync('src/pages/sell.js', js);
