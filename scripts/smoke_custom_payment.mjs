// Explicit one-time TEST-only integration fixture. Never submits or charges a card.
import { createClient } from '@supabase/supabase-js';
import { sessionMatches } from '../src/lib/xpay.mjs';
if (process.env.KP_CUSTOM_PAYMENT_SMOKE === '1' && process.env.VERCEL_ENV === 'production') {
  const key = process.env.XPAY_TEST_SECRET_KEY;
  if (!key?.includes('_test_')) throw Error('Test credential required');
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const order = { id: 'b14344b0-7427-43a4-99d1-9d7020261102', service_id: 'payment-check', tier: 0, client_id: null, stage_id: null, title: 'تجربة دفع حقيقية — تجربة الدفع', amount_sar: 10, amount_egp_minor: 15000, exchange_rate: 15, rate_updated_at: new Date().toISOString(), livemode: false };
  const { error } = await db.from('xpay_orders').upsert(order, { onConflict: 'id', ignoreDuplicates: true });
  if (error) throw Error('Test fixture unavailable');
  const response = await fetch('https://api.xpay.app/checkout/sessions', { method: 'POST', headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', 'Idempotency-Key': 'kareempro-custom-smoke-20261102' }, body: JSON.stringify({ mode: 'payment', uiMode: 'custom', currency: 'EGP', locale: 'ar', expiresAfterMinutes: 1440, afterCompletion: { type: 'redirect', redirect: { url: 'https://kareempro.com/checkout/result?session_id={CHECKOUT_SESSION_ID}' } }, lineItems: [{ priceData: { currency: 'EGP', unitAmount: order.amount_egp_minor, productData: { name: order.title } }, quantity: 1 }], metadata: { order_id: order.id }, feeConfig: { feesPassThrough: false, vatCollectionEnabled: false } }), signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw Error('Test session unavailable: ' + response.status);
  const session = await response.json();
  if (!sessionMatches(session, { ...order, session_id: session.id }) || session.uiMode !== 'custom' || !session.clientSecret) throw Error('Invalid test session');
  const { error: saveError } = await db.from('xpay_orders').update({ session_id: session.id, checkout_url: null }).eq('id', order.id).eq('status', 'pending');
  if (saveError) throw Error('Test session not saved');
  console.log('Custom TEST payment fixture ready; no card submitted or money charged.');
}
