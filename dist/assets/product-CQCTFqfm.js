import{i as y,s as i,r as g,a as v}from"./navbar-C9M4oSfT.js";document.getElementById("langSelect").addEventListener("change",e=>{y.setLang(e.target.value)});document.getElementById("themeToggle").addEventListener("click",()=>{const e=document.documentElement,a=(e.getAttribute("data-theme")||"light")==="dark"?"light":"dark";e.classList.remove("dark","light"),e.classList.add(a),e.setAttribute("data-theme",a),localStorage.setItem("theme",a),document.getElementById("themeToggle").textContent=a==="dark"?"☀️":"🌙"});document.getElementById("hamburgerBtn").addEventListener("click",()=>{document.querySelector(".navbar-links").classList.toggle("active")});const d=document.getElementById("loginBtn"),s=document.getElementById("logoutBtn"),f=document.getElementById("balanceBadge");let r=null;async function u(){const{data:{user:e}}=await i.auth.getUser();if(r=e,e){d.style.display="none",s.style.display="flex";const{data:t}=await i.from("users").select("balance").eq("id",e.id).single();f.querySelector("span").innerText=`€${parseFloat(t.balance).toFixed(2)}`,document.getElementById("favoritesTab").style.display="inline-flex"}else d.style.display="flex",s.style.display="none",document.getElementById("favoritesTab").style.display="none"}d.addEventListener("click",async()=>{window.location.href="login.html"});s.addEventListener("click",async()=>{await i.auth.signOut(),window.location.href="index.html"});u();let l="all",m=[],o=new Set;async function c(){if(!r){document.getElementById("productGrid").innerHTML='<div style="padding:20px;text-align:center;grid-column:1/-1;color:var(--muted);">Please log in to view your products.</div>';return}try{let e=[];if(l==="favorites")try{const{data:t}=await i.from("favorites").select("product_id").eq("user_id",r.id);if(t&&t.length>0){const a=t.map(p=>p.product_id),{data:n}=await i.from("products").select(`
              *,
              seller:users!seller_id(username, avatar_url)
            `).in("id",a);e=n||[]}}catch(t){console.warn("Favorites functionality not available:",t),e=[]}else{let t=i.from("products").select(`
          *,
          seller:users!seller_id(username, avatar_url)
        `);l==="active"?t=t.eq("seller_id",r.id).gt("stock",0):l==="sold"?t=t.eq("seller_id",r.id).eq("stock",0):t=t.eq("seller_id",r.id);const{data:a}=await t.order("created_at",{ascending:!1});e=a||[]}if(m=e,h(e),r)try{const{data:t}=await i.from("favorites").select("product_id").eq("user_id",r.id);o=new Set(t?.map(a=>a.product_id)||[])}catch(t){console.warn("Favorites table may not exist yet:",t),o=new Set}}catch(e){console.error("Error loading products:",e),document.getElementById("productGrid").innerHTML='<div style="padding:20px;text-align:center;grid-column:1/-1;color:var(--error);">Error loading products.</div>'}}function h(e){const t=document.getElementById("productGrid"),a=document.getElementById("emptyState");if(e.length===0){t.style.display="none",a.style.display="block";return}t.style.display="grid",a.style.display="none",t.innerHTML=e.map(n=>`
    <div class="product-card-modern" data-product-id="${n.id}">
      <div class="product-image-container">
        <img src="${n.image_url||"https://via.placeholder.com/400x300"}" alt="${n.name}" class="product-image">
        <button class="product-like-btn ${o.has(n.id)?"liked":""}" data-product-id="${n.id}">
          ${o.has(n.id)?"❤️":"🤍"}
        </button>
        <div class="product-overlay">
          <button class="btn-quick-view" data-product-id="${n.id}">Quick View</button>
        </div>
      </div>
      <div class="product-info">
        <div class="product-seller" style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.5rem;">
          <div class="seller-avatar" style="width:24px; height:24px; border-radius:50%; background:linear-gradient(135deg,#667eea,#764ba2); display:flex; align-items:center; justify-content:center; font-size:12px; color:white; font-weight:600;" onclick="showUserProfile('${n.seller_id}')">
            ${n.seller?.username?.charAt(0).toUpperCase()||"U"}
          </div>
          <span class="seller-name" style="font-size:0.875rem; color:var(--muted); cursor:pointer;" onclick="showUserProfile('${n.seller_id}')">
            ${n.seller?.username||"Unknown"}
          </span>
        </div>
        <h3 class="product-name">${n.name}</h3>
        <div class="product-meta">
          <span class="product-rating">⭐ ${n.condition||"N/A"}</span>
          <span class="product-views">📦 ${n.stock||0}</span>
        </div>
        <p class="product-description">${n.description||"No description available."}</p>
        <div class="product-footer">
          <div class="product-price">
            ${n.original_price&&n.original_price>n.price?`<span class="price-original">€${parseFloat(n.original_price).toFixed(2)}</span>`:""}
            <span class="price-currency">€</span>
            <span class="price-amount">${parseFloat(n.price).toFixed(2)}</span>
          </div>
          <div class="product-actions">
            ${n.seller_id===r?.id?`<button class="btn-edit" data-product-id="${n.id}">✏️</button>
               <button class="btn-delete" data-product-id="${n.id}">🗑️</button>`:`<button class="btn-add-cart" data-product-id="${n.id}">🛒</button>
               <button class="btn-buy-now" data-product-id="${n.id}">Buy Now</button>`}
          </div>
        </div>
      </div>
    </div>
  `).join(""),w()}function w(){document.querySelectorAll(".product-like-btn").forEach(e=>{e.addEventListener("click",async t=>{t.stopPropagation();const a=e.dataset.productId;await E(a)})}),document.querySelectorAll(".btn-quick-view").forEach(e=>{e.addEventListener("click",t=>{const a=e.dataset.productId;b(a)})}),document.querySelectorAll(".btn-buy-now, .btn-add-cart").forEach(e=>{e.addEventListener("click",t=>{const a=e.dataset.productId,n=e.classList.contains("btn-buy-now")?"buy":"cart";k(a,n)})}),document.querySelectorAll(".btn-edit").forEach(e=>{e.addEventListener("click",t=>{const a=e.dataset.productId;B(a)})}),document.querySelectorAll(".btn-delete").forEach(e=>{e.addEventListener("click",t=>{const a=e.dataset.productId;L(a)})})}async function E(e){if(!r){alert("Please log in to add favorites");return}try{const t=o.has(e);t?(await g(r.id,e),o.delete(e)):(await v(r.id,e),o.add(e));const a=document.querySelector(`.product-like-btn[data-product-id="${e}"]`);a&&(a.classList.toggle("liked",!t),a.textContent=t?"🤍":"❤️")}catch(t){console.error("Error toggling favorite:",t),alert("Favorites functionality is not available yet. Please contact support.")}}function b(e){m.find(a=>a.id===e)&&(window.location.href=`index.html?product=${e}`)}function k(e,t){alert(t==="buy"?"Purchase functionality would be implemented here":"Add to cart functionality would be implemented here")}function B(e){window.location.href=`sell.html?edit=${e}`}async function L(e){if(confirm("Are you sure you want to delete this product?"))try{const{error:t}=await i.from("products").delete().eq("id",e);if(t)throw t;c(),alert("Product deleted successfully")}catch(t){console.error("Error deleting product:",t),alert("Error deleting product")}}document.querySelectorAll(".filter-tab").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll(".filter-tab").forEach(t=>t.classList.remove("active")),e.classList.add("active"),l=e.dataset.filter,c()})});document.getElementById("sellNowBtn")?.addEventListener("click",()=>{window.location.href="sell.html"});document.getElementById("sellNowEmptyBtn")?.addEventListener("click",()=>{window.location.href="sell.html"});document.getElementById("profileModalClose")?.addEventListener("click",()=>{document.getElementById("userProfileModal").style.display="none"});document.getElementById("profileModalOverlay")?.addEventListener("click",()=>{document.getElementById("userProfileModal").style.display="none"});u().then(()=>{c()});
