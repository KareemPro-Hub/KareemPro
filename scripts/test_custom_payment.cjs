// Real server modules with isolated provider/database boundaries. No live writes.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const babel = require('next/dist/compiled/babel/bundle.js');
function load(file, mocks = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const code = babel.core().transformSync(source, { presets: [[babel.presetEnv(), { targets: { node: 'current' }, modules: 'commonjs' }]], babelrc: false, configFile: false }).code;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(id => Object.hasOwn(mocks, id) ? mocks[id] : require(id), module, module.exports);
  return module.exports;
}
(async () => {
  const xp = await import('../src/lib/xpay.mjs');
  const display = load('src/lib/payment-display.js');
  const checkout = load('src/lib/checkout.js');
  const selected = { service: { id: 'stage', name: 'تطوير مدونة تيك فيكسر — TechFixer' }, pkg: { name: 'الدفعة الأولى', price: 200 }, packageName: 'الباقة الاحترافية', stageId: '11111111-1111-1111-1111-111111111111', stageNumber: 1, clientId: 'owner' };
  const base = { id: '22222222-2222-2222-2222-222222222222', session_id: 'cs_test_local', stage_id: selected.stageId, client_id: 'owner', service_id: 'stage', tier: null, title: 'مشروع — دفعة', amount_sar: 200, amount_egp_minor: 298457, exchange_rate: 14.92285, rate_updated_at: new Date().toISOString(), livemode: false, status: 'pending' };
  assert.deepEqual(display.paymentDisplay(selected, base), { heading: 'مدونة تيك فيكسر — TechFixer «الباقة الاحترافية»', stage: 'الدفعة الأولى', amountSar: 200, amountEgpMinor: 298457, egyptian: false });
  assert.equal(display.paymentDisplay({ ...selected, stageNumber: 2 }, base).stage, 'الدفعة الثانية');
  assert.equal(display.paymentDisplay({ ...selected, stageId: null, packageName: null, pkg: { name: 'الباقة الأساسية|تفاصيل', currency: 'EGP' } }, base).egyptian, true);
  let order, session, user, providerCalls, changes, selectedNow, publicKey;
  const db = { from() { const q = { select() { return q; }, eq() { return q; }, neq() { return q; }, maybeSingle: async () => ({ data: order }), single: async () => ({ data: order }), upsert(value) { changes++; order ||= { ...value, status: 'pending' }; return q; }, update(value) { changes++; Object.assign(order, value); return q; }, then(resolve) { return Promise.resolve({ error: null }).then(resolve); } }; return q; } };
  const server = {
    paymentPublicKey: () => publicKey, selectedPayment: async () => selectedNow,
    xpay: async (url, options) => { providerCalls.push({ url, options }); return session; },
    confirmSession: async value => { assert(xp.sessionMatches(value, order)); },
    paymentsReady: () => true, customPaymentsReady: () => true,
  };
  const page = load('src/lib/xpay-payment-page.js', { 'server-only': {}, '@/lib/supabase/server': { createAdminClient: () => db, createClient: async () => ({ auth: { getUser: async () => ({ data: { user } }) } }) }, './xpay-server': server, './checkout': checkout, './xpay.mjs': xp, './payment-display': display });
  function reset() {
    order = { ...base }; user = { id: 'owner' }; changes = 0; providerCalls = []; selectedNow = selected; publicKey = 'pk_test_local_only';
    session = { id: base.session_id, uiMode: 'custom', clientSecret: 'test_only_client_secret', metadata: { order_id: base.id }, currency: 'EGP', amountTotal: base.amount_egp_minor, livemode: false, status: 'open', paymentStatus: 'unpaid', isExpired: false };
  }
  reset(); assert.equal(await page.loadPaymentPage('../bad'), null); assert.equal(providerCalls.length, 0);
  for (const id of [null, 'intruder']) { reset(); user = id ? { id } : null; assert.equal(await page.loadPaymentPage(base.session_id), null); assert.equal(providerCalls.length, 0); }
  reset(); const loaded = await page.loadPaymentPage(base.session_id); assert.equal(loaded.display.amountSar, 200); assert.equal(loaded.clientSecret, session.clientSecret); assert.equal(loaded.display.heading, 'مدونة تيك فيكسر — TechFixer «الباقة الاحترافية»'); assert(!JSON.stringify(loaded).includes('owner'));
  for (const change of [{ amountTotal: 1 }, { currency: 'SAR' }, { livemode: true }, { metadata: { order_id: 'wrong' } }]) { reset(); Object.assign(session, change); await assert.rejects(page.loadPaymentPage(base.session_id), /snapshot/); }
  for (const change of [{ status: 'complete' }, { paymentStatus: 'paid' }]) { reset(); Object.assign(session, change); assert.equal((await page.loadPaymentPage(base.session_id)).redirect, '/checkout/result?session_id=cs_test_local'); }
  reset(); session.isExpired = true; assert.equal((await page.loadPaymentPage(base.session_id)).redirect, checkout.checkoutPath(order));
  reset(); publicKey = null; await assert.rejects(page.loadPaymentPage(base.session_id), /unavailable/);
  reset(); selectedNow = { ...selected, pkg: { ...selected.pkg, price: 250 } }; assert.equal((await page.loadPaymentPage(base.session_id)).redirect, checkout.checkoutPath(order));
  reset(); session.uiMode = 'hosted'; session.url = 'https://checkout.xpay.app/c/cs_test_local'; assert.equal((await page.loadPaymentPage(base.session_id)).redirect, session.url);
  reset(); session.uiMode = 'hosted'; session.url = 'https://bad.invalid/'; assert.equal(await page.loadPaymentPage(base.session_id), null);
  // New custom sessions omit hosted-only flags and retain every financial check.
  const api = load('src/app/api/xpay/checkout/route.js', { '@/lib/xpay.mjs': xp, '@/lib/checkout': checkout, '@/lib/xpay-server': server, '@/lib/supabase/server': { createAdminClient: () => db } });
  process.env.XPAY_QUOTE_SECRET = 'test-only-custom-secret';
  const request = () => new Request('https://kareempro.com/api/xpay/checkout', { method: 'POST', headers: { origin: 'https://kareempro.com' }, body: new URLSearchParams({ quote: xp.signQuote(base, process.env.XPAY_QUOTE_SECRET) }) });
  reset(); order = null;
  // The stage lookup preceding an insert must not look like another open order.
  const response = await api.POST(request());
  assert.equal(response.status, 303); assert.equal(response.headers.get('location'), 'https://kareempro.com/checkout/pay?session_id=cs_test_local');
  const body = providerCalls.find(call => call.options?.body)?.options.body;
  assert.equal(body.uiMode, 'custom'); assert.equal(body.currency, 'EGP'); assert.equal(body.lineItems[0].priceData.unitAmount, 298457); assert.equal(body.feeConfig.feesPassThrough, false);
  for (const field of ['nameCollection', 'phoneNumberCollection', 'cancelUrl', 'submitType']) assert(!Object.hasOwn(body, field));
  assert.equal(order.checkout_url, null);
  reset(); const reuse = await api.POST(request()); assert.equal(reuse.status, 303); assert.equal(reuse.headers.get('location'), 'https://kareempro.com/checkout/pay?session_id=cs_test_local'); assert(!providerCalls.some(call => call.options?.body));
  console.log('PASS: custom payment labels, owner isolation, authoritative amounts/mode/metadata, expired/paid/Fawry states, hosted compatibility, custom session creation and reuse. No live payment calls.');
})().catch(error => { console.error(error); process.exit(1); });
