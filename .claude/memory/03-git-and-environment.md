---
name: git-and-environment
description: كيف تُشغَّل أوامر Git من ساندبوكس Cowork، سلوك الأقفال، شرط التوكن للـ Push، وقيود البناء. اقرأه قبل أول أمر Git في أي جلسة.
---

# Git والبيئة

## القاعدة صفر — قبل أي شيء

مجلد المشروع يصل للساندبوكس عبر mount **يمنع الحذف افتراضيًا**. النتيجة: أوامر
Git تنجح في إنشاء ملفات القفل وتفشل في حذفها، فتظهر تحذيرات
`unable to unlink` ويعلق `.git/HEAD.lock` ويتعطّل العمل في منتصفه.

**أول أمر في أي جلسة، قبل أي شغل**: اطلب صلاحية الحذف على المجلد الموصّل عبر
`device_request_delete_permission`.

## إن لم تُمنح الصلاحية

- القراءة دائمًا بـ `git --no-optional-locks` (status / log / diff) — لا تُنشئ أقفالًا.
- `git add` و`commit` ينجحان (يعتمدان على rename) لكن يتركان تحذيرات وأحيانًا قفلًا.
- بعد كل commit: افحص `ls .git/*.lock`، وإن وُجد قفل **انقله** بـ `mv` إلى
  `.git/stale_locks/` — **لا تحذفه**.

## Push — يحتاج توكن

الساندبوكس بلا credential helper وبلا Keychain، فـ `git push` العادي يفشل بـ
`could not read Username`. الحل: GitHub PAT بصلاحية `repo` يُمرَّر في رابط الـ
remote **لمرة واحدة داخل الأمر نفسه**:

```
cd "<مسار المشروع>" && git push "https://<TOKEN>@github.com/KareemPro-Hub/KareemPro.git" main:main
```

**ممنوع** حفظ التوكن في `.git/config` أو في أي ملف أو في هذه الذاكرة. يُطلب من
كريم عند الحاجة، ويُحذف من GitHub بعد انتهاء العمل.

## التحقق من وصول الـ Push

```
cd "<مسار المشروع>" && git --no-optional-locks rev-parse HEAD && git ls-remote origin -h refs/heads/main
```

الاثنان متطابقان = وصل فعلًا. نجاح أمر الـ push وحده ليس دليلًا.

## البناء لا يعمل داخل الساندبوكس

`npm run build` يفشل: Next يحاول تنزيل حزمة SWC لمعمارية linux-arm64 والشبكة
مقفولة. البديل لفحص سلامة أي ملف JS/JSX:

```
cd "<مسار المشروع>" && node -e "const b=require('./node_modules/next/dist/compiled/babel/bundle.js');const p=b.parser();const fs=require('fs');p.parse(fs.readFileSync('<الملف>','utf8'),{sourceType:'module',plugins:['jsx']});console.log('PARSE OK')"
```

وللمنطق الخالص (مثل `src/lib/timeline.js`) يُشغَّل بـ
`node --input-type=module -e "import { ... } from './src/lib/....js'; ..."`.

## بقايا في `.git`

يوجد نحو 194 ملف قفل قديم ومجلد `.git/stale_locks/`. غير ضارة وGit يتجاهلها.
**لا تنظّفها في مهمة عادية.**

## ملفات لا تُحذف رغم أسمائها

`_testfile_del.txt` و`_to_delete/packageStages.js.bak` متتبَّعان فعليًا في Git.

## مسارات المشروع على أجهزة كريم

| الجهاز | مسار القرص | مسار الشِل |
|---|---|---|
| `kareem-mac-local` | `/Users/KareemMac/Documents/AI/Kareem Pro` | `$HOME/mnt/Kareem Pro` |
| MacBook Air | `/Volumes/MacBook SSD/Kareem-AI/Kareem Pro` (قرص خارجي) | `$HOME/mnt/Kareem Pro` |

مسار الشِل واحد على أي جهاز لأن الـ mount يستخدم اسم المجلد لا مساره.

## عطل البروكسي على بعض الأجهزة

على MacBook Air كان `git fetch` و`git ls-remote` يفشلان بـ
`could not read Username` رغم أن الوصول لا يحتاج مصادقة — السبب بروكسي
الساندبوكس مع HTTP/2 وبروتوكول Git v2.

الحل، يُضبط مرة واحدة لكل نسخة محلية:

```
cd "$HOME/mnt/Kareem Pro" && git config protocol.version 0 && git config http.version HTTP/1.1
```
