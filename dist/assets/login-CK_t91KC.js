import{l as a}from"./navbar-Au8OVFrc.js";import"./main-yX_z8rBf.js";(function(){const t=new URLSearchParams(window.location.search),e=t.get("reason");if(t.get("redirect"),e){const s={chat:"You must be logged in to access the chat feature.",settings:"You must be logged in to access your settings.",products:"You must be logged in to view your products."}[e]||"You must be logged in to access this page.";setTimeout(()=>{alert("🔐 "+s)},100)}})();function n(o,t){const e=t?.message||t||"Unknown error";console.error("Login Error:",e),e.includes("Invalid API key")?alert(`❌ Invalid API Key

Your Supabase credentials are incorrect.

Please check your .env file has the correct:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

See .env.example for the correct format.`):e.includes("auth")?alert("🔐 Authentication Error: "+e):alert(o+": "+e)}document.getElementById("loginForm").addEventListener("submit",async o=>{o.preventDefault();const t=document.getElementById("emailInput").value.trim(),e=document.getElementById("passwordInput").value;if(!t||!e){alert("Please fill in all fields");return}try{const r=await a(t,e);if(r.error){n("Login failed",r.error);return}window.location.href="index.html"}catch(r){n("Login failed",r)}});
