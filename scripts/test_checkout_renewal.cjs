// Isolated tests: real checkout/login code, no network, email, or payment writes.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const babel = require('next/dist/compiled/babel/bundle.js');
const root = path.resolve(__dirname, '..');
function load(file, mocks = {}, fetch = () => { throw Error('Network forbidden'); }) {
  const code = babel.core().transformSync(fs.readFileSync(path.join(root, file), 'utf8'), {
    presets: [[babel.presetEnv(), { targets: { node: 'current' }, modules: 'commonjs' }]], babelrc: false, configFile: false,
  }).code;
  const module = { exports: {} };
  const req = id => Object.hasOwn(mocks, id) ? mocks[id] : require(id);
  new Function('require', 'module', 'exports', 'fetch', code)(req, module, module.exports, fetch);
  return module.exports;
}
(async () => {
  const xp = await import('../src/lib/xpay.mjs');
  const checkout = load('src/lib/checkout.js');
  const secret = 'test-only-renewal-secret';
  const stage = '11111111-1111-1111-1111-111111111111';
  const base = { id: '22222222-2222-2222-2222-222222222222', stage_id: stage, client_id: 'owner', service_id: 'stage', tier: null, title: 'مشروع — دفعة', amount_sar: 125, amount_egp_minor: 187500, exchange_rate: 15, rate_updated_at: new Date().toISOString(), livemode: false };
  process.env.XPAY_QUOTE_SECRET = secret;
  process.env.XPAY_SECRET_KEY = 'sk_test_local_only';
  let order, writes, selectedCalls, calls, allowed = true, ready = true;
  let session;
  const selected = { service: { id: 'stage', name: 'مشروع' }, pkg: { name: 'دفعة', price: 125 }, stageId: stage, clientId: 'owner' };
  const db = { from() {
    const q = { select() { return q; }, eq() { return q; }, neq() { return q; }, maybeSingle: async () => ({ data: null }),
      upsert(data) { writes++; order ||= { ...data, status: 'pending' }; return q; },
      single: async () => ({ data: order }), update(data) { writes++; Object.assign(order, data); return q; },
      then(resolve) { return Promise.resolve({ error: null }).then(resolve); } };
    return q;
  } };
  const api = load('src/app/api/xpay/checkout/route.js', {
    '@/lib/xpay.mjs': xp, '@/lib/checkout': checkout, '@/lib/supabase/server': { createAdminClient: () => db },
    '@/lib/xpay-server': { paymentsReady: () => ready, customPaymentsReady: () => false, selectedPayment: async () => { selectedCalls++; return allowed ? selected : null; },
      xpay: async (url, options) => { calls.push({ url, options }); return session; },
      confirmSession: async value => { assert(xp.sessionMatches(value, order)); if (xp.sessionExpired(value)) order.status = 'expired'; } },
  });
  const request = (quote, origin = 'https://kareempro.com') => new Request('https://kareempro.com/api/xpay/checkout', { method: 'POST', headers: { origin }, body: new URLSearchParams({ quote }) });
  function reset(existing) { order = existing; writes = 0; selectedCalls = 0; calls = []; allowed = true; ready = true; session = { id: 'cs_test_local', metadata: { order_id: base.id }, amountTotal: base.amount_egp_minor, currency: 'EGP', livemode: false, status: 'open', paymentStatus: 'unpaid', url: 'https://checkout.xpay.app/c/cs_test_local' }; }
  // Even years-old signed pages recover via a fresh summary, never stale pricing.
  for (const days of [1, 2, 7, 3650]) for (const fields of [base, { ...base, stage_id: null, service_id: 'web', tier_key: 'professional' }, { ...base, stage_id: null, service_id: 'web', tier: 0 }]) {
    reset(); const token = xp.signQuote(fields, secret, Date.now() - days * 86400000);
    const response = await api.POST(request(token));
    assert.equal(response.status, 303); assert.equal(response.headers.get('location'), 'https://kareempro.com' + checkout.checkoutPath(fields));
    assert.equal(writes + selectedCalls + calls.length, 0);
  }
  reset(); const fresh = xp.signQuote(base, secret);
  assert.equal((await api.POST(request(fresh + 'tampered'))).status, 503); assert.equal(writes, 0);
  const staleTampered = xp.signQuote(base, secret, Date.now() - 86400000) + 'tampered';
  assert.equal((await api.POST(request(staleTampered))).status, 503); assert.equal(writes, 0);
  assert.equal((await api.POST(request(fresh, 'https://invalid.example'))).status, 403);
  ready = false; assert.equal((await api.POST(request(fresh))).status, 503); ready = true;
  allowed = false; assert.equal((await api.POST(request(fresh))).status, 409); assert.equal(writes, 0);
  reset({ ...base, status: 'expired' }); assert.equal((await api.POST(request(fresh))).headers.get('location'), 'https://kareempro.com' + checkout.checkoutPath(base)); assert.equal(calls.length, 0);
  for (const expired of [{ status: 'expired' }, { status: 'open', isExpired: true }]) {
    reset({ ...base, status: 'pending', session_id: 'cs_test_local', checkout_url: 'https://checkout.xpay.app/c/cs_test_local' }); Object.assign(session, expired);
    const response = await api.POST(request(fresh)); assert.equal(response.headers.get('location'), 'https://kareempro.com' + checkout.checkoutPath(base));
    assert.equal(order.status, 'expired'); assert(calls.every(c => !c.options));
  }
  reset({ ...base, status: 'pending', session_id: 'cs_test_local', checkout_url: 'https://checkout.xpay.app/c/cs_test_local' });
  assert.equal((await api.POST(request(fresh))).headers.get('location'), session.url); assert.equal(calls.length, 1);
  session.paymentStatus = 'paid'; assert.match((await api.POST(request(fresh))).headers.get('location'), /checkout\/result\?session_id=cs_test_local$/);
  reset(); assert.equal((await api.POST(request(fresh))).headers.get('location'), session.url); assert.equal(calls[0].options.body.lineItems[0].priceData.unitAmount, base.amount_egp_minor);
  assert.equal(calls[0].options.body.lineItems[0].priceData.productData.name, '\u2067\u2066125\u2069\u00a0ريال\u00a0سعودي\u2069');
  assert.equal(calls[0].options.body.lineItems[0].priceData.productData.description, base.title);
  assert.equal(checkout.hostedPaymentTitle(base, { currency: 'EGP' }), base.title);
  assert.equal(calls[0].options.idempotencyKey, 'kareempro-' + base.id);
  // The actual snapshot/confirmation code releases only provider-confirmed expiry.
  let prior, changes, rpcCalls;
  const snapshotDb = { from() { const q = { select() { return q; }, eq() { return q; }, maybeSingle: async () => ({ data: prior }), update(data) { changes.push(data); return q; }, then(resolve) { return Promise.resolve({ error: null }).then(resolve); } }; return q; }, rpc: async () => { rpcCalls++; return { error: null }; } };
  const server = load('src/lib/xpay-server.js', { 'server-only': {}, '@/lib/supabase/server': { createAdminClient: () => snapshotDb }, '../../public/pricing-catalog.json': [], './checkout': checkout, './xpay.mjs': xp }, async () => ({ ok: true, json: async () => session }));
  for (const state of ['open', 'expired', 'flag', 'paid', 'complete']) {
    prior = { ...base, status: 'pending', session_id: 'cs_test_local' }; changes = []; rpcCalls = 0;
    session = { id: prior.session_id, metadata: { order_id: base.id }, currency: 'EGP', amountTotal: base.amount_egp_minor, livemode: false, status: state === 'flag' ? 'open' : state, isExpired: state === 'flag', paymentStatus: state === 'paid' ? 'paid' : 'unpaid' };
    const snapshot = await server.paymentSnapshot(selected, { rate: 16, updatedAt: Date.now() });
    if (['expired', 'flag'].includes(state)) { assert.equal(snapshot.id, undefined); assert.equal(snapshot.amount_egp_minor, 200000); assert.equal(changes[0].status, 'expired'); }
    else if (state === 'paid') { assert.equal(snapshot.paidSession, prior.session_id); assert.equal(rpcCalls, 1); }
    else { assert.equal(snapshot.id, prior.id); assert.equal(snapshot.amount_egp_minor, base.amount_egp_minor); assert.equal(changes.length, 0); }
  }
  // Login links remain reusable years later; deleted tokens/clients stay denied.
  let row, touched = 0;
  const loginDb = { from() { const q = { insert: async data => { row = { ...data, id: 'local', clients: { email: 'client@example.invalid' } }; return {}; }, select() { return q; }, eq() { return q; }, maybeSingle: async () => ({ data: row }), update() { touched++; return q; }, then(resolve) { return Promise.resolve({ error: null }).then(resolve); } }; return q; } };
  const login = load('src/lib/loginLinks.js');
  await login.createLoginLink(loginDb, 'local-client'); assert.equal(row.expires_at, 'infinity'); assert.equal(row.token.length, 43);
  const clock = Date.now; Date.now = () => clock() + 100 * 365 * 86400000;
  try { for (let i = 0; i < 2; i++) assert.equal(await login.redeemLoginToken(loginDb, row.token), row.clients.email); } finally { Date.now = clock; }
  assert.equal(touched, 2); row.clients = null; assert.equal(await login.redeemLoginToken(loginDb, row.token), null);
  row = null; assert.equal(await login.redeemLoginToken(loginDb, 'deleted'), null); assert.equal(await login.redeemLoginToken(loginDb, null), null);
  console.log('PASS: stale checkout pages (1 day to 10 years), stage/catalog renewal, tampering/ownership, provider expiry/paid/pending states, stable amount/idempotency, perpetual reusable login and revoked access. No live calls.');
})().catch(error => { console.error(error); process.exit(1); });
