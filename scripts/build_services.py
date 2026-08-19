# -*- coding: utf-8 -*-
"""يولّد صفحات الخدمات الستاتيك في public/ من scripts/services_data.py
تشغيل:  python3 scripts/build_services.py
"""
import os, sys, json, html as H
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from services_data import *

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'public')
BASE_CSS = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'base.css'), encoding='utf-8').read()
SITE = "https://kareempro.com"

FONTS = """<style>
@font-face{font-family:'FrutigerArabic';src:url('/FrutigerLTArabic45Light.woff2') format('woff2'),url('/FrutigerLTArabic45Light.ttf') format('truetype');font-weight:300;font-display:swap}
@font-face{font-family:'FrutigerArabic';src:url('/FrutigerLTArabic55Roman.woff2') format('woff2'),url('/FrutigerLTArabic55Roman.ttf') format('truetype');font-weight:400;font-display:swap}
@font-face{font-family:'FrutigerArabic';src:url('/FrutigerLTArabic65Bold.woff2') format('woff2'),url('/FrutigerLTArabic65Bold.ttf') format('truetype');font-weight:700;font-display:swap}
@font-face{font-family:'FrutigerArabic';src:url('/frutigerltarabic75black.woff2') format('woff2'),url('/frutigerltarabic75black.ttf') format('truetype');font-weight:900;font-display:swap}
</style>"""

WA_SVG = ('<svg class="i-wa" viewBox="0 0 24 24" aria-hidden="true"><path d="M12.04 2.02c-5.5 0-9.96 4.46-9.96 9.96 0 1.76.46 3.47 1.34 4.99L2 22.02l5.2-1.36a9.93 9.93 0 0 0 4.84 1.23h.01c5.5 0 9.96-4.46 9.96-9.96 0-2.66-1.04-5.16-2.92-7.04a9.9 9.9 0 0 0-7.05-2.87zm5.83 14.06c-.25.7-1.45 1.33-2 1.41-.51.08-1.16.11-1.87-.12-.43-.13-.98-.32-1.69-.63-2.98-1.29-4.93-4.29-5.08-4.49-.15-.2-1.21-1.62-1.21-3.08s.77-2.18 1.04-2.48c.27-.3.59-.37.79-.37h.57c.19 0 .43-.07.67.51.25.6.85 2.05.92 2.2.07.15.12.32.02.52-.1.2-.15.33-.3.5-.15.17-.32.39-.45.52-.15.14-.3.3-.13.6.17.3.76 1.27 1.64 2.05 1.13 1.01 2.08 1.32 2.38 1.47.29.15.47.13.64-.07.17-.2.74-.86.94-1.16.2-.3.4-.25.67-.15.27.1 1.72.81 2.02.96.3.15.5.22.57.35.08.13.08.72-.17 1.41z"/></svg>')
DOWN_SVG = '<svg class="i-ln" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4.5v14M5.8 12.6 12 18.8l6.2-6.2"/></svg>'
CHK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.6 4.6L19 7.4"/></svg>'
XX  = '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>'
SHIELD = '<svg viewBox="0 0 24 24"><path d="M12 2.8 4.5 6v6c0 4.5 3.2 7.9 7.5 9.2 4.3-1.3 7.5-4.7 7.5-9.2V6z"/><path d="M9 12.2l2.1 2.1L15.4 10"/></svg>'
MIC = '<svg viewBox="0 0 24 24"><rect x="9" y="2.5" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3.5"/><path d="M8.5 21.5h7"/></svg>'
GO = '<span class="shot-go">%s<svg viewBox="0 0 24 24"><path d="M7 17 17 7M8.5 7H17v8.5"/></svg></span>'

def wa(msg):
    from urllib.parse import quote
    return "https://wa.me/%s?text=%s" % (WA_PHONE, quote(msg, safe=''))

def tabbar(cur):
    out = []
    for k in ORDER:
        s = SERVICES[k]
        cls = 'tab on' if k == cur else 'tab'
        out.append('<a class="%s" href="%s"><svg viewBox="0 0 24 24">%s</svg>%s</a>' % (cls, s['url'], ICO[k], s['tab']))
    return '<div class="tabbar"><nav class="tabs">%s</nav></div>' % ''.join(out)

