import { supabase, getCurrentUser, loginUser, registerUser, logoutUser, getBalance, getProducts, addBalance, purchaseProduct, reserveProduct, listProduct, getUserTransactions } from './supabase.js';
import { showToast } from './main.js';
import { i18n } from './i18n.js';

// ---------------------
// UTILS
// ---------------------
function escapeHtml(str=''){return String(str).replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));}

// ---------------------
// NAVBAR / AUTH
// ---------------------
export async function updateNavbar(){
  const user = await getCurrentUser();
  const loginBtn=document.getElementById("loginBtn");
  const logoutBtn=document.getElementById("logoutBtn");
  const balanceBadge=document.getElementById("balanceBadge");
  if(user){
    if(loginBtn) loginBtn.style.display="none";
    if(logoutBtn) logoutBtn.style.display="flex";
    if(balanceBadge){
      balanceBadge.style.display="flex";
      const balance=await getBalance(user.id);
      balanceBadge.querySelector("span").innerText=`€${(+balance).toFixed(2)}`;
    }
  }else{
    if(loginBtn) loginBtn.style.display="flex";
    if(logoutBtn) logoutBtn.style.display="none";
    if(balanceBadge) balanceBadge.style.display="none";
  }
}

// Logout
const logoutBtnEl = document.getElementById("logoutBtn");
if(logoutBtnEl){
  logoutBtnEl.addEventListener("click", async ()=>{
    await logoutUser();
    showToast("Logged out","success");
    updateNavbar();
  });
}

// ---------------------
// PRODUCTS
// ---------------------
export async function loadProducts(containerId='productsContainer'){
  const container=document.getElementById(containerId);
  if(!container) return;
  container.innerHTML='<div style="padding:20px">Loading...</div>';
  const products = await getProducts();
  container.innerHTML='';
  products.forEach(p=>{
    const card=document.createElement("div");
    card.className='product-card-modern';
    card.innerHTML=`
      <div class="product-image-container">
        <img class="product-image" src="${p.image_url||'https://placehold.co/600x400/667eea/white?text=No+Image'}" alt="${escapeHtml(p.name)}">
        <button class="product-like-btn" data-id="${p.id}">❤</button>
        ${p.is_reserved?'<span class="product-badge-new">Reserved</span>':''}
        <div class="product-overlay">
          <button class="btn-quick-view" data-id="${p.id}">Quick View</button>
        </div>
      </div>
      <div class="product-info">
        <span class="product-category">${escapeHtml(p.category||'Other')}</span>
        <h3 class="product-name">${escapeHtml(p.name)}</h3>
        <div class="product-footer">
          <div class="product-price">
            <span class="price-currency">€</span>
            <span class="price-amount">${(+p.price).toFixed(2)}</span>
          </div>
          <div class="product-actions">
            <button class="btn-add-cart" data-id="${p.id}">🛒</button>
            <button class="btn-buy-now" data-id="${p.id}">Buy</button>
          </div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  container.querySelectorAll('.btn-buy-now').forEach(btn=>{
    btn.addEventListener('click', async e=>{
      const id=e.currentTarget.dataset.id;
      const user=await getCurrentUser();
      if(!user) return showToast("Login first","error");
      try{await purchaseProduct(id,user.id);showToast("Purchased","success");loadProducts();updateNavbar();}
      catch(err){showToast(err.message,"error");}
    });
  });

  container.querySelectorAll('.btn-quick-view').forEach(btn=>{
    btn.addEventListener('click', async e=>{
      const id=e.currentTarget.dataset.id;
      // Implement modal or details view here
      showToast(`Quick view product ${id}`,"info");
    });
  });
}

// ---------------------
// INIT PAGE - Disabled: main.js handles all page initialization
// ---------------------
// window.addEventListener("load", async ()=>{
//   updateNavbar();
//   loadProducts();
//   if (i18n && typeof i18n.setLang === 'function') {
//     i18n.setLang(i18n.lang || localStorage.getItem('lang') || 'en');
//   }
// });
