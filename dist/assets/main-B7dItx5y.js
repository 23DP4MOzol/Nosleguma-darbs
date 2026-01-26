const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/navbar-BgUz24lM.js","assets/navbar-DnmfGxTg.css"])))=>i.map(i=>d[i]);
import{s as m,i as c,_ as A}from"./navbar-BgUz24lM.js";function u(l,s="success"){let a=document.getElementById("toastContainer");a||(a=document.createElement("div"),a.id="toastContainer",Object.assign(a.style,{position:"fixed",right:"20px",bottom:"20px",zIndex:"9999",display:"flex",flexDirection:"column",gap:"8px",maxWidth:"320px"}),document.body.appendChild(a));const o=document.createElement("div");o.textContent=l,Object.assign(o.style,{background:s==="error"?"#fee2e2":"#ecfdf5",color:s==="error"?"#991b1b":"#065f46",padding:"12px 16px",borderRadius:"12px",boxShadow:"0 6px 18px rgba(0,0,0,0.1)",fontWeight:"600",fontSize:"14px",transition:"transform 0.25s ease, opacity 0.25s ease",transform:"translateY(8px)",opacity:"0"}),a.appendChild(o),requestAnimationFrame(()=>{o.style.transform="translateY(0)",o.style.opacity="1"}),setTimeout(()=>{o.style.transform="translateY(8px)",o.style.opacity="0",setTimeout(()=>o.remove(),250)},3e3)}function B(l=""){const s=String(l),a={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};return s.replace(/[&<>"']/g,o=>a[o])}function X(){const l=localStorage.getItem("theme")||"light",s=document.documentElement;s.classList.remove("light","dark"),s.classList.add(l),s.setAttribute("data-theme",l);const a=document.getElementById("themeToggle");a&&(a.textContent=l==="dark"?"☀️":"🌙",a.addEventListener("click",Z));const o=document.getElementById("userThemeToggle");o&&(o.textContent=c.t("toggle_theme"))}function Z(){const l=document.documentElement,a=(l.getAttribute("data-theme")||"light")==="dark"?"light":"dark";l.classList.remove("dark","light"),l.classList.add(a),l.setAttribute("data-theme",a),localStorage.setItem("theme",a);const o=document.getElementById("themeToggle");o&&(o.textContent=a==="dark"?"☀️":"🌙");const n=document.getElementById("userThemeToggle");n&&(n.textContent=c.t("toggle_theme"))}function ee(){const l=localStorage.getItem("lang")||"en";c&&typeof c.setLang=="function"&&c.setLang(l);const s=document.querySelectorAll("#langSelect, #userLang");s&&s.length&&s.forEach(a=>{if(a){try{a.value=l}catch{}a.addEventListener("change",o=>{const n=o.target.value;localStorage.setItem("lang",n),c&&typeof c.setLang=="function"&&c.setLang(n),document.querySelectorAll("#langSelect, #userLang").forEach(d=>{d&&(d.value=n)})})}})}async function z(){try{const{data:l}=await m.auth.getUser(),s=l?l.user:null,a=document.getElementById("loginBtn"),o=document.getElementById("logoutBtn"),n=document.getElementById("balanceBadge"),d=document.getElementById("sellBtn"),h=document.getElementById("settingsBtn"),b=document.getElementById("adminBtn");if(s){let x="user";try{const{data:L,error:E}=await m.from("users").select("balance, role").eq("id",s.id).single();if(console.log("User data from database:",L),console.log("User ID:",s.id),console.log("Error fetching user:",E),!E&&L){x=L.role||"user",console.log("User role:",x);const k=parseFloat(L.balance||0);if(n){n.style.display="flex";const P=n.querySelector("span");P&&(P.textContent=`€${k.toFixed(2)}`)}}else{console.warn("No user data found in public.users table - creating entry");const{data:k,error:P}=await m.from("users").insert([{id:s.id,email:s.email,username:s.email.split("@")[0],role:"user",balance:0}]).select().single();if(!P&&k&&(x=k.role),n){n.style.display="flex";const S=n.querySelector("span");S&&(S.textContent="€0.00")}}}catch(L){if(console.error("Error in updateNavbarAuth:",L),n){n.style.display="flex";const E=n.querySelector("span");E&&(E.textContent="€0.00")}}console.log("Admin button element:",b),console.log("Setting admin button display for role:",x),a&&(a.style.display="none"),o&&(o.style.display="inline-block"),d&&(d.style.opacity="1",d.style.pointerEvents="auto"),h&&(h.style.display="inline-block",h.style.opacity="1",h.style.pointerEvents="auto"),b&&(x==="admin"?b.style.display="block":b.style.display="none")}else a&&(a.style.display="inline-block"),o&&(o.style.display="none"),n&&(n.style.display="none"),d&&(d.style.opacity="0.6",d.style.pointerEvents="none"),h&&(h.style.display="none"),b&&(b.style.display="none")}catch(l){console.error("Error updating navbar auth:",l)}}function te(){const l=document.getElementById("loginBtn"),s=document.getElementById("logoutBtn"),a=document.getElementById("sellBtn"),o=document.getElementById("settingsBtn");l&&l.addEventListener("click",()=>{window.location.href="login.html"}),s&&s.addEventListener("click",async()=>{try{await m.auth.signOut(),await z(),window.location.href="index.html"}catch(n){console.error("Error signing out:",n),u("Error signing out","error")}}),a&&a.addEventListener("click",async()=>{const{data:n}=await m.auth.getUser();(n?n.user:null)?window.location.href="sell.html":(u(c.t?c.t("loginFirst"):"Please log in first","error"),setTimeout(()=>window.location.href="login.html",1500))}),o&&o.addEventListener("click",async()=>{const{data:n}=await m.auth.getUser();(n?n.user:null)?window.location.href="settings.html":(u(c.t?c.t("loginFirst"):"Please log in first","error"),setTimeout(()=>window.location.href="login.html",1500))}),m&&m.auth&&typeof m.auth.onAuthStateChange=="function"&&m.auth.onAuthStateChange(()=>{z()}),z()}function oe(){const l=document.getElementById("hamburgerBtn"),s=document.querySelector(".navbar-links");l&&s&&l.addEventListener("click",a=>{a.stopPropagation(),s.classList.toggle("active")}),document.addEventListener("click",a=>{s&&l&&!s.contains(a.target)&&!l.contains(a.target)&&s.classList.remove("active")}),window.addEventListener("resize",()=>{window.innerWidth>768&&s&&s.classList.remove("active")})}async function J(l){try{const{data:s}=await m.auth.getUser(),a=s?.user,{data:o}=await m.from("users").select("*").eq("id",l).single();if(!o)return;const{data:n}=await m.from("products").select("*").eq("seller_id",l).order("created_at",{ascending:!1}).limit(10),{data:d}=await m.from("reviews").select("rating, comment, created_at, buyer_id, users!buyer_id(username)").eq("seller_id",l).order("created_at",{ascending:!1});let h=0;d&&d.length>0&&(h=d.reduce((E,k)=>E+k.rating,0)/d.length);let b=!1,x=!1;if(a&&a.id!==l){const{data:E}=await m.from("reviews").select("id").eq("buyer_id",a.id).eq("seller_id",l).single();x=!!E,b=!x}const L=`
      <div class="profile-header">
        <div class="profile-avatar">
          ${o.username?.charAt(0).toUpperCase()||"U"}
        </div>
        <h2 class="profile-name">${o.username||"Unknown User"}</h2>
        ${o.bio?`<p class="profile-bio">${B(o.bio)}</p>`:""}
        <div class="profile-stats">
          <div class="profile-stat">
            <div class="profile-stat-value">${n?.length||0}</div>
            <div class="profile-stat-label">Products</div>
          </div>
          <div class="profile-stat">
            <div class="profile-stat-value">${h.toFixed(1)} ⭐</div>
            <div class="profile-stat-label">Rating (${d?.length||0} reviews)</div>
          </div>
        </div>
      </div>

      <div class="profile-section">
        <h3>Recent Products</h3>
        <div class="profile-products">
          ${n?.map(E=>`
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
          ${d?.map(E=>`
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

      ${b?`
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
    `;if(document.getElementById("profileModalContent").innerHTML=L,document.getElementById("userProfileModal").style.display="flex",document.querySelectorAll("#profileModalContent .btn-buy-now").forEach(E=>{E.addEventListener("click",()=>{const k=E.dataset.productId;document.getElementById("userProfileModal").style.display="none",document.body.style.overflow="auto",showProductModal(k)})}),b){const E=document.getElementById("reviewForm");E&&E.addEventListener("submit",async k=>{k.preventDefault();const P=parseInt(document.getElementById("reviewRating").value),S=document.getElementById("reviewComment").value.trim();if(!P||P<1||P>5){u("Please select a valid rating","error");return}try{const{error:C}=await m.from("reviews").insert({buyer_id:a.id,seller_id:l,rating:P,comment:S||null});if(C)throw C;u("Review submitted successfully!","success"),document.getElementById("userProfileModal").style.display="none",J(l)}catch(C){console.error("Error submitting review:",C),u("Failed to submit review","error")}})}}catch(s){console.error("Error loading user profile:",s)}}async function re(){if(!document.querySelector(".product-grid-modern"))return;async function l(){try{const e=await m.from("products").select("*",{count:"exact",head:!0}),t=await m.from("users").select("*",{count:"exact",head:!0}),r=await m.from("products").select("seller_id",{count:"exact",head:!0}),f=e.count||0,v=t.count||0,I=r.count||0,w=document.getElementById("statsProducts"),T=document.getElementById("statsUsers"),M=document.getElementById("statsSellers");w&&(w.textContent=f.toString()),T&&(T.textContent=v.toString()),M&&(M.textContent=I.toString())}catch(e){console.error("Error updating stats:",e)}}let s=[],a="all",o={search:"",minPrice:"",maxPrice:"",location:"",condition:"",stock:"",availability:"",brand:"",color:"",date:"",sortBy:"newest"};async function n(){try{const{data:e,error:t}=await m.from("products").select("*, users!seller_id(username)").order("created_at",{ascending:!1});if(t)throw t;s=Array.isArray(e)?e:[],d(),l()}catch(e){console.error("Error loading products:",e),u(c.t&&c.t("error_loading_products")||"Error loading products","error")}}function d(){let e=[...s];if(a!=="all"&&(e=e.filter(t=>(t.category||"").toLowerCase()===a.toLowerCase())),o.search){const t=o.search.toLowerCase();e=e.filter(r=>(r.name||"").toLowerCase().includes(t)||(r.description||"").toLowerCase().includes(t)||(r.category||"").toLowerCase().includes(t))}if(o.minPrice){const t=parseFloat(o.minPrice);e=e.filter(r=>parseFloat(r.price||0)>=t)}if(o.maxPrice){const t=parseFloat(o.maxPrice);e=e.filter(r=>parseFloat(r.price||0)<=t)}if(o.location&&(e=e.filter(t=>(t.location||"").toLowerCase().includes(o.location.toLowerCase()))),o.condition&&(e=e.filter(t=>(t.condition||"")===o.condition)),o.stock&&(e=e.filter(t=>{const r=parseInt(t.stock||0);switch(o.stock){case"in_stock":return r>0;case"low_stock":return r>=1&&r<=5;case"high_stock":return r>=10;case"out_of_stock":return r===0;default:return!0}})),o.availability&&(e=e.filter(t=>o.availability==="available"?!t.is_reserved&&(t.stock||0)>0:o.availability==="reserved"?t.is_reserved:!0)),o.brand){const t=o.brand.toLowerCase();e=e.filter(r=>(r.brand||"").toLowerCase().includes(t))}if(o.color){const t=o.color.toLowerCase();e=e.filter(r=>(r.color||"").toLowerCase().includes(t))}if(o.date){const t=new Date;e=e.filter(r=>{const f=new Date(r.created_at),I=(t-f)/(1e3*60*60*24);switch(o.date){case"today":return I<1;case"week":return I<7;case"month":return I<30;case"3months":return I<90;default:return!0}})}switch(o.sortBy){case"oldest":e.sort((t,r)=>new Date(t.created_at)-new Date(r.created_at));break;case"price_low":e.sort((t,r)=>parseFloat(t.price||0)-parseFloat(r.price||0));break;case"price_high":e.sort((t,r)=>parseFloat(r.price||0)-parseFloat(t.price||0));break;case"name":e.sort((t,r)=>(t.name||"").localeCompare(r.name||""));break;case"name_desc":e.sort((t,r)=>(r.name||"").localeCompare(t.name||""));break;case"popular":e.sort((t,r)=>{const f=parseInt(t.views||0);return parseInt(r.views||0)-f});break;default:e.sort((t,r)=>new Date(r.created_at)-new Date(t.created_at));break}h(e)}async function h(e=null){const t=document.getElementById("productGrid");if(!t)return;const r=e||s;if(!r||r.length===0){t.innerHTML=`<div style="padding:40px;text-align:center;grid-column:1/-1;color:var(--muted);">
        <div style="font-size: 3rem; margin-bottom: 1rem;">📦</div>
        <span data-i18n="no_products">No products found</span>
        <p style="margin-top: 0.5rem; font-size: 0.875rem;">Try adjusting your filters or search terms</p>
      </div>`,c&&typeof c.setLang=="function"&&c.setLang(c.lang||"en");return}const{data:f}=await m.auth.getUser(),v=f?.user;let I="user";if(v)try{const{data:w}=await m.from("users").select("role").eq("id",v.id).single();I=w?.role||"user"}catch(w){console.error("Error fetching user role:",w)}t.innerHTML="",r.forEach(w=>{const T=w.image_url||"https://via.placeholder.com/300x200",M=Number.isFinite(Number(w.price))?parseFloat(w.price).toFixed(2):"0.00",G=w.stock!=null?w.stock:0,Q=B(w.category||"other"),Y=B(w.name||"Unnamed Product"),H=B(w.location||""),O=w.condition?w.condition.replace("_"," "):"",j={new:"✨",like_new:"🔄",good:"👍",fair:"😐",poor:"⚠️"},V=v&&(I==="admin"||w.seller_id===v.id),F=document.createElement("div");if(F.className="product-card-modern",F.style.cursor="pointer",F.setAttribute("data-product-id",w.id),F.addEventListener("click",U=>{!U.target.closest(".btn-buy-now")&&!U.target.closest(".btn-reserve")&&k(w)}),F.innerHTML=`
        <div class="product-image-container">
          <img src="${B(T)}" alt="${Y}" class="product-image" onerror="this.src='https://via.placeholder.com/300x200'">
          <button class="product-like-btn" data-id="${B(w.id)}" aria-label="Like">❤️</button>
          ${w.is_reserved?'<span class="product-badge-new" data-i18n="reserved">Reserved</span>':""}
          <div class="product-overlay">
            <button class="btn-quick-view" data-id="${B(w.id)}" data-i18n="quickView">👁 Quick View</button>
          </div>
        </div>
        <div class="product-info">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
            <span class="product-category">${Q}</span>
            ${O?`<span style="background: #dbeafe; color: #1e40af; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 500;">${j[w.condition]} ${O}</span>`:""}
          </div>
          <h3 class="product-name">${Y}</h3>
          <div class="product-seller" style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.5rem;">
            <div class="seller-avatar" style="width:24px; height:24px; border-radius:50%; background:linear-gradient(135deg,#667eea,#764ba2); display:flex; align-items:center; justify-content:center; font-size:12px; color:white; font-weight:600; cursor:pointer;" onclick="event.stopPropagation(); showUserProfile('${w.seller_id}')">
              👤
            </div>
            <span class="seller-name" style="font-size:0.875rem; color:var(--muted); cursor:pointer;" onclick="event.stopPropagation(); showUserProfile('${w.seller_id}')">
              ${B(w.users?.username||"Unknown")}
            </span>
          </div>
          <div class="product-meta">
            ${H?`<span style="display: block; color: #6b7280; font-size: 0.875rem; margin-bottom: 0.25rem;">📍 ${H}</span>`:""}
            <span class="product-views">📦 ${B(G)} in stock</span>
          </div>
          <div class="product-footer">
            <div class="product-price">
              <span class="price-currency">€</span>
              <span class="price-amount">${M}</span>
            </div>
            <div class="product-actions">
              <button class="btn-buy-now" data-id="${B(w.id)}" data-i18n="buyNow">🛒 Buy Now</button>
            </div>
          </div>
          ${V?`
            <div class="product-management-actions" style="display: flex; gap: 0.5rem; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--border);">
              <button class="btn-edit-product" data-product-id="${B(w.id)}" style="flex: 1; padding: 0.5rem; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 0.875rem; cursor: pointer; font-weight: 500; transition: background 0.2s;">
                ✏️ Edit
              </button>
              <button class="btn-delete-product" data-product-id="${B(w.id)}" style="flex: 1; padding: 0.5rem; background: #ef4444; color: white; border: none; border-radius: 6px; font-size: 0.875rem; cursor: pointer; font-weight: 500; transition: background 0.2s;">
                🗑️ Delete
              </button>
            </div>
          `:""}
        </div>
      `,t.appendChild(F),V){const U=F.querySelector(".btn-edit-product"),W=F.querySelector(".btn-delete-product");U&&U.addEventListener("click",N=>{N.stopPropagation(),D(w)}),W&&W.addEventListener("click",async N=>{N.stopPropagation(),confirm(`Are you sure you want to delete "${w.name}"?`)&&await q(w.id)})}}),c&&typeof c.setLang=="function"&&c.setLang(c.lang||"en"),b()}function b(){document.querySelectorAll(".btn-buy-now:not([disabled])").forEach(e=>{e.replaceWith(e.cloneNode(!0))}),document.querySelectorAll(".btn-buy-now:not([disabled])").forEach(e=>{e.addEventListener("click",async t=>{const r=t.currentTarget.dataset.id;await x(r)})}),document.querySelectorAll(".btn-add-cart").forEach(e=>{e.replaceWith(e.cloneNode(!0))}),document.querySelectorAll(".btn-add-cart").forEach(e=>{e.addEventListener("click",async t=>{const r=t.currentTarget.dataset.id;await L(r)})}),document.querySelectorAll(".btn-remove-reserve").forEach(e=>{e.replaceWith(e.cloneNode(!0))}),document.querySelectorAll(".btn-remove-reserve").forEach(e=>{e.addEventListener("click",async t=>{const r=t.currentTarget.dataset.id;await E(r)})}),document.querySelectorAll(".btn-quick-view").forEach(e=>{e.replaceWith(e.cloneNode(!0))}),document.querySelectorAll(".btn-quick-view").forEach(e=>{e.addEventListener("click",t=>{const r=t.currentTarget.dataset.id,f=s.find(v=>String(v.id)===String(r));f&&k(f)})})}async function x(e){try{const{data:t}=await m.auth.getUser(),r=t?t.user:null;if(!r){u(c.t?c.t("loginFirst"):"Please log in first","error"),setTimeout(()=>window.location.href="login.html",1500);return}const f=await A(()=>import("./navbar-BgUz24lM.js").then(v=>v.b),__vite__mapDeps([0,1]));if(f&&typeof f.purchaseProduct=="function")await f.purchaseProduct(e,r.id),u(c.t?c.t("purchaseComplete"):"Purchase completed","success"),await n(),await z();else throw new Error("Purchase function not available")}catch(t){console.error("Purchase error:",t),u(t.message||"Purchase failed","error")}}async function L(e){try{const{data:t}=await m.auth.getUser(),r=t?t.user:null;if(!r){u(c.t?c.t("loginFirst"):"Please log in first","error"),setTimeout(()=>window.location.href="login.html",1500);return}const f=await A(()=>import("./navbar-BgUz24lM.js").then(v=>v.b),__vite__mapDeps([0,1]));if(f&&typeof f.reserveProduct=="function")await f.reserveProduct(e,r.id,.2),u(c.t&&c.t("reserved_success")||"Product reserved successfully!","success"),await n(),await z();else throw new Error("Reserve function not available")}catch(t){console.error("Reserve error:",t),u(t.message||"Reservation failed","error")}}async function E(e){try{const{data:t}=await m.auth.getUser(),r=t?t.user:null;if(!r){u(c.t?c.t("loginFirst"):"Please log in first","error"),setTimeout(()=>window.location.href="login.html",1500);return}const f=await A(()=>import("./navbar-BgUz24lM.js").then(v=>v.b),__vite__mapDeps([0,1]));if(f&&typeof f.removeReserve=="function")await f.removeReserve(e,r.id),u("Reservation removed successfully!","success"),await n(),await z();else throw new Error("Remove reserve function not available")}catch(t){console.error("Remove reserve error:",t),u(t.message||"Failed to remove reservation","error")}}async function k(e){const t=document.getElementById("productModal");if(!t)return;const r=t.querySelector(".modal-body");let f=null,v=0,I=0;if(e.seller_id){const{data:K}=await m.from("users").select("id, username, email, created_at").eq("id",e.seller_id).single();f=K,v=4.5,I=23}const w=Math.floor(Math.random()*50),T=Math.floor(Math.random()*30),M=Math.floor(Math.random()*200)+50,G={new:"✨",like_new:"🔄",good:"👍",fair:"😐",poor:"⚠️"},Q=e.condition?e.condition.replace("_"," "):"",Y=e.image_url||"https://via.placeholder.com/600x400",H=Number.isFinite(Number(e.price))?parseFloat(e.price).toFixed(2):"0.00";r.innerHTML=`
      <div class="modal-product-grid">
        <div>
          <img src="${B(Y)}" alt="${B(e.name)}" class="modal-product-image">
        </div>
        
        <div class="modal-product-info">
          <h1>${B(e.name)}</h1>
          <div class="modal-product-price">€${H}</div>
          
          <div class="modal-product-meta">
            <span class="modal-badge" style="background: #dbeafe; color: #1e40af;">
              ${G[e.condition]||"📦"} ${B(Q)}
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
              <div class="modal-stat-value">❤️ ${w}</div>
              <div class="modal-stat-label">Likes</div>
            </div>
            <div class="modal-stat">
              <div class="modal-stat-value">🔖 ${T}</div>
              <div class="modal-stat-label">Saved</div>
            </div>
            <div class="modal-stat">
              <div class="modal-stat-value">👁 ${M}</div>
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
              ${"⭐".repeat(Math.floor(v))} ${v}/5 (${I} reviews)
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
    `,t.style.display="flex",document.body.style.overflow="hidden";const O=t.querySelector(".modal-seller-info h3");O&&O.addEventListener("click",()=>{t.style.display="none",document.body.style.overflow="auto",J(e.seller_id)});const j=()=>{t.style.display="none",document.body.style.overflow="auto"},V=document.getElementById("modalClose"),F=document.getElementById("modalOverlay");V&&(V.onclick=j),F&&(F.onclick=j);const U=document.getElementById("chatSellerBtn");U&&(U.onclick=()=>{window.location.href=`chat.html?seller=${e.seller_id}&product=${e.id}`});const W=document.getElementById("likeProductBtn");W&&(W.onclick=()=>{u("Product liked!","success")});const N=document.getElementById("modalBuyBtn");N&&(N.onclick=async()=>{await x(e.id),j()})}const P=document.querySelectorAll(".filter-tab");P&&P.length&&P.forEach(e=>{e.addEventListener("click",t=>{P.forEach(r=>r.classList.remove("active")),e.classList.add("active"),a=e.dataset.category||"all",d()})});const S=document.getElementById("applyFilters"),C=document.getElementById("clearFilters");S&&S.addEventListener("click",()=>{o.search=document.getElementById("searchInput")?.value||"",o.minPrice=document.getElementById("minPrice")?.value||"",o.maxPrice=document.getElementById("maxPrice")?.value||"",o.location=document.getElementById("locationFilter")?.value||"",o.condition=document.getElementById("conditionFilter")?.value||"",o.stock=document.getElementById("stockFilter")?.value||"",o.availability=document.getElementById("availabilityFilter")?.value||"",o.brand=document.getElementById("brandFilter")?.value||"",o.color=document.getElementById("colorFilter")?.value||"",o.date=document.getElementById("dateFilter")?.value||"",o.sortBy=document.getElementById("sortFilter")?.value||"newest",d(),y(),u("Filters applied successfully!","success")}),C&&C.addEventListener("click",()=>{o={search:"",minPrice:"",maxPrice:"",location:"",condition:"",stock:"",availability:"",brand:"",color:"",date:"",sortBy:"newest"},["searchInput","minPrice","maxPrice","brandFilter","colorFilter"].forEach(v=>{const I=document.getElementById(v);I&&(I.value="")}),["locationFilter","conditionFilter","stockFilter","availabilityFilter","dateFilter","sortFilter"].forEach(v=>{const I=document.getElementById(v);I&&(I.value=v==="sortFilter"?"newest":"")});const r=document.getElementById("categoryFilter");r&&(r.value=""),a="all",P.forEach(v=>v.classList.remove("active"));const f=document.querySelector('[data-category="all"]');f&&f.classList.add("active"),d(),y(),u("Filters cleared!","success")});function y(){const e=document.getElementById("activeFilters"),t=document.getElementById("filterTags");if(!e||!t)return;t.innerHTML="";let r=!1;const f={search:"🔍 Search",minPrice:"💰 Min",maxPrice:"💸 Max",location:"📍 Location",condition:"⭐ Condition",stock:"📊 Stock",availability:"🔖 Status",brand:"🏷️ Brand",color:"🎨 Color",date:"📅 Date",sortBy:"🔄 Sort"};Object.keys(o).forEach(v=>{if(o[v]&&o[v]!=="newest"){r=!0;const I=document.createElement("div");I.className="filter-tag",I.innerHTML=`
          ${f[v]}: ${o[v]}
          <span class="remove-tag">×</span>
        `,I.onclick=()=>{o[v]=v==="sortBy"?"newest":"";const w={search:"searchInput",minPrice:"minPrice",maxPrice:"maxPrice",location:"locationFilter",condition:"conditionFilter",stock:"stockFilter",availability:"availabilityFilter",brand:"brandFilter",color:"colorFilter",date:"dateFilter",sortBy:"sortFilter"}[v],T=document.getElementById(w);T&&(T.value=v==="sortBy"?"newest":""),d(),y()},t.appendChild(I)}}),e.style.display=r?"block":"none"}const i=document.getElementById("searchInput");if(i){let e;i.addEventListener("input",()=>{clearTimeout(e),e=setTimeout(()=>{o.search=i.value,d()},300)})}const g=document.getElementById("toggleFiltersBtn"),p=document.getElementById("advancedFiltersContainer"),_=document.getElementById("filterArrow");let $=!1;g&&p&&g.addEventListener("click",()=>{$=!$,$?(p.style.display="block",_.style.transform="rotate(180deg)",g.querySelector("[data-i18n]").setAttribute("data-i18n","hide_filters"),g.querySelector("[data-i18n]").textContent=c.t("hide_filters")):(p.style.display="none",_.style.transform="rotate(0deg)",g.querySelector("[data-i18n]").setAttribute("data-i18n","show_filters"),g.querySelector("[data-i18n]").textContent=c.t("show_filters"))}),document.querySelector(".btn-hero-primary")?.addEventListener("click",()=>{document.querySelector(".main-container")?.scrollIntoView({behavior:"smooth"})}),document.querySelector(".btn-hero-secondary")?.addEventListener("click",()=>{document.querySelector(".features-section")?.scrollIntoView({behavior:"smooth"})});async function q(e){try{const{data:t}=await m.auth.getUser(),r=t?.user;if(!r){u("Please log in first","error");return}const{deleteProduct:f}=await A(async()=>{const{deleteProduct:v}=await import("./navbar-BgUz24lM.js").then(I=>I.b);return{deleteProduct:v}},__vite__mapDeps([0,1]));await f(e,r.id),u("Product deleted successfully!","success"),n()}catch(t){console.error("Error deleting product:",t),u(t.message||"Failed to delete product","error")}}function D(e){const t=`
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
    `,r=document.getElementById("editProductModal");r&&r.remove(),document.body.insertAdjacentHTML("beforeend",t),document.body.style.overflow="hidden",document.getElementById("editProductForm").addEventListener("submit",async f=>{f.preventDefault(),await R(e.id)})}window.closeEditModal=function(){const e=document.getElementById("editProductModal");e&&(e.remove(),document.body.style.overflow="auto")};async function R(e){try{const{data:t}=await m.auth.getUser(),r=t?.user;if(!r){u("Please log in first","error");return}const f={name:document.getElementById("editName").value,price:parseFloat(document.getElementById("editPrice").value),category:document.getElementById("editCategory").value,condition:document.getElementById("editCondition").value,stock:parseInt(document.getElementById("editStock").value),location:document.getElementById("editLocation").value,description:document.getElementById("editDescription").value,image_url:document.getElementById("editImageUrl").value},{updateProduct:v}=await A(async()=>{const{updateProduct:I}=await import("./navbar-BgUz24lM.js").then(w=>w.b);return{updateProduct:I}},__vite__mapDeps([0,1]));await v(e,r.id,f),u("Product updated successfully!","success"),closeEditModal(),n()}catch(t){console.error("Error updating product:",t),u(t.message||"Failed to update product","error")}}n(),document.addEventListener("purchaseProduct",async e=>{await x(e.detail.productId),document.getElementById("productModal").style.display="none",document.body.style.overflow="auto"}),document.addEventListener("reserveProduct",async e=>{await L(e.detail.productId),document.getElementById("productModal").style.display="none",document.body.style.overflow="auto"})}function ne(){if(!document.getElementById("userEmail"))return;async function l(){try{const{data:y}=await m.auth.getUser(),i=y?y.user:null;if(!i){u("You must be logged in to access settings.","error"),setTimeout(()=>window.location.href="login.html",2e3);return}const g=await m.from("users").select("*").eq("id",i.id).single();if(g.error){console.error("Error loading user settings:",g.error);return}const p=g.data,_=document.getElementById("userEmail"),$=document.getElementById("userEmailDisplay");_&&(_.value=p.email||""),$&&($.textContent=p.email||"");const q=document.getElementById("userBalanceDisplay");q&&(q.textContent=`€${Number.isFinite(Number(p.balance))?parseFloat(p.balance).toFixed(2):"0.00"}`);const D=document.getElementById("userName"),R=document.getElementById("usernameInput");D&&(D.textContent=p.username||"User"),R&&(R.value=p.username||"");const e=document.getElementById("userAvatar"),t=document.getElementById("userAvatarText"),r=document.getElementById("avatarUrlInput");p.avatar_url?(e&&(e.src=p.avatar_url,e.style.display="block"),t&&(t.style.display="none"),r&&(r.value=p.avatar_url)):t&&(t.textContent=(p.username||"U").charAt(0).toUpperCase());const f=document.getElementById("bioInput");f&&(f.value=p.bio||"");const v=document.getElementById("whatISellInput");v&&(v.value=p.what_i_sell||"");const I=document.getElementById("userLang");I&&(I.value=p.language||"en");const w=p.theme||"light",T=document.getElementById("userThemeToggle");T&&(T.textContent=c.t("toggle_theme")),s(i.id)}catch(y){console.error("Error in loadUserSettings:",y)}}async function s(y){try{const{count:i}=await m.from("products").select("*",{count:"exact",head:!0}).eq("seller_id",y),{count:g}=await m.from("user_transactions").select("*",{count:"exact",head:!0}).eq("user_id",y).eq("transaction_type","sale"),p=document.getElementById("userProductCount"),_=document.getElementById("userSalesCount");p&&(p.textContent=i||0),_&&(_.textContent=g||0),a(y),o(y),n(y)}catch(i){console.error("Error loading user stats:",i)}}async function a(y){try{const{data:i}=await m.from("products").select("*").eq("seller_id",y).order("created_at",{ascending:!1}).limit(10),g=document.getElementById("userProducts");if(!g)return;i&&i.length>0?g.innerHTML=i.map(p=>`
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
         `}catch(i){console.error("Error loading user products:",i)}}async function o(y){try{const{data:i}=await m.from("reviews").select("rating, comment, created_at, buyer_id, users!buyer_id(username)").eq("seller_id",y).order("created_at",{ascending:!1}).limit(5),g=document.getElementById("userReviews");if(!g)return;i&&i.length>0?g.innerHTML=i.map(p=>`
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
         `}catch(i){console.error("Error loading user reviews:",i)}}async function n(y){try{const{data:i}=await m.from("user_transactions").select("*").eq("user_id",y).eq("transaction_type","sale").order("created_at",{ascending:!1}).limit(10),g=document.getElementById("userSales");if(!g)return;i&&i.length>0?g.innerHTML=i.map(p=>`
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
         `}catch(i){console.error("Error loading user sales:",i)}}const d=document.getElementById("saveProfileBtn");d&&d.addEventListener("click",async()=>{try{const{data:y}=await m.auth.getUser(),i=y?.user;if(!i){u("Please log in first","error");return}const g=document.getElementById("usernameInput")?.value,p=document.getElementById("bioInput")?.value,_=document.getElementById("whatISellInput")?.value,$=document.getElementById("userLang")?.value;let q=null;const D=document.querySelector('input[name="avatarType"][value="file"]');if(D&&D.checked){const e=document.getElementById("avatarFileInput");if(e&&e.files[0]){const{uploadAvatar:t}=await A(async()=>{const{uploadAvatar:r}=await import("./navbar-BgUz24lM.js").then(f=>f.b);return{uploadAvatar:r}},__vite__mapDeps([0,1]));q=await t(e.files[0],i.id)}}else q=document.getElementById("avatarUrlInput")?.value||null;const{error:R}=await m.from("users").update({username:g||null,avatar_url:q,bio:p||null,what_i_sell:_||null,language:$||"en",updated_at:new Date().toISOString()}).eq("id",i.id);if(R)throw R;u(c.t("profile_updated"),"success"),l()}catch(y){console.error("Error updating profile:",y),u(c.t("profile_update_failed"),"error")}});const h=document.querySelectorAll('input[name="avatarType"]'),b=document.getElementById("avatarUrlInput"),x=document.getElementById("avatarFileInput");h.forEach(y=>{y.addEventListener("change",i=>{i.target.value==="url"?(b.style.display="block",x.style.display="none",x.value=""):(b.style.display="none",x.style.display="block",b.value="")})});const L=document.getElementById("changeAvatarBtn");L&&L.addEventListener("click",()=>{const y=document.querySelector('input[name="avatarType"][value="url"]');y&&y.checked?(b.focus(),b.scrollIntoView({behavior:"smooth",block:"center"})):x.click()}),b&&b.addEventListener("input",()=>{const y=b.value,i=document.getElementById("userAvatar"),g=document.getElementById("userAvatarText");y?(i&&(i.src=y,i.style.display="block",i.onerror=()=>{i.style.display="none",g&&(g.style.display="flex")}),g&&(g.style.display="none")):(i&&(i.style.display="none"),g&&(g.style.display="flex"))}),x&&x.addEventListener("change",y=>{const i=y.target.files[0];if(i){const g=new FileReader;g.onload=p=>{const _=document.getElementById("userAvatar"),$=document.getElementById("userAvatarText");_&&(_.src=p.target.result,_.style.display="block"),$&&($.style.display="none")},g.readAsDataURL(i)}});const E=document.getElementById("userThemeToggle");E&&E.addEventListener("click",async()=>{const y=document.documentElement,g=(y.getAttribute("data-theme")||"light")==="dark"?"light":"dark";y.classList.remove("dark","light"),y.classList.add(g),y.setAttribute("data-theme",g),localStorage.setItem("theme",g),E.textContent=c.t("toggle_theme");const p=document.getElementById("themeToggle");p&&(p.textContent=g==="dark"?"☀️":"🌙");try{const{data:_}=await m.auth.getUser(),$=_?.user;$&&await m.from("users").update({theme:g,updated_at:new Date().toISOString()}).eq("id",$.id)}catch(_){console.error("Error saving theme preference:",_)}u(c.t(g==="dark"?"switched_to_dark":"switched_to_light"),"success")});const k=document.getElementById("userLang");k&&k.addEventListener("change",async y=>{const i=y.target.value;localStorage.setItem("lang",i),c&&typeof c.setLang=="function"&&c.setLang(i);const g=document.getElementById("userThemeToggle");g&&(g.textContent=c.t("toggle_theme"));try{const{data:p}=await m.auth.getUser(),_=p?.user;_&&await m.from("users").update({language:i,updated_at:new Date().toISOString()}).eq("id",_.id)}catch(p){console.error("Error saving language preference:",p)}u(c.t("language_changed"),"success")});const P=document.getElementById("settingsLogoutBtn");P&&P.addEventListener("click",async()=>{try{await m.auth.signOut(),u("Logged out successfully","success"),setTimeout(()=>window.location.href="index.html",1e3)}catch(y){console.error("Error signing out:",y),u("Error signing out","error")}});const S=document.getElementById("deleteAccountBtn");S&&S.addEventListener("click",async()=>{if(confirm(c.t&&c.t("delete_account_confirm")||"Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost."))try{const{data:i}=await m.auth.getUser(),g=i?i.user:null;if(!g)return;await m.from("users").delete().eq("id",g.id),u("Account deleted successfully","success"),setTimeout(()=>window.location.href="index.html",1e3)}catch(i){console.error("Error deleting account:",i),u("Error deleting account","error")}});const C=document.getElementById("previewProfileBtn");C&&C.addEventListener("click",()=>{ae()}),l()}function ae(){const l=document.getElementById("usernameInput")?.value||"User",s=document.getElementById("bioInput")?.value||"",a=document.getElementById("whatISellInput")?.value||"",o=document.getElementById("userEmail")?.value||"";let n="";const d=document.querySelector('input[name="avatarType"][value="file"]');d&&d.checked&&document.getElementById("avatarFileInput").files[0]?n=document.getElementById("avatarFileInput").dataset.previewUrl||"":n=document.getElementById("avatarUrlInput")?.value||"";const h=`
     <div id="profilePreviewModal" class="product-modal" style="display: flex;">
       <div class="modal-overlay" onclick="closeProfilePreview()"></div>
       <div class="modal-content" style="max-width: 600px;">
         <button class="modal-close" onclick="closeProfilePreview()">×</button>
         <div class="modal-body">
           <h2 style="margin-bottom: 1.5rem; color: var(--text-primary); text-align: center;">Profile Preview</h2>
           <div style="text-align: center; padding: 2rem;">
             <div style="position: relative; width: 120px; margin: 0 auto 1rem;">
               <div style="width: 120px; height: 120px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; font-size: 3rem; color: white; font-weight: 700; overflow: hidden; margin: 0 auto;">
                 ${n?`<img src="${n}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover;">`:`<span>${l.charAt(0).toUpperCase()}</span>`}
               </div>
             </div>
             <h3 style="margin: 0 0 0.5rem 0; font-size: 1.5rem; font-weight: 700; color: var(--fg);">${l}</h3>
             <p style="margin: 0 0 1rem 0; color: var(--muted); font-size: 0.875rem;">${o}</p>
             ${s?`<p style="margin: 0 0 1rem 0; color: var(--fg); font-size: 0.875rem;">${s}</p>`:""}
             ${a?`<p style="margin: 0 0 1rem 0; color: var(--muted); font-size: 0.875rem;"><strong>What I sell:</strong> ${a}</p>`:""}
             <div style="margin-top: 2rem; padding: 1rem; background: var(--secondary); border-radius: 12px;">
               <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary);">€0.00</div>
               <div style="font-size: 0.875rem; color: var(--muted);">Current Balance</div>
             </div>
           </div>
         </div>
       </div>
     </div>
   `,b=document.getElementById("profilePreviewModal");b&&b.remove(),document.body.insertAdjacentHTML("beforeend",h),document.body.style.overflow="hidden"}window.closeProfilePreview=function(){const l=document.getElementById("profilePreviewModal");l&&(l.remove(),document.body.style.overflow="auto")};function ie(){if(!document.getElementById("sellForm"))return;async function l(){const{data:a}=await m.auth.getUser();a&&a.user||(u("You must be logged in to sell items.","error"),setTimeout(()=>window.location.href="login.html",2e3))}l();const s=document.getElementById("sellForm");s&&s.addEventListener("submit",async a=>{a.preventDefault();const{data:o}=await m.auth.getUser(),n=o?o.user:null;if(!n){u(c.t?c.t("loginFirst"):"Please log in first","error");return}const d={name:document.getElementById("productNameInput")?.value||"",category:document.getElementById("productCategoryInput")?.value||"",price:parseFloat(document.getElementById("productPriceInput")?.value||"0"),description:document.getElementById("productDescriptionInput")?.value||"",image_url:document.getElementById("productImageInput")?.value||"",stock:parseInt(document.getElementById("productStockInput")?.value||"1"),condition:document.getElementById("productConditionInput")?.value||"",location:document.getElementById("productLocationInput")?.value||""};try{const h=await A(()=>import("./navbar-BgUz24lM.js").then(b=>b.b),__vite__mapDeps([0,1]));if(h&&typeof h.listProduct=="function")await h.listProduct(d,n.id)?(u("Product listed successfully!","success"),a.target.reset()):u("Error listing product","error");else throw new Error("listProduct helper not found")}catch(h){console.error("Error listing product:",h),u("Error listing product: "+(h.message||""),"error")}})}function se(){if(!document.getElementById("loginForm"))return;document.getElementById("loginForm").addEventListener("submit",async s=>{s.preventDefault();const a=document.getElementById("emailInput")?.value.trim()||"",o=document.getElementById("passwordInput")?.value||"";if(!a||!o){u("Please fill in all fields","error");return}try{const n=await A(()=>import("./navbar-BgUz24lM.js").then(d=>d.b),__vite__mapDeps([0,1]));if(n&&typeof n.loginUser=="function"){const d=await n.loginUser(a,o);if(d&&d.error){u("Login failed: "+(d.error.message||d.error),"error");return}window.location.href="index.html"}else{const{error:d}=await m.auth.signInWithPassword({email:a,password:o});if(d){u("Login failed: "+d.message,"error");return}window.location.href="index.html"}}catch(n){console.error("Login error:",n),u("Login failed. Please try again.","error")}})}function le(){if(!document.getElementById("registerForm"))return;document.getElementById("registerForm").addEventListener("submit",async s=>{s.preventDefault();const a=document.getElementById("usernameInput")?.value.trim()||"",o=document.getElementById("emailInput")?.value.trim()||"",n=document.getElementById("passwordInput")?.value||"",d=document.getElementById("confirmPasswordInput")?.value||"";if(n!==d){u(c.t&&c.t("passwords_not_match")||"Passwords do not match","error");return}if(n.length<6){u(c.t&&c.t("password_too_short")||"Password must be at least 6 characters","error");return}try{const h=await m.auth.signUp({email:o,password:n,options:{data:{username:a}}});if(h.error)throw h.error;u(c.t&&c.t("registration_success")||"Registration successful! Please check your email to verify your account."),window.location.href="login.html"}catch(h){console.error("Registration error:",h),u(h.message||"Registration failed. Please try again.","error")}})}function de(){if(!document.getElementById("currentBalance"))return;async function l(){try{const{data:o}=await m.auth.getUser(),n=o?o.user:null;if(!n)return;const d=await m.from("users").select("balance").eq("id",n.id).single(),h=document.getElementById("currentBalance");if(!d.error&&d.data){const b=parseFloat(d.data.balance||0);h&&(h.innerText=`€${b.toFixed(2)}`)}else h&&(h.innerText="€0.00");a(n.id)}catch(o){console.error("Error loading user balance:",o)}}const s=document.getElementById("addFundsBtn");s&&s.addEventListener("click",async()=>{const o=document.getElementById("fundAmount"),n=parseFloat(o?.value||"0");if(isNaN(n)||n<=0){u("Enter a valid amount","error");return}const{data:d}=await m.auth.getUser(),h=d?d.user:null;if(!h){u("Please login first","error");return}try{const b=await A(()=>import("./navbar-BgUz24lM.js").then(x=>x.b),__vite__mapDeps([0,1]));if(b&&typeof b.addBalance=="function")await b.addBalance(h.id,n),await l(),o&&(o.value=""),u("Funds added successfully!","success");else throw new Error("addBalance helper not found")}catch(b){console.error("Failed to add funds:",b),u("Failed to add funds","error")}});async function a(o){try{const{data:n,error:d}=await m.from("user_transactions").select().eq("user_id",o).order("created_at",{ascending:!1}),h=document.getElementById("transactionHistory");if(!h)return;h.innerHTML="",!d&&n&&n.length?n.forEach(b=>{const x=document.createElement("div");x.className="transaction-item";const L=b.transaction_type==="deposit"?"➕":"➖",E=Number.isFinite(Number(b.amount))?Math.abs(Number(b.amount)).toFixed(2):"0.00",k=b.created_at?new Date(b.created_at).toLocaleString():"";x.innerHTML=`<span>${L} €${E}</span> <span>${k}</span>`,h.appendChild(x)}):h.innerHTML='<p data-i18n="no_tx">No transactions yet.</p>'}catch(n){console.error("Error loading transactions:",n)}}l()}document.addEventListener("DOMContentLoaded",()=>{oe(),te(),X(),ee(),re(),ne(),ie(),se(),le(),de()});