def timeline(tl):
    cols = []
    for i, (t, d) in enumerate(tl):
        cols.append('<div class="tlx-col"><span class="tlx-num">0%d</span><span class="tlx-mark"><i></i></span>'
                    '<h3 class="tlx-t">%s</h3><p class="tlx-d">%s</p></div>' % (i+1, t, d))
    return '<div class="tlx"><div class="tlx-grid">%s</div></div>' % ''.join(cols)

def pains(items):
    out = []
    for bad, txt, good in items:
        out.append('<div class="pain"><span class="pain-x">%s%s</span>'
                   '<p style="color:#cbbccb;font-weight:300;font-size:.92rem;line-height:1.9;margin-bottom:.9rem">%s</p>'
                   '<div class="pain-v">%s<span>%s</span></div></div>' % (XX, bad, txt, CHK, good))
    return '<div class="pain-grid">%s</div>' % ''.join(out)

def proof(s):
    out = ''
    if s.get('shots'):
        cards = []
        for sh in s['shots']:
            img, url, name, sub, href, btn = sh
            cards.append('<a class="shot" href="%s" target="_blank" rel="noopener">'
                '<div class="shot-bar"><span class="dot"></span><span class="dot"></span><span class="dot"></span>'
                '<span class="shot-url">%s</span></div>'
                '<img src="/%s" alt="%s — %s" width="1200" height="750" loading="lazy" />'
                '<div class="shot-cap"><div><b>%s</b><span>%s</span></div>%s</div></a>'
                % (href, url, img, name, sub, name, sub, GO % btn))
        out += '<div class="showcase">%s</div>' % ''.join(cards)
    if s.get('sites'):
        cards = []
        for name, dom, desc, href, theme in s['sites']:
            mini = ''.join('<div class="m-card"><div class="m-img"></div><div class="m-l"></div><div class="m-l s"></div></div>' for _ in range(3))
            cards.append('<a class="sitecard" href="%s" target="_blank" rel="noopener">'
                '<div class="mock"><div class="mock-bar"><i></i><i></i><i></i><span>%s</span></div>'
                '<div class="mock-screen" style="%s">'
                '<div class="m-top"><span class="m-logo"></span><span class="m-nav"><i></i><i></i><i></i></span><span class="m-cta"></span></div>'
                '<div class="m-h1"></div><div class="m-h2"></div>'
                '<div class="m-strip"><i></i><i></i><i></i><i></i></div>'
                '<div class="m-grid">%s</div></div></div>'
                '<div class="site-body"><b>%s</b><code>%s</code><p>%s</p>%s</div></a>'
                % (href, dom, theme, mini, name, dom, desc, GO % 'زيارة الموقع'))
        out += '<div class="sitegrid">%s</div>' % ''.join(cards)
    if s.get('chips'):
        chips = ''.join('<div class="pchip"><img src="/clients/%s.webp" alt="" width="200" height="110" loading="lazy" /></div>' % c for c in s['chips'])
        out += '<div class="proofchips">%s</div>' % chips
        if s.get('chipNote'):
            out += '<p class="proofnote">%s</p>' % s['chipNote']
    return out

def voice_block():
    return ('<div class="voice"><div class="voice-badge">%s</div><div>'
      '<span class="sec-tag">شهادة صوتية من صاحب المنصة</span>'
      '<div class="player"><button class="play-btn" id="playBtn" aria-label="تشغيل الشهادة الصوتية">'
      '<svg viewBox="0 0 24 24"><path d="M7 4.5v15l13-7.5z"/></svg></button>'
      '<div class="bars" id="bars"></div><span class="p-time" id="pTime">0:00</span>'
      '<audio id="au" preload="none" src="/testimonials/qudrat-owner.mp3"></audio></div>'
      '<p class="quote">«كنت محتاج منصة تكون باسمي أنا، مش مجرد قناة أو مجموعة. كريم فهم الفكرة من أول جلسة، '
      'وسلّمني منصة وتطبيق بلوحة تحكم أقدر أضيف فيها الدروس بنفسي. النتيجة إن الطلاب بقوا يشتركوا مباشرة.»</p>'
      '<div class="voice-who"><b>أ. المغربي</b> — مؤسس منصة قدرات المغربي</div></div></div>' % MIC)

