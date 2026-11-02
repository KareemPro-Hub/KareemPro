// Exercise the actual webhook and confirmation modules. No network or live writes.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createHmac } = require('node:crypto');
const babel = require('next/dist/compiled/babel/bundle.js');
function load(file, mocks, fetch) {
  const code = babel.core().transformSync(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), { presets: [[babel.presetEnv(), { targets: { node: 'current' }, modules: 'commonjs' }]], babelrc: false, configFile: false }).code;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', 'fetch', code)(id => Object.hasOwn(mocks, id) ? mocks[id] : require(id), module, module.exports, fetch);
  return module.exports;
}
(async () => {
  const xp = await import('../src/lib/xpay.mjs');
  const checkout = load('src/lib/checkout.js', {});
  const order = { id: '11111111-1111-1111-1111-111111111111', session_id: 'cs_test_local', amount_egp_minor: 298457, livemode: false };
  let fresh, fetches, confirmations, changes, outage, lastAuthorization;
  const db = { from() { const q = { select() { return q; }, eq() { return q; }, maybeSingle: async () => ({ data: order }), update(value) { changes.push(value); return q; }, then(resolve) { return Promise.resolve({ error: null }).then(resolve); } }; return q; }, rpc: async (name, args) => { assert.equal(name, 'confirm_xpay_payment'); confirmations.push(args); return { error: null }; } };
  process.env.XPAY_WEBHOOK_SECRET = 'test_only_live_signature';
  process.env.XPAY_TEST_WEBHOOK_SECRET = 'test_only_sandbox_signature';
  process.env.XPAY_SECRET_KEY = 'test_only_live_key';
  process.env.XPAY_TEST_SECRET_KEY = 'test_only_sandbox_key';
  const server = load('src/lib/xpay-server.js', { 'server-only': {}, '@/lib/supabase/server': { createAdminClient: () => db }, '../../public/pricing-catalog.json': [], './checkout': checkout, './xpay.mjs': xp }, async (url, options) => { fetches++; lastAuthorization = options.headers.Authorization; if (outage) return { ok: false, status: 503 }; return { ok: true, json: async () => fresh }; });
  const webhook = load('src/app/api/xpay/webhook/route.js', { '@/lib/xpay.mjs': xp, '@/lib/xpay-server': server });
  const event = { id: 'evt_local', type: 'checkout.session.completed', data: { object: { id: order.session_id, paymentStatus: 'paid', amountTotal: 1 } } };
  function reset() { fresh = { id: order.session_id, metadata: { order_id: order.id }, currency: 'EGP', amountTotal: order.amount_egp_minor, livemode: false, status: 'open', paymentStatus: 'unpaid', isExpired: false }; fetches = 0; confirmations = []; changes = []; outage = false; }
  function request(value = event, secret = process.env.XPAY_TEST_WEBHOOK_SECRET, timestamp = Math.floor(Date.now() / 1000), headers = {}) { const raw = typeof value === 'string' ? value : JSON.stringify(value); const signature = createHmac('sha256', secret).update(timestamp + '.' + raw).digest('hex'); return new Request('https://kareempro.com/api/xpay/webhook', { method: 'POST', headers: { 'XPay-Signature': `t=${timestamp},v1=${signature}`, ...headers }, body: raw }); }
  reset(); assert.equal((await webhook.POST(request(event, 'forged'))).status, 400); assert.equal(fetches + confirmations.length, 0);
  reset(); assert.equal((await webhook.POST(request(event, undefined, Math.floor(Date.now() / 1000) - 301))).status, 400); assert.equal(fetches, 0);
  reset(); assert.equal((await webhook.POST(request('x'.repeat(262145)))).status, 413); assert.equal(fetches, 0);
  reset(); assert.equal((await webhook.POST(request(event, undefined, undefined, { 'Content-Length': '262145' }))).status, 413); assert.equal(fetches, 0);
  reset(); assert.equal((await webhook.POST(request({ ...event, type: 'unknown.event' }))).status, 200); assert.equal(fetches, 0);
  // A signed event claiming paid cannot override the current provider state.
  reset(); assert.equal((await webhook.POST(request())).status, 200); assert.equal(fetches, 1); assert.equal(confirmations.length + changes.length, 0); assert.equal(lastAuthorization, 'Bearer test_only_sandbox_key');
  reset(); fresh.status = 'complete'; assert.equal((await webhook.POST(request())).status, 200); assert.equal(confirmations.length + changes.length, 0);
  reset(); fresh.paymentStatus = 'paid'; assert.equal((await webhook.POST(request())).status, 200); assert.equal(confirmations.length, 1); assert.deepEqual(confirmations[0], { p_order_id: order.id, p_session_id: order.session_id, p_amount: order.amount_egp_minor, p_live: false, p_event_id: event.id });
  for (const changed of [{ amountTotal: 1 }, { currency: 'SAR' }, { livemode: true }]) { reset(); Object.assign(fresh, changed); assert.equal((await webhook.POST(request())).status, 500); assert.equal(confirmations.length, 0); }
  reset(); outage = true; assert.equal((await webhook.POST(request())).status, 500); assert.equal(confirmations.length, 0);
  reset(); fresh.isExpired = true; assert.equal((await webhook.POST(request())).status, 200); assert.deepEqual(changes, [{ status: 'expired' }]); assert.equal(confirmations.length, 0);
  reset(); assert.equal((await webhook.POST(request({ ...event, type: 'checkout.session.async_payment_failed' }))).status, 200); assert.deepEqual(changes, [{ status: 'failed' }]);
  reset(); fresh.paymentStatus = 'paid'; fresh.livemode = order.livemode = true; fresh.id = order.session_id = 'cs_live_local'; const liveEvent = { ...event, data: { object: { id: order.session_id } } }; assert.equal((await webhook.POST(request(liveEvent, process.env.XPAY_WEBHOOK_SECRET))).status, 200); assert.equal(lastAuthorization, 'Bearer test_only_live_key'); assert.equal(confirmations[0].p_live, true);
  console.log('PASS: real webhook rejects forged/stale/oversized events, fetches authoritative state, blocks unpaid Fawry/amount/mode/currency mismatch, retries outages, handles expiry/failure, and separates sandbox/live credentials. No live calls.');
})().catch(error => { console.error(error); process.exit(1); });
