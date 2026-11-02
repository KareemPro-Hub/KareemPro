// Explicit maintenance: changes product names only; never price/session amounts.
import { createClient } from '@supabase/supabase-js';
import { hostedPaymentTitle } from '../src/lib/checkout.js';
import { sessionMatches } from '../src/lib/xpay.mjs';
export async function refreshPendingTitles({ db, provider }) {
  const { data: orders, error } = await db.from('xpay_orders').select('id,session_id,title,service_id,amount_sar,amount_egp_minor,livemode').eq('status', 'pending');
  if (error) throw Error('Order lookup failed');
  let updated = 0;
  for (const order of orders || []) {
    if (!order.session_id || order.service_id === 'payment-check-egp') continue;
    const session = await provider('GET', '/checkout/sessions/' + order.session_id, undefined, order.livemode);
    if (!sessionMatches(session, order)) throw Error('Session snapshot mismatch');
    if (session.status !== 'open' || session.paymentStatus === 'paid' || session.isExpired) continue;
    const items = session.lineItems || [];
    if (items.length !== 1 || items[0].quantity !== 1) throw Error('Unexpected product scope');
    const product = items[0].price?.product;
    const id = typeof product === 'object' ? product.id : product || items[0].price?.productId;
    if (typeof id !== 'string' || !/^prod_[A-Za-z0-9]+$/.test(id)) throw Error('Missing product identifier');
    const title = hostedPaymentTitle(order, {});
    await provider('PATCH', '/products/' + id, { name: title }, order.livemode);
    const fresh = await provider('GET', '/checkout/sessions/' + order.session_id, undefined, order.livemode);
    if (!sessionMatches(fresh, order)) throw Error('Session changed during title refresh');
    if (fresh.lineItems?.[0]?.price?.product?.name !== title) throw Error('Title refresh not reflected');
    updated++;
  }
  return updated;
}
if (process.env.KP_REFRESH_PAYMENT_TITLES === '1' && process.env.VERCEL_ENV === 'production') {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const provider = async (method, path, body, live) => {
    const key = live === false ? process.env.XPAY_TEST_SECRET_KEY : process.env.XPAY_SECRET_KEY;
    const response = await fetch('https://api.xpay.app' + path, { method, headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw Error('Provider title update failed: ' + response.status);
    return response.json();
  };
  console.log('Open payment titles refreshed without changing amounts:', await refreshPendingTitles({ db, provider }));
}
