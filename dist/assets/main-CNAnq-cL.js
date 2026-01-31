const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./navbar-UlE-X-40.js","./navbar-C5EQzQ5q.css"])))=>i.map(i=>d[i]);
import{b as re,i as c,c as Z,d as ne,e as ae,p as ie,s as m,_ as q}from"./navbar-UlE-X-40.js";function J(s=""){return String(s).replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[a])}async function K(){const s=await Z(),a=document.getElementById("loginBtn"),i=document.getElementById("logoutBtn"),t=document.getElementById("balanceBadge");if(s){if(a&&(a.style.display="none"),i&&(i.style.display="flex"),t){t.style.display="flex";const r=await ne(s.id);t.querySelector("span").innerText=`€${(+r).toFixed(2)}`}}else a&&(a.style.display="flex"),i&&(i.style.display="none"),t&&(t.style.display="none")}const X=document.getElementById("logoutBtn");X&&X.addEventListener("click",async()=>{await re(),d("Logged out","success"),K()});async function ee(s="productsContainer"){const a=document.getElementById(s);if(!a)return;a.innerHTML='<div style="padding:20px">Loading...</div>';const i=await ae();a.innerHTML="",i.forEach(t=>{const r=document.createElement("div");r.className="product-card-modern",r.innerHTML=`
      <div class="product-image-container">
        <img class="product-image" src="${t.image_url||"https://via.placeholder.com/600x400"}" alt="${J(t.name)}">
        <button class="product-like-btn" data-id="${t.id}">❤</button>
        ${t.is_reserved?'<span class="product-badge-new">Reserved</span>':""}
        <div class="product-overlay">
          <button class="btn-quick-view" data-id="${t.id}">Quick View</button>
        </div>
      </div>
      <div class="product-info">
        <span class="product-category">${J(t.category||"Other")}</span>
        <h3 class="product-name">${J(t.name)}</h3>
        <div class="product-footer">
          <div class="product-price">
            <span class="price-currency">€</span>
            <span class="price-amount">${(+t.price).toFixed(2)}</span>
          </div>
          <div class="product-actions">
            <button class="btn-add-cart" data-id="${t.id}">🛒</button>
            <button class="btn-buy-now" data-id="${t.id}">Buy</button>
          </div>
        </div>
      </div>
    `,a.appendChild(r)}),a.querySelectorAll(".btn-buy-now").forEach(t=>{t.addEventListener("click",async r=>{const l=r.currentTarget.dataset.id,y=await Z();if(!y)return d("Login first","error");try{await ie(l,y.id),d("Purchased","success"),ee(),K()}catch(w){d(w.message,"error")}})}),a.querySelectorAll(".btn-quick-view").forEach(t=>{t.addEventListener("click",async r=>{const l=r.currentTarget.dataset.id;d(`Quick view product ${l}`,"info")})})}window.addEventListener("load",async()=>{K(),ee(),c&&typeof c.setLang=="function"&&c.setLang(c.lang||localStorage.getItem("lang")||"en")});window.openChatWithSeller=function(s,a){window.location.href=`chat.html?seller=${s}&product=${a}`};window.toggleSaveProduct=function(s){alert("Product saved! (Feature coming soon)")};window.toggleLikeProduct=function(s){alert("Product liked! (Feature coming soon)")};window.handlePurchase=async function(s){const a=new CustomEvent("purchaseProduct",{detail:{productId:s}});document.dispatchEvent(a)};window.handleReserve=async function(s){const a=new CustomEvent("reserveProduct",{detail:{productId:s}});document.dispatchEvent(a)};function d(s,a="success"){let i=document.getElementById("toastContainer");i||(i=document.createElement("div"),i.id="toastContainer",Object.assign(i.style,{position:"fixed",right:"20px",bottom:"20px",zIndex:"9999",display:"flex",flexDirection:"column",gap:"8px",maxWidth:"320px"}),document.body.appendChild(i));const t=document.createElement("div");t.textContent=s,Object.assign(t.style,{background:a==="error"?"#fee2e2":"#ecfdf5",color:a==="error"?"#991b1b":"#065f46",padding:"12px 16px",borderRadius:"12px",boxShadow:"0 6px 18px rgba(0,0,0,0.1)",fontWeight:"600",fontSize:"14px",transition:"transform 0.25s ease, opacity 0.25s ease",transform:"translateY(8px)",opacity:"0"}),i.appendChild(t),requestAnimationFrame(()=>{t.style.transform="translateY(0)",t.style.opacity="1"}),setTimeout(()=>{t.style.transform="translateY(8px)",t.style.opacity="0",setTimeout(()=>t.remove(),250)},3e3)}function B(s=""){const a=String(s),i={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};return a.replace(/[&<>"']/g,t=>i[t])}function se(){const s=localStorage.getItem("theme")||"light",a=document.documentElement;a.classList.remove("light","dark"),a.classList.add(s),a.setAttribute("data-theme",s);const i=document.getElementById("themeToggle");i&&(i.textContent=s==="dark"?"☀️":"🌙",i.addEventListener("click",le));const t=document.getElementById("userThemeToggle");t&&(t.textContent=c.t("toggle_theme"))}function le(){const s=document.documentElement,i=(s.getAttribute("data-theme")||"light")==="dark"?"light":"dark";s.classList.remove("dark","light"),s.classList.add(i),s.setAttribute("data-theme",i),localStorage.setItem("theme",i);const t=document.getElementById("themeToggle");t&&(t.textContent=i==="dark"?"☀️":"🌙");const r=document.getElementById("userThemeToggle");r&&(r.textContent=c.t("toggle_theme"))}function ce(){const s=localStorage.getItem("lang")||"en";c&&typeof c.setLang=="function"&&c.setLang(s);const a=document.querySelectorAll("#langSelect, #userLang");a&&a.length&&a.forEach(i=>{if(i){try{i.value=s}catch{}i.addEventListener("change",t=>{const r=t.target.value;localStorage.setItem("lang",r),c&&typeof c.setLang=="function"&&c.setLang(r),document.querySelectorAll("#langSelect, #userLang").forEach(l=>{l&&(l.value=r)})})}})}async function z(){try{const{data:s}=await m.auth.getUser(),a=s?s.user:null,i=document.getElementById("loginBtn"),t=document.getElementById("logoutBtn"),r=document.getElementById("balanceBadge"),l=document.getElementById("sellBtn"),y=document.getElementById("settingsBtn"),w=document.getElementById("adminBtn");if(a){let x="user";try{const{data:P,error:E}=await m.from("users").select("balance, role").eq("id",a.id).single();if(console.log("User data from database:",P),console.log("User ID:",a.id),console.log("Error fetching user:",E),!E&&P){x=P.role||"user",console.log("User role:",x);const _=parseFloat(P.balance||0);if(r){r.style.display="flex";const L=r.querySelector("span");L&&(L.textContent=`€${_.toFixed(2)}`)}}else{console.warn("No user data found in public.users table - creating entry");const{data:_,error:L}=await m.from("users").insert([{id:a.id,email:a.email,username:a.email.split("@")[0],role:"user",balance:0}]).select().single();if(!L&&_&&(x=_.role),r){r.style.display="flex";const S=r.querySelector("span");S&&(S.textContent="€0.00")}}}catch(P){if(console.error("Error in updateNavbarAuth:",P),r){r.style.display="flex";const E=r.querySelector("span");E&&(E.textContent="€0.00")}}console.log("Admin button element:",w),console.log("Setting admin button display for role:",x),i&&(i.style.display="none"),t&&(t.style.display="inline-block"),l&&(l.style.opacity="1",l.style.pointerEvents="auto"),y&&(y.style.display="inline-block",y.style.opacity="1",y.style.pointerEvents="auto"),w&&(x==="admin"?w.style.display="block":w.style.display="none")}else i&&(i.style.display="inline-block"),t&&(t.style.display="none"),r&&(r.style.display="none"),l&&(l.style.opacity="0.6",l.style.pointerEvents="none"),y&&(y.style.display="none"),w&&(w.style.display="none")}catch(s){console.error("Error updating navbar auth:",s)}}function de(){const s=document.getElementById("loginBtn"),a=document.getElementById("logoutBtn"),i=document.getElementById("sellBtn"),t=document.getElementById("settingsBtn");s?(console.log("Login button found, attaching listener"),s.addEventListener("click",()=>{console.log("Login button clicked"),window.location.href="./login.html"})):console.log("Login button not found"),a&&a.addEventListener("click",async()=>{try{await m.auth.signOut(),await z(),window.location.href="./index.html"}catch(r){console.error("Error signing out:",r),d("Error signing out","error")}}),i&&i.addEventListener("click",async()=>{const{data:r}=await m.auth.getUser();(r?r.user:null)?window.location.href="./sell.html":(d(c.t?c.t("loginFirst"):"Please log in first","error"),setTimeout(()=>window.location.href="login.html",1500))}),t&&t.addEventListener("click",async()=>{const{data:r}=await m.auth.getUser();(r?r.user:null)?window.location.href="./settings.html":(d(c.t?c.t("loginFirst"):"Please log in first","error"),setTimeout(()=>window.location.href="login.html",1500))}),m&&m.auth&&typeof m.auth.onAuthStateChange=="function"&&m.auth.onAuthStateChange(()=>{z()}),z()}function ue(){const s=document.getElementById("hamburgerBtn"),a=document.querySelector(".navbar-links");s&&a&&s.addEventListener("click",i=>{i.stopPropagation(),a.classList.toggle("active")}),document.addEventListener("click",i=>{a&&s&&!a.contains(i.target)&&!s.contains(i.target)&&a.classList.remove("active")}),window.addEventListener("resize",()=>{window.innerWidth>768&&a&&a.classList.remove("active")})}async function te(s){try{const{data:a}=await m.auth.getUser(),i=a?.user,{data:t}=await m.from("users").select("*").eq("id",s).single();if(!t)return;const{data:r}=await m.from("products").select("*").eq("seller_id",s).order("created_at",{ascending:!1}).limit(10),{data:l}=await m.from("reviews").select("rating, comment, created_at, buyer_id, users!buyer_id(username)").eq("seller_id",s).order("created_at",{ascending:!1});let y=0;l&&l.length>0&&(y=l.reduce((E,_)=>E+_.rating,0)/l.length);let w=!1,x=!1;if(i&&i.id!==s){const{data:E}=await m.from("reviews").select("id").eq("buyer_id",i.id).eq("seller_id",s).single();x=!!E,w=!x}const P=`
      <div class="profile-header">
        <div class="profile-avatar">
          ${t.username?.charAt(0).toUpperCase()||"U"}
        </div>
        <h2 class="profile-name">${t.username||"Unknown User"}</h2>
        ${t.bio?`<p class="profile-bio">${B(t.bio)}</p>`:""}
        <div class="profile-stats">
          <div class="profile-stat">
            <div class="profile-stat-value">${r?.length||0}</div>
            <div class="profile-stat-label">Products</div>
          </div>
          <div class="profile-stat">
            <div class="profile-stat-value">${y.toFixed(1)} ⭐</div>
            <div class="profile-stat-label">Rating (${l?.length||0} reviews)</div>
          </div>
        </div>
      </div>

      <div class="profile-section">
        <h3>Recent Products</h3>
        <div class="profile-products">
          ${r?.map(E=>`
            <div class="profile-product-card">
              <img src="${E.image_url||"https://via.placeholder.com/200x150"}" alt="${E.name}" class="profile-product-image">
              <div class="profile-product-info">
                <h4 class="profile-product-name">${B(E.name)}</h4>
                <div class="profile-product-price">€${parseFloat(E.price).toFixed(2)}</div>
                <button class="btn-buy-now" style="width:100%; padding:0.5rem; margin-top:0.5rem;" data-product-id="${E.id}">View Product</button>
              </div>
            </div>
          `).join("")||'<p style="grid-column:1/-1; text-align:center; color:var(--muted);">No products yet.</p>'}
        </div>
      </div>

      <div class="profile-section">
        <h3>Reviews & Comments</h3>
        <div class="profile-reviews">
          ${l?.map(E=>`
            <div class="profile-review">
              <div class="profile-review-header">
                <span class="profile-review-buyer">${B(E.users?.username||"Anonymous")}</span>
                <span class="profile-review-rating">⭐ ${E.rating}/5</span>
                <span class="profile-review-date">${new Date(E.created_at).toLocaleDateString()}</span>
              </div>
              <p class="profile-review-comment">${B(E.comment||"No comment")}</p>
            </div>
          `).join("")||'<p style="text-align:center; color:var(--muted);">No reviews yet.</p>'}
        </div>
      </div>

      ${w?`
        <div class="profile-section">
          <h3>Leave a Review</h3>
          <form id="reviewForm" class="profile-review-form">
            <label>Rating</label>
            <select id="reviewRating" required>
              <option value="">Select rating</option>
              <option value="5">⭐⭐⭐⭐⭐ 5 stars</option>
              <option value="4">⭐⭐⭐⭐ 4 stars</option>
              <option value="3">⭐⭐⭐ 3 stars</option>
              <option value="2">⭐⭐ 2 stars</option>
              <option value="1">⭐ 1 star</option>
            </select>
            <label>Comment</label>
            <textarea id="reviewComment" rows="3" placeholder="Share your experience..."></textarea>
            <button type="submit">Submit Review</button>
          </form>
        </div>
      `:x?'<p style="text-align:center; color:var(--muted); margin-top:1rem;">You have already reviewed this seller.</p>':""}
    `;if(document.getElementById("profileModalContent").innerHTML=P,document.getElementById("userProfileModal").style.display="flex",document.querySelectorAll("#profileModalContent .btn-buy-now").forEach(E=>{E.addEventListener("click",()=>{const _=E.dataset.productId;document.getElementById("userProfileModal").style.display="none",document.body.style.overflow="auto",showProductModal(_)})}),w){const E=document.getElementById("reviewForm");E&&E.addEventListener("submit",async _=>{_.preventDefault();const L=parseInt(document.getElementById("reviewRating").value),S=document.getElementById("reviewComment").value.trim();if(!L||L<1||L>5){d("Please select a valid rating","error");return}try{const{error:C}=await m.from("reviews").insert({buyer_id:i.id,seller_id:s,rating:L,comment:S||null});if(C)throw C;d("Review submitted successfully!","success"),document.getElementById("userProfileModal").style.display="none",te(s)}catch(C){console.error("Error submitting review:",C),d("Failed to submit review","error")}})}}catch(a){console.error("Error loading user profile:",a)}}async function me(){if(!document.querySelector(".product-grid-modern"))return;async function s(){try{const e=await m.from("products").select("*",{count:"exact",head:!0}),o=await m.from("users").select("*",{count:"exact",head:!0}),n=await m.from("products").select("seller_id",{count:"exact",head:!0}),f=e.count||0,b=o.count||0,I=n.count||0,h=document.getElementById("statsProducts"),T=document.getElementById("statsUsers"),D=document.getElementById("statsSellers");h&&(h.textContent=f.toString()),T&&(T.textContent=b.toString()),D&&(D.textContent=I.toString())}catch(e){console.error("Error updating stats:",e)}}let a=[],i="all",t={search:"",minPrice:"",maxPrice:"",location:"",condition:"",stock:"",availability:"",brand:"",color:"",date:"",sortBy:"newest"};async function r(){try{const{data:e,error:o}=await m.from("products").select("*, users!seller_id(username)").order("created_at",{ascending:!1});if(o){if(o.status===401||o.message.includes("401")){console.log("Products require authentication to view"),a=[],l();return}throw o}a=Array.isArray(e)?e:[],l(),s()}catch(e){console.error("Error loading products:",e),e.status!==401&&d(c.t&&c.t("error_loading_products")||"Error loading products","error")}}function l(){let e=[...a];if(i!=="all"&&(e=e.filter(o=>(o.category||"").toLowerCase()===i.toLowerCase())),t.search){const o=t.search.toLowerCase();e=e.filter(n=>(n.name||"").toLowerCase().includes(o)||(n.description||"").toLowerCase().includes(o)||(n.category||"").toLowerCase().includes(o))}if(t.minPrice){const o=parseFloat(t.minPrice);e=e.filter(n=>parseFloat(n.price||0)>=o)}if(t.maxPrice){const o=parseFloat(t.maxPrice);e=e.filter(n=>parseFloat(n.price||0)<=o)}if(t.location&&(e=e.filter(o=>(o.location||"").toLowerCase().includes(t.location.toLowerCase()))),t.condition&&(e=e.filter(o=>(o.condition||"")===t.condition)),t.stock&&(e=e.filter(o=>{const n=parseInt(o.stock||0);switch(t.stock){case"in_stock":return n>0;case"low_stock":return n>=1&&n<=5;case"high_stock":return n>=10;case"out_of_stock":return n===0;default:return!0}})),t.availability&&(e=e.filter(o=>t.availability==="available"?!o.is_reserved&&(o.stock||0)>0:t.availability==="reserved"?o.is_reserved:!0)),t.brand){const o=t.brand.toLowerCase();e=e.filter(n=>(n.brand||"").toLowerCase().includes(o))}if(t.color){const o=t.color.toLowerCase();e=e.filter(n=>(n.color||"").toLowerCase().includes(o))}if(t.date){const o=new Date;e=e.filter(n=>{const f=new Date(n.created_at),I=(o-f)/(1e3*60*60*24);switch(t.date){case"today":return I<1;case"week":return I<7;case"month":return I<30;case"3months":return I<90;default:return!0}})}switch(t.sortBy){case"oldest":e.sort((o,n)=>new Date(o.created_at)-new Date(n.created_at));break;case"price_low":e.sort((o,n)=>parseFloat(o.price||0)-parseFloat(n.price||0));break;case"price_high":e.sort((o,n)=>parseFloat(n.price||0)-parseFloat(o.price||0));break;case"name":e.sort((o,n)=>(o.name||"").localeCompare(n.name||""));break;case"name_desc":e.sort((o,n)=>(n.name||"").localeCompare(o.name||""));break;case"popular":e.sort((o,n)=>{const f=parseInt(o.views||0);return parseInt(n.views||0)-f});break;default:e.sort((o,n)=>new Date(n.created_at)-new Date(o.created_at));break}y(e)}async function y(e=null){const o=document.getElementById("productGrid");if(!o)return;const n=e||a;if(!n||n.length===0){o.innerHTML=`<div style="padding:40px;text-align:center;grid-column:1/-1;color:var(--muted);">
        <div style="font-size: 3rem; margin-bottom: 1rem;">📦</div>
        <span data-i18n="no_products">No products found</span>
        <p style="margin-top: 0.5rem; font-size: 0.875rem;">Try adjusting your filters or search terms</p>
      </div>`,c&&typeof c.setLang=="function"&&c.setLang(c.lang||"en");return}const{data:f}=await m.auth.getUser(),b=f?.user;let I="user";if(b)try{const{data:h}=await m.from("users").select("role").eq("id",b.id).single();I=h?.role||"user"}catch(h){console.error("Error fetching user role:",h)}o.innerHTML="",n.forEach(h=>{const T=h.image_url||"https://via.placeholder.com/300x200",D=Number.isFinite(Number(h.price))?parseFloat(h.price).toFixed(2):"0.00",Q=h.stock!=null?h.stock:0,G=B(h.category||"other"),Y=B(h.name||"Unnamed Product"),H=B(h.location||""),O=h.condition?h.condition.replace("_"," "):"",V={new:"✨",like_new:"🔄",good:"👍",fair:"😐",poor:"⚠️"},j=b&&(I==="admin"||h.seller_id===b.id),F=document.createElement("div");if(F.className="product-card-modern",F.style.cursor="pointer",F.setAttribute("data-product-id",h.id),F.addEventListener("click",U=>{!U.target.closest(".btn-buy-now")&&!U.target.closest(".btn-reserve")&&_(h)}),F.innerHTML=`
        <div class="product-image-container">
          <img src="${B(T)}" alt="${Y}" class="product-image" onerror="this.src='https://via.placeholder.com/300x200'">
          <button class="product-like-btn" data-id="${B(h.id)}" aria-label="Like">❤️</button>
          ${h.is_reserved?'<span class="product-badge-new" data-i18n="reserved">Reserved</span>':""}
          <div class="product-overlay">
            <button class="btn-quick-view" data-id="${B(h.id)}" data-i18n="quickView">👁 Quick View</button>
          </div>
        </div>
        <div class="product-info">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
            <span class="product-category">${G}</span>
            ${O?`<span style="background: #dbeafe; color: #1e40af; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 500;">${V[h.condition]} ${O}</span>`:""}
          </div>
          <h3 class="product-name">${Y}</h3>
          <div class="product-seller" style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.5rem;">
            <div class="seller-avatar" style="width:24px; height:24px; border-radius:50%; background:linear-gradient(135deg,#667eea,#764ba2); display:flex; align-items:center; justify-content:center; font-size:12px; color:white; font-weight:600; cursor:pointer;" onclick="event.stopPropagation(); showUserProfile('${h.seller_id}')">
              👤
            </div>
            <span class="seller-name" style="font-size:0.875rem; color:var(--muted); cursor:pointer;" onclick="event.stopPropagation(); showUserProfile('${h.seller_id}')">
              ${B(h.users?.username||"Unknown")}
            </span>
          </div>
          <div class="product-meta">
            ${H?`<span style="display: block; color: #6b7280; font-size: 0.875rem; margin-bottom: 0.25rem;">📍 ${H}</span>`:""}
            <span class="product-views">📦 ${B(Q)} in stock</span>
          </div>
          <div class="product-footer">
            <div class="product-price">
              ${h.original_price&&h.original_price>h.price?`<span class="price-original">€${parseFloat(h.original_price).toFixed(2)}</span>`:""}
              <span class="price-currency">€</span>
              <span class="price-amount">${D}</span>
            </div>
            <div class="product-actions">
              <button class="btn-buy-now" data-id="${B(h.id)}" data-i18n="buyNow">🛒 Buy Now</button>
            </div>
          </div>
          ${j?`
            <div class="product-management-actions" style="display: flex; gap: 0.5rem; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--border);">
              <button class="btn-edit-product" data-product-id="${B(h.id)}" style="flex: 1; padding: 0.5rem; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 0.875rem; cursor: pointer; font-weight: 500; transition: background 0.2s;">
                ✏️ Edit
              </button>
              <button class="btn-delete-product" data-product-id="${B(h.id)}" style="flex: 1; padding: 0.5rem; background: #ef4444; color: white; border: none; border-radius: 6px; font-size: 0.875rem; cursor: pointer; font-weight: 500; transition: background 0.2s;">
                🗑️ Delete
              </button>
            </div>
          `:""}
        </div>
      `,o.appendChild(F),j){const U=F.querySelector(".btn-edit-product"),W=F.querySelector(".btn-delete-product");U&&U.addEventListener("click",N=>{N.stopPropagation(),M(h)}),W&&W.addEventListener("click",async N=>{N.stopPropagation(),confirm(`Are you sure you want to delete "${h.name}"?`)&&await A(h.id)})}}),c&&typeof c.setLang=="function"&&c.setLang(c.lang||"en"),w()}function w(){document.querySelectorAll(".btn-buy-now:not([disabled])").forEach(e=>{e.replaceWith(e.cloneNode(!0))}),document.querySelectorAll(".btn-buy-now:not([disabled])").forEach(e=>{e.addEventListener("click",async o=>{const n=o.currentTarget.dataset.id;await x(n)})}),document.querySelectorAll(".btn-add-cart").forEach(e=>{e.replaceWith(e.cloneNode(!0))}),document.querySelectorAll(".btn-add-cart").forEach(e=>{e.addEventListener("click",async o=>{const n=o.currentTarget.dataset.id;await P(n)})}),document.querySelectorAll(".btn-remove-reserve").forEach(e=>{e.replaceWith(e.cloneNode(!0))}),document.querySelectorAll(".btn-remove-reserve").forEach(e=>{e.addEventListener("click",async o=>{const n=o.currentTarget.dataset.id;await E(n)})}),document.querySelectorAll(".btn-quick-view").forEach(e=>{e.replaceWith(e.cloneNode(!0))}),document.querySelectorAll(".btn-quick-view").forEach(e=>{e.addEventListener("click",o=>{const n=o.currentTarget.dataset.id,f=a.find(b=>String(b.id)===String(n));f&&_(f)})})}async function x(e){try{const{data:o}=await m.auth.getUser(),n=o?o.user:null;if(!n){d(c.t?c.t("loginFirst"):"Please log in first","error"),setTimeout(()=>window.location.href="login.html",1500);return}const f=await q(()=>import("./navbar-UlE-X-40.js").then(b=>b.f),__vite__mapDeps([0,1]),import.meta.url);if(f&&typeof f.purchaseProduct=="function")await f.purchaseProduct(e,n.id),d(c.t?c.t("purchaseComplete"):"Purchase completed","success"),await r(),await z();else throw new Error("Purchase function not available")}catch(o){console.error("Purchase error:",o),d(o.message||"Purchase failed","error")}}async function P(e){try{const{data:o}=await m.auth.getUser(),n=o?o.user:null;if(!n){d(c.t?c.t("loginFirst"):"Please log in first","error"),setTimeout(()=>window.location.href="./login.html",1500);return}const f=await q(()=>import("./navbar-UlE-X-40.js").then(b=>b.f),__vite__mapDeps([0,1]),import.meta.url);if(f&&typeof f.reserveProduct=="function")await f.reserveProduct(e,n.id,.2),d(c.t&&c.t("reserved_success")||"Product reserved successfully!","success"),await r(),await z();else throw new Error("Reserve function not available")}catch(o){console.error("Reserve error:",o),d(o.message||"Reservation failed","error")}}async function E(e){try{const{data:o}=await m.auth.getUser(),n=o?o.user:null;if(!n){d(c.t?c.t("loginFirst"):"Please log in first","error"),setTimeout(()=>window.location.href="./login.html",1500);return}const f=await q(()=>import("./navbar-UlE-X-40.js").then(b=>b.f),__vite__mapDeps([0,1]),import.meta.url);if(f&&typeof f.removeReserve=="function")await f.removeReserve(e,n.id),d("Reservation removed successfully!","success"),await r(),await z();else throw new Error("Remove reserve function not available")}catch(o){console.error("Remove reserve error:",o),d(o.message||"Failed to remove reservation","error")}}async function _(e){const o=document.getElementById("productModal");if(!o)return;const n=o.querySelector(".modal-body");let f=null,b=0,I=0;if(e.seller_id){const{data:oe}=await m.from("users").select("id, username, email, created_at").eq("id",e.seller_id).single();f=oe,b=4.5,I=23}const h=Math.floor(Math.random()*50),T=Math.floor(Math.random()*30),D=Math.floor(Math.random()*200)+50,Q={new:"✨",like_new:"🔄",good:"👍",fair:"😐",poor:"⚠️"},G=e.condition?e.condition.replace("_"," "):"",Y=e.image_url||"https://via.placeholder.com/600x400",H=Number.isFinite(Number(e.price))?parseFloat(e.price).toFixed(2):"0.00";n.innerHTML=`
      <div class="modal-product-grid">
        <div>
          <img src="${B(Y)}" alt="${B(e.name)}" class="modal-product-image">
        </div>
        
        <div class="modal-product-info">
          <h1>${B(e.name)}</h1>
          <div class="modal-product-price">€${H}</div>
          
          <div class="modal-product-meta">
            <span class="modal-badge" style="background: #dbeafe; color: #1e40af;">
              ${Q[e.condition]||"📦"} ${B(G)}
            </span>
            <span class="modal-badge" style="background: #fef3c7; color: #92400e;">
              📍 ${B(e.location)||"Not specified"}
            </span>
            <span class="modal-badge" style="background: #f3e8ff; color: #6b21a8;">
              📦 ${B(e.category)||"other"}
            </span>
            ${e.stock>0?`<span class="modal-badge" style="background: #d1fae5; color: #065f46;">✓ ${e.stock} in stock</span>`:'<span class="modal-badge" style="background: #fee2e2; color: #991b1b;">✗ Out of stock</span>'}
          </div>
          
          <div class="modal-description">
            <h3 style="margin-bottom: 0.75rem; font-size: 1.125rem;">Description</h3>
            <p>${B(e.description)||"No description provided."}</p>
          </div>
          
          <!-- Product Stats -->
          <div class="modal-stats">
            <div class="modal-stat">
              <div class="modal-stat-value">❤️ ${h}</div>
              <div class="modal-stat-label">Likes</div>
            </div>
            <div class="modal-stat">
              <div class="modal-stat-value">🔖 ${T}</div>
              <div class="modal-stat-label">Saved</div>
            </div>
            <div class="modal-stat">
              <div class="modal-stat-value">👁 ${D}</div>
              <div class="modal-stat-label">Views</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Seller Information -->
      <div class="modal-seller-card">
        <div class="modal-seller-header">
          <div class="modal-seller-avatar">
            ${f?.username?f.username.charAt(0).toUpperCase():"?"}
          </div>
          <div class="modal-seller-info">
            <h3 style="cursor:pointer; color:#3b82f6;">${B(f?.username)||"Unknown Seller"}</h3>
            <div class="modal-seller-rating">
              ${"⭐".repeat(Math.floor(b))} ${b}/5 (${I} reviews)
            </div>
            <div style="font-size: 0.875rem; color: var(--muted); margin-top: 0.25rem;">
              Member since ${f?.created_at?new Date(f.created_at).toLocaleDateString():"N/A"}
            </div>
          </div>
        </div>
        
        ${f?`
          <button class="modal-btn modal-btn-secondary" style="width: 100%; margin-top: 1rem;" id="chatSellerBtn" data-seller="${e.seller_id}" data-product="${e.id}">
            💬 Chat with Seller
          </button>
        `:""}
      </div>
      
      <!-- Action Buttons -->
      <div class="modal-actions">
        <button class="modal-btn modal-btn-secondary" id="likeProductBtn">
          ❤️ Like Product
        </button>
        ${e.stock>0?`
          <button class="modal-btn modal-btn-primary" id="modalBuyBtn" data-id="${e.id}">
            🛒 Buy Now - €${H}
          </button>
        `:""}
      </div>
    `,o.style.display="flex",document.body.style.overflow="hidden";const O=o.querySelector(".modal-seller-info h3");O&&O.addEventListener("click",()=>{o.style.display="none",document.body.style.overflow="auto",te(e.seller_id)});const V=()=>{o.style.display="none",document.body.style.overflow="auto"},j=document.getElementById("modalClose"),F=document.getElementById("modalOverlay");j&&(j.onclick=V),F&&(F.onclick=V);const U=document.getElementById("chatSellerBtn");U&&(U.onclick=()=>{window.location.href=`chat.html?seller=${e.seller_id}&product=${e.id}`});const W=document.getElementById("likeProductBtn");W&&(W.onclick=()=>{d("Product liked!","success")});const N=document.getElementById("modalBuyBtn");N&&(N.onclick=async()=>{await x(e.id),V()})}const L=document.querySelectorAll(".filter-tab");L&&L.length&&L.forEach(e=>{e.addEventListener("click",o=>{L.forEach(n=>n.classList.remove("active")),e.classList.add("active"),i=e.dataset.category||"all",l()})});const S=document.getElementById("applyFilters"),C=document.getElementById("clearFilters");S&&S.addEventListener("click",()=>{t.search=document.getElementById("searchInput")?.value||"",t.minPrice=document.getElementById("minPrice")?.value||"",t.maxPrice=document.getElementById("maxPrice")?.value||"",t.location=document.getElementById("locationFilter")?.value||"",t.condition=document.getElementById("conditionFilter")?.value||"",t.stock=document.getElementById("stockFilter")?.value||"",t.availability=document.getElementById("availabilityFilter")?.value||"",t.brand=document.getElementById("brandFilter")?.value||"",t.color=document.getElementById("colorFilter")?.value||"",t.date=document.getElementById("dateFilter")?.value||"",t.sortBy=document.getElementById("sortFilter")?.value||"newest",l(),v(),d("Filters applied successfully!","success")}),C&&C.addEventListener("click",()=>{t={search:"",minPrice:"",maxPrice:"",location:"",condition:"",stock:"",availability:"",brand:"",color:"",date:"",sortBy:"newest"},["searchInput","minPrice","maxPrice","brandFilter","colorFilter"].forEach(b=>{const I=document.getElementById(b);I&&(I.value="")}),["locationFilter","conditionFilter","stockFilter","availabilityFilter","dateFilter","sortFilter"].forEach(b=>{const I=document.getElementById(b);I&&(I.value=b==="sortFilter"?"newest":"")});const n=document.getElementById("categoryFilter");n&&(n.value=""),i="all",L.forEach(b=>b.classList.remove("active"));const f=document.querySelector('[data-category="all"]');f&&f.classList.add("active"),l(),v(),d("Filters cleared!","success")});function v(){const e=document.getElementById("activeFilters"),o=document.getElementById("filterTags");if(!e||!o)return;o.innerHTML="";let n=!1;const f={search:"🔍 Search",minPrice:"💰 Min",maxPrice:"💸 Max",location:"📍 Location",condition:"⭐ Condition",stock:"📊 Stock",availability:"🔖 Status",brand:"🏷️ Brand",color:"🎨 Color",date:"📅 Date",sortBy:"🔄 Sort"};Object.keys(t).forEach(b=>{if(t[b]&&t[b]!=="newest"){n=!0;const I=document.createElement("div");I.className="filter-tag",I.innerHTML=`
          ${f[b]}: ${t[b]}
          <span class="remove-tag">×</span>
        `,I.onclick=()=>{t[b]=b==="sortBy"?"newest":"";const h={search:"searchInput",minPrice:"minPrice",maxPrice:"maxPrice",location:"locationFilter",condition:"conditionFilter",stock:"stockFilter",availability:"availabilityFilter",brand:"brandFilter",color:"colorFilter",date:"dateFilter",sortBy:"sortFilter"}[b],T=document.getElementById(h);T&&(T.value=b==="sortBy"?"newest":""),l(),v()},o.appendChild(I)}}),e.style.display=n?"block":"none"}const u=document.getElementById("searchInput");if(u){let e;u.addEventListener("input",()=>{clearTimeout(e),e=setTimeout(()=>{t.search=u.value,l()},300)})}const g=document.getElementById("toggleFiltersBtn"),p=document.getElementById("advancedFiltersContainer"),k=document.getElementById("filterArrow");let $=!1;g&&p&&g.addEventListener("click",()=>{$=!$,$?(p.style.display="block",k.style.transform="rotate(180deg)",g.querySelector("[data-i18n]").setAttribute("data-i18n","hide_filters"),g.querySelector("[data-i18n]").textContent=c.t("hide_filters")):(p.style.display="none",k.style.transform="rotate(0deg)",g.querySelector("[data-i18n]").setAttribute("data-i18n","show_filters"),g.querySelector("[data-i18n]").textContent=c.t("show_filters"))}),document.querySelector(".btn-hero-primary")?.addEventListener("click",()=>{document.querySelector(".main-container")?.scrollIntoView({behavior:"smooth"})}),document.querySelector(".btn-hero-secondary")?.addEventListener("click",()=>{document.querySelector(".features-section")?.scrollIntoView({behavior:"smooth"})});async function A(e){try{const{data:o}=await m.auth.getUser(),n=o?.user;if(!n){d("Please log in first","error");return}const{deleteProduct:f}=await q(async()=>{const{deleteProduct:b}=await import("./navbar-UlE-X-40.js").then(I=>I.f);return{deleteProduct:b}},__vite__mapDeps([0,1]),import.meta.url);await f(e,n.id),d("Product deleted successfully!","success"),r()}catch(o){console.error("Error deleting product:",o),d(o.message||"Failed to delete product","error")}}function M(e){const o=`
      <div id="editProductModal" class="product-modal" style="display: flex;">
        <div class="modal-overlay" onclick="closeEditModal()"></div>
        <div class="modal-content" style="max-width: 800px;">
          <button class="modal-close" onclick="closeEditModal()">×</button>
          <div class="modal-body">
            <h2 style="margin-bottom: 1.5rem; color: var(--text-primary);">Edit Product</h2>
            <form id="editProductForm" style="display: flex; flex-direction: column; gap: 1rem;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div>
                  <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Product Name</label>
                  <input type="text" id="editName" value="${B(e.name)}" required style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px;">
                </div>
                <div>
                  <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Price (€)</label>
                  <input type="number" id="editPrice" value="${e.price}" required min="0" step="0.01" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px;">
                </div>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div>
                  <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Category</label>
                  <select id="editCategory" required style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px;">
                    <option value="electronics" ${e.category==="electronics"?"selected":""}>Electronics</option>
                    <option value="clothing" ${e.category==="clothing"?"selected":""}>Clothing</option>
                    <option value="furniture" ${e.category==="furniture"?"selected":""}>Furniture</option>
                    <option value="books" ${e.category==="books"?"selected":""}>Books</option>
                    <option value="sports" ${e.category==="sports"?"selected":""}>Sports</option>
                    <option value="home" ${e.category==="home"?"selected":""}>Home</option>
                    <option value="vehicles" ${e.category==="vehicles"?"selected":""}>Vehicles</option>
                    <option value="other" ${e.category==="other"?"selected":""}>Other</option>
                  </select>
                </div>
                <div>
                  <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Condition</label>
                  <select id="editCondition" required style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px;">
                    <option value="new" ${e.condition==="new"?"selected":""}>New</option>
                    <option value="like_new" ${e.condition==="like_new"?"selected":""}>Like New</option>
                    <option value="good" ${e.condition==="good"?"selected":""}>Good</option>
                    <option value="fair" ${e.condition==="fair"?"selected":""}>Fair</option>
                    <option value="poor" ${e.condition==="poor"?"selected":""}>Poor</option>
                  </select>
                </div>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div>
                  <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Stock</label>
                  <input type="number" id="editStock" value="${e.stock}" required min="0" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px;">
                </div>
                <div>
                  <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Location</label>
                  <input type="text" id="editLocation" value="${B(e.location||"")}" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px;">
                </div>
              </div>
              
              <div>
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Description</label>
                <textarea id="editDescription" required rows="4" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px;">${B(e.description||"")}</textarea>
              </div>
              
              <div>
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Image URL</label>
                <input type="url" id="editImageUrl" value="${B(e.image_url||"")}" required style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px;">
              </div>
              
              <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                <button type="submit" style="flex: 1; padding: 0.75rem; background: #3b82f6; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                  💾 Save Changes
                </button>
                <button type="button" onclick="closeEditModal()" style="flex: 1; padding: 0.75rem; background: #e5e7eb; color: #374151; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                  ✖️ Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `,n=document.getElementById("editProductModal");n&&n.remove(),document.body.insertAdjacentHTML("beforeend",o),document.body.style.overflow="hidden",document.getElementById("editProductForm").addEventListener("submit",async f=>{f.preventDefault(),await R(e.id)})}window.closeEditModal=function(){const e=document.getElementById("editProductModal");e&&(e.remove(),document.body.style.overflow="auto")};async function R(e){try{const{data:o}=await m.auth.getUser(),n=o?.user;if(!n){d("Please log in first","error");return}const f={name:document.getElementById("editName").value,price:parseFloat(document.getElementById("editPrice").value),category:document.getElementById("editCategory").value,condition:document.getElementById("editCondition").value,stock:parseInt(document.getElementById("editStock").value),location:document.getElementById("editLocation").value,description:document.getElementById("editDescription").value,image_url:document.getElementById("editImageUrl").value},{updateProduct:b}=await q(async()=>{const{updateProduct:I}=await import("./navbar-UlE-X-40.js").then(h=>h.f);return{updateProduct:I}},__vite__mapDeps([0,1]),import.meta.url);await b(e,n.id,f),d("Product updated successfully!","success"),closeEditModal(),r()}catch(o){console.error("Error updating product:",o),d(o.message||"Failed to update product","error")}}r(),document.addEventListener("purchaseProduct",async e=>{await x(e.detail.productId),document.getElementById("productModal").style.display="none",document.body.style.overflow="auto"}),document.addEventListener("reserveProduct",async e=>{await P(e.detail.productId),document.getElementById("productModal").style.display="none",document.body.style.overflow="auto"})}function ge(){if(!document.getElementById("userEmail"))return;async function s(){try{const{data:v}=await m.auth.getUser(),u=v?v.user:null;if(!u){d("You must be logged in to access settings.","error"),setTimeout(()=>window.location.href="login.html",2e3);return}const g=await m.from("users").select("*").eq("id",u.id).single();if(g.error){console.error("Error loading user settings:",g.error);return}const p=g.data,k=document.getElementById("userEmail"),$=document.getElementById("userEmailDisplay");k&&(k.value=p.email||""),$&&($.textContent=p.email||"");const A=document.getElementById("userBalanceDisplay");A&&(A.textContent=`€${Number.isFinite(Number(p.balance))?parseFloat(p.balance).toFixed(2):"0.00"}`);const M=document.getElementById("userName"),R=document.getElementById("usernameInput");M&&(M.textContent=p.username||"User"),R&&(R.value=p.username||"");const e=document.getElementById("userAvatar"),o=document.getElementById("userAvatarText"),n=document.getElementById("avatarUrlInput");p.avatar_url?(e&&(e.src=p.avatar_url,e.style.display="block"),o&&(o.style.display="none"),n&&(n.value=p.avatar_url)):o&&(o.textContent=(p.username||"U").charAt(0).toUpperCase());const f=document.getElementById("bioInput");f&&(f.value=p.bio||"");const b=document.getElementById("whatISellInput");b&&(b.value=p.what_i_sell||"");const I=document.getElementById("userLang");I&&(I.value=p.language||"en");const h=p.theme||"light",T=document.getElementById("userThemeToggle");T&&(T.textContent=c.t("toggle_theme")),a(u.id)}catch(v){console.error("Error in loadUserSettings:",v)}}async function a(v){try{const{count:u}=await m.from("products").select("*",{count:"exact",head:!0}).eq("seller_id",v),{count:g}=await m.from("user_transactions").select("*",{count:"exact",head:!0}).eq("user_id",v).eq("transaction_type","sale"),p=document.getElementById("userProductCount"),k=document.getElementById("userSalesCount");p&&(p.textContent=u||0),k&&(k.textContent=g||0),i(v),t(v),r(v)}catch(u){console.error("Error loading user stats:",u)}}async function i(v){try{const{data:u}=await m.from("products").select("*").eq("seller_id",v).order("created_at",{ascending:!1}).limit(10),g=document.getElementById("userProducts");if(!g)return;u&&u.length>0?g.innerHTML=u.map(p=>`
           <div class="product-card-modern" style="margin:0; display:flex; align-items:center; gap:1rem; padding:1rem;">
             <img src="${p.image_url||"https://via.placeholder.com/80x60"}" alt="${p.name}" style="width:80px; height:60px; object-fit:cover; border-radius:8px;">
             <div style="flex:1;">
               <h4 style="margin:0 0 0.5rem 0; font-size:1rem;">${p.name}</h4>
               <div style="font-size:0.875rem; color:var(--muted);">€${parseFloat(p.price).toFixed(2)} • ${p.stock} in stock</div>
             </div>
             <button class="btn-edit-product" data-product-id="${p.id}" style="padding:0.5rem; background:#3b82f6; color:white; border:none; border-radius:6px; cursor:pointer;">Edit</button>
           </div>
         `).join(""):g.innerHTML=`
           <div style="text-align: center; padding: 2rem; color: var(--muted);">
             <div style="font-size: 2rem; margin-bottom: 0.5rem;">📦</div>
             <span data-i18n="no_listings">No products listed yet</span>
           </div>
         `}catch(u){console.error("Error loading user products:",u)}}async function t(v){try{const{data:u}=await m.from("reviews").select("rating, comment, created_at, buyer_id, users!buyer_id(username)").eq("seller_id",v).order("created_at",{ascending:!1}).limit(5),g=document.getElementById("userReviews");if(!g)return;u&&u.length>0?g.innerHTML=u.map(p=>`
           <div style="padding:1rem; background:var(--secondary); border-radius:8px; margin-bottom:1rem;">
             <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.5rem;">
               <span style="font-weight:600;">${B(p.users?.username||"Anonymous")}</span>
               <span>⭐ ${p.rating}/5</span>
               <span style="font-size:0.875rem; color:var(--muted);">${new Date(p.created_at).toLocaleDateString()}</span>
             </div>
             <p style="margin:0; font-size:0.875rem;">${B(p.comment||"No comment")}</p>
           </div>
         `).join(""):g.innerHTML=`
           <div style="text-align: center; padding: 2rem; color: var(--muted);">
             <div style="font-size: 2rem; margin-bottom: 0.5rem;">⭐</div>
             <span data-i18n="no_reviews">No reviews yet</span>
           </div>
         `}catch(u){console.error("Error loading user reviews:",u)}}async function r(v){try{const{data:u}=await m.from("user_transactions").select("*").eq("user_id",v).eq("transaction_type","sale").order("created_at",{ascending:!1}).limit(10),g=document.getElementById("userSales");if(!g)return;u&&u.length>0?g.innerHTML=u.map(p=>`
           <div style="padding:1rem; background:var(--secondary); border-radius:8px; margin-bottom:1rem;">
             <div style="display:flex; justify-content:space-between; align-items:center;">
               <div>
                 <div style="font-weight:600;">€${Math.abs(p.amount).toFixed(2)}</div>
                 <div style="font-size:0.875rem; color:var(--muted);">${new Date(p.created_at).toLocaleDateString()}</div>
               </div>
               <div style="font-size:0.875rem; color:var(--muted);">Sale</div>
             </div>
           </div>
         `).join(""):g.innerHTML=`
           <div style="text-align: center; padding: 2rem; color: var(--muted);">
             <div style="font-size: 2rem; margin-bottom: 0.5rem;">💰</div>
             <span data-i18n="no_sales">No sales yet</span>
           </div>
         `}catch(u){console.error("Error loading user sales:",u)}}const l=document.getElementById("saveProfileBtn");l&&l.addEventListener("click",async()=>{try{const{data:v}=await m.auth.getUser(),u=v?.user;if(!u){d("Please log in first","error");return}const g=document.getElementById("usernameInput")?.value,p=document.getElementById("bioInput")?.value,k=document.getElementById("whatISellInput")?.value,$=document.getElementById("userLang")?.value;let A=null;const M=document.querySelector('input[name="avatarType"][value="file"]');if(M&&M.checked){const e=document.getElementById("avatarFileInput");if(e&&e.files[0]){const{uploadAvatar:o}=await q(async()=>{const{uploadAvatar:n}=await import("./navbar-UlE-X-40.js").then(f=>f.f);return{uploadAvatar:n}},__vite__mapDeps([0,1]),import.meta.url);A=await o(e.files[0],u.id)}}else A=document.getElementById("avatarUrlInput")?.value||null;const{error:R}=await m.from("users").update({username:g||null,avatar_url:A,bio:p||null,what_i_sell:k||null,language:$||"en",updated_at:new Date().toISOString()}).eq("id",u.id);if(R)throw R;d(c.t("profile_updated"),"success"),s()}catch(v){console.error("Error updating profile:",v),d(c.t("profile_update_failed"),"error")}});const y=document.querySelectorAll('input[name="avatarType"]'),w=document.getElementById("avatarUrlInput"),x=document.getElementById("avatarFileInput");y.forEach(v=>{v.addEventListener("change",u=>{u.target.value==="url"?(w.style.display="block",x.style.display="none",x.value=""):(w.style.display="none",x.style.display="block",w.value="")})});const P=document.getElementById("changeAvatarBtn");P&&P.addEventListener("click",()=>{const v=document.querySelector('input[name="avatarType"][value="url"]');v&&v.checked?(w.focus(),w.scrollIntoView({behavior:"smooth",block:"center"})):x.click()}),w&&w.addEventListener("input",()=>{const v=w.value,u=document.getElementById("userAvatar"),g=document.getElementById("userAvatarText");v?(u&&(u.src=v,u.style.display="block",u.onerror=()=>{u.style.display="none",g&&(g.style.display="flex")}),g&&(g.style.display="none")):(u&&(u.style.display="none"),g&&(g.style.display="flex"))}),x&&x.addEventListener("change",v=>{const u=v.target.files[0];if(u){const g=new FileReader;g.onload=p=>{const k=document.getElementById("userAvatar"),$=document.getElementById("userAvatarText");k&&(k.src=p.target.result,k.style.display="block"),$&&($.style.display="none")},g.readAsDataURL(u)}});const E=document.getElementById("userThemeToggle");E&&E.addEventListener("click",async()=>{const v=document.documentElement,g=(v.getAttribute("data-theme")||"light")==="dark"?"light":"dark";v.classList.remove("dark","light"),v.classList.add(g),v.setAttribute("data-theme",g),localStorage.setItem("theme",g),E.textContent=c.t("toggle_theme");const p=document.getElementById("themeToggle");p&&(p.textContent=g==="dark"?"☀️":"🌙");try{const{data:k}=await m.auth.getUser(),$=k?.user;$&&await m.from("users").update({theme:g,updated_at:new Date().toISOString()}).eq("id",$.id)}catch(k){console.error("Error saving theme preference:",k)}d(c.t(g==="dark"?"switched_to_dark":"switched_to_light"),"success")});const _=document.getElementById("userLang");_&&_.addEventListener("change",async v=>{const u=v.target.value;localStorage.setItem("lang",u),c&&typeof c.setLang=="function"&&c.setLang(u);const g=document.getElementById("userThemeToggle");g&&(g.textContent=c.t("toggle_theme"));try{const{data:p}=await m.auth.getUser(),k=p?.user;k&&await m.from("users").update({language:u,updated_at:new Date().toISOString()}).eq("id",k.id)}catch(p){console.error("Error saving language preference:",p)}d(c.t("language_changed"),"success")});const L=document.getElementById("settingsLogoutBtn");L&&L.addEventListener("click",async()=>{try{await m.auth.signOut(),d("Logged out successfully","success"),setTimeout(()=>window.location.href="index.html",1e3)}catch(v){console.error("Error signing out:",v),d("Error signing out","error")}});const S=document.getElementById("deleteAccountBtn");S&&S.addEventListener("click",async()=>{if(confirm(c.t&&c.t("delete_account_confirm")||"Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost."))try{const{data:u}=await m.auth.getUser(),g=u?u.user:null;if(!g)return;await m.from("users").delete().eq("id",g.id),d("Account deleted successfully","success"),setTimeout(()=>window.location.href="index.html",1e3)}catch(u){console.error("Error deleting account:",u),d("Error deleting account","error")}});const C=document.getElementById("previewProfileBtn");C&&C.addEventListener("click",()=>{pe()}),s()}function pe(){const s=document.getElementById("usernameInput")?.value||"User",a=document.getElementById("bioInput")?.value||"",i=document.getElementById("whatISellInput")?.value||"",t=document.getElementById("userEmail")?.value||"";let r="";const l=document.querySelector('input[name="avatarType"][value="file"]');l&&l.checked&&document.getElementById("avatarFileInput").files[0]?r=document.getElementById("avatarFileInput").dataset.previewUrl||"":r=document.getElementById("avatarUrlInput")?.value||"";const y=`
     <div id="profilePreviewModal" class="product-modal" style="display: flex;">
       <div class="modal-overlay" onclick="closeProfilePreview()"></div>
       <div class="modal-content" style="max-width: 600px;">
         <button class="modal-close" onclick="closeProfilePreview()">×</button>
         <div class="modal-body">
           <h2 style="margin-bottom: 1.5rem; color: var(--text-primary); text-align: center;">Profile Preview</h2>
           <div style="text-align: center; padding: 2rem;">
             <div style="position: relative; width: 120px; margin: 0 auto 1rem;">
               <div style="width: 120px; height: 120px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; font-size: 3rem; color: white; font-weight: 700; overflow: hidden; margin: 0 auto;">
                 ${r?`<img src="${r}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover;">`:`<span>${s.charAt(0).toUpperCase()}</span>`}
               </div>
             </div>
             <h3 style="margin: 0 0 0.5rem 0; font-size: 1.5rem; font-weight: 700; color: var(--fg);">${s}</h3>
             <p style="margin: 0 0 1rem 0; color: var(--muted); font-size: 0.875rem;">${t}</p>
             ${a?`<p style="margin: 0 0 1rem 0; color: var(--fg); font-size: 0.875rem;">${a}</p>`:""}
             ${i?`<p style="margin: 0 0 1rem 0; color: var(--muted); font-size: 0.875rem;"><strong>What I sell:</strong> ${i}</p>`:""}
             <div style="margin-top: 2rem; padding: 1rem; background: var(--secondary); border-radius: 12px;">
               <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary);">€0.00</div>
               <div style="font-size: 0.875rem; color: var(--muted);">Current Balance</div>
             </div>
           </div>
         </div>
       </div>
     </div>
   `,w=document.getElementById("profilePreviewModal");w&&w.remove(),document.body.insertAdjacentHTML("beforeend",y),document.body.style.overflow="hidden"}window.closeProfilePreview=function(){const s=document.getElementById("profilePreviewModal");s&&(s.remove(),document.body.style.overflow="auto")};function fe(){if(!document.getElementById("sellForm"))return;async function s(){const{data:i}=await m.auth.getUser();i&&i.user||(d("You must be logged in to sell items.","error"),setTimeout(()=>window.location.href="login.html",2e3))}s();const a=document.getElementById("sellForm");a&&a.addEventListener("submit",async i=>{i.preventDefault();const{data:t}=await m.auth.getUser(),r=t?t.user:null;if(!r){d(c.t?c.t("loginFirst"):"Please log in first","error");return}const l={name:document.getElementById("productNameInput")?.value||"",category:document.getElementById("productCategoryInput")?.value||"",price:parseFloat(document.getElementById("productPriceInput")?.value||"0"),description:document.getElementById("productDescriptionInput")?.value||"",image_url:document.getElementById("productImageInput")?.value||"",stock:parseInt(document.getElementById("productStockInput")?.value||"1"),condition:document.getElementById("productConditionInput")?.value||"",location:document.getElementById("productLocationInput")?.value||""};try{const y=await q(()=>import("./navbar-UlE-X-40.js").then(w=>w.f),__vite__mapDeps([0,1]),import.meta.url);if(y&&typeof y.listProduct=="function")await y.listProduct(l,r.id)?(d("Product listed successfully!","success"),i.target.reset()):d("Error listing product","error");else throw new Error("listProduct helper not found")}catch(y){console.error("Error listing product:",y),d("Error listing product: "+(y.message||""),"error")}})}function ye(){if(!document.getElementById("loginForm"))return;document.getElementById("loginForm").addEventListener("submit",async a=>{a.preventDefault();const i=document.getElementById("emailInput")?.value.trim()||"",t=document.getElementById("passwordInput")?.value||"";if(!i||!t){d("Please fill in all fields","error");return}try{const r=await q(()=>import("./navbar-UlE-X-40.js").then(l=>l.f),__vite__mapDeps([0,1]),import.meta.url);if(r&&typeof r.loginUser=="function"){const l=await r.loginUser(i,t);if(l&&l.error){d("Login failed: "+(l.error.message||l.error),"error");return}window.location.href="index.html"}else{const{error:l}=await m.auth.signInWithPassword({email:i,password:t});if(l){d("Login failed: "+l.message,"error");return}window.location.href="index.html"}}catch(r){console.error("Login error:",r),d("Login failed. Please try again.","error")}})}function ve(){if(!document.getElementById("registerForm"))return;document.getElementById("registerForm").addEventListener("submit",async a=>{a.preventDefault();const i=document.getElementById("usernameInput")?.value.trim()||"",t=document.getElementById("emailInput")?.value.trim()||"",r=document.getElementById("passwordInput")?.value||"",l=document.getElementById("confirmPasswordInput")?.value||"";if(r!==l){d(c.t&&c.t("passwords_not_match")||"Passwords do not match","error");return}if(r.length<6){d(c.t&&c.t("password_too_short")||"Password must be at least 6 characters","error");return}try{const y=await m.auth.signUp({email:t,password:r,options:{data:{username:i}}});if(y.error)throw y.error;d(c.t&&c.t("registration_success")||"Registration successful! Please check your email to verify your account."),window.location.href="login.html"}catch(y){console.error("Registration error:",y),d(y.message||"Registration failed. Please try again.","error")}})}function he(){if(!document.getElementById("currentBalance"))return;async function s(){try{const{data:t}=await m.auth.getUser(),r=t?t.user:null;if(!r)return;const l=await m.from("users").select("balance").eq("id",r.id).single(),y=document.getElementById("currentBalance");if(!l.error&&l.data){const w=parseFloat(l.data.balance||0);y&&(y.innerText=`€${w.toFixed(2)}`)}else y&&(y.innerText="€0.00");i(r.id)}catch(t){console.error("Error loading user balance:",t)}}const a=document.getElementById("addFundsBtn");a&&a.addEventListener("click",async()=>{const t=document.getElementById("fundAmount"),r=parseFloat(t?.value||"0");if(isNaN(r)||r<=0){d("Enter a valid amount","error");return}const{data:l}=await m.auth.getUser(),y=l?l.user:null;if(!y){d("Please login first","error");return}try{const w=await q(()=>import("./navbar-UlE-X-40.js").then(x=>x.f),__vite__mapDeps([0,1]),import.meta.url);if(w&&typeof w.addBalance=="function")await w.addBalance(y.id,r),await s(),t&&(t.value=""),d("Funds added successfully!","success");else throw new Error("addBalance helper not found")}catch(w){console.error("Failed to add funds:",w),d("Failed to add funds","error")}});async function i(t){try{const{data:r,error:l}=await m.from("user_transactions").select().eq("user_id",t).order("created_at",{ascending:!1}),y=document.getElementById("transactionHistory");if(!y)return;y.innerHTML="",!l&&r&&r.length?r.forEach(w=>{const x=document.createElement("div");x.className="transaction-item";const P=w.transaction_type==="deposit"?"➕":"➖",E=Number.isFinite(Number(w.amount))?Math.abs(Number(w.amount)).toFixed(2):"0.00",_=w.created_at?new Date(w.created_at).toLocaleString():"";x.innerHTML=`<span>${P} €${E}</span> <span>${_}</span>`,y.appendChild(x)}):y.innerHTML='<p data-i18n="no_tx">No transactions yet.</p>'}catch(r){console.error("Error loading transactions:",r)}}s()}document.addEventListener("DOMContentLoaded",()=>{ue(),de(),se(),ce(),me(),ge(),fe(),ye(),ve(),he()});
