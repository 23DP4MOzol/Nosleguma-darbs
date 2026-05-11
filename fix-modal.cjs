const fs = require('fs');

let modalJs = fs.readFileSync('src/product-modal.js', 'utf8');

// Inject currentUser check at the start
if (!modalJs.includes('supabase.auth.getUser()')) {
    modalJs = modalJs.replace(
        "export async function showProductModal(product) {\n  const modal = document.getElementById('productModal');",
        "export async function showProductModal(product) {\n  const { data: { user: currentUser } } = await supabase.auth.getUser();\n  const modal = document.getElementById('productModal');"
    );
}

// Replace the reserve/buy buttons block
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
    
    modalJs = modalJs.replace(modalRegex, rep);
    fs.writeFileSync('src/product-modal.js', modalJs);
} else {
    console.log("modalJs regex didn't match");
}