def logos_band():
    imgs = ''.join('<img src="/clients/%s.webp" alt="%s" width="200" height="110" loading="lazy" />' % (c, a) for c, a in LOGOS)
    return ('<section class="rv" style="padding-top:1rem"><div class="wrap center">'
      '<span class="sec-tag">من وثقوا بنا</span>'
      '<h2 class="sec-title">جهات <span class="g-text">حكومية وتعليمية وتجارية</span> اشتغلنا معها</h2>'
      '<p class="sec-sub">أكثر من 50 جهة داخل المملكة وخارجها على مدار 11 عامًا.</p></div>'
      '<div class="wrap"><div class="lg-band"><div class="lg-wall">%s</div></div></div></section>' % imgs)

def compare():
    a = ''.join('<li>%s<span>%s</span></li>' % (XX, x) for x in CMP_A)
    b = ''.join('<li>%s<span>%s</span></li>' % (CHK, x) for x in CMP_B)
    return ('<section class="rv"><div class="wrap center">'
      '<span class="sec-tag">لماذا نظام خاص بك</span>'
      '<h2 class="sec-title">نظامك الخاص <span class="g-text">مقابل</span> الحلول الجاهزة</h2>'
      '<p class="sec-sub">هذه هي الفروق التي تظهر بعد أول سنة من التشغيل.</p>'
      '<div class="cmp"><div class="cmp-col cmp-a"><div class="cmp-h">حل جاهز باشتراك شهري</div><ul>%s</ul></div>'
      '<div class="cmp-col cmp-b"><div class="cmp-h">نظامك مع <span class="g-text">Kareem Pro</span></div><ul>%s</ul></div>'
      '</div></div></section>' % (a, b))

def steps():
    out = ''.join('<div class="step"><div class="step-n">%d</div><h3>%s</h3><p>%s</p></div>' % (i+1, t, d)
                  for i, (t, d) in enumerate(STEPS))
    return ('<section class="rv"><div class="wrap center"><span class="sec-tag">كيف نعمل</span>'
      '<h2 class="sec-title">من الفكرة إلى <span class="g-text">الإطلاق</span> في 4 خطوات</h2>'
      '<div class="steps">%s</div></div></section>' % out)

def pricing(svc_tab):
    cards = []
    for name, sub, price, best, feats in PKGS:
        lis = ''.join('<li>%s<span>%s</span></li>' % (CHK, f) for f in feats)
        tag = '<span class="pk-tag">الأكثر طلبًا</span>' if best else ''
        href = wa('السلام عليكم، دخلت من صفحة %s في موقع Kareem Pro، ومهتم بـ%s 🙏' % (svc_tab, name))
        cards.append('<div class="pk%s">%s<span class="pk-name">%s</span><span class="pk-sub">%s</span>'
          '<div class="pk-price"><span class="pk-from">تبدأ من</span><span class="pk-val">%s</span>'
          '<img class="pk-cur" src="/riyal-symbol-white.png" alt="ريال سعودي" width="20" height="20" /></div>'
          '<ul class="pk-list">%s</ul>'
          '<a class="pk-cta" href="%s" target="_blank" rel="noopener">اطلب هذه الباقة</a></div>'
          % (' pk-best' if best else '', tag, name, sub, price, lis, href))
    return ('<section id="pricing" class="rv"><div class="wrap center"><span class="sec-tag">الباقات والأسعار</span>'
      '<h2 class="sec-title">أسعار <span class="g-text">واضحة</span> .. بدون مفاجآت</h2>'
      '<div class="pk-grid">%s</div>'
      '<p class="pk-note">الأسعار بالريال السعودي وتشمل التنفيذ الكامل والتسليم .. ولا تشمل الرسوم الخارجية '
      '(الدومين، الاستضافة، حساب Apple Developer وGoogle Play). الفاتورة الرسمية متاحة عند الطلب.</p>'
      '</div></section>' % ''.join(cards))

def guarantees():
    out = ''.join('<div>%s%s</div>' % (SHIELD, g) for g in GRS)
    return '<section class="rv" style="padding-top:0"><div class="wrap center"><div class="gr">%s</div></div></section>' % out

def faq_block(extra):
    items = FAQS + list(extra)
    out = ''.join('<details class="q"><summary>%s</summary><p>%s</p></details>' % (q, a) for q, a in items)
    return ('<section class="rv"><div class="wrap center"><span class="sec-tag">أسئلة شائعة</span>'
      '<h2 class="sec-title">قبل أن تبدأ</h2><div class="faq">%s</div></div></section>' % out), items

