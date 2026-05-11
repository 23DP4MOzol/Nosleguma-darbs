const fs = require('fs');

let mainJs = fs.readFileSync('src/main.js', 'utf8');

const regex = /card\.addEventListener\('click', \(e\) => {[\s\S]*?showProductModal\(product\);\s*}\s*<img src=/m;

const replacement = `      card.addEventListener('click', (e) => {
        // Don't open modal if clicking action buttons or like/quick-view button
        if (!e.target.closest('.btn-buy-now') && !e.target.closest('.btn-reserve') && !e.target.closest('.product-like-btn') && !e.target.closest('.btn-quick-view')) {
          recordProductView(product.id);
          const img = card.querySelector('.product-image');
          if (document.startViewTransition && img) {
             img.style.viewTransitionName = 'active-product';
             document.startViewTransition(() => {
                showProductModal(product);
             }).finished.finally(() => {
                img.style.viewTransitionName = '';
                const modalImg = document.querySelector('.modal-product-image');
                if (modalImg) modalImg.style.viewTransitionName = '';
             });
          } else {
             showProductModal(product);
          }
        }
      });

      card.innerHTML = \`
        <div class="product-image-container">
          <img src=`;

mainJs = mainJs.replace(regex, replacement);

fs.writeFileSync('src/main.js', mainJs);
