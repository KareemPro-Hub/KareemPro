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
  const actions = load('src/app/admin/actions.js', mocks, '\nmodule.exports.auditTemplates = SERVICE_TEMPLATES; module.exports.auditOffer = { ensureDefaultProposal };');
  let adminGuards = 0, paymentPlans = 0;
  for (const fn of Object.values(actions)) if (typeof fn === 'function') { await assert.rejects(() => fn(), /guard/); adminGuards++; }
  const catalog = require('../public/pricing-catalog.json');
  const { checkoutPackage, checkoutPath } = load('src/lib/checkout.js');
  const { currentBloggerArticleCount } = load('src/lib/public-offers.js');
  const { getAdminTimeline } = load('src/lib/timeline.js');
  const bloggerPackages = actions.auditTemplates.blogger.packages;
  const zawyatiPackages = actions.auditTemplates.zawyati.packages;
  const zawyatiPlans = [[150, 100], [200, 200]];
  assert.deepEqual(zawyatiPackages.map(pkg => [pkg.price, pkg.original_price]), [[250, 500], [400, 900]]);
  let storedProposal, storedPackages;
  const inviteDb = {
    from(table) {
      if (table === 'proposal_packages') return { insert: async rows => { storedPackages = rows; return {}; } };
      assert.equal(table, 'proposals');
      return {
        select: () => ({ eq: () => ({ limit: () => ({ maybeSingle: async () => ({ data: storedProposal }) }) }) }),
        insert: row => {
          assert.equal(storedProposal, undefined);
          storedProposal = { ...row, id: 'new-proposal' };
          return { select: () => ({ single: async () => ({ data: storedProposal }) }) };
        },
      };
    },
  };
  await actions.auditOffer.ensureDefaultProposal(inviteDb, 'local-client', 'zawyati');
  await actions.auditOffer.ensureDefaultProposal(inviteDb, 'local-client', 'zawyati');
  assert.equal(storedProposal.project_title, 'تطوير مدونة زاويتي');
  assert.deepEqual(storedPackages.map(pkg => [pkg.name, pkg.price, pkg.original_price]), zawyatiPackages.map(pkg => [pkg.name, pkg.price, pkg.original_price]));
  for (const [index, pkg] of zawyatiPackages.entries()) {
    const steps = getAdminTimeline(pkg.name, pkg.price);
    assert.equal(steps.at(-1).key, 'zawyati_delivery');
    assert.equal(steps.some(step => step.key === 'zawyati_content'), index === 1);
    assert.ok(pkg.features.includes('إرسال طلب مراجعة جديد'));
  }
  const releaseFilters = {};
  const deliveryDb = {
    from(table) {
      const q = {
        select: () => q,
        single: async () => ({ data: { client_id: 'local-client', package_name: zawyatiPackages[0].name, timeline_step: 'zawyati_development' } }),
        update(values) {
          if (table === 'stages') assert.equal(values.status, 'awaiting_payment');
          return q;
        },
        eq(key, value) { if (table === 'stages') releaseFilters[key] = value; return q; },
        insert: async () => ({}),
      };
      return q;
    },
  };
  const delivery = load('src/app/admin/actions.js', { ...mocks, '@/lib/admin': { requireAdmin: async () => {} },
    '@/lib/supabase/server': { createAdminClient: () => deliveryDb } });
  await delivery.updateTimelineStep('local-project', 'zawyati_delivery');
  assert.deepEqual(releaseFilters, { project_id: 'local-project', stage_number: 2, status: 'upcoming' });
  const bloggerPlans = [
    [0, 'basic', 250, undefined, 3, [150, 100]],
    [1, 'featured', 450, 900, 20, [250, 200]],
    [2, 'professional', 750, 1300, 60, [350, 200, 200]],
  ];
  for (const [index, tier, price, oldPrice, count, amounts] of bloggerPlans) {
    const pkg = bloggerPackages[index];
    assert.equal(pkg.price, price);
    assert.equal(pkg.original_price, oldPrice);
    assert.equal(currentBloggerArticleCount(pkg), count);
    const stages = stage.buildStagesForProposal(pkg);
    assert.deepEqual(stages.map(s => s.amount), amounts);
    assert.ok(stages.at(-1).description.includes(`نشر ${count} مقالًا`));
    assert.ok(getAdminTimeline(pkg.name, price).find(s => s.key === 'blog_delivery_articles').title.includes(String(count)));
    for (const linkTier of index === 0 ? [tier] : [tier, String(index - 1)]) {
      assert.equal(checkoutPackage(catalog, { service: 'blog', tier: linkTier }).pkg.price, price);
    }
  }
  assert.deepEqual(stage.buildStagesForPackagePrice(750).map(s => s.amount), [250, 250, 250]);
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
  const stageId = '11111111-1111-1111-1111-111111111111';
  let checkoutStage;
  const paymentDb = {
    auth: { getUser: async () => ({ data: { user: { id: 'owner' } } }) },
    from(table) {
      const filters = {};
      const query = {
        select: () => query,
        eq(key, value) { filters[key] = value; return query; },
        async maybeSingle() {
          if (table === 'stages' && filters.id === stageId) return { data: checkoutStage };
          if (table === 'projects' && filters.id === 'project' && filters.client_id === 'owner') {
            return { data: { title: 'مدونة بلوجر', client_id: 'owner', currency: 'SAR' } };
          }
          return { data: null };
        },
      };
      return query;
    },
  };
  const xpay = load('src/lib/xpay-server.js', {
    'server-only': {},
    './xpay.mjs': await import('../src/lib/xpay.mjs'),
    '@/lib/supabase/server': { createClient: async () => paymentDb },
  });
  const originalError = console.error; console.error = () => {};
  try {
    for (selectedPackage of actions.auditTemplates.techfixer.packages) {
      await proposalActions.acceptProposal({ proposalId: 'proposal', packageId: 'package', signerName: 'اسم عميل اختبار' });
      assert.equal(rpcArgs.p_stages[0].status, 'awaiting_payment'); assert.equal(rpcArgs.p_stages[1].status, 'upcoming');
      assert.equal(rpcArgs.p_stages.reduce((sum, item) => sum + item.amount, 0), selectedPackage.price);
    }
    for (const [index, amounts] of zawyatiPlans.entries()) {
      selectedPackage = zawyatiPackages[index];
      const args = { proposalId: 'proposal', packageId: 'package', signerName: 'اسم عميل اختبار' };
      await assert.rejects(() => proposalActions.acceptProposal({ ...args, displayedStageAmounts: [125, 125] }), /تغيّر تقسيم الدفعات/);
      await proposalActions.acceptProposal({ ...args, displayedStageAmounts: amounts });
      assert.deepEqual(rpcArgs.p_stages.map(s => s.amount), amounts);
      assert.deepEqual(rpcArgs.p_stages.map(s => s.status), ['awaiting_payment', 'upcoming']);
      for (const [i, payment] of rpcArgs.p_stages.entries()) {
        checkoutStage = { ...payment, id: stageId, stage_number: i + 1, project_id: 'project' };
        if (i === 1) {
          assert.equal(await xpay.selectedPayment({ stage: stageId }), null);
          checkoutStage.status = 'awaiting_payment';
        }
        const selected = await xpay.selectedPayment({ stage: stageId });
        assert.equal(selected.pkg.price, amounts[i]);
        assert.equal(checkoutPath({ stage_id: selected.stageId }), `/checkout?stage=${stageId}`);
      }
    }
    for (const [index, , price, , , amounts] of bloggerPlans) {
      selectedPackage = bloggerPackages[index];
      const args = { proposalId: 'proposal', packageId: 'package', signerName: 'اسم عميل اختبار' };
      const previous = rpcArgs;
      const previousPart = Math.floor(price * 100 / 3);
      const previousAmounts = [previousPart / 100, previousPart / 100, (price * 100 - previousPart * 2) / 100];
      await assert.rejects(() => proposalActions.acceptProposal(args), /تغيّر تقسيم الدفعات/);
      await assert.rejects(() => proposalActions.acceptProposal({ ...args, displayedStageAmounts: previousAmounts }), /تغيّر تقسيم الدفعات/);
      assert.equal(rpcArgs, previous);
      await proposalActions.acceptProposal({ ...args, displayedStageAmounts: amounts });
      assert.deepEqual(rpcArgs.p_stages.map(s => s.amount), amounts);
      assert.deepEqual(rpcArgs.p_stages.map(s => s.status), amounts.map((_, i) => i === 0 ? 'awaiting_payment' : 'upcoming'));
      for (const [i, payment] of rpcArgs.p_stages.entries()) {
        checkoutStage = { ...payment, id: stageId, stage_number: i + 1, project_id: 'project' };
        if (payment.status === 'upcoming') {
          assert.equal(await xpay.selectedPayment({ stage: stageId }), null);
          checkoutStage.status = 'awaiting_payment';
        }
        const selected = await xpay.selectedPayment({ stage: stageId });
        assert.equal(selected.pkg.price, amounts[i]);
        assert.equal(selected.stageNumber, i + 1);
        assert.equal(checkoutPath({ stage_id: selected.stageId }), `/checkout?stage=${stageId}`);
      }
    }
    selectedPackage = actions.auditTemplates.techfixer.packages[0];
    rpcError = { message: 'Transaction failed' }; const before = emailCalls;
    await assert.rejects(() => proposalActions.acceptProposal({ proposalId: 'proposal', packageId: 'package', signerName: 'اسم عميل اختبار' }), /Transaction failed/);
    assert.equal(emailCalls, before); rpcError = null;
    owner = 'other'; await assert.rejects(() => proposalActions.acceptProposal({ proposalId: 'proposal', packageId: 'package', signerName: 'اسم عميل اختبار' }), /غير مصرح/); owner = 'owner';
    await assert.rejects(() => proposalActions.rejectProposal({ proposalId: 'proposal', reason: 'رفض محلي' }), /تم اتخاذ قرار/);
    assert.equal(emailCalls, before); casWon = true; await proposalActions.rejectProposal({ proposalId: 'proposal', reason: 'رفض محلي' });
  } finally { console.error = originalError; }
  console.log(JSON.stringify({ authRedirects: 'PASS (helper and actual callback)', adminGuards, clientGuards, foreignOwnershipGuards: 6, paymentPlans, atomicAction: 'PASS', mailOutage: 'PASS', rejectRace: 'PASS', liveCalls: 0 }));
})().catch(error => { console.error(error); process.exit(1); });
