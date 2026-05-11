const fs = require('fs');

let mainJs = fs.readFileSync('src/main.js', 'utf8');

const regex = /\$\{isSoldRecently \? `<span style="color:#ef4444; font-weight:700; font-size:0\.875rem;">SOLD<\/span>` :\s*`<button class="btn-buy-now" data-id="\$\{escapeHtml\(product\.id\)\}" data-i18n="buyNow">\\ud83d\\uded2 Buy Now<\/button>`\}/g;

const replacement = `\${isSoldRecently ? \`<span style="color:#ef4444; font-weight:700; font-size:0.875rem;">SOLD</span>\` :
                  ((currentUser && product.seller_id === currentUser.id) ? '' : \`<button class="btn-buy-now" data-id="\${escapeHtml(product.id)}" data-i18n="buyNow">\\ud83d\\uded2 Buy Now</button>\`)}`;

if(regex.test(mainJs)) {
    mainJs = mainJs.replace(regex, replacement);
    fs.writeFileSync('src/main.js', mainJs);
    console.log("mainJs replaced");
} else {
    console.log("No match found in mainJs");
}

let modalJs = fs.readFileSync('src/product-modal.js', 'utf8');
const modalRegex = /\$\{product\.stock > 0 && !product\.is_reserved \? `\s*<button class="modal-btn modal-btn-secondary" onclick="handleReserve\('\$\{product\.id\}'\)">\s*[\s\S]*?<button class="modal-btn modal-btn-primary" onclick="handlePurchase\('\$\{product\.id\}'\)">\s*[\s\S]*?<\/button>\s*` : ''\}/m;

if(modalRegex.test(modalJs)) {
    console.log("modalJs matched");
    let rep = `\${(product.stock > 0 && !product.is_reserved && (!currentUser || product.seller_id !== currentUser.id)) ? \`
        <button class="modal-btn modal-btn-secondary" onclick="handleReserve('\${product.id}')">
          🛒 Reserve (\u20ac0.20)
        </button>
        <button class="modal-btn modal-btn-primary" onclick="handlePurchase('\${product.id}')">
          🛒 Buy Now - \u20ac\${price}
        </button>
        \` : ''}`;
    // Replace the block but we need to inject currentUser variable into showProductModal
    // wait, where is currentUser defined in product-modal.js?
    // Let's do that separately.
}
