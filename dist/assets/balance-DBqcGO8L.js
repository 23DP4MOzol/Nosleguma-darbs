import{i as o,s as c}from"./navbar-D2POqtqi.js";function S(){const e=localStorage.getItem("theme")||"light",t=document.documentElement;t.classList.remove("light","dark"),t.classList.add(e),t.setAttribute("data-theme",e),document.getElementById("themeToggle").textContent=e==="dark"?"☀️":"🌙"}function F(){const e=localStorage.getItem("lang")||"en",t=document.getElementById("langSelect");t&&(t.value=e),o.setLang(e)}document.getElementById("langSelect").addEventListener("change",e=>{const t=e.target.value;localStorage.setItem("lang",t),o.setLang(t)});document.getElementById("themeToggle").addEventListener("click",()=>{const e=document.documentElement,r=(e.getAttribute("data-theme")||"light")==="dark"?"light":"dark";e.classList.remove("dark","light"),e.classList.add(r),e.setAttribute("data-theme",r),localStorage.setItem("theme",r),document.getElementById("themeToggle").textContent=r==="dark"?"☀️":"🌙"});S();F();document.getElementById("hamburgerBtn").addEventListener("click",()=>{document.querySelector(".navbar-links").classList.toggle("active")});const b=document.getElementById("loginBtn"),E=document.getElementById("logoutBtn"),B=document.getElementById("balanceBadge"),L=document.getElementById("currentBalance"),h=document.getElementById("transactionHistory");let v=null,u="all";async function p(e,t="all"){const{data:r,error:i}=await c.from("user_transactions").select("*").eq("user_id",e).order("created_at",{ascending:!1});if(h.querySelectorAll(".transaction-item").forEach(n=>n.remove()),r&&r.length){let n=r;if(t!=="all")switch(t){case"deposits":n=r.filter(a=>a.transaction_type==="topup");break;case"purchases":n=r.filter(a=>a.transaction_type==="purchase");break;case"sales":n=r.filter(a=>a.transaction_type==="sale");break}if(n.forEach(a=>{const s=document.createElement("div");s.className="transaction-item",s.style.cssText=`
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid var(--border);
        transition: background-color 0.2s;
        border-radius: 8px;
      `,s.onmouseover=()=>{const g=document.documentElement.getAttribute("data-theme")==="dark";s.style.backgroundColor=g?"rgba(255, 255, 255, 0.05)":"var(--secondary)"},s.onmouseout=()=>s.style.backgroundColor="transparent";const l=g=>{switch(g){case"topup":return"💰";case"purchase":return"🛒";case"sale":return"💸";case"fee":return"📝";case"refund":return"↩️";case"withdraw":return"💳";default:return"💳"}},T=g=>{switch(g){case"topup":return"#10b981";case"sale":return"#10b981";case"refund":return"#10b981";case"purchase":case"fee":case"withdraw":return"#ef4444";default:return"#6b7280"}},$=g=>{const d=g.description||"";if(d.toLowerCase().includes("top-up")||d.toLowerCase().includes("topup"))return o.t("transaction_topup");if(d.toLowerCase().includes("withdrawal")||d.toLowerCase().includes("withdraw"))return o.t("transaction_withdraw");if(d.toLowerCase().includes("listing fee")){const f=d.match(/listing fee for (.+)/i);return f?`${o.t("transaction_listing_fee")}: ${f[1]}`:o.t("transaction_listing_fee")}else if(d.toLowerCase().includes("purchase")){const f=d.match(/purchase[:\s]+(.+)/i);return f?`${o.t("transaction_purchase")}: ${f[1]}`:o.t("transaction_purchase")}else if(d.toLowerCase().includes("sale")){const f=d.match(/sale[:\s]+(.+)/i);return f?`${o.t("transaction_sale")}: ${f[1]}`:o.t("transaction_sale")}else if(d.toLowerCase().includes("refund"))return o.t("transaction_refund");return d||g.transaction_type.replace("_"," ")},I=Math.abs(parseFloat(a.amount||0)),C=["topup","sale","refund"].includes(a.transaction_type);s.innerHTML=`
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div style="font-size: 1.25rem;">${l(a.transaction_type)}</div>
          <div>
            <div style="font-weight: 500; color: var(--fg);">${$(a)}</div>
            <div style="font-size: 0.875rem; color: var(--muted);">${new Date(a.created_at).toLocaleDateString()}</div>
          </div>
        </div>
        <div style="font-weight: 600; color: ${T(a.transaction_type)};">
          ${C?"+":"-"}€${I.toFixed(2)}
        </div>
      `,h.appendChild(s)}),n.length===0){const a=document.createElement("div");a.style.cssText="text-align: center; padding: 2rem; color: var(--muted);",a.innerHTML=`<div style="font-size: 2rem; margin-bottom: 1rem;">📭</div>${o.t("no_filter_transactions").replace("{filter}",t)}`,h.appendChild(a)}}else{const n=document.createElement("div");n.style.cssText="text-align: center; padding: 2rem; color: var(--muted);",n.innerHTML=`<div style="font-size: 2rem; margin-bottom: 1rem;">📭</div>${o.t("no_transactions_found")}`,h.appendChild(n)}}async function _(){const{data:{user:e}}=await c.auth.getUser();if(e){v=e.id,b.style.display="none",E.style.display="flex";const{data:t,error:r}=await c.from("users").select("balance, role").eq("id",e.id).maybeSingle();if(r&&console.warn("Error fetching user balance:",r),t){const i=parseFloat(t.balance||0);if(B.querySelector("span").innerText=`€${i.toFixed(2)}`,L.innerText=`€${i.toFixed(2)}`,t.role==="admin"){const y=document.getElementById("adminBtn");y&&(y.style.display="flex")}}else B.querySelector("span").innerText="€0.00",L.innerText="€0.00";p(e.id,u),x(e.id)}else b.style.display="flex",E.style.display="none",window.location.href="login.html"}b.addEventListener("click",async()=>{window.location.href="login.html"});E.addEventListener("click",async()=>{await c.auth.signOut(),window.location.href="index.html"});const A=document.querySelector(".add-funds"),z=A?.querySelector("div");let m=document.getElementById("withdrawBtn");m||(m=document.createElement("button"),m.id="withdrawBtn",m.className="btn-hero-secondary",m.style.cssText="margin-left:0.5rem;padding:0.75rem 1rem;border-radius:8px; background:#ef4444;color:white;border:none; cursor:pointer;",m.textContent="Withdraw",z?.appendChild(m));const k=document.getElementById("addFundsBtn");k&&k.addEventListener("click",async()=>{const e=parseFloat(document.getElementById("fundAmount").value);if(isNaN(e)||e<=0)return alert(o.t("enter_valid_amount"));const{data:{user:t}}=await c.auth.getUser();if(!t)return alert(o.t("loginFirst"));try{const{data:r,error:i}=await c.rpc("rpc_topup",{amount:e});if(i)throw i;await _(),document.getElementById("fundAmount").value="",alert(o.t("deposit_success"))}catch(r){console.error("Error adding funds:",r),alert("Failed to add funds: "+(r.message||r))}});m&&m.addEventListener("click",async()=>{const e=parseFloat(document.getElementById("fundAmount").value);if(isNaN(e)||e<=0)return alert(o.t("enter_valid_amount"));const{data:{user:t}}=await c.auth.getUser();if(!t)return alert(o.t("loginFirst"));try{const{data:r,error:i}=await c.rpc("rpc_withdraw",{amount:e});if(i)throw i;await _(),document.getElementById("fundAmount").value="",alert(o.t("withdrawal_success"))}catch(r){console.error("Error withdrawing funds:",r),alert("Failed to withdraw: "+(r.message||r))}});async function x(e){try{const{data:t,error:r}=await c.from("products").select("*").eq("seller_id",e).order("created_at",{ascending:!1}),i=document.getElementById("myListingsContainer");if(r){console.error("Error loading user products:",r),i.innerHTML=`
        <div style="text-align: center; padding: 2rem; color: var(--muted);">
          <div style="font-size: 2rem; margin-bottom: 1rem;">❌</div>
          <div style="color: #ef4444;">Failed to load listings.</div>
        </div>
      `;return}if(i.innerHTML="",!t||t.length===0){i.innerHTML=`
        <div style="text-align: center; padding: 2rem; color: var(--muted);">
          <div style="font-size: 2rem; margin-bottom: 1rem;">📦</div>
          <div data-i18n="no_listings">${o.t("no_listings")}</div>
        </div>
      `;return}const y=document.createElement("div");y.style.cssText="display: grid; grid-template-columns: 2fr 1fr 1fr 200px; gap: 1rem; padding: 1rem; border-bottom: 2px solid var(--border); font-weight: 600; color: var(--fg); font-size: 0.875rem;",y.innerHTML=`
      <div>Product</div>
      <div>Price</div>
      <div>Stock</div>
      <div>Actions</div>
    `,i.appendChild(y),t.forEach(n=>{const a=document.createElement("div");a.style.cssText="display: grid; grid-template-columns: 2fr 1fr 1fr 200px; gap: 1rem; align-items: center; padding: 1rem; border-bottom: 1px solid var(--border); transition: background-color 0.2s;",a.onmouseover=()=>{const l=document.documentElement.getAttribute("data-theme")==="dark";a.style.backgroundColor=l?"rgba(255, 255, 255, 0.05)":"var(--secondary)"},a.onmouseout=()=>a.style.backgroundColor="transparent";const s={new:"✨",like_new:"🔄",good:"👍",fair:"😐",poor:"⚠️"};a.innerHTML=`
        <div>
          <div style="font-weight: 600; color: var(--fg); margin-bottom: 0.25rem;">${q(n.name)}</div>
          <div style="font-size: 0.875rem; color: var(--muted);">
            ${n.category?`📦 ${n.category}`:""} 
            ${n.condition?`• ${s[n.condition]||""} ${n.condition.replace("_"," ")}`:""}
          </div>
          <div style="font-size: 0.75rem; color: var(--muted); margin-top: 0.25rem;">
            ${n.created_at?`Created: ${new Date(n.created_at).toLocaleDateString()}`:""}
          </div>
        </div>
        <div style="font-weight: 600; color: var(--fg);">€${parseFloat(n.price||0).toFixed(2)}</div>
        <div style="color: var(--fg);">
          ${parseInt(n.stock||0)>0?`<span style="color: #10b981;">✓ ${n.stock}</span>`:'<span style="color: #ef4444;">✗ 0</span>'}
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button data-id="${n.id}" class="editListingBtn" style="flex: 1; padding: 0.5rem 1rem; background: var(--primary); color: white; border: none; border-radius: 6px; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: var(--transition);">
            ✏️ ${o.t("edit_listing")}
          </button>
          <button data-id="${n.id}" class="deleteListingBtn" style="flex: 1; padding: 0.5rem 1rem; background: #ef4444; color: white; border: none; border-radius: 6px; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: var(--transition);">
            🗑️ ${o.t("delete_listing")}
          </button>
        </div>
      `,i.appendChild(a)}),i.querySelectorAll(".deleteListingBtn").forEach(n=>{n.onclick=async a=>{a.stopPropagation();const s=a.target.getAttribute("data-id");if(confirm(o.t("delete_listing_confirm"))){n.textContent="⏳...",n.disabled=!0;try{const{error:l}=await c.from("products").delete().eq("id",s);if(l)throw l;alert(o.t("listing_deleted")),x(e)}catch(l){console.error("Error deleting listing",l),alert(o.t("failed_to_delete")+": "+(l.message||l)),n.textContent=`🗑️ ${o.t("delete_listing")}`,n.disabled=!1}}}}),i.querySelectorAll(".editListingBtn").forEach(n=>{n.onclick=a=>{a.stopPropagation();const s=a.target.getAttribute("data-id");window.location.href=`sell.html?edit=${s}`}})}catch(t){console.error("Error loading user products",t);const r=document.getElementById("myListingsContainer");r&&(r.innerHTML=`
        <div style="text-align: center; padding: 2rem; color: var(--muted);">
          <div style="font-size: 2rem; margin-bottom: 1rem;">❌</div>
          <div style="color: #ef4444;">Failed to load listings: ${t.message}</div>
        </div>
      `)}}function q(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}document.getElementById("filterAll").addEventListener("click",()=>{w("filterAll"),u="all",p(v,u)});document.getElementById("filterDeposits").addEventListener("click",()=>{w("filterDeposits"),u="deposits",p(v,u)});document.getElementById("filterPurchases").addEventListener("click",()=>{w("filterPurchases"),u="purchases",p(v,u)});document.getElementById("filterSales").addEventListener("click",()=>{w("filterSales"),u="sales",p(v,u)});function w(e){document.querySelectorAll(".filter-btn").forEach(t=>{t.classList.remove("active"),t.style.background="var(--card-bg)",t.style.color="var(--fg)",t.style.border="1px solid var(--border)"}),document.getElementById(e).classList.add("active"),document.getElementById(e).style.background="var(--primary)",document.getElementById(e).style.color="white",document.getElementById(e).style.border="1px solid var(--primary)"}_();
