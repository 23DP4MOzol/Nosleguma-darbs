import { supabase, getCurrentUser, loginUser, registerUser, logoutUser, getBalance, getProducts, addBalance, purchaseProduct, reserveProduct, listProduct, getUserTransactions } from './supabase.js';

// ---------------------
// UTILS
// ---------------------
function showToast(msg, type="success", timeout=3000){
  let container = document.getElementById("toastContainer");
  if(!container){
    container = document.createElement("div");
    container.id="toastContainer";
    Object.assign(container.style,{position:"fixed",right:"20px",bottom:"20px",zIndex:9999,display:"flex",flexDirection:"column",gap:"8px"});
    document.body.appendChild(container);
  }
  const node=document.createElement("div");
  node.textContent=msg;
  node.className=`toast toast-${type}`;
  Object.assign(node.style,{
    background:type==="error"? "#fee2e2":"#ecfdf5",
    color:type==="error"? "#ef4444":"#065f46",
    padding:"10px 14px", borderRadius:"10px", boxShadow:"0 6px 18px rgba(0,0,0,0.08)", fontWeight:600
  });
  container.appendChild(node);
  setTimeout(()=>node.remove(),timeout);
}

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
        <img class="product-image" src="${p.image_url||'https://via.placeholder.com/600x400'}" alt="${escapeHtml(p.name)}">
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
// INIT PAGE
// ---------------------
window.addEventListener("load", async ()=>{
  updateNavbar();
  loadProducts();
});
// After rendering products
i18n.setLang(i18n.lang);

// Example: switch language
document.getElementById('langSwitcher').addEventListener('change', (e) => {
  i18n.setLang(e.target.value);
});
