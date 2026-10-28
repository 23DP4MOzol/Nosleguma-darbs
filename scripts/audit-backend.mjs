// Read-only backend contract checks. Never prints credentials or user records.
import { loadEnv } from 'vite';
const env = loadEnv('development', process.cwd(), 'VITE_');
const headers = { apikey: env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}` };
for (const endpoint of ['/auth/v1/settings', '/rest/v1/']) {
  const response = await fetch(env.VITE_SUPABASE_URL + endpoint, { headers, signal: AbortSignal.timeout(15000) });
  const body = await response.json();
  if (endpoint.includes('settings')) console.log(JSON.stringify({ endpoint, status: response.status, settings: body }));
  else {
    console.log(JSON.stringify({ endpoint, status: response.status, paths: Object.keys(body.paths || {}) }));
    for (const table of ['users', 'products', 'orders', 'messages', 'conversations', 'chat_messages', 'chat_sessions', 'support_tickets', 'user_transactions']) {
      const schema = body.definitions?.[table];
      console.log(JSON.stringify({ table, columns: Object.keys(schema?.properties || {}), required: schema?.required }));
    }
    for (const [path, methods] of Object.entries(body.paths || {})) {
      if (path.startsWith('/rpc/')) console.log(JSON.stringify({ rpc: path, parameters: methods.post?.parameters }));
    }
  }
}
for (const table of ['products', 'users', 'orders', 'favorites', 'reviews', 'shipping_rates', 'parcel_lockers', 'platform_settings', 'conversations', 'messages', 'support_tickets', 'chat_sessions', 'chat_messages', 'audit_logs', 'user_transactions', 'product_views', 'escrow']) {
  const response = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/${table}?select=*&limit=0`, { headers, signal: AbortSignal.timeout(10000) });
  const body = await response.json();
  console.log(JSON.stringify({ table, status: response.status, ...(response.ok ? {} : { code: body.code, message: body.message }) }));
}
for (const [table, fields] of Object.entries({ users: 'email,balance,role', orders: 'buyer_id,shipping_address', messages: 'content', user_transactions: 'amount', support_tickets: 'description' })) {
  const response = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/${table}?select=${fields}&limit=1`, { headers, signal: AbortSignal.timeout(10000) });
  const body = await response.json();
  console.log(JSON.stringify({ anonymousVisibility: table, status: response.status, visibleRows: Array.isArray(body) ? body.length : null, populatedFields: Array.isArray(body) && body[0] ? Object.keys(body[0]).filter(key => body[0][key] != null) : [] }));
}