def final(s):
    return ('<section class="rv"><div class="wrap"><div class="final">'
      '<h2>%s</h2>'
      '<p><span class="final-big">ابدأ باستشارة مجانية</span>'
      '<span class="final-sub">نفهم فكرتك ونعطيك تصورًا واضحًا بالمدة والتكلفة، بدون أي التزام.</span></p>'
      '<a class="btn btn-wa" href="%s" target="_blank" rel="noopener">%s%s</a>'
      '<small>الرد خلال لحظات · فاتورة رسمية متاحة · تعاقد واضح قبل البدء</small>'
      '</div></div></section>' % (s['final'], wa(waMsg(s)), WA_SVG, s['cta']))

def waMsg(s):
    return 'السلام عليكم، دخلت من صفحة %s في موقع Kareem Pro، و%s 🙏' % (s['tab'], s['cta'])

FOOT = """<footer>
  <div class="ft-top"><nav class="ft-links">
    <a href="/">الموقع الرئيسي</a>
    <a href="/platforms">كل الخدمات</a>
    <a href="#pricing">الباقات والأسعار</a>
    <a href="/refund-policy.html">سياسة الاسترجاع</a>
  </nav></div>
  <div class="ft-copy">© 2026 Kareem Pro — جميع الحقوق محفوظة</div>
</footer>"""

SCRIPT = """<script>
(function(){
  var p=document.getElementById('prog');
  window.addEventListener('scroll',function(){var h=document.documentElement;
    p.style.width=(h.scrollTop/(h.scrollHeight-h.clientHeight)*100)+'%';},{passive:true});
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:.12});
  document.querySelectorAll('.rv').forEach(function(el){io.observe(el);});
  var cio=new IntersectionObserver(function(es){es.forEach(function(en){
    if(!en.isIntersecting)return; cio.unobserve(en.target);
    var el=en.target,end=+el.dataset.count,sfx=el.dataset.suffix||'',pfx=el.dataset.prefix||'',t0=null;
    function step(ts){if(!t0)t0=ts;var q=Math.min((ts-t0)/1100,1);
      el.textContent=pfx+Math.round(end*(1-Math.pow(1-q,3)))+sfx;if(q<1)requestAnimationFrame(step);}
    requestAnimationFrame(step);});},{threshold:.6});
  document.querySelectorAll('[data-count]').forEach(function(el){cio.observe(el);});
  var bars=document.getElementById('bars');
  if(bars){
    var Hh=[7,13,20,11,26,17,30,22,14,27,19,33,24,12,29,16,23,31,18,10,25,15,28,21,9,26,17,32,13,20,11,24,30,16,22,12,27,19,8,14];
    Hh.forEach(function(x){var i=document.createElement('i');i.style.height=x+'px';bars.appendChild(i);});
    var au=document.getElementById('au'),btn=document.getElementById('playBtn'),t=document.getElementById('pTime'),all=bars.querySelectorAll('i');
    function fmt(s){s=Math.floor(s||0);return Math.floor(s/60)+':'+('0'+(s%60)).slice(-2);}
    btn.addEventListener('click',function(){
      if(au.paused){au.play().then(function(){btn.innerHTML='<svg viewBox="0 0 24 24"><rect x="6.5" y="4.5" width="4" height="15"/><rect x="13.5" y="4.5" width="4" height="15"/></svg>';})
        .catch(function(){t.textContent='قريبًا';});}
      else{au.pause();btn.innerHTML='<svg viewBox="0 0 24 24"><path d="M7 4.5v15l13-7.5z"/></svg>';}});
    au.addEventListener('timeupdate',function(){var q=au.duration?au.currentTime/au.duration:0;t.textContent=fmt(au.currentTime);
      all.forEach(function(el,i){el.classList.toggle('on',i/all.length<=q);});});
    au.addEventListener('error',function(){t.textContent='قريبًا';});
  }
})();
</script>"""

