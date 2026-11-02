import 'server-only';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { paymentPublicKey, selectedPayment, xpay, confirmSession } from './xpay-server';
import { checkoutPath, checkoutPriceMatches } from './checkout';
import { sessionMatches, sessionExpired, safeCheckoutUrl } from './xpay.mjs';
import { paymentDisplay } from './payment-display';

// A session identifier is a provider checkout link, not an authorization bypass.
// Project payments additionally require the authenticated project owner.
export async function loadPaymentPage(id) {
  if (typeof id !== 'string' || !/^cs_(live|test)_[A-Za-z0-9]+$/.test(id)) return null;
  const db = createAdminClient();
  const { data: order, error } = await db.from('xpay_orders').select('*').eq('session_id', id).maybeSingle();
  if (error) throw Error('Payment lookup unavailable');
  if (!order) return null;
  if (order.client_id) {
    const auth = await createClient();
    const { data: { user } } = await auth.auth.getUser();
    if (!user || user.id !== order.client_id) return null;
  }
  const result = '/checkout/result?session_id=' + encodeURIComponent(id);
  if (order.status === 'paid') return { redirect: result };
  const back = checkoutPath(order);
  if (order.status !== 'pending') return { redirect: back };
  const session = await xpay('/checkout/sessions/' + id);
  if (!sessionMatches(session, order)) throw Error('Payment snapshot mismatch');
  await confirmSession(session, 'reconcile:' + id);
  if (session.paymentStatus === 'paid' || session.status === 'complete') return { redirect: result };
  if (sessionExpired(session)) return { redirect: back };
  if (session.uiMode !== 'custom') return safeCheckoutUrl(session.url) ? { redirect: session.url } : null;
  const publicKey = paymentPublicKey(order.livemode);
  if (!publicKey || typeof session.clientSecret !== 'string' || !session.clientSecret) throw Error('Payment form unavailable');
  const selected = await selectedPayment(order.stage_id ? { stage: order.stage_id } : { service: order.service_id, tier: String(order.tier) });
  if (!selected || !checkoutPriceMatches(selected.pkg, order)) return { redirect: back };
  return { publicKey, clientSecret: session.clientSecret, sessionId: id, back, result, display: paymentDisplay(selected, order) };
}
