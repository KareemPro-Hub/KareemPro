// Explicit, one-off maintenance. Never charges, refunds, or edits order amounts.
import { createClient } from '@supabase/supabase-js';
export async function expireLegacySessions({ db, provider }) {
  const { data: projects, error } = await db.from('projects').select('id,package_name,stages(id,amount,status)').eq('package_price', 500);
  if (error) throw Error('Project lookup failed');
  let verified = 0;
  for (const project of projects || []) {
    if (!/TechFixer|تيك فيكسر/i.test(project.package_name) || !/الاحترافية|محتوى|مقال/.test(project.package_name)) continue;
    const stages = project.stages || [];
    if (stages.length !== 2 || stages.some(s => Number(s.amount) !== 250 || !['upcoming', 'awaiting_payment'].includes(s.status))) throw Error('Project requires manual reconciliation');
    const { data: orders, error: orderError } = await db.from('xpay_orders').select('session_id,amount_sar,amount_egp_minor,livemode').in('stage_id', stages.map(s => s.id)).eq('status', 'pending');
    if (orderError) throw Error('Order lookup failed');
    for (const order of orders || []) {
      if (!order.session_id) continue;
      let session = await provider(order.session_id);
      if (session.currency !== 'EGP' || session.amountTotal !== Number(order.amount_egp_minor) || session.livemode !== order.livemode || session.paymentStatus === 'paid') throw Error('Payment requires reconciliation');
      if (session.status === 'open' && !session.isExpired) {
        await provider(order.session_id, true);
        session = await provider(order.session_id);
      }
      if (session.paymentStatus === 'paid' || !(session.status === 'expired' || session.isExpired === true)) throw Error('Session remains payable');
      verified++;
    }
  }
  return verified;
}
if (process.env.KP_TECHFIXER_PRICE_FIX === '1' && process.env.VERCEL_ENV === 'production') {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const provider = async (id, expire = false) => {
    if (!/^cs_(live|test)_[A-Za-z0-9]+$/.test(id)) throw Error('Invalid session');
    const key = id.startsWith('cs_test_') ? process.env.XPAY_TEST_SECRET_KEY : process.env.XPAY_SECRET_KEY;
    const response = await fetch('https://api.xpay.app/checkout/sessions/' + id + (expire ? '/expire' : ''), { method: expire ? 'POST' : 'GET', headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' }, ...(expire ? { body: '{}' } : {}), signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw Error('Provider operation failed: ' + response.status);
    return response.json();
  };
  console.log('Legacy TechFixer unpaid sessions confirmed expired:', await expireLegacySessions({ db, provider }));
}
