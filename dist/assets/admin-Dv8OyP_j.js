import{s as n}from"./navbar-Au8OVFrc.js";import"./main-yX_z8rBf.js";let g=null;async function h(){const{data:{user:e}}=await n.auth.getUser();if(!e)return window.location.href="login.html?redirect="+encodeURIComponent(window.location.href)+"&reason=admin",!1;const{data:a}=await n.from("users").select("role").eq("id",e.id).single();return!a||a.role!=="admin"?(alert("Access denied. Admin privileges required."),window.location.href="index.html",!1):e}function w(e){document.querySelectorAll(".admin-nav-btn").forEach(a=>{a.classList.remove("active"),a.dataset.tab===e&&a.classList.add("active")}),document.querySelectorAll(".admin-section").forEach(a=>{a.style.display="none"}),document.getElementById(`section-${e}`).style.display="block",$(e)}async function $(e){switch(e){case"dashboard":await m();break;case"users":await l();break;case"products":await y();break;case"transactions":await T();break;case"orders":await B();break;case"chats":await M();break;case"tickets":await v();break;case"analytics":await A();break;case"settings":await U();break}}async function m(){try{const{count:e}=await n.from("users").select("*",{count:"exact",head:!0}),{count:a}=await n.from("products").select("*",{count:"exact",head:!0}),t=new Date().toISOString().split("T")[0],{data:s}=await n.from("user_transactions").select("amount").gte("created_at",t),o=s?.reduce((u,c)=>u+(c.amount>0?c.amount:0),0)||0,{data:r}=await n.from("user_transactions").select("amount"),i=r?.reduce((u,c)=>u+(c.amount>0?c.amount:0),0)||0,{count:b}=await n.from("orders").select("*",{count:"exact",head:!0}),{count:f}=await n.from("support_tickets").select("*",{count:"exact",head:!0}).eq("status","open");document.getElementById("dash-total-users").textContent=e||0,document.getElementById("dash-total-products").textContent=a||0,document.getElementById("dash-today-revenue").textContent=`€${o.toFixed(2)}`,document.getElementById("dash-total-revenue").textContent=`€${i.toFixed(2)}`,document.getElementById("dash-total-orders").textContent=b||0,document.getElementById("dash-open-tickets").textContent=f||0,await E()}catch(e){console.error("Error loading dashboard:",e)}}async function E(){try{const{data:e}=await n.from("user_transactions").select("*, users!user_id(username, email)").order("created_at",{ascending:!1}).limit(15),a=document.getElementById("dash-activities");if(!e?.length){a.innerHTML='<tr><td colspan="4" style="text-align:center;">No recent activities</td></tr>';return}a.innerHTML=e.map(t=>`
      <tr>
        <td>${t.users?.username||t.users?.email||"Unknown"}</td>
        <td><span class="badge badge-${t.transaction_type}">${t.transaction_type}</span></td>
        <td>${d(t.created_at)}</td>
        <td class="${t.amount>=0?"text-success":"text-danger"}">€${Math.abs(t.amount).toFixed(2)}</td>
      </tr>
    `).join("")}catch(e){console.error("Error loading activities:",e)}}async function l(){await k()}async function k(){const e=document.getElementById("user-search")?.value||"",a=document.getElementById("user-role")?.value||"all";let t=n.from("users").select("*");e&&(t=t.or(`email.ilike.%${e}%,username.ilike.%${e}%`)),a!=="all"&&(t=t.eq("role",a));const{data:s,error:o}=await t.order("created_at",{ascending:!1}).limit(100);if(o){console.error("Error searching users:",o);return}_(s||[])}function _(e){const a=document.getElementById("users-table-body");if(!e.length){a.innerHTML='<tr><td colspan="7" style="text-align:center;">No users found</td></tr>';return}a.innerHTML=e.map(t=>`
    <tr>
      <td>${t.username||"N/A"}</td>
      <td>${t.email}</td>
      <td><span class="badge badge-${t.role}">${t.role}</span></td>
      <td>€${parseFloat(t.balance||0).toFixed(2)}</td>
      <td>${d(t.created_at)}</td>
      <td>${t.role==="admin"?'<span class="badge badge-admin">Admin</span>':'<span class="badge badge-user">User</span>'}</td>
      <td>
        <button class="btn btn-sm" onclick="viewUserDetails('${t.id}')">View</button>
        <button class="btn btn-sm btn-warning" onclick="editUser('${t.id}', '${t.balance}')">Edit</button>
        ${t.role!=="admin"?`<button class="btn btn-sm btn-danger" onclick="deleteUser('${t.id}')">Delete</button>`:""}
      </td>
    </tr>
  `).join("")}window.switchUserTab=function(e){document.querySelectorAll("#userDetailContent .tab-btn").forEach(a=>a.classList.remove("active")),document.querySelectorAll("#userDetailContent .tab-content").forEach(a=>a.classList.remove("active")),document.querySelector(`[data-tab="${e}"]`)?.classList.add("active"),document.getElementById(e)?.classList.add("active")};window.deleteUser=async function(e){if(confirm("Are you sure you want to DELETE this user? This cannot be undone!"))try{const{error:a}=await n.from("users").delete().eq("id",e);if(a)throw a;alert("User deleted successfully"),document.getElementById("userDetailModal").style.display="none",await l()}catch(a){alert("Error deleting user: "+a.message)}};window.editUser=async function(e,a){const t=prompt("Enter new balance for user:",a);if(t!==null)try{const{error:s}=await n.from("users").update({balance:parseFloat(t),updated_at:new Date().toISOString()}).eq("id",e);if(s)throw s;alert("Balance updated successfully"),await l()}catch(s){alert("Error updating balance: "+s.message)}};async function y(){const e=document.getElementById("product-search")?.value||"";let a=n.from("products").select("*, users!seller_id(username, email)");e&&(a=a.ilike("name",`%${e}%`));const{data:t,error:s}=await a.order("created_at",{ascending:!1}).limit(100);if(s){console.error("Error loading products:",s);return}x(t||[])}function x(e){const a=document.getElementById("products-table-body");if(!e.length){a.innerHTML='<tr><td colspan="8" style="text-align:center;">No products found</td></tr>';return}a.innerHTML=e.map(t=>`
    <tr>
      <td><img src="${t.image_url||"https://via.placeholder.com/50"}" style="width:50px;height:50px;object-fit:cover;border-radius:4px;"></td>
      <td>${t.name}</td>
      <td>${t.users?.username||"Unknown"}</td>
      <td>€${parseFloat(t.price).toFixed(2)}</td>
      <td>${t.stock}</td>
      <td>${t.condition||"N/A"}</td>
      <td>${d(t.created_at)}</td>
      <td>
        <button class="btn btn-sm btn-danger" onclick="deleteProduct('${t.id}')">Delete</button>
      </td>
    </tr>
  `).join("")}window.deleteProduct=async function(e){if(!confirm("Delete this product?"))return;const{error:a}=await n.from("products").delete().eq("id",e);if(a){alert("Error: "+a.message);return}await y()};async function T(){const e=document.getElementById("tx-type")?.value||"all";let a=n.from("user_transactions").select("*, users!user_id(username, email)");e!=="all"&&(a=a.eq("transaction_type",e));const{data:t,error:s}=await a.order("created_at",{ascending:!1}).limit(200);if(s){console.error("Error loading transactions:",s);return}I(t||[])}function I(e){const a=document.getElementById("transactions-table-body");if(!e.length){a.innerHTML='<tr><td colspan="6" style="text-align:center;">No transactions found</td></tr>';return}a.innerHTML=e.map(t=>`
    <tr>
      <td>${d(t.created_at)}</td>
      <td>${t.users?.username||"Unknown"}</td>
      <td><span class="badge badge-${t.transaction_type}">${t.transaction_type}</span></td>
      <td>${t.description||"-"}</td>
      <td class="${t.amount>=0?"text-success":"text-danger"}">€${Math.abs(t.amount).toFixed(2)}</td>
    </tr>
  `).join("")}async function B(){const{data:e,error:a}=await n.from("orders").select("*").order("created_at",{ascending:!1}).limit(200);if(a){console.error("Error loading orders:",a);return}L(e||[])}function L(e){const a=document.getElementById("orders-table-body");if(!e.length){a.innerHTML='<tr><td colspan="6" style="text-align:center;">No orders found</td></tr>';return}a.innerHTML=e.map(t=>`
    <tr>
      <td>${t.id.slice(0,8)}...</td>
      <td>€${parseFloat(t.total||0).toFixed(2)}</td>
      <td><span class="badge badge-${t.status}">${t.status}</span></td>
      <td>${t.shipping_address||"-"}</td>
      <td>${d(t.created_at)}</td>
    </tr>
  `).join("")}async function M(){try{const{data:e,error:a}=await n.from("conversations").select(`
        *,
        buyer:users!buyer_id(username, email),
        seller:users!seller_id(username, email),
        product:products(name, price)
      `).order("last_message_at",{ascending:!1}).limit(100);if(a)throw a;D(e||[])}catch(e){console.error("Error loading conversations:",e),document.getElementById("chats-content").innerHTML="<p>Error loading conversations</p>"}}function D(e){const a=document.getElementById("chats-content");if(!e.length){a.innerHTML='<p style="text-align:center;">No conversations found</p>';return}a.innerHTML=`
    <div class="admin-conversations-list">
      ${e.map(t=>`
        <div class="conversation-item">
          <div class="conversation-users">
            <span>${t.buyer?.username||"Buyer"}</span> ↔ <span>${t.seller?.username||"Seller"}</span>
          </div>
          <div class="conversation-product">📦 ${t.product?.name||"No product"}</div>
          <div class="conversation-preview">${t.last_message||"No messages"}</div>
          <div class="conversation-time">${d(t.last_message_at)}</div>
          <span class="badge badge-${t.status}">${t.status}</span>
          <button class="btn btn-sm" onclick="viewConversation('${t.id}')">View</button>
        </div>
      `).join("")}
    </div>
  `}window.viewConversation=async function(e){try{const{data:a}=await n.from("messages").select("*, sender:users!sender_id(username)").eq("conversation_id",e).order("created_at",{ascending:!0});if(!a?.length){alert("No messages in this conversation");return}const t=a.map(s=>`
      <div style="margin-bottom:0.5rem;">
        <strong>${s.sender?.username}:</strong> ${s.content}
        <span style="color:var(--muted);font-size:0.75rem;">(${d(s.created_at)})</span>
      </div>
    `).join("");alert(`Conversation Messages:

${t}`)}catch(a){alert("Error loading messages: "+a.message)}};async function v(){try{const{data:e,error:a}=await n.from("support_tickets").select("*, user:users!user_id(username, email)").order("created_at",{ascending:!1}).limit(100);if(a)throw a;S(e||[])}catch(e){console.error("Error loading tickets:",e),document.getElementById("tickets-content").innerHTML="<p>Error loading tickets</p>"}}function S(e){const a=document.getElementById("tickets-content");if(!e.length){a.innerHTML='<p style="text-align:center;">No support tickets</p>';return}a.innerHTML=`
    <table class="admin-table">
      <thead>
        <tr><th>User</th><th>Title</th><th>Priority</th><th>Status</th><th>Date</th><th>Action</th></tr>
      </thead>
      <tbody>
        ${e.map(t=>`
          <tr>
            <td>${t.user?.username||"Unknown"}</td>
            <td>${t.title||"-"}</td>
            <td><span class="badge badge-${t.priority}">${t.priority}</span></td>
            <td><span class="badge badge-${t.status}">${t.status}</span></td>
            <td>${d(t.created_at)}</td>
            <td>
              <button class="btn btn-sm" onclick="viewTicket('${t.id}')">View</button>
              ${t.status==="open"?`<button class="btn btn-sm btn-success" onclick="resolveTicket('${t.id}')">Resolve</button>`:""}
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `}window.viewTicket=function(e){alert("Ticket detail view coming soon")};window.resolveTicket=async function(e){try{const{error:a}=await n.from("support_tickets").update({status:"resolved",resolved_at:new Date().toISOString()}).eq("id",e);if(a)throw a;await v()}catch(a){alert("Error resolving ticket: "+a.message)}};async function A(){try{const{data:e}=await n.from("user_transactions").select("created_at, amount").gte("created_at",new Date(Date.now()-31536e6).toISOString()),a={};e?.forEach(r=>{if(r.amount>0){const i=r.created_at.slice(0,7);a[i]=(a[i]||0)+r.amount}});const{count:t}=await n.from("users").select("*",{count:"exact",head:!0}),{count:s}=await n.from("products").select("*",{count:"exact",head:!0}),{count:o}=await n.from("orders").select("*",{count:"exact",head:!0});document.getElementById("analytics-content").innerHTML=`
      <div class="analytics-grid">
        <div class="analytics-card">
          <h3>💰 Revenue by Month</h3>
          <div class="chart-placeholder">
            ${Object.entries(a).slice(-12).map(([r,i])=>`
              <div class="chart-bar">
                <div class="bar-value">€${i.toFixed(0)}</div>
                <div class="bar-label">${r}</div>
              </div>
            `).join("")||"<p>No revenue data</p>"}
          </div>
        </div>
        
        <div class="analytics-card">
          <h3>📈 Platform Stats</h3>
          <div class="admin-stats-grid">
            <div class="stat-box">
              <div class="stat-value">${t}</div>
              <div class="stat-label">Total Users</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${s}</div>
              <div class="stat-label">Total Products</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${o}</div>
              <div class="stat-label">Total Orders</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">€${Object.values(a).reduce((r,i)=>r+i,0).toFixed(2)}</div>
              <div class="stat-label">Total Revenue</div>
            </div>
          </div>
        </div>
      </div>
    `}catch(e){console.error("Error loading analytics:",e),document.getElementById("analytics-content").innerHTML="<p>Error loading analytics</p>"}}async function U(){document.getElementById("site-settings-form").innerHTML=`
    <h3>⚙️ Platform Settings</h3>
    <p style="color:var(--muted);">Settings are managed through Supabase database. Future enhancement: Add platform_settings table.</p>
    
    <h3 style="margin-top:2rem;">🗄️ Database Stats</h3>
    <button class="btn btn-primary" onclick="refreshStats()">Refresh All Stats</button>
    
    <h3 style="margin-top:2rem;">🔧 Quick Actions</h3>
    <div class="settings-section">
      <button class="btn btn-warning" onclick="clearOldData()">Archive Old Data</button>
    </div>
  `}window.refreshStats=function(){m(),alert("Stats refreshed!")};window.clearOldData=function(){alert("Data cleanup feature coming soon")};function d(e){return e?new Date(e).toLocaleString():"N/A"}function p(e,a){let t;return function(...o){const r=()=>{clearTimeout(t),e(...o)};clearTimeout(t),t=setTimeout(r,a)}}async function H(){g=await h(),g&&(document.querySelectorAll(".admin-nav-btn").forEach(e=>{e.addEventListener("click",()=>w(e.dataset.tab))}),document.getElementById("user-search")?.addEventListener("input",p(l,300)),document.getElementById("product-search")?.addEventListener("input",p(y,300)),await m())}document.getElementById("userDetailModalClose")?.addEventListener("click",()=>{document.getElementById("userDetailModal").style.display="none"});document.getElementById("userDetailModalOverlay")?.addEventListener("click",()=>{document.getElementById("userDetailModal").style.display="none"});H();
