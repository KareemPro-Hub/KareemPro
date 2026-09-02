> ## ⚠ هذا الملف متقادم — لا تعمل بتعليماته
>
> المرجع الوحيد لقواعد العمل وسياق المشروع هو **`.claude/memory/`**، ونقطة
> البداية `.claude/memory/MEMORY.md`.
>
> **الملغى تحديدًا في هذا الملف**: قاعدة «ممنوع تشغيل أي أمر git كتابي» و«الـ
> Commit والـ Push يعملهما كريم من GitHub Desktop». التوجيه الحالي عكسها:
> Git من الطرفية فقط، وGitHub Desktop **ممنوع**، وClaude ينفّذ الـ Commit
> والـ Push بنفسه ثم يتحقق من التطابق مع الفرع البعيد.
>
> ما يبقى صالحًا هنا: وصف بنية المشروع ومتغيرات الهوية. التفاصيل في
> `.claude/memory/07-outdated-files.md`.

## Imported Claude Cowork project instructions

## Git من داخل الساندبوكس (Cowork / Claude Code) — قاعدة إلزامية

مجلد المشروع متصفّح من بيئة لينكس معزولة عبر mount. الـ mount ده **بيسمح بإنشاء الملفات
لكن بيرفض حذفها** (`unlink → Operation not permitted`) داخل `.git/`.

النتيجة: أي أمر git بيعمل قفل مؤقت (`.git/index.lock` أو `.git/HEAD.lock`) بينجح في إنشائه
ويفشل في حذفه، فيفضل القفل عالق. وبعدها **GitHub Desktop بيبقى مش شايف أي تغييرات
ومش بيقول السبب** — الشاشة بتفضل فاضية وكأن مفيش تعديلات.

### القواعد

1. **ممنوع تمامًا تشغيل أي أمر git كتابي من الساندبوكس**
   (`git add` / `commit` / `push` / `pull` / `checkout` / `stash` / `merge` / `rm --cached`).
   حتى لو المستخدم طلب "انشر" أو "اعمل Commit" — الرد الصحيح إنك تجهّز الملفات
   وتقوله إنها جاهزة، **مش تشغّل git**. كل أمر كتابي بيسيب قفل عالق وبيكسر
   GitHub Desktop في المرة اللي بعدها.

   **دور Claude ينتهي عند تعديل الملفات.** الـ Commit والـ Push بيعملهم كريم
   بنفسه من **GitHub Desktop**.

   في نهاية أي شغل، Claude يسلّم:
   - قائمة الملفات اللي اتعدّلت
   - رسالة Commit جاهزة للنسخ

2. **قراءة حالة الريبو تكون بـ `--no-optional-locks` دايمًا** — دي مش بتنشئ أي قفل:

   ```
   git --no-optional-locks status --short
   git --no-optional-locks log --oneline -5
   git --no-optional-locks diff --stat
   ```

   أي `git status` أو `git diff` عادي (من غير الفلاج) بيسيب `index.lock` عالق.

3. **لو اتقفل الريبو فعلاً** (GitHub Desktop مش شايف تعديلات) — الحل من Terminal الماك:

   ```
   rm -f ~/Documents/Ai/"Kareem Pro"/.git/*.lock
   ```

   ثم إعادة تشغيل GitHub Desktop.

4. مجلد `.git` فيه بقايا أقفال قديمة (`HEAD.lock.old_*`, `index.lock.old_*`, `stale_locks/`)
   من مرات سابقة. غير ضارة وgit بيتجاهلها، لكن ممكن تتحذف من الماك وقت التنظيف.

## بنية المشروع

- الموقع التسويقي صفحة ستاتيك واحدة: `public/index.html` — بتتقدّم على `/` عبر rewrite في `next.config.mjs`.
- صفحات الهبوط المخصصة ستاتيك برضه في `public/` + rewrite لرابط نظيف
  (مثال: `public/edu-platform.html` → `/edu-platform`).
- تطبيق Next.js بيغطي `/portal` و`/admin` و`/auth` تحت `src/app/`.
- الباقات الافتراضية للعملاء متعرّفة في `src/app/admin/actions.js` ثابت `DEFAULT_PACKAGES` —
  أي سعر معروض في الموقع لازم يطابقه.
- الخطوط: Frutiger LT Arabic (300/400/700/900) من `public/`. متغيرات الهوية في `:root`:
  `--g1 #FFA826` · `--g2 #FF5535` · `--g3 #D9187A` · `--dark #0a0e26`.
