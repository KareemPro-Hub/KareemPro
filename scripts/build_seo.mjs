import fs from 'node:fs';
const root = new URL('../public/', import.meta.url);
const seo = JSON.parse(fs.readFileSync(new URL('./seo-pages.json', import.meta.url), 'utf8'));
const esc = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
function meta(html, attr, key, value) {
  const pattern = new RegExp(`<meta\\b(?=[^>]*\\b${attr}="${key}")[^>]*>`, 'i');
  const tag = `<meta ${attr}="${key}" content="${esc(value)}" />`;
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace('</head>', tag + '\n</head>');
}
for (const [path, spec] of Object.entries(seo.pages)) {
  const file = new URL(path === '/' ? 'index.html' : path.slice(1) + '.html', root);
  const before = fs.readFileSync(file, 'utf8');
  let html = before.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(spec.title)}</title>`);
  for (const [attr, key, value] of [
    ['name', 'description', spec.description], ['property', 'og:title', spec.title],
    ['property', 'og:description', spec.description], ['property', 'og:image:type', 'image/jpeg'],
    ['name', 'twitter:title', spec.title], ['name', 'twitter:description', spec.description],
  ]) html = meta(html, attr, key, value);
  const { question, answer } = seo.regionalFaq;
  if (!html.slice(html.indexOf('</head>')).includes(question)) {
    const row = path === '/'
      ? `<details><summary>${esc(question)}<span class="ic"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></span></summary><p>${esc(answer)}</p></details>`
      : `<details class="q"><summary>${esc(question)}</summary><p>${esc(answer)}</p></details>`;
    const container = path === '/' ? '<div class="faq reveal">' : '<div class="faq">';
    if (!html.includes(container)) throw Error('FAQ container missing: ' + path);
    html = html.replace(container, container + '\n' + row);
  }
  html = html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (tag, text) => {
    const data = JSON.parse(text);
    if (['Service', 'Organization'].includes(data['@type'])) data.areaServed = seo.areaServed;
    if (data['@type'] === 'Service' && !data.name) data.name = 'تصميم مواقع وبرمجة تطبيقات ومتاجر إلكترونية';
    if (data['@type'] === 'FAQPage' && !data.mainEntity.some(item => item.name === question))
      data.mainEntity.push({ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer } });
    return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
  });
  if (path === '/') html = html.replace(/(<div class="gshot">)(<img\b[^>]*>)/g, (match, wrapper, img) => {
    if (!/\bloading=/.test(img)) img = img.replace(/\s*\/?>$/, ' loading="lazy" />');
    if (!/\bdecoding=/.test(img)) img = img.replace(/\s*\/?>$/, ' decoding="async" />');
    return wrapper + img;
  });
  if (html !== before) fs.writeFileSync(file, html);
}
// Keep the existing sitemap and its URLs; these dates are deliberate content dates,
// not the date of every deployment or an automatic monthly clock.
const sitemapFile = new URL('sitemap.xml', root);
const sitemap = fs.readFileSync(sitemapFile, 'utf8');
const next = sitemap.replace(/<url>[\s\S]*?<\/url>/g, entry => {
  const loc = entry.match(/<loc>(.*?)<\/loc>/)?.[1];
  if (!loc) return entry;
  const path = new URL(loc).pathname;
  const date = seo.pages[path] ? seo.updated : seo.lastmodOverrides[path];
  return date ? entry.replace(/<lastmod>.*?<\/lastmod>/, `<lastmod>${date}</lastmod>`) : entry;
});
if (next !== sitemap) fs.writeFileSync(sitemapFile, next);
console.log('SEO metadata synchronized for 9 marketing pages; existing sitemap URLs preserved.');