def jsonld(s, faq_items):
    svc = {"@context":"https://schema.org","@type":"Service","name":s['tab'],
     "serviceType":s['tab'],"areaServed":{"@type":"Country","name":"SA"},
     "provider":{"@type":"Organization","name":"Kareem Pro","url":SITE,"logo":SITE+"/logo-transparent.png"},
     "url":SITE+s['url'],
     "offers":[{"@type":"Offer","name":n,"price":p.replace(',',''),"priceCurrency":"SAR"} for n,_,p,_,_ in PKGS]}
    faq = {"@context":"https://schema.org","@type":"FAQPage","mainEntity":[
      {"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}} for q,a in faq_items]}
    bc = {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
      {"@type":"ListItem","position":1,"name":"الرئيسية","item":SITE+"/"},
      {"@type":"ListItem","position":2,"name":"الخدمات","item":SITE+"/platforms"},
      {"@type":"ListItem","position":3,"name":s['tab'],"item":SITE+s['url']}]}
    return '\n'.join('<script type="application/ld+json">%s</script>' % json.dumps(x, ensure_ascii=False, separators=(',',':')) for x in (svc, faq, bc))

def page(k):
    s = SERVICES[k]
    faq_html, faq_items = faq_block(s.get('faqExtra', []))
    body_proof = proof(s) + (voice_block() if s.get('voice') else '')
    return """<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="theme-color" content="#0a0e26" />
<title>{title}</title>
<meta name="description" content="{desc}" />
<meta name="keywords" content="{kw}" />
<meta name="robots" content="index, follow, max-image-preview:large" />
<meta name="author" content="Kareem Pro" />
<meta name="geo.region" content="SA" />
<link rel="canonical" href="{site}{url}" />
<link rel="icon" type="image/png" href="/logo-transparent.png" />
<link rel="apple-touch-icon" href="/logo-transparent.png" />
<link rel="preload" as="font" type="font/woff2" href="/FrutigerLTArabic55Roman.woff2" crossorigin />
<link rel="preload" as="font" type="font/woff2" href="/frutigerltarabic75black.woff2" crossorigin />
<meta property="og:title" content="{title}" />
<meta property="og:description" content="{desc}" />
<meta property="og:type" content="website" />
<meta property="og:locale" content="ar_SA" />
<meta property="og:site_name" content="Kareem Pro" />
<meta property="og:url" content="{site}{url}" />
<meta property="og:image" content="{site}/og-banner.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{title}" />
<meta name="twitter:description" content="{desc}" />
<meta name="twitter:image" content="{site}/og-banner.png" />
{ld}
{fonts}
<style>{css}</style>
</head>
<body>
<div id="prog"></div>

<nav>
  <a class="nav-logo" href="/">
    <img src="/logo-transparent.png" alt="Kareem Pro" width="36" height="36" />
    <div><b>KAREEM PRO</b><span>منصات · متاجر · تطبيقات</span></div>
  </a>
  <a class="nav-cta" href="{waurl}" target="_blank" rel="noopener">{wasvg}اطلب الآن</a>
</nav>

{tabs}

<header class="hero" id="top">
  <div class="wrap">
    <span class="eyebrow"><span class="e-ico"><svg viewBox="0 0 24 24">{ico}</svg></span>{eyebrow}</span>
    <h1>{h1}</h1>
    <p class="lead">{lead}</p>
    {timeline}
    <div class="btns">
      <a class="btn btn-wa" href="{waurl}" target="_blank" rel="noopener">{wasvg}{cta}</a>
      <a class="btn btn-ghost" href="#proof">{down}شاهد نماذج حقيقية</a>
    </div>
    <div class="trust">
      <div><b data-count="11" data-prefix="+">0</b>سنة خبرة</div>
      <div><b data-count="50" data-prefix="+">0</b>جهة وثقت بنا</div>
      <div><b data-count="2000" data-prefix="+">0</b>عميل خدمناه</div>
      <div><b data-count="100" data-suffix="%">0</b>ملكية كاملة لك</div>
    </div>
  </div>
</header>

<section class="rv">
  <div class="wrap center">
    <span class="sec-tag">نتكلم بصراحة</span>
    <h2 class="sec-title">لو دي مشاكلك .. <span class="g-text">فأنت في المكان الصح</span></h2>
    <p class="sec-sub">{painSub}</p>
    {pains}
  </div>
</section>

<section id="proof" class="rv">
  <div class="wrap center">
    <span class="sec-tag">نماذج على أرض الواقع</span>
    <h2 class="sec-title">{proofTitle}</h2>
    <p class="sec-sub">{proofSub}</p>
    {proof}
  </div>
</section>

{logos}
{compare}
{steps}
{pricing}
{guarantees}
{faq}
{final}
{footer}
<a class="float" href="{waurl}" target="_blank" rel="noopener">{wasvg}{cta}</a>
{script}
</body>
</html>
""".format(title=s['title'], desc=s['desc'], kw=s['kw'], site=SITE, url=s['url'],
           ld=jsonld(s, faq_items), fonts=FONTS, css=BASE_CSS,
           waurl=wa(waMsg(s)), wasvg=WA_SVG, down=DOWN_SVG,
           tabs=tabbar(k), ico=ICO[k], eyebrow=s['eyebrow'], h1=s['h1'], lead=s['lead'],
           timeline=timeline(s['tl']), cta=s['cta'], painSub=s['painSub'], pains=pains(s['pains']),
           proofTitle=s['proofTitle'], proofSub=s['proofSub'], proof=body_proof,
           logos=logos_band(), compare=compare(), steps=steps(), pricing=pricing(s['tab']),
           guarantees=guarantees(), faq=faq_html, final=final(s), footer=FOOT, script=SCRIPT)

if __name__ == '__main__':
    for k in ORDER:
        out = os.path.join(ROOT, SERVICES[k]['file'])
        open(out, 'w', encoding='utf-8').write(page(k))
        print('✓', SERVICES[k]['file'], '%.0f KB' % (os.path.getsize(out)/1024))

# ── صفحة التجميع /platforms ──────────────────────────────────────────────
HUB_CSS = """
.svc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1.2rem;margin-top:3rem;text-align:start}
.svc{display:flex;flex-direction:column;gap:.7rem;text-decoration:none;border:1px solid var(--border);border-radius:22px;
  padding:1.9rem 1.7rem;background:linear-gradient(165deg,rgba(24,30,74,.62),rgba(15,20,52,.3));
  transition:transform .35s,border-color .35s,box-shadow .35s}
.svc:hover{transform:translateY(-8px);border-color:rgba(217,24,122,.5);box-shadow:0 26px 58px rgba(0,0,0,.45)}
.svc-ico{width:56px;height:56px;border-radius:16px;background:var(--grad);display:flex;align-items:center;justify-content:center;
  box-shadow:0 8px 24px rgba(217,24,122,.4)}
.svc-ico svg{width:29px;height:29px;fill:none;stroke:#fff;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.svc b{font-weight:900;font-size:1.2rem;color:#fbf3fb;line-height:1.5}
.svc p{color:#ddd0dd;font-weight:400;font-size:.92rem;line-height:1.85;flex:1;margin-bottom:.4rem}
.svc .shot-go{align-self:flex-start}
"""

def hub():
    cards = []
    for k in ORDER:
        s = SERVICES[k]
        cards.append('<a class="svc" href="%s"><span class="svc-ico"><svg viewBox="0 0 24 24">%s</svg></span>'
          '<b>%s</b><p>%s</p>%s</a>' % (s['url'], ICO[k], s['tab'], s['lead'], GO % 'اعرف التفاصيل'))
    faq_html, faq_items = faq_block([])
    title = "منصات ومتاجر وتطبيقات وأنظمة إدارة باسمك — Kareem Pro"
    desc = ("تصميم وبرمجة متاجر إلكترونية ومنصات تعليمية وأنظمة حجز مواعيد وبوابات عملاء ومنصات جمعيات "
            "ومدونات ربحية — باسمك وملكيتك الكاملة، بلا عمولة ولا اشتراك شهري.")
    ld = [{"@context":"https://schema.org","@type":"ItemList","name":"خدمات Kareem Pro","itemListElement":[
            {"@type":"ListItem","position":i+1,"name":SERVICES[k]['tab'],"url":SITE+SERVICES[k]['url']}
            for i,k in enumerate(ORDER)]},
          {"@context":"https://schema.org","@type":"FAQPage","mainEntity":[
            {"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}} for q,a in faq_items]}]
    ldhtml = '\n'.join('<script type="application/ld+json">%s</script>' % json.dumps(x, ensure_ascii=False, separators=(',',':')) for x in ld)
    msg = 'السلام عليكم، دخلت من صفحة الخدمات في موقع Kareem Pro وأريد الاستفسار 🙏'
    return """<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="theme-color" content="#0a0e26" />
<title>{title}</title>
<meta name="description" content="{desc}" />
<meta name="keywords" content="تصميم مواقع, إنشاء متجر إلكتروني, إنشاء منصة تعليمية, نظام حجز مواعيد, بوابة عملاء, منصة جمعية خيرية, إنشاء مدونة ربحية, برمجة تطبيقات" />
<meta name="robots" content="index, follow, max-image-preview:large" />
<meta name="geo.region" content="SA" />
<link rel="canonical" href="{site}/platforms" />
<link rel="icon" type="image/png" href="/logo-transparent.png" />
<link rel="preload" as="font" type="font/woff2" href="/FrutigerLTArabic55Roman.woff2" crossorigin />
<link rel="preload" as="font" type="font/woff2" href="/frutigerltarabic75black.woff2" crossorigin />
<meta property="og:title" content="{title}" />
<meta property="og:description" content="{desc}" />
<meta property="og:type" content="website" />
<meta property="og:locale" content="ar_SA" />
<meta property="og:site_name" content="Kareem Pro" />
<meta property="og:url" content="{site}/platforms" />
<meta property="og:image" content="{site}/og-banner.png" />
<meta name="twitter:card" content="summary_large_image" />
{ld}
{fonts}
<style>{css}{hubcss}</style>
</head>
<body>
<div id="prog"></div>
<nav>
  <a class="nav-logo" href="/">
    <img src="/logo-transparent.png" alt="Kareem Pro" width="36" height="36" />
    <div><b>KAREEM PRO</b><span>منصات · متاجر · تطبيقات</span></div>
  </a>
  <a class="nav-cta" href="{waurl}" target="_blank" rel="noopener">{wasvg}اطلب الآن</a>
</nav>

<header class="hero" id="top" style="padding-top:7rem">
  <div class="wrap">
    <span class="eyebrow"><span class="e-ico"><svg viewBox="0 0 24 24">{ico}</svg></span>خدماتنا الرقمية</span>
    <h1>نبني لك <span class="g-text">النظام الذي يشغّل عملك</span> .. باسمك وملكيتك</h1>
    <p class="lead">متجر إلكتروني · منصة تعليمية · نظام حجز مواعيد · بوابة عملاء · منصة جمعية · مدونة ربحية — اختر الأقرب لنشاطك.</p>
    <div class="svc-grid">{cards}</div>
    <div class="trust">
      <div><b data-count="11" data-prefix="+">0</b>سنة خبرة</div>
      <div><b data-count="50" data-prefix="+">0</b>جهة وثقت بنا</div>
      <div><b data-count="2000" data-prefix="+">0</b>عميل خدمناه</div>
      <div><b data-count="100" data-suffix="%">0</b>ملكية كاملة لك</div>
    </div>
  </div>
</header>

{logos}
{compare}
{steps}
{pricing}
{guarantees}
{faq}
<section class="rv"><div class="wrap"><div class="final">
  <h2>جاهز تبدأ <span class="g-text">مشروعك</span> ؟</h2>
  <p><span class="final-big">ابدأ باستشارة مجانية</span>
     <span class="final-sub">نفهم فكرتك ونعطيك تصورًا واضحًا بالمدة والتكلفة، بدون أي التزام.</span></p>
  <a class="btn btn-wa" href="{waurl}" target="_blank" rel="noopener">{wasvg}تواصل معنا الآن</a>
  <small>الرد خلال لحظات · فاتورة رسمية متاحة · تعاقد واضح قبل البدء</small>
</div></div></section>
{footer}
<a class="float" href="{waurl}" target="_blank" rel="noopener">{wasvg}تواصل معنا</a>
{script}
</body>
</html>
""".format(title=title, desc=desc, site=SITE, ld=ldhtml, fonts=FONTS, css=BASE_CSS, hubcss=HUB_CSS,
           waurl=wa(msg), wasvg=WA_SVG, ico=ICO['portal'], cards=''.join(cards),
           logos=logos_band(), compare=compare(), steps=steps(), pricing=pricing('الخدمات'),
           guarantees=guarantees(), faq=faq_html, footer=FOOT, script=SCRIPT)

if __name__ == '__main__':
    out = os.path.join(ROOT, 'platforms.html')
    open(out, 'w', encoding='utf-8').write(hub())
    print('✓ platforms.html (hub) %.0f KB' % (os.path.getsize(out)/1024))
