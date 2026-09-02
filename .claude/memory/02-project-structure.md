---
name: project-structure
description: بنية مستودع Kareem Pro والمعرّفات التقنية الثابتة وحدود المشروع. اقرأه قبل البحث عن أي ملف أو تعديل أي صفحة.
---

# بنية المشروع والمعرّفات

## الهوية

| البند | القيمة |
|---|---|
| المستودع | `https://github.com/KareemPro-Hub/KareemPro.git` |
| الفرع | `main` فقط (`nextjs-portal` فرع محلي قديم — لا يُستخدم ولا يُدمج) |
| النطاق | `https://kareempro.com` |
| الاستضافة | Vercel |
| DNS والتحقق | Cloudflare (سجل TXT للتحقق من Google Search Console — لا يُحذف) |

## بنية هجينة: ستاتيك + Next.js

- `public/index.html` — الموقع التسويقي، يُقدَّم على `/` عبر Rewrite في
  `next.config.mjs`. **ليس مولَّدًا** — يُعدَّل مباشرة.
- صفحات الخدمات الستاتيك في `public/` مع روابط نظيفة:
  `platforms` · `edu-platform` · `store` · `pos-system` · `booking` ·
  `portal-system` · `charity` · `blog`
  **مولَّدة** من `scripts/build_services.py` + `scripts/services_data.py` +
  `scripts/base.css`. عدّل المصدر ثم أعد التوليد — لا تعدّل الناتج يدويًا.
- `src/app/` — تطبيق Next.js: `/portal` و`/admin` و`/team` و`/auth` و`/preview`.
- `src/proxy.js` — حماية المسارات بجلسات Supabase.
- `supabase/schema.sql` — مخطط قاعدة البيانات.
- `design-preview/` — معاينات تصميم، خارج البناء.
- `_to_delete/` — ملفات مُبعدة بـ `mv` بدل الحذف.

## الهوية البصرية

خطوط Frutiger LT Arabic بأوزان 300/400/700/900 من `public/`.
متغيرات `:root`: `--g1 #FFA826` · `--g2 #FF5535` · `--g3 #D9187A` ·
`--dark #0a0e26`. لا تُغيَّر إلا بطلب صريح.

## التقنيات

Next.js 16.3.3 · React 19.2.8 · Supabase (`@supabase/ssr` و`@supabase/supabase-js`)
· Resend للبريد · `puppeteer-core` و`@sparticuz/chromium` لإيصالات PDF.

## متغيرات البيئة — الأسماء فقط، بلا أي قيم

`NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY` ·
`SUPABASE_SERVICE_ROLE_KEY` · `NEXT_PUBLIC_SITE_URL` · `RESEND_API_KEY` ·
`RESEND_FROM` · `ADMIN_NOTIFICATION_EMAIL`

لا توجد ملفات `.env*` محلية؛ القيم في Vercel.

## حدود المشروع — لا تخلط

هذا المستودع **لا يحتوي** كود «قدرات المغربي» ولا iHealth/Urs ولا تطبيق القرآن
ولا Kareem Wallet. قد تظهر أسماؤها كنماذج أعمال أو قوالب عروض داخل Kareem Pro،
وهذا لا يجعل أكوادها جزءًا من المشروع.
