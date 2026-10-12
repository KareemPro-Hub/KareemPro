import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const parser = require('../node_modules/next/dist/compiled/babel/bundle.js').parser();
const ast = parser.parse(fs.readFileSync(new URL('../src/app/admin/actions.js', import.meta.url), 'utf8'), { sourceType: 'module' });
const declarations = ast.program.body.filter(n => n.type === 'VariableDeclaration').flatMap(n => n.declarations);
function literal(node) {
  if (['StringLiteral', 'NumericLiteral', 'BooleanLiteral'].includes(node.type)) return node.value;
  if (node.type === 'NullLiteral') return null;
  if (node.type === 'ArrayExpression') return node.elements.map(literal);
  if (node.type === 'ObjectExpression') return Object.fromEntries(node.properties.map(p => [p.key.name || p.key.value, literal(p.value)]));
  if (node.type === 'CallExpression' && node.callee.type === 'MemberExpression' && node.callee.property.name === 'join') return literal(node.callee.object).join(literal(node.arguments[0]));
  throw new Error('Unsupported pricing literal: ' + node.type);
}
const defaults = literal(declarations.find(n => n.id.name === 'DEFAULT_PACKAGES').init);
const blogger = literal(declarations.find(n => n.id.name === 'SERVICE_TEMPLATES').init.properties.find(p => p.key.name === 'blogger').value).packages;
const offers = JSON.parse(fs.readFileSync(new URL('../public/service-offers.json', import.meta.url), 'utf8'));
const services = [
  ['platforms', 'منصات ومواقع', '/platforms'], ['edu', 'منصة تعليمية', '/edu-platform'],
  ['store', 'متجر إلكتروني', '/store'], ['pos', 'نقاط بيع', '/pos-system'],
  ['booking', 'حجز مواعيد', '/booking'], ['portal', 'بوابة عملاء', '/portal-system'],
  ['charity', 'مواقع الجمعيات', '/charity'], ['blog', 'مدونات بلوجر', '/blog'],
].map(([id, name, url]) => ({ id, name, url, packages: id === 'blog' ? blogger : defaults.map((pkg, i) => {
  const offer = offers[id];
  return offer ? { ...pkg, price: pkg.price + offer.adjustment, name: pkg.name.split('|')[0] + '|' + offer.taglines[i], features: offer.features[i].join('\n') } : pkg;
}) }));
const visibleServices = services.filter(s => ['platforms', 'edu', 'store', 'blog'].includes(s.id));
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
function card(pkg, service, tier) {
  const [name, tagline] = pkg.name.split('|');
  const features = pkg.features.split('\n').slice(0, 6);
  const url = `/checkout?service=${service.id}&tier=${tier}`;
  return `<article class="pricing-card${pkg.is_featured ? ' featured' : ''}"><h3>${esc(name)}</h3><p class="price-tagline">${esc(tagline.replaceAll('**', ''))}</p><div class="price-sar"><small>تبدأ من</small><span dir="ltr">${pkg.price.toLocaleString('en-US')}</span><small>ريال سعودي</small></div><div class="currency-equivalent" data-sar="${pkg.price}" aria-live="polite">جارٍ حساب مقابل الجنيه…</div><ul>${features.map(f => `<li>${esc(f.replaceAll('**', ''))}</li>`).join('')}</ul><a class="price-cta" href="${esc(url)}">اطلب هذه الباقة</a></article>`;
}
const tabs = visibleServices.map((s, i) => `<button type="button" role="tab" id="price-tab-${s.id}" data-price-tab aria-controls="price-panel-${s.id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${esc(s.name)}</button>`).join('');
const panels = visibleServices.map((s, i) => `<div class="pricing-grid" role="tabpanel" id="price-panel-${s.id}" data-price-panel aria-labelledby="price-tab-${s.id}"${i ? ' hidden' : ''}>${s.packages.map((p, tier) => card(p, s, tier)).join('')}</div>`).join('\n');
const section = `<!-- PRICING:START -->
<section id="pricing"><div class="container"><div class="sec-head"><div class="sec-tag">الباقات والأسعار</div><h2 class="sec-title">اختر باقة <span class="g-text">مشروعك</span></h2><p class="sec-sub">السعر بالريال السعودي وما يعادله بالجنيه المصري. اختر الخدمة للاطلاع على باقاتها.</p></div><div class="price-tabs" role="tablist" aria-label="خدمات الباقات">${tabs}</div>${panels}<p class="pricing-note">الأسعار تبدأ من المبالغ الموضحة. يحدد عرض مشروعك وعقده النطاق والسعر النهائي والدفعات. مقابل الجنيه محسوب بسعر التحويل الموضح؛ يُؤكَّد مبلغ السداد قبل الدفع. الرسوم الخارجية مثل الدومين والاستضافة وحسابات المتاجر حسب العرض.</p></div></section>
<!-- PRICING:END -->`;
const homeUrl = new URL('../public/index.html', import.meta.url);
let home = fs.readFileSync(homeUrl, 'utf8');
home = home.includes('<!-- PRICING:START -->') ? home.replace(/<!-- PRICING:START -->[\s\S]*?<!-- PRICING:END -->/, section) : home.replace('<!-- ═══ خطوات العمل ═══ -->', section + '\n<!-- ═══ خطوات العمل ═══ -->');
fs.writeFileSync(homeUrl, home);
fs.writeFileSync(new URL('../public/pricing-catalog.json', import.meta.url), JSON.stringify(services, null, 2) + '\n');
// Blogger has its own real proposal packages; keep the public page in sync.
for (const service of services) {
const pageUrl = new URL(`../public/${service.url.slice(1)}.html`, import.meta.url);
let page = fs.readFileSync(pageUrl, 'utf8');
const cards = `<div class="pricing-grid">${service.packages.map((p, tier) => card(p, service, tier)).join('')}</div>`;
page = page.replace(/<div class="(?:pk-grid|pricing-grid)">[\s\S]*?<p class="pk-note">/, cards + '<p class="pk-note">');
page = page.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (match, json) => {
  const data = JSON.parse(json);
  if (data['@type'] !== 'Service') return match;
  data.offers = service.packages.map(p => ({ '@type': 'Offer', name: p.name.split('|')[0], price: String(p.price), priceCurrency: 'SAR' }));
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
});
fs.writeFileSync(pageUrl, page);
}
console.log('Pricing generated: 4 visible services; service-specific prices, features and checkout links.');
