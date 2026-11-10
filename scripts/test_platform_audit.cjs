// Actual server code with isolated service boundaries; never touches real users.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const babel = require('next/dist/compiled/babel/bundle.js');
const root = path.resolve(__dirname, '..');
function load(file, mocks = {}, append = '') {
  const filename = path.resolve(root, file);
  const code = babel.core().transformSync(fs.readFileSync(filename, 'utf8') + append, {
    presets: [[babel.presetEnv(), { targets: { node: 'current' }, modules: 'commonjs' }]], babelrc: false, configFile: false,
  }).code;
  const module = { exports: {} };
  const req = id => Object.hasOwn(mocks, id) ? mocks[id]
    : id.startsWith('@/') ? load('src/' + id.slice(2) + '.js', mocks)
    : id.startsWith('.') ? id.endsWith('.json') ? require(path.resolve(path.dirname(filename), id)) : load(path.resolve(path.dirname(filename), id) + '.js', mocks)
    : require(id);
  new Function('require', 'module', 'exports', code)(req, module, module.exports);
  return module.exports;
}
(async () => {
  const redirect = load('src/lib/authRedirect.js');
  for (const value of ['https://evil.invalid', '//evil.invalid', '@evil.invalid', 'javascript:alert(1)', '/\\evil.invalid', '/%5cevil.invalid', '/%2fevil.invalid', '/\nevil.invalid', null, {}, '/%']) {
    assert.equal(redirect.safeAuthNext(value, '/admin'), '/admin');
  }
  for (const value of ['/portal', '/admin/projects?view=all', '/auth/set-password?role=team', '/portal#files']) assert.equal(redirect.safeAuthNext(value), value);
  const next = { NextResponse: { redirect: url => new Response(null, { status: 303, headers: { location: url } }) } };
  const callback = load('src/app/auth/callback/route.js', { 'next/server': next, '@/lib/authRedirect': redirect,
    '@/lib/supabase/server': { createClient: async () => ({ auth: { exchangeCodeForSession: async () => ({}) } }) } });
  for (const value of ['@evil.invalid', 'https://evil.invalid', '//evil.invalid']) {
    const response = await callback.GET(new Request('https://kareempro.com/auth/callback?code=local&next=' + encodeURIComponent(value)));
    assert.equal(response.headers.get('location'), 'https://kareempro.com/portal');
  }
  const stage = load('src/lib/packageStages.js');
  const mocks = { 'next/cache': { revalidatePath() {} }, 'next/navigation': { redirect() { throw Error('guard'); } },
    '@/lib/admin': { requireAdmin: async () => { throw Error('guard'); } }, '@/lib/supabase/server': { createAdminClient() { throw Error('No database access before guard'); } },
    '@/lib/email': {}, '@/lib/pdfReceipt': {}, '@/lib/projectFiles': {} };
  const actions = load('src/app/admin/actions.js', mocks, '\nmodule.exports.auditTemplates = SERVICE_TEMPLATES;');
  let adminGuards = 0, paymentPlans = 0;
  for (const fn of Object.values(actions)) if (typeof fn === 'function') { await assert.rejects(() => fn(), /guard/); adminGuards++; }
  const catalog = require('../public/pricing-catalog.json');
  const { checkoutPackage } = load('src/lib/checkout.js');
  const { currentBloggerArticleCount } = load('src/lib/public-offers.js');
  const { getAdminTimeline } = load('src/lib/timeline.js');
  const bloggerPackages = actions.auditTemplates.blogger.packages;
  for (const [index, tier, price, oldPrice, count] of [[1, 'featured', 450, 900, 20], [2, 'professional', 750, 1300, 60]]) {
    const pkg = bloggerPackages[index];
    assert.equal(pkg.price, price);
    assert.equal(pkg.original_price, oldPrice);
    assert.equal(currentBloggerArticleCount(pkg), count);
    const stages = stage.buildStagesForProposal(pkg);
    assert.deepEqual(stages.map(s => s.amount), [price / 3, price / 3, price / 3]);
    assert.ok(stages[2].description.includes(`نشر ${count} مقالًا`));
    assert.ok(getAdminTimeline(pkg.name, price).find(s => s.key === 'blog_delivery_articles').title.includes(String(count)));
    for (const linkTier of [tier, String(index - 1)]) {
      assert.equal(checkoutPackage(catalog, { service: 'blog', tier: linkTier }).pkg.price, price);
    }
  }
  for (const service of [...Object.values(actions.auditTemplates), ...catalog]) for (const pkg of service.packages || []) {
    const plan = stage.buildStagesForProposal(pkg);
    if (plan) { assert.equal(plan.reduce((sum, item) => sum + item.amount, 0), pkg.price - (stage.PACKAGE_SETTLEMENTS[pkg.price]?.amount || 0)); paymentPlans++; }
  }
  const noUser = { createClient: async () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }), createAdminClient() { throw Error('No anonymous database access'); } };
  let clientGuards = 0;
  for (const file of ['portal/notes-actions.js', 'portal/files-actions.js', 'portal/notifications-actions.js', 'team/actions.js']) {
    for (const fn of Object.values(load('src/app/' + file, { '@/lib/supabase/server': noUser, 'next/cache': {}, '@/lib/email': {}, '@/lib/projectFiles': {} }))) {
      await assert.rejects(() => fn(), /يجب تسجيل الدخول/); clientGuards++;
    }
  }
  const foreignDb = { from() { const q = { select() { return q; }, eq() { return q; }, single: async () => ({ data: { client_id: 'other', assignee_id: 'other', for_admin: true } }), update() { throw Error('Unauthorized write'); }, delete() { throw Error('Unauthorized delete'); } }; return q; } };
  const foreignMocks = { '@/lib/supabase/server': { createClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: 'owner' } } }) } }), createAdminClient: () => foreignDb }, 'next/cache': {}, '@/lib/email': {}, '@/lib/projectFiles': {} };
  const foreignFiles = load('src/app/portal/files-actions.js', foreignMocks);
  const foreignNotes = load('src/app/portal/notes-actions.js', foreignMocks);
  const foreignNotifications = load('src/app/portal/notifications-actions.js', foreignMocks);
  const foreignTasks = load('src/app/team/actions.js', foreignMocks);
  for (const action of [() => foreignFiles.getMyFileUrl('foreign'), () => foreignNotes.addMyNote('test', 'foreign'), () => foreignNotes.sendMyNoteToAdmin('foreign'), () => foreignNotes.deleteMyNote('foreign'), () => foreignNotifications.markNotificationRead('foreign'), () => foreignTasks.setMyTaskDone('foreign', true)]) await assert.rejects(action, /غير مصرح/);
  let rpcError = null, emailCalls = 0, rpcArgs, owner = 'owner', casWon = false;
  let selectedPackage = actions.auditTemplates.techfixer.packages[0];
  const proposal = () => ({ id: 'proposal', client_id: owner, status: 'pending', project_title: 'مشروع محلي', clients: { full_name: 'عميل اختبار', email: 'local@example.invalid' }, proposal_packages: [{ ...selectedPackage, id: 'package' }] });
  const database = { from() { let updating = false; const q = { select() { return q; }, eq() { return q; }, single: async () => ({ data: proposal() }), update() { updating = true; return q; }, maybeSingle: async () => ({ data: updating && casWon ? { id: 'proposal' } : null }), insert() { return Promise.resolve({}); } }; return q; }, rpc: async (_, args) => { rpcArgs = args; return { data: 'project', error: rpcError }; } };
  const proposalActions = load('src/app/portal/proposal-actions.js', { 'next/cache': { revalidatePath() {} }, '@/lib/supabase/server': { createClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: 'owner' } } }) } }), createAdminClient: () => database }, '@/lib/email': { sendProposalDecisionEmail: async () => { emailCalls++; throw Error('Simulated mail outage'); } } });
  const originalError = console.error; console.error = () => {};
  try {
    for (selectedPackage of actions.auditTemplates.techfixer.packages) {
      await proposalActions.acceptProposal({ proposalId: 'proposal', packageId: 'package', signerName: 'اسم عميل اختبار' });
      assert.equal(rpcArgs.p_stages[0].status, 'awaiting_payment'); assert.equal(rpcArgs.p_stages[1].status, 'upcoming');
      assert.equal(rpcArgs.p_stages.reduce((sum, item) => sum + item.amount, 0), selectedPackage.price);
    }
    rpcError = { message: 'Transaction failed' }; const before = emailCalls;
    await assert.rejects(() => proposalActions.acceptProposal({ proposalId: 'proposal', packageId: 'package', signerName: 'اسم عميل اختبار' }), /Transaction failed/);
    assert.equal(emailCalls, before); rpcError = null;
    owner = 'other'; await assert.rejects(() => proposalActions.acceptProposal({ proposalId: 'proposal', packageId: 'package', signerName: 'اسم عميل اختبار' }), /غير مصرح/); owner = 'owner';
    await assert.rejects(() => proposalActions.rejectProposal({ proposalId: 'proposal', reason: 'رفض محلي' }), /تم اتخاذ قرار/);
    assert.equal(emailCalls, before); casWon = true; await proposalActions.rejectProposal({ proposalId: 'proposal', reason: 'رفض محلي' });
  } finally { console.error = originalError; }
  console.log(JSON.stringify({ authRedirects: 'PASS (helper and actual callback)', adminGuards, clientGuards, foreignOwnershipGuards: 6, paymentPlans, atomicAction: 'PASS', mailOutage: 'PASS', rejectRace: 'PASS', liveCalls: 0 }));
})().catch(error => { console.error(error); process.exit(1); });
