const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./navbar-BgutAARZ.js","./navbar-C5EQzQ5q.css"])))=>i.map(i=>d[i]);
import{b as ge,c as se,d as pe,e as ye,p as fe,s as m,i as c,_ as R}from"./navbar-BgutAARZ.js";function K(a,r="success",s=3e3){let t=document.getElementById("toastContainer");t||(t=document.createElement("div"),t.id="toastContainer",Object.assign(t.style,{position:"fixed",right:"20px",bottom:"20px",zIndex:9999,display:"flex",flexDirection:"column",gap:"8px"}),document.body.appendChild(t));const n=document.createElement("div");n.textContent=a,n.className=`toast toast-${r}`,Object.assign(n.style,{background:r==="error"?"#fee2e2":"#ecfdf5",color:r==="error"?"#ef4444":"#065f46",padding:"10px 14px",borderRadius:"10px",boxShadow:"0 6px 18px rgba(0,0,0,0.08)",fontWeight:600}),t.appendChild(n),setTimeout(()=>n.remove(),s)}function ne(a=""){return String(a).replace(/[&<>"']/g,r=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[r])}async function re(){const a=await se(),r=document.getElementById("loginBtn"),s=document.getElementById("logoutBtn"),t=document.getElementById("balanceBadge");if(a){if(r&&(r.style.display="none"),s&&(s.style.display="flex"),t){t.style.display="flex";const n=await pe(a.id);t.querySelector("span").innerText=`€${(+n).toFixed(2)}`}}else r&&(r.style.display="flex"),s&&(s.style.display="none"),t&&(t.style.display="none")}const ie=document.getElementById("logoutBtn");ie&&ie.addEventListener("click",async()=>{await ge(),K("Logged out","success"),re()});async function le(a="productsContainer"){const r=document.getElementById(a);if(!r)return;r.innerHTML='<div style="padding:20px">Loading...</div>';const s=await ye();r.innerHTML="",s.forEach(t=>{const n=document.createElement("div");n.className="product-card-modern",n.innerHTML=`
      <div class="product-image-container">
        <img class="product-image" src="${t.image_url||"https://via.placeholder.com/600x400"}" alt="${ne(t.name)}">
        <button class="product-like-btn" data-id="${t.id}">❤</button>
        ${t.is_reserved?'<span class="product-badge-new">Reserved</span>':""}
        <div class="product-overlay">
          <button class="btn-quick-view" data-id="${t.id}">Quick View</button>
        </div>
      </div>
      <div class="product-info">
        <span class="product-category">${ne(t.category||"Other")}</span>
        <h3 class="product-name">${ne(t.name)}</h3>
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
    `,r.appendChild(n)}),r.querySelectorAll(".btn-buy-now").forEach(t=>{t.addEventListener("click",async n=>{const l=n.currentTarget.dataset.id,f=await se();if(!f)return K("Login first","error");try{await fe(l,f.id),K("Purchased","success"),le(),re()}catch(b){K(b.message,"error")}})}),r.querySelectorAll(".btn-quick-view").forEach(t=>{t.addEventListener("click",async n=>{const l=n.currentTarget.dataset.id;K(`Quick view product ${l}`,"info")})})}window.addEventListener("load",async()=>{re(),le()});i18n.setLang(i18n.lang);document.getElementById("langSwitcher").addEventListener("change",a=>{i18n.setLang(a.target.value)});window.openChatWithSeller=function(a,r){window.location.href=`chat.html?seller=${a}&product=${r}`};window.toggleSaveProduct=function(a){alert("Product saved! (Feature coming soon)")};window.toggleLikeProduct=function(a){alert("Product liked! (Feature coming soon)")};window.handlePurchase=async function(a){const r=new CustomEvent("purchaseProduct",{detail:{productId:a}});document.dispatchEvent(r)};window.handleReserve=async function(a){const r=new CustomEvent("reserveProduct",{detail:{productId:a}});document.dispatchEvent(r)};const k=document.createElement("div");k.id="aiWidget";k.style.position="fixed";k.style.bottom="20px";k.style.right="20px";k.style.width="350px";k.style.height="450px";k.style.backgroundColor="var(--secondary)";k.style.borderRadius="12px";k.style.boxShadow="0 8px 24px var(--shadow-dark)";k.style.display="flex";k.style.flexDirection="column";k.style.zIndex="10000";k.style.userSelect="none";k.style.transition="transform 0.2s ease";const N=document.createElement("div");N.style.backgroundColor="var(--primary)";N.style.color="white";N.style.padding="0.75rem 1rem";N.style.cursor="move";N.style.fontWeight="bold";N.innerText="AI Assistant";k.appendChild(N);const C=document.createElement("div");C.style.flex="1";C.style.overflowY="auto";C.style.padding="1rem";C.style.backgroundColor="var(--bg)";k.appendChild(C);const Z=document.createElement("div");Z.style.display="flex";Z.style.borderTop="1px solid var(--border)";const A=document.createElement("input");A.type="text";A.placeholder="Type your question...";A.style.flex="1";A.style.padding="0.75rem";A.style.border="none";A.style.outline="none";A.style.backgroundColor="var(--secondary)";Z.appendChild(A);const O=document.createElement("button");O.innerText="Send";O.className="btn-primary";O.style.marginLeft="0.5rem";O.style.padding="0.5rem 1rem";Z.appendChild(O);k.appendChild(Z);document.body.appendChild(k);let ae=!1,de,ce;N.addEventListener("mousedown",a=>{ae=!0,de=a.clientX-k.getBoundingClientRect().left,ce=a.clientY-k.getBoundingClientRect().top,k.style.transition="none"});document.addEventListener("mousemove",a=>{ae&&(k.style.left=`${a.clientX-de}px`,k.style.top=`${a.clientY-ce}px`,k.style.bottom="auto",k.style.right="auto")});document.addEventListener("mouseup",()=>{ae=!1,k.style.transition="transform 0.2s ease"});O.addEventListener("click",async()=>{const a=A.value.trim();if(!a)return;const r=document.createElement("div");r.innerText=a,r.style.background="var(--primary)",r.style.color="white",r.style.padding="0.5rem",r.style.marginBottom="0.5rem",r.style.borderRadius="8px",r.style.alignSelf="flex-end",C.appendChild(r),C.scrollTop=C.scrollHeight,A.value="";try{const t=await(await fetch("/.netlify/functions/ai-chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:a})})).json(),n=document.createElement("div");n.innerText=t.response||"No response",n.style.background="var(--secondary)",n.style.color="var(--fg)",n.style.padding="0.5rem",n.style.marginBottom="0.5rem",n.style.borderRadius="8px",n.style.alignSelf="flex-start",C.appendChild(n),C.scrollTop=C.scrollHeight}catch{showToast("AI assistant error","error")}});A.addEventListener("keydown",a=>{a.key==="Enter"&&O.click()});function u(a,r="success"){let s=document.getElementById("toastContainer");s||(s=document.createElement("div"),s.id="toastContainer",Object.assign(s.style,{position:"fixed",right:"20px",bottom:"20px",zIndex:"9999",display:"flex",flexDirection:"column",gap:"8px",maxWidth:"320px"}),document.body.appendChild(s));const t=document.createElement("div");t.textContent=a,Object.assign(t.style,{background:r==="error"?"#fee2e2":"#ecfdf5",color:r==="error"?"#991b1b":"#065f46",padding:"12px 16px",borderRadius:"12px",boxShadow:"0 6px 18px rgba(0,0,0,0.1)",fontWeight:"600",fontSize:"14px",transition:"transform 0.25s ease, opacity 0.25s ease",transform:"translateY(8px)",opacity:"0"}),s.appendChild(t),requestAnimationFrame(()=>{t.style.transform="translateY(0)",t.style.opacity="1"}),setTimeout(()=>{t.style.transform="translateY(8px)",t.style.opacity="0",setTimeout(()=>t.remove(),250)},3e3)}function B(a=""){const r=String(a),s={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};return r.replace(/[&<>"']/g,t=>s[t])}function ve(){const a=localStorage.getItem("theme")||"light",r=document.documentElement;r.classList.remove("light","dark"),r.classList.add(a),r.setAttribute("data-theme",a);const s=document.getElementById("themeToggle");s&&(s.textContent=a==="dark"?"☀️":"🌙",s.addEventListener("click",he));const t=document.getElementById("userThemeToggle");t&&(t.textContent=c.t("toggle_theme"))}function he(){const a=document.documentElement,s=(a.getAttribute("data-theme")||"light")==="dark"?"light":"dark";a.classList.remove("dark","light"),a.classList.add(s),a.setAttribute("data-theme",s),localStorage.setItem("theme",s);const t=document.getElementById("themeToggle");t&&(t.textContent=s==="dark"?"☀️":"🌙");const n=document.getElementById("userThemeToggle");n&&(n.textContent=c.t("toggle_theme"))}function be(){const a=localStorage.getItem("lang")||"en";c&&typeof c.setLang=="function"&&c.setLang(a);const r=document.querySelectorAll("#langSelect, #userLang");r&&r.length&&r.forEach(s=>{if(s){try{s.value=a}catch{}s.addEventListener("change",t=>{const n=t.target.value;localStorage.setItem("lang",n),c&&typeof c.setLang=="function"&&c.setLang(n),document.querySelectorAll("#langSelect, #userLang").forEach(l=>{l&&(l.value=n)})})}})}async function W(){try{const{data:a}=await m.auth.getUser(),r=a?a.user:null,s=document.getElementById("loginBtn"),t=document.getElementById("logoutBtn"),n=document.getElementById("balanceBadge"),l=document.getElementById("sellBtn"),f=document.getElementById("settingsBtn"),b=document.getElementById("adminBtn");if(r){let x="user";try{const{data:$,error:E}=await m.from("users").select("balance, role").eq("id",r.id).single();if(console.log("User data from database:",$),console.log("User ID:",r.id),console.log("Error fetching user:",E),!E&&$){x=$.role||"user",console.log("User role:",x);const L=parseFloat($.balance||0);if(n){n.style.display="flex";const P=n.querySelector("span");P&&(P.textContent=`€${L.toFixed(2)}`)}}else{console.warn("No user data found in public.users table - creating entry");const{data:L,error:P}=await m.from("users").insert([{id:r.id,email:r.email,username:r.email.split("@")[0],role:"user",balance:0}]).select().single();if(!P&&L&&(x=L.role),n){n.style.display="flex";const q=n.querySelector("span");q&&(q.textContent="€0.00")}}}catch($){if(console.error("Error in updateNavbarAuth:",$),n){n.style.display="flex";const E=n.querySelector("span");E&&(E.textContent="€0.00")}}console.log("Admin button element:",b),console.log("Setting admin button display for role:",x),s&&(s.style.display="none"),t&&(t.style.display="inline-block"),l&&(l.style.opacity="1",l.style.pointerEvents="auto"),f&&(f.style.display="inline-block",f.style.opacity="1",f.style.pointerEvents="auto"),b&&(x==="admin"?b.style.display="block":b.style.display="none")}else s&&(s.style.display="inline-block"),t&&(t.style.display="none"),n&&(n.style.display="none"),l&&(l.style.opacity="0.6",l.style.pointerEvents="none"),f&&(f.style.display="none"),b&&(b.style.display="none")}catch(a){console.error("Error updating navbar auth:",a)}}function we(){const a=document.getElementById("loginBtn"),r=document.getElementById("logoutBtn"),s=document.getElementById("sellBtn"),t=document.getElementById("settingsBtn");a?(console.log("Login button found, attaching listener"),a.addEventListener("click",()=>{console.log("Login button clicked"),window.location.href="./login.html"})):console.log("Login button not found"),r&&r.addEventListener("click",async()=>{try{await m.auth.signOut(),await W(),window.location.href="./index.html"}catch(n){console.error("Error signing out:",n),u("Error signing out","error")}}),s&&s.addEventListener("click",async()=>{const{data:n}=await m.auth.getUser();(n?n.user:null)?window.location.href="./sell.html":(u(c.t?c.t("loginFirst"):"Please log in first","error"),setTimeout(()=>window.location.href="login.html",1500))}),t&&t.addEventListener("click",async()=>{const{data:n}=await m.auth.getUser();(n?n.user:null)?window.location.href="./settings.html":(u(c.t?c.t("loginFirst"):"Please log in first","error"),setTimeout(()=>window.location.href="login.html",1500))}),m&&m.auth&&typeof m.auth.onAuthStateChange=="function"&&m.auth.onAuthStateChange(()=>{W()}),W()}function Ee(){const a=document.getElementById("hamburgerBtn"),r=document.querySelector(".navbar-links");a&&r&&a.addEventListener("click",s=>{s.stopPropagation(),r.classList.toggle("active")}),document.addEventListener("click",s=>{r&&a&&!r.contains(s.target)&&!a.contains(s.target)&&r.classList.remove("active")}),window.addEventListener("resize",()=>{window.innerWidth>768&&r&&r.classList.remove("active")})}async function ue(a){try{const{data:r}=await m.auth.getUser(),s=r?.user,{data:t}=await m.from("users").select("*").eq("id",a).single();if(!t)return;const{data:n}=await m.from("products").select("*").eq("seller_id",a).order("created_at",{ascending:!1}).limit(10),{data:l}=await m.from("reviews").select("rating, comment, created_at, buyer_id, users!buyer_id(username)").eq("seller_id",a).order("created_at",{ascending:!1});let f=0;l&&l.length>0&&(f=l.reduce((E,L)=>E+L.rating,0)/l.length);let b=!1,x=!1;if(s&&s.id!==a){const{data:E}=await m.from("reviews").select("id").eq("buyer_id",s.id).eq("seller_id",a).single();x=!!E,b=!x}const $=`
      <div class="profile-header">
        <div class="profile-avatar">
          ${t.username?.charAt(0).toUpperCase()||"U"}
        </div>
        <h2 class="profile-name">${t.username||"Unknown User"}</h2>
        ${t.bio?`<p class="profile-bio">${B(t.bio)}</p>`:""}
        <div class="profile-stats">
          <div class="profile-stat">
            <div class="profile-stat-value">${n?.length||0}</div>
            <div class="profile-stat-label">Products</div>
          </div>
          <div class="profile-stat">
            <div class="profile-stat-value">${f.toFixed(1)} ⭐</div>
            <div class="profile-stat-label">Rating (${l?.length||0} reviews)</div>
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
    `;if(document.getElementById("profileModalContent").innerHTML=$,document.getElementById("userProfileModal").style.display="flex",document.querySelectorAll("#profileModalContent .btn-buy-now").forEach(E=>{E.addEventListener("click",()=>{const L=E.dataset.productId;document.getElementById("userProfileModal").style.display="none",document.body.style.overflow="auto",showProductModal(L)})}),b){const E=document.getElementById("reviewForm");E&&E.addEventListener("submit",async L=>{L.preventDefault();const P=parseInt(document.getElementById("reviewRating").value),q=document.getElementById("reviewComment").value.trim();if(!P||P<1||P>5){u("Please select a valid rating","error");return}try{const{error:U}=await m.from("reviews").insert({buyer_id:s.id,seller_id:a,rating:P,comment:q||null});if(U)throw U;u("Review submitted successfully!","success"),document.getElementById("userProfileModal").style.display="none",ue(a)}catch(U){console.error("Error submitting review:",U),u("Failed to submit review","error")}})}}catch(r){console.error("Error loading user profile:",r)}}async function Ie(){if(!document.querySelector(".product-grid-modern"))return;async function a(){try{const e=await m.from("products").select("*",{count:"exact",head:!0}),o=await m.from("users").select("*",{count:"exact",head:!0}),i=await m.from("products").select("seller_id",{count:"exact",head:!0}),y=e.count||0,w=o.count||0,I=i.count||0,h=document.getElementById("statsProducts"),F=document.getElementById("statsUsers"),j=document.getElementById("statsSellers");h&&(h.textContent=y.toString()),F&&(F.textContent=w.toString()),j&&(j.textContent=I.toString())}catch(e){console.error("Error updating stats:",e)}}let r=[],s="all",t={search:"",minPrice:"",maxPrice:"",location:"",condition:"",stock:"",availability:"",brand:"",color:"",date:"",sortBy:"newest"};async function n(){try{const{data:e,error:o}=await m.from("products").select("*, users!seller_id(username)").order("created_at",{ascending:!1});if(o)throw o;r=Array.isArray(e)?e:[],l(),a()}catch(e){console.error("Error loading products:",e),u(c.t&&c.t("error_loading_products")||"Error loading products","error")}}function l(){let e=[...r];if(s!=="all"&&(e=e.filter(o=>(o.category||"").toLowerCase()===s.toLowerCase())),t.search){const o=t.search.toLowerCase();e=e.filter(i=>(i.name||"").toLowerCase().includes(o)||(i.description||"").toLowerCase().includes(o)||(i.category||"").toLowerCase().includes(o))}if(t.minPrice){const o=parseFloat(t.minPrice);e=e.filter(i=>parseFloat(i.price||0)>=o)}if(t.maxPrice){const o=parseFloat(t.maxPrice);e=e.filter(i=>parseFloat(i.price||0)<=o)}if(t.location&&(e=e.filter(o=>(o.location||"").toLowerCase().includes(t.location.toLowerCase()))),t.condition&&(e=e.filter(o=>(o.condition||"")===t.condition)),t.stock&&(e=e.filter(o=>{const i=parseInt(o.stock||0);switch(t.stock){case"in_stock":return i>0;case"low_stock":return i>=1&&i<=5;case"high_stock":return i>=10;case"out_of_stock":return i===0;default:return!0}})),t.availability&&(e=e.filter(o=>t.availability==="available"?!o.is_reserved&&(o.stock||0)>0:t.availability==="reserved"?o.is_reserved:!0)),t.brand){const o=t.brand.toLowerCase();e=e.filter(i=>(i.brand||"").toLowerCase().includes(o))}if(t.color){const o=t.color.toLowerCase();e=e.filter(i=>(i.color||"").toLowerCase().includes(o))}if(t.date){const o=new Date;e=e.filter(i=>{const y=new Date(i.created_at),I=(o-y)/(1e3*60*60*24);switch(t.date){case"today":return I<1;case"week":return I<7;case"month":return I<30;case"3months":return I<90;default:return!0}})}switch(t.sortBy){case"oldest":e.sort((o,i)=>new Date(o.created_at)-new Date(i.created_at));break;case"price_low":e.sort((o,i)=>parseFloat(o.price||0)-parseFloat(i.price||0));break;case"price_high":e.sort((o,i)=>parseFloat(i.price||0)-parseFloat(o.price||0));break;case"name":e.sort((o,i)=>(o.name||"").localeCompare(i.name||""));break;case"name_desc":e.sort((o,i)=>(i.name||"").localeCompare(o.name||""));break;case"popular":e.sort((o,i)=>{const y=parseInt(o.views||0);return parseInt(i.views||0)-y});break;default:e.sort((o,i)=>new Date(i.created_at)-new Date(o.created_at));break}f(e)}async function f(e=null){const o=document.getElementById("productGrid");if(!o)return;const i=e||r;if(!i||i.length===0){o.innerHTML=`<div style="padding:40px;text-align:center;grid-column:1/-1;color:var(--muted);">
        <div style="font-size: 3rem; margin-bottom: 1rem;">📦</div>
        <span data-i18n="no_products">No products found</span>
        <p style="margin-top: 0.5rem; font-size: 0.875rem;">Try adjusting your filters or search terms</p>
      </div>`,c&&typeof c.setLang=="function"&&c.setLang(c.lang||"en");return}const{data:y}=await m.auth.getUser(),w=y?.user;let I="user";if(w)try{const{data:h}=await m.from("users").select("role").eq("id",w.id).single();I=h?.role||"user"}catch(h){console.error("Error fetching user role:",h)}o.innerHTML="",i.forEach(h=>{const F=h.image_url||"https://via.placeholder.com/300x200",j=Number.isFinite(Number(h.price))?parseFloat(h.price).toFixed(2):"0.00",te=h.stock!=null?h.stock:0,oe=B(h.category||"other"),ee=B(h.name||"Unnamed Product"),Y=B(h.location||""),Q=h.condition?h.condition.replace("_"," "):"",X={new:"✨",like_new:"🔄",good:"👍",fair:"😐",poor:"⚠️"},G=w&&(I==="admin"||h.seller_id===w.id),S=document.createElement("div");if(S.className="product-card-modern",S.style.cursor="pointer",S.setAttribute("data-product-id",h.id),S.addEventListener("click",M=>{!M.target.closest(".btn-buy-now")&&!M.target.closest(".btn-reserve")&&L(h)}),S.innerHTML=`
        <div class="product-image-container">
          <img src="${B(F)}" alt="${ee}" class="product-image" onerror="this.src='https://via.placeholder.com/300x200'">
          <button class="product-like-btn" data-id="${B(h.id)}" aria-label="Like">❤️</button>
          ${h.is_reserved?'<span class="product-badge-new" data-i18n="reserved">Reserved</span>':""}
          <div class="product-overlay">
            <button class="btn-quick-view" data-id="${B(h.id)}" data-i18n="quickView">👁 Quick View</button>
          </div>
        </div>
        <div class="product-info">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
            <span class="product-category">${oe}</span>
            ${Q?`<span style="background: #dbeafe; color: #1e40af; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 500;">${X[h.condition]} ${Q}</span>`:""}
          </div>
          <h3 class="product-name">${ee}</h3>
          <div class="product-seller" style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.5rem;">
            <div class="seller-avatar" style="width:24px; height:24px; border-radius:50%; background:linear-gradient(135deg,#667eea,#764ba2); display:flex; align-items:center; justify-content:center; font-size:12px; color:white; font-weight:600; cursor:pointer;" onclick="event.stopPropagation(); showUserProfile('${h.seller_id}')">
              👤
            </div>
            <span class="seller-name" style="font-size:0.875rem; color:var(--muted); cursor:pointer;" onclick="event.stopPropagation(); showUserProfile('${h.seller_id}')">
              ${B(h.users?.username||"Unknown")}
            </span>
          </div>
          <div class="product-meta">
            ${Y?`<span style="display: block; color: #6b7280; font-size: 0.875rem; margin-bottom: 0.25rem;">📍 ${Y}</span>`:""}
            <span class="product-views">📦 ${B(te)} in stock</span>
          </div>
          <div class="product-footer">
            <div class="product-price">
              ${h.original_price&&h.original_price>h.price?`<span class="price-original">€${parseFloat(h.original_price).toFixed(2)}</span>`:""}
              <span class="price-currency">€</span>
              <span class="price-amount">${j}</span>
            </div>
            <div class="product-actions">
              <button class="btn-buy-now" data-id="${B(h.id)}" data-i18n="buyNow">🛒 Buy Now</button>
            </div>
          </div>
          ${G?`
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
      `,o.appendChild(S),G){const M=S.querySelector(".btn-edit-product"),J=S.querySelector(".btn-delete-product");M&&M.addEventListener("click",V=>{V.stopPropagation(),z(h)}),J&&J.addEventListener("click",async V=>{V.stopPropagation(),confirm(`Are you sure you want to delete "${h.name}"?`)&&await D(h.id)})}}),c&&typeof c.setLang=="function"&&c.setLang(c.lang||"en"),b()}function b(){document.querySelectorAll(".btn-buy-now:not([disabled])").forEach(e=>{e.replaceWith(e.cloneNode(!0))}),document.querySelectorAll(".btn-buy-now:not([disabled])").forEach(e=>{e.addEventListener("click",async o=>{const i=o.currentTarget.dataset.id;await x(i)})}),document.querySelectorAll(".btn-add-cart").forEach(e=>{e.replaceWith(e.cloneNode(!0))}),document.querySelectorAll(".btn-add-cart").forEach(e=>{e.addEventListener("click",async o=>{const i=o.currentTarget.dataset.id;await $(i)})}),document.querySelectorAll(".btn-remove-reserve").forEach(e=>{e.replaceWith(e.cloneNode(!0))}),document.querySelectorAll(".btn-remove-reserve").forEach(e=>{e.addEventListener("click",async o=>{const i=o.currentTarget.dataset.id;await E(i)})}),document.querySelectorAll(".btn-quick-view").forEach(e=>{e.replaceWith(e.cloneNode(!0))}),document.querySelectorAll(".btn-quick-view").forEach(e=>{e.addEventListener("click",o=>{const i=o.currentTarget.dataset.id,y=r.find(w=>String(w.id)===String(i));y&&L(y)})})}async function x(e){try{const{data:o}=await m.auth.getUser(),i=o?o.user:null;if(!i){u(c.t?c.t("loginFirst"):"Please log in first","error"),setTimeout(()=>window.location.href="login.html",1500);return}const y=await R(()=>import("./navbar-BgutAARZ.js").then(w=>w.f),__vite__mapDeps([0,1]),import.meta.url);if(y&&typeof y.purchaseProduct=="function")await y.purchaseProduct(e,i.id),u(c.t?c.t("purchaseComplete"):"Purchase completed","success"),await n(),await W();else throw new Error("Purchase function not available")}catch(o){console.error("Purchase error:",o),u(o.message||"Purchase failed","error")}}async function $(e){try{const{data:o}=await m.auth.getUser(),i=o?o.user:null;if(!i){u(c.t?c.t("loginFirst"):"Please log in first","error"),setTimeout(()=>window.location.href="./login.html",1500);return}const y=await R(()=>import("./navbar-BgutAARZ.js").then(w=>w.f),__vite__mapDeps([0,1]),import.meta.url);if(y&&typeof y.reserveProduct=="function")await y.reserveProduct(e,i.id,.2),u(c.t&&c.t("reserved_success")||"Product reserved successfully!","success"),await n(),await W();else throw new Error("Reserve function not available")}catch(o){console.error("Reserve error:",o),u(o.message||"Reservation failed","error")}}async function E(e){try{const{data:o}=await m.auth.getUser(),i=o?o.user:null;if(!i){u(c.t?c.t("loginFirst"):"Please log in first","error"),setTimeout(()=>window.location.href="./login.html",1500);return}const y=await R(()=>import("./navbar-BgutAARZ.js").then(w=>w.f),__vite__mapDeps([0,1]),import.meta.url);if(y&&typeof y.removeReserve=="function")await y.removeReserve(e,i.id),u("Reservation removed successfully!","success"),await n(),await W();else throw new Error("Remove reserve function not available")}catch(o){console.error("Remove reserve error:",o),u(o.message||"Failed to remove reservation","error")}}async function L(e){const o=document.getElementById("productModal");if(!o)return;const i=o.querySelector(".modal-body");let y=null,w=0,I=0;if(e.seller_id){const{data:me}=await m.from("users").select("id, username, email, created_at").eq("id",e.seller_id).single();y=me,w=4.5,I=23}const h=Math.floor(Math.random()*50),F=Math.floor(Math.random()*30),j=Math.floor(Math.random()*200)+50,te={new:"✨",like_new:"🔄",good:"👍",fair:"😐",poor:"⚠️"},oe=e.condition?e.condition.replace("_"," "):"",ee=e.image_url||"https://via.placeholder.com/600x400",Y=Number.isFinite(Number(e.price))?parseFloat(e.price).toFixed(2):"0.00";i.innerHTML=`
      <div class="modal-product-grid">
        <div>
          <img src="${B(ee)}" alt="${B(e.name)}" class="modal-product-image">
        </div>
        
        <div class="modal-product-info">
          <h1>${B(e.name)}</h1>
          <div class="modal-product-price">€${Y}</div>
          
          <div class="modal-product-meta">
            <span class="modal-badge" style="background: #dbeafe; color: #1e40af;">
              ${te[e.condition]||"📦"} ${B(oe)}
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
              <div class="modal-stat-value">🔖 ${F}</div>
              <div class="modal-stat-label">Saved</div>
            </div>
            <div class="modal-stat">
              <div class="modal-stat-value">👁 ${j}</div>
              <div class="modal-stat-label">Views</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Seller Information -->
      <div class="modal-seller-card">
        <div class="modal-seller-header">
          <div class="modal-seller-avatar">
            ${y?.username?y.username.charAt(0).toUpperCase():"?"}
          </div>
          <div class="modal-seller-info">
            <h3 style="cursor:pointer; color:#3b82f6;">${B(y?.username)||"Unknown Seller"}</h3>
            <div class="modal-seller-rating">
              ${"⭐".repeat(Math.floor(w))} ${w}/5 (${I} reviews)
            </div>
            <div style="font-size: 0.875rem; color: var(--muted); margin-top: 0.25rem;">
              Member since ${y?.created_at?new Date(y.created_at).toLocaleDateString():"N/A"}
            </div>
          </div>
        </div>
        
        ${y?`
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
            🛒 Buy Now - €${Y}
          </button>
        `:""}
      </div>
    `,o.style.display="flex",document.body.style.overflow="hidden";const Q=o.querySelector(".modal-seller-info h3");Q&&Q.addEventListener("click",()=>{o.style.display="none",document.body.style.overflow="auto",ue(e.seller_id)});const X=()=>{o.style.display="none",document.body.style.overflow="auto"},G=document.getElementById("modalClose"),S=document.getElementById("modalOverlay");G&&(G.onclick=X),S&&(S.onclick=X);const M=document.getElementById("chatSellerBtn");M&&(M.onclick=()=>{window.location.href=`chat.html?seller=${e.seller_id}&product=${e.id}`});const J=document.getElementById("likeProductBtn");J&&(J.onclick=()=>{u("Product liked!","success")});const V=document.getElementById("modalBuyBtn");V&&(V.onclick=async()=>{await x(e.id),X()})}const P=document.querySelectorAll(".filter-tab");P&&P.length&&P.forEach(e=>{e.addEventListener("click",o=>{P.forEach(i=>i.classList.remove("active")),e.classList.add("active"),s=e.dataset.category||"all",l()})});const q=document.getElementById("applyFilters"),U=document.getElementById("clearFilters");q&&q.addEventListener("click",()=>{t.search=document.getElementById("searchInput")?.value||"",t.minPrice=document.getElementById("minPrice")?.value||"",t.maxPrice=document.getElementById("maxPrice")?.value||"",t.location=document.getElementById("locationFilter")?.value||"",t.condition=document.getElementById("conditionFilter")?.value||"",t.stock=document.getElementById("stockFilter")?.value||"",t.availability=document.getElementById("availabilityFilter")?.value||"",t.brand=document.getElementById("brandFilter")?.value||"",t.color=document.getElementById("colorFilter")?.value||"",t.date=document.getElementById("dateFilter")?.value||"",t.sortBy=document.getElementById("sortFilter")?.value||"newest",l(),v(),u("Filters applied successfully!","success")}),U&&U.addEventListener("click",()=>{t={search:"",minPrice:"",maxPrice:"",location:"",condition:"",stock:"",availability:"",brand:"",color:"",date:"",sortBy:"newest"},["searchInput","minPrice","maxPrice","brandFilter","colorFilter"].forEach(w=>{const I=document.getElementById(w);I&&(I.value="")}),["locationFilter","conditionFilter","stockFilter","availabilityFilter","dateFilter","sortFilter"].forEach(w=>{const I=document.getElementById(w);I&&(I.value=w==="sortFilter"?"newest":"")});const i=document.getElementById("categoryFilter");i&&(i.value=""),s="all",P.forEach(w=>w.classList.remove("active"));const y=document.querySelector('[data-category="all"]');y&&y.classList.add("active"),l(),v(),u("Filters cleared!","success")});function v(){const e=document.getElementById("activeFilters"),o=document.getElementById("filterTags");if(!e||!o)return;o.innerHTML="";let i=!1;const y={search:"🔍 Search",minPrice:"💰 Min",maxPrice:"💸 Max",location:"📍 Location",condition:"⭐ Condition",stock:"📊 Stock",availability:"🔖 Status",brand:"🏷️ Brand",color:"🎨 Color",date:"📅 Date",sortBy:"🔄 Sort"};Object.keys(t).forEach(w=>{if(t[w]&&t[w]!=="newest"){i=!0;const I=document.createElement("div");I.className="filter-tag",I.innerHTML=`
          ${y[w]}: ${t[w]}
          <span class="remove-tag">×</span>
        `,I.onclick=()=>{t[w]=w==="sortBy"?"newest":"";const h={search:"searchInput",minPrice:"minPrice",maxPrice:"maxPrice",location:"locationFilter",condition:"conditionFilter",stock:"stockFilter",availability:"availabilityFilter",brand:"brandFilter",color:"colorFilter",date:"dateFilter",sortBy:"sortFilter"}[w],F=document.getElementById(h);F&&(F.value=w==="sortBy"?"newest":""),l(),v()},o.appendChild(I)}}),e.style.display=i?"block":"none"}const d=document.getElementById("searchInput");if(d){let e;d.addEventListener("input",()=>{clearTimeout(e),e=setTimeout(()=>{t.search=d.value,l()},300)})}const g=document.getElementById("toggleFiltersBtn"),p=document.getElementById("advancedFiltersContainer"),_=document.getElementById("filterArrow");let T=!1;g&&p&&g.addEventListener("click",()=>{T=!T,T?(p.style.display="block",_.style.transform="rotate(180deg)",g.querySelector("[data-i18n]").setAttribute("data-i18n","hide_filters"),g.querySelector("[data-i18n]").textContent=c.t("hide_filters")):(p.style.display="none",_.style.transform="rotate(0deg)",g.querySelector("[data-i18n]").setAttribute("data-i18n","show_filters"),g.querySelector("[data-i18n]").textContent=c.t("show_filters"))}),document.querySelector(".btn-hero-primary")?.addEventListener("click",()=>{document.querySelector(".main-container")?.scrollIntoView({behavior:"smooth"})}),document.querySelector(".btn-hero-secondary")?.addEventListener("click",()=>{document.querySelector(".features-section")?.scrollIntoView({behavior:"smooth"})});async function D(e){try{const{data:o}=await m.auth.getUser(),i=o?.user;if(!i){u("Please log in first","error");return}const{deleteProduct:y}=await R(async()=>{const{deleteProduct:w}=await import("./navbar-BgutAARZ.js").then(I=>I.f);return{deleteProduct:w}},__vite__mapDeps([0,1]),import.meta.url);await y(e,i.id),u("Product deleted successfully!","success"),n()}catch(o){console.error("Error deleting product:",o),u(o.message||"Failed to delete product","error")}}function z(e){const o=`
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
    `,i=document.getElementById("editProductModal");i&&i.remove(),document.body.insertAdjacentHTML("beforeend",o),document.body.style.overflow="hidden",document.getElementById("editProductForm").addEventListener("submit",async y=>{y.preventDefault(),await H(e.id)})}window.closeEditModal=function(){const e=document.getElementById("editProductModal");e&&(e.remove(),document.body.style.overflow="auto")};async function H(e){try{const{data:o}=await m.auth.getUser(),i=o?.user;if(!i){u("Please log in first","error");return}const y={name:document.getElementById("editName").value,price:parseFloat(document.getElementById("editPrice").value),category:document.getElementById("editCategory").value,condition:document.getElementById("editCondition").value,stock:parseInt(document.getElementById("editStock").value),location:document.getElementById("editLocation").value,description:document.getElementById("editDescription").value,image_url:document.getElementById("editImageUrl").value},{updateProduct:w}=await R(async()=>{const{updateProduct:I}=await import("./navbar-BgutAARZ.js").then(h=>h.f);return{updateProduct:I}},__vite__mapDeps([0,1]),import.meta.url);await w(e,i.id,y),u("Product updated successfully!","success"),closeEditModal(),n()}catch(o){console.error("Error updating product:",o),u(o.message||"Failed to update product","error")}}n(),document.addEventListener("purchaseProduct",async e=>{await x(e.detail.productId),document.getElementById("productModal").style.display="none",document.body.style.overflow="auto"}),document.addEventListener("reserveProduct",async e=>{await $(e.detail.productId),document.getElementById("productModal").style.display="none",document.body.style.overflow="auto"})}function Be(){if(!document.getElementById("userEmail"))return;async function a(){try{const{data:v}=await m.auth.getUser(),d=v?v.user:null;if(!d){u("You must be logged in to access settings.","error"),setTimeout(()=>window.location.href="login.html",2e3);return}const g=await m.from("users").select("*").eq("id",d.id).single();if(g.error){console.error("Error loading user settings:",g.error);return}const p=g.data,_=document.getElementById("userEmail"),T=document.getElementById("userEmailDisplay");_&&(_.value=p.email||""),T&&(T.textContent=p.email||"");const D=document.getElementById("userBalanceDisplay");D&&(D.textContent=`€${Number.isFinite(Number(p.balance))?parseFloat(p.balance).toFixed(2):"0.00"}`);const z=document.getElementById("userName"),H=document.getElementById("usernameInput");z&&(z.textContent=p.username||"User"),H&&(H.value=p.username||"");const e=document.getElementById("userAvatar"),o=document.getElementById("userAvatarText"),i=document.getElementById("avatarUrlInput");p.avatar_url?(e&&(e.src=p.avatar_url,e.style.display="block"),o&&(o.style.display="none"),i&&(i.value=p.avatar_url)):o&&(o.textContent=(p.username||"U").charAt(0).toUpperCase());const y=document.getElementById("bioInput");y&&(y.value=p.bio||"");const w=document.getElementById("whatISellInput");w&&(w.value=p.what_i_sell||"");const I=document.getElementById("userLang");I&&(I.value=p.language||"en");const h=p.theme||"light",F=document.getElementById("userThemeToggle");F&&(F.textContent=c.t("toggle_theme")),r(d.id)}catch(v){console.error("Error in loadUserSettings:",v)}}async function r(v){try{const{count:d}=await m.from("products").select("*",{count:"exact",head:!0}).eq("seller_id",v),{count:g}=await m.from("user_transactions").select("*",{count:"exact",head:!0}).eq("user_id",v).eq("transaction_type","sale"),p=document.getElementById("userProductCount"),_=document.getElementById("userSalesCount");p&&(p.textContent=d||0),_&&(_.textContent=g||0),s(v),t(v),n(v)}catch(d){console.error("Error loading user stats:",d)}}async function s(v){try{const{data:d}=await m.from("products").select("*").eq("seller_id",v).order("created_at",{ascending:!1}).limit(10),g=document.getElementById("userProducts");if(!g)return;d&&d.length>0?g.innerHTML=d.map(p=>`
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
         `}catch(d){console.error("Error loading user products:",d)}}async function t(v){try{const{data:d}=await m.from("reviews").select("rating, comment, created_at, buyer_id, users!buyer_id(username)").eq("seller_id",v).order("created_at",{ascending:!1}).limit(5),g=document.getElementById("userReviews");if(!g)return;d&&d.length>0?g.innerHTML=d.map(p=>`
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
         `}catch(d){console.error("Error loading user reviews:",d)}}async function n(v){try{const{data:d}=await m.from("user_transactions").select("*").eq("user_id",v).eq("transaction_type","sale").order("created_at",{ascending:!1}).limit(10),g=document.getElementById("userSales");if(!g)return;d&&d.length>0?g.innerHTML=d.map(p=>`
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
         `}catch(d){console.error("Error loading user sales:",d)}}const l=document.getElementById("saveProfileBtn");l&&l.addEventListener("click",async()=>{try{const{data:v}=await m.auth.getUser(),d=v?.user;if(!d){u("Please log in first","error");return}const g=document.getElementById("usernameInput")?.value,p=document.getElementById("bioInput")?.value,_=document.getElementById("whatISellInput")?.value,T=document.getElementById("userLang")?.value;let D=null;const z=document.querySelector('input[name="avatarType"][value="file"]');if(z&&z.checked){const e=document.getElementById("avatarFileInput");if(e&&e.files[0]){const{uploadAvatar:o}=await R(async()=>{const{uploadAvatar:i}=await import("./navbar-BgutAARZ.js").then(y=>y.f);return{uploadAvatar:i}},__vite__mapDeps([0,1]),import.meta.url);D=await o(e.files[0],d.id)}}else D=document.getElementById("avatarUrlInput")?.value||null;const{error:H}=await m.from("users").update({username:g||null,avatar_url:D,bio:p||null,what_i_sell:_||null,language:T||"en",updated_at:new Date().toISOString()}).eq("id",d.id);if(H)throw H;u(c.t("profile_updated"),"success"),a()}catch(v){console.error("Error updating profile:",v),u(c.t("profile_update_failed"),"error")}});const f=document.querySelectorAll('input[name="avatarType"]'),b=document.getElementById("avatarUrlInput"),x=document.getElementById("avatarFileInput");f.forEach(v=>{v.addEventListener("change",d=>{d.target.value==="url"?(b.style.display="block",x.style.display="none",x.value=""):(b.style.display="none",x.style.display="block",b.value="")})});const $=document.getElementById("changeAvatarBtn");$&&$.addEventListener("click",()=>{const v=document.querySelector('input[name="avatarType"][value="url"]');v&&v.checked?(b.focus(),b.scrollIntoView({behavior:"smooth",block:"center"})):x.click()}),b&&b.addEventListener("input",()=>{const v=b.value,d=document.getElementById("userAvatar"),g=document.getElementById("userAvatarText");v?(d&&(d.src=v,d.style.display="block",d.onerror=()=>{d.style.display="none",g&&(g.style.display="flex")}),g&&(g.style.display="none")):(d&&(d.style.display="none"),g&&(g.style.display="flex"))}),x&&x.addEventListener("change",v=>{const d=v.target.files[0];if(d){const g=new FileReader;g.onload=p=>{const _=document.getElementById("userAvatar"),T=document.getElementById("userAvatarText");_&&(_.src=p.target.result,_.style.display="block"),T&&(T.style.display="none")},g.readAsDataURL(d)}});const E=document.getElementById("userThemeToggle");E&&E.addEventListener("click",async()=>{const v=document.documentElement,g=(v.getAttribute("data-theme")||"light")==="dark"?"light":"dark";v.classList.remove("dark","light"),v.classList.add(g),v.setAttribute("data-theme",g),localStorage.setItem("theme",g),E.textContent=c.t("toggle_theme");const p=document.getElementById("themeToggle");p&&(p.textContent=g==="dark"?"☀️":"🌙");try{const{data:_}=await m.auth.getUser(),T=_?.user;T&&await m.from("users").update({theme:g,updated_at:new Date().toISOString()}).eq("id",T.id)}catch(_){console.error("Error saving theme preference:",_)}u(c.t(g==="dark"?"switched_to_dark":"switched_to_light"),"success")});const L=document.getElementById("userLang");L&&L.addEventListener("change",async v=>{const d=v.target.value;localStorage.setItem("lang",d),c&&typeof c.setLang=="function"&&c.setLang(d);const g=document.getElementById("userThemeToggle");g&&(g.textContent=c.t("toggle_theme"));try{const{data:p}=await m.auth.getUser(),_=p?.user;_&&await m.from("users").update({language:d,updated_at:new Date().toISOString()}).eq("id",_.id)}catch(p){console.error("Error saving language preference:",p)}u(c.t("language_changed"),"success")});const P=document.getElementById("settingsLogoutBtn");P&&P.addEventListener("click",async()=>{try{await m.auth.signOut(),u("Logged out successfully","success"),setTimeout(()=>window.location.href="index.html",1e3)}catch(v){console.error("Error signing out:",v),u("Error signing out","error")}});const q=document.getElementById("deleteAccountBtn");q&&q.addEventListener("click",async()=>{if(confirm(c.t&&c.t("delete_account_confirm")||"Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost."))try{const{data:d}=await m.auth.getUser(),g=d?d.user:null;if(!g)return;await m.from("users").delete().eq("id",g.id),u("Account deleted successfully","success"),setTimeout(()=>window.location.href="index.html",1e3)}catch(d){console.error("Error deleting account:",d),u("Error deleting account","error")}});const U=document.getElementById("previewProfileBtn");U&&U.addEventListener("click",()=>{xe()}),a()}function xe(){const a=document.getElementById("usernameInput")?.value||"User",r=document.getElementById("bioInput")?.value||"",s=document.getElementById("whatISellInput")?.value||"",t=document.getElementById("userEmail")?.value||"";let n="";const l=document.querySelector('input[name="avatarType"][value="file"]');l&&l.checked&&document.getElementById("avatarFileInput").files[0]?n=document.getElementById("avatarFileInput").dataset.previewUrl||"":n=document.getElementById("avatarUrlInput")?.value||"";const f=`
     <div id="profilePreviewModal" class="product-modal" style="display: flex;">
       <div class="modal-overlay" onclick="closeProfilePreview()"></div>
       <div class="modal-content" style="max-width: 600px;">
         <button class="modal-close" onclick="closeProfilePreview()">×</button>
         <div class="modal-body">
           <h2 style="margin-bottom: 1.5rem; color: var(--text-primary); text-align: center;">Profile Preview</h2>
           <div style="text-align: center; padding: 2rem;">
             <div style="position: relative; width: 120px; margin: 0 auto 1rem;">
               <div style="width: 120px; height: 120px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; font-size: 3rem; color: white; font-weight: 700; overflow: hidden; margin: 0 auto;">
                 ${n?`<img src="${n}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover;">`:`<span>${a.charAt(0).toUpperCase()}</span>`}
               </div>
             </div>
             <h3 style="margin: 0 0 0.5rem 0; font-size: 1.5rem; font-weight: 700; color: var(--fg);">${a}</h3>
             <p style="margin: 0 0 1rem 0; color: var(--muted); font-size: 0.875rem;">${t}</p>
             ${r?`<p style="margin: 0 0 1rem 0; color: var(--fg); font-size: 0.875rem;">${r}</p>`:""}
             ${s?`<p style="margin: 0 0 1rem 0; color: var(--muted); font-size: 0.875rem;"><strong>What I sell:</strong> ${s}</p>`:""}
             <div style="margin-top: 2rem; padding: 1rem; background: var(--secondary); border-radius: 12px;">
               <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary);">€0.00</div>
               <div style="font-size: 0.875rem; color: var(--muted);">Current Balance</div>
             </div>
           </div>
         </div>
       </div>
     </div>
   `,b=document.getElementById("profilePreviewModal");b&&b.remove(),document.body.insertAdjacentHTML("beforeend",f),document.body.style.overflow="hidden"}window.closeProfilePreview=function(){const a=document.getElementById("profilePreviewModal");a&&(a.remove(),document.body.style.overflow="auto")};function ke(){if(!document.getElementById("sellForm"))return;async function a(){const{data:s}=await m.auth.getUser();s&&s.user||(u("You must be logged in to sell items.","error"),setTimeout(()=>window.location.href="login.html",2e3))}a();const r=document.getElementById("sellForm");r&&r.addEventListener("submit",async s=>{s.preventDefault();const{data:t}=await m.auth.getUser(),n=t?t.user:null;if(!n){u(c.t?c.t("loginFirst"):"Please log in first","error");return}const l={name:document.getElementById("productNameInput")?.value||"",category:document.getElementById("productCategoryInput")?.value||"",price:parseFloat(document.getElementById("productPriceInput")?.value||"0"),description:document.getElementById("productDescriptionInput")?.value||"",image_url:document.getElementById("productImageInput")?.value||"",stock:parseInt(document.getElementById("productStockInput")?.value||"1"),condition:document.getElementById("productConditionInput")?.value||"",location:document.getElementById("productLocationInput")?.value||""};try{const f=await R(()=>import("./navbar-BgutAARZ.js").then(b=>b.f),__vite__mapDeps([0,1]),import.meta.url);if(f&&typeof f.listProduct=="function")await f.listProduct(l,n.id)?(u("Product listed successfully!","success"),s.target.reset()):u("Error listing product","error");else throw new Error("listProduct helper not found")}catch(f){console.error("Error listing product:",f),u("Error listing product: "+(f.message||""),"error")}})}function _e(){if(!document.getElementById("loginForm"))return;document.getElementById("loginForm").addEventListener("submit",async r=>{r.preventDefault();const s=document.getElementById("emailInput")?.value.trim()||"",t=document.getElementById("passwordInput")?.value||"";if(!s||!t){u("Please fill in all fields","error");return}try{const n=await R(()=>import("./navbar-BgutAARZ.js").then(l=>l.f),__vite__mapDeps([0,1]),import.meta.url);if(n&&typeof n.loginUser=="function"){const l=await n.loginUser(s,t);if(l&&l.error){u("Login failed: "+(l.error.message||l.error),"error");return}window.location.href="index.html"}else{const{error:l}=await m.auth.signInWithPassword({email:s,password:t});if(l){u("Login failed: "+l.message,"error");return}window.location.href="index.html"}}catch(n){console.error("Login error:",n),u("Login failed. Please try again.","error")}})}function Le(){if(!document.getElementById("registerForm"))return;document.getElementById("registerForm").addEventListener("submit",async r=>{r.preventDefault();const s=document.getElementById("usernameInput")?.value.trim()||"",t=document.getElementById("emailInput")?.value.trim()||"",n=document.getElementById("passwordInput")?.value||"",l=document.getElementById("confirmPasswordInput")?.value||"";if(n!==l){u(c.t&&c.t("passwords_not_match")||"Passwords do not match","error");return}if(n.length<6){u(c.t&&c.t("password_too_short")||"Password must be at least 6 characters","error");return}try{const f=await m.auth.signUp({email:t,password:n,options:{data:{username:s}}});if(f.error)throw f.error;u(c.t&&c.t("registration_success")||"Registration successful! Please check your email to verify your account."),window.location.href="login.html"}catch(f){console.error("Registration error:",f),u(f.message||"Registration failed. Please try again.","error")}})}function Pe(){if(!document.getElementById("currentBalance"))return;async function a(){try{const{data:t}=await m.auth.getUser(),n=t?t.user:null;if(!n)return;const l=await m.from("users").select("balance").eq("id",n.id).single(),f=document.getElementById("currentBalance");if(!l.error&&l.data){const b=parseFloat(l.data.balance||0);f&&(f.innerText=`€${b.toFixed(2)}`)}else f&&(f.innerText="€0.00");s(n.id)}catch(t){console.error("Error loading user balance:",t)}}const r=document.getElementById("addFundsBtn");r&&r.addEventListener("click",async()=>{const t=document.getElementById("fundAmount"),n=parseFloat(t?.value||"0");if(isNaN(n)||n<=0){u("Enter a valid amount","error");return}const{data:l}=await m.auth.getUser(),f=l?l.user:null;if(!f){u("Please login first","error");return}try{const b=await R(()=>import("./navbar-BgutAARZ.js").then(x=>x.f),__vite__mapDeps([0,1]),import.meta.url);if(b&&typeof b.addBalance=="function")await b.addBalance(f.id,n),await a(),t&&(t.value=""),u("Funds added successfully!","success");else throw new Error("addBalance helper not found")}catch(b){console.error("Failed to add funds:",b),u("Failed to add funds","error")}});async function s(t){try{const{data:n,error:l}=await m.from("user_transactions").select().eq("user_id",t).order("created_at",{ascending:!1}),f=document.getElementById("transactionHistory");if(!f)return;f.innerHTML="",!l&&n&&n.length?n.forEach(b=>{const x=document.createElement("div");x.className="transaction-item";const $=b.transaction_type==="deposit"?"➕":"➖",E=Number.isFinite(Number(b.amount))?Math.abs(Number(b.amount)).toFixed(2):"0.00",L=b.created_at?new Date(b.created_at).toLocaleString():"";x.innerHTML=`<span>${$} €${E}</span> <span>${L}</span>`,f.appendChild(x)}):f.innerHTML='<p data-i18n="no_tx">No transactions yet.</p>'}catch(n){console.error("Error loading transactions:",n)}}a()}document.addEventListener("DOMContentLoaded",()=>{Ee(),we(),ve(),be(),Ie(),Be(),ke(),_e(),Le(),Pe()});
