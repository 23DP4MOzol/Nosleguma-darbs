// Read-only backend contract checks. Never prints credentials or user records.
import { loadEnv } from 'vite';
const env = loadEnv('development', process.cwd(), 'VITE_');
const headers = { apikey: env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}` };
for (const endpoint of ['/auth/v1/settings', '/rest/v1/']) {
  const response = await fetch(env.VITE_SUPABASE_URL + endpoint, { headers, signal: AbortSignal.timeout(15000) });
  const body = await response.json();
  if (endpoint.includes('settings')) console.log(JSON.stringify({ endpoint, status: response.status, settings: body }));
  else if (response.ok) {
    console.log(JSON.stringify({ endpoint, status: response.status, paths: Object.keys(body.paths || {}) }));
    for (const table of ['users', 'products', 'orders', 'messages', 'conversations', 'chat_messages', 'chat_sessions', 'support_tickets', 'user_transactions']) {
      const schema = body.definitions?.[table];
      console.log(JSON.stringify({ table, columns: Object.keys(schema?.properties || {}), required: schema?.required }));
    }
    for (const [path, methods] of Object.entries(body.paths || {})) {
      if (path.startsWith('/rpc/')) console.log(JSON.stringify({ rpc: path, parameters: methods.post?.parameters }));
    }
  }
  if (!response.ok) console.log(JSON.stringify({ endpoint, status: response.status, code: body.code, message: body.message }));
}
for (const table of ['products', 'users', 'orders', 'favorites', 'reviews', 'shipping_rates', 'parcel_lockers', 'platform_settings', 'conversations', 'messages', 'support_tickets', 'chat_sessions', 'chat_messages', 'audit_logs', 'user_transactions', 'product_views']) {
  const response = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/${table}?select=*&limit=0`, { headers, signal: AbortSignal.timeout(10000) });
  const body = await response.json();
  console.log(JSON.stringify({ table, status: response.status, ...(response.ok ? {} : { code: body.code, message: body.message }) }));
}
for (const [table, fields] of Object.entries({ users: 'email,balance,role', orders: 'buyer_id,shipping_address', messages: 'content', user_transactions: 'amount', support_tickets: 'description' })) {
  const response = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/${table}?select=${fields}&limit=1`, { headers, signal: AbortSignal.timeout(10000) });
  const body = await response.json();
  console.log(JSON.stringify({ anonymousVisibility: table, status: response.status, visibleRows: Array.isArray(body) ? body.length : null, populatedFields: Array.isArray(body) && body[0] ? Object.keys(body[0]).filter(key => body[0][key] != null) : [], ...(response.ok ? {} : { code: body.code, message: body.message }) }));
}
const expectedColumns = {
  users: 'id,email,username,balance,role,avatar_url,bio,what_i_sell,notification_preferences,notify_orders,notify_reviews,notify_comments,created_at,updated_at',
  products: 'id,seller_id,name,description,price,category,condition,location,image_url,stock,listing_fee,valid_until,reserve_fee,is_reserved,reserved_by,weight_kg,seller_street,seller_city,seller_postal_code,brand,color,original_price,sold_at,status,views_count,created_at,updated_at',
  orders: 'id,product_id,buyer_id,seller_id,delivery_method,order_status,status,unit_price,quantity,buyer_notes,order_number,meetup_location,meetup_date,shipping_cost,total_amount,shipping_carrier,shipping_service,recipient_name,recipient_phone,package_weight_kg,parcel_locker_id,parcel_locker_address,shipping_address,shipping_city,shipping_postal_code,shipping_country,payment_status,escrow_amount,escrow_released,paid_at,tracking_number,meetup_confirmed_by_buyer,meetup_confirmed_by_seller,escrow_released_at,completed_at,cancelled_at,created_at,updated_at',
  support_tickets: 'id,user_id,issue_type,title,description,priority,status,assigned_admin_id,created_at,updated_at',
  messages: 'id,conversation_id,sender_id,content,is_read,attachment_url,attachment_name,attachment_type,created_at',
  chat_messages: 'id,session_id,sender_id,content,is_read,attachment_url,attachment_name,attachment_type,created_at'
};
for (const [table, fields] of Object.entries(expectedColumns)) {
  let columns = fields.split(',');
  const missing = [];
  for (let attempt = 0; attempt < fields.split(',').length; attempt++) {
    const response = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/${table}?select=${columns.join(',')}&limit=0`, { headers, signal: AbortSignal.timeout(10000) });
    const body = await response.json();
    if (response.ok) break;
    const column = body.message?.match(/column (?:\w+\.)?(\w+) does not exist/)?.[1];
    if (!column || !columns.includes(column)) { missing.push({ code: body.code, message: body.message }); break; }
    missing.push(column);
    columns = columns.filter(value => value !== column);
  }
  console.log(JSON.stringify({ contract: table, missingColumns: missing }));
}
