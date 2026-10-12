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
const services = [
  ['platforms', 'منصات ومواقع', '/platforms'], ['edu', 'منصة تعليمية', '/edu-platform'],
  ['store', 'متجر إلكتروني', '/store'], ['pos', 'نقاط بيع', '/pos-system'],
  ['booking', 'حجز مواعيد', '/booking'], ['portal', 'بوابة عملاء', '/portal-system'],
  ['charity', 'مواقع الجمعيات', '/charity'], ['blog', 'مدونات بلوجر', '/blog'],
].map(([id, name, url]) => ({ id, name, url, packages: id === 'blog' ? blogger : defaults }));
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
function card(pkg, service) {
  const [name, tagline] = pkg.name.split('|');
  const features = pkg.features.split('\n').slice(0, 6);
  const url = 'https://wa.me/966507069605?text=' + encodeURIComponent(`السلام عليكم، أرغب في ${name} لخدمة ${service.name} في Kareem Pro.`);
  return `<article class="pricing-card${pkg.is_featured ? ' featured' : ''}"><h3>${esc(name)}</h3><p class="price-tagline">${esc(tagline.replaceAll('**', ''))}</p><div class="price-sar"><small>تبدأ من</small><span dir="ltr">${pkg.price.toLocaleString('en-US')}</span><small>ريال سعودي</small></div><div class="currency-equivalent" data-sar="${pkg.price}" aria-live="polite">جارٍ حساب مقابل الجنيه…</div><ul>${features.map(f => `<li>${esc(f.replaceAll('**', ''))}</li>`).join('')}</ul><a class="price-cta" href="${esc(url)}" target="_blank" rel="noopener">اطلب هذه الباقة</a></article>`;
}
const tabs = services.map((s, i) => `<button type="button" role="tab" id="price-tab-${s.id}" data-price-tab aria-controls="price-panel-${s.id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${esc(s.name)}</button>`).join('');
const panels = services.map((s, i) => `<div class="pricing-grid" role="tabpanel" id="price-panel-${s.id}" data-price-panel aria-labelledby="price-tab-${s.id}"${i ? ' hidden' : ''}>${s.packages.map(p => card(p, s)).join('')}</div>`).join('\n');
const section = `<!-- PRICING:START -->
<section id="pricing"><div class="container"><div class="sec-head"><div class="sec-tag">الباقات والأسعار</div><h2 class="sec-title">اختر باقة <span class="g-text">مشروعك</span></h2><p class="sec-sub">السعر بالريال السعودي وما يعادله بالجنيه المصري. اختر الخدمة للاطلاع على باقاتها.</p></div><div class="price-tabs" role="tablist" aria-label="خدمات الباقات">${tabs}</div>${panels}<p class="pricing-note">الأسعار تبدأ من المبالغ الموضحة. يحدد عرض مشروعك وعقده النطاق والسعر النهائي والدفعات. مقابل الجنيه محسوب بسعر التحويل الموضح؛ يُؤكَّد مبلغ السداد قبل الدفع. الرسوم الخارجية مثل الدومين والاستضافة وحسابات المتاجر حسب العرض.</p></div></section>
<!-- PRICING:END -->`;
const homeUrl = new URL('../public/index.html', import.meta.url);
let home = fs.readFileSync(homeUrl, 'utf8');
home = home.includes('<!-- PRICING:START -->') ? home.replace(/<!-- PRICING:START -->[\s\S]*?<!-- PRICING:END -->/, section) : home.replace('<!-- ═══ خطوات العمل ═══ -->', section + '\n<!-- ═══ خطوات العمل ═══ -->');
fs.writeFileSync(homeUrl, home);
fs.writeFileSync(new URL('../public/pricing-catalog.json', import.meta.url), JSON.stringify(services, null, 2) + '\n');
// Blogger has its own real proposal packages; keep the public page in sync.
const blogUrl = new URL('../public/blog.html', import.meta.url);
let blog = fs.readFileSync(blogUrl, 'utf8');
const blogCards = `<div class="pricing-grid">${blogger.map(p => card(p, services.at(-1))).join('')}</div>`;
blog = blog.replace(/<div class="(?:pk-grid|pricing-grid)">[\s\S]*?<p class="pk-note">/, blogCards + '<p class="pk-note">');
blog = blog.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (match, json) => {
  const data = JSON.parse(json);
  if (data['@type'] !== 'Service') return match;
  data.offers = blogger.map(p => ({ '@type': 'Offer', name: p.name.split('|')[0], price: String(p.price), priceCurrency: 'SAR' }));
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
});
fs.writeFileSync(blogUrl, blog);
console.log('Pricing generated from proposal templates: 8 services, 30 packages.');
