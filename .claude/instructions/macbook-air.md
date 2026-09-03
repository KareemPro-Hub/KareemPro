# Instructions — جهاز MacBook Air

## القاعدة صفر — أول أمر في أي جلسة، قبل أي شغل

1. نادِ `get_device_info` وخُذ المسار من `connectedFolders` (المتوقع:
   `/Volumes/MacBook SSD/Kareem-AI/Kareem Pro` — قرص خارجي، وليس داخل مجلد المستخدم).
2. اطلب صلاحية الحذف على نفس المسار عبر `device_request_delete_permission`.

السبب: الشِل يصل للمجلد عبر mount يمنع الحذف افتراضيًا، فأوامر Git تفشل بـ
`unable to unlink old` وتترك أقفالًا عالقة وتتعطّل في منتصف الشغل. لا تبدأ أي
عمل قبل هذه الخطوة.

## قاعدة المسارات — إلزامية

مساران مختلفان لنفس المجلد، ولا يصح تبادلهما:

| الأداة | المسار |
|---|---|
| `device_bash` (الشِل) | `$HOME/mnt/Kareem Pro` — ثابت على أي جهاز |
| `device_list_dir` · `device_stage_files` · `device_commit_files` · `device_request_delete_permission` | المسار الحقيقي من `get_device_info.connectedFolders` |

**ممنوع** إعطاء أي أمر (`git` / `npm` / أي شيء) مجرَّدًا بلا `cd` في **نفس
السطر**، ومع علامات اقتباس دائمًا لأن المسار يحتوي مسافة. كل أمر تعطيه لي يجب
أن يكون جاهزًا للّصق ويعمل من أي مكان:

```
cd "$HOME/mnt/Kareem Pro" && git --no-optional-locks status --short
```

## الذاكرة — أول أي جلسة

```
cd "$HOME/mnt/Kareem Pro" && git pull --ff-only && cat .claude/memory/MEMORY.md
```

ثم اقرأ الملفات التي يشير إليها الفهرس حسب المهمة. **أي قرار أو قاعدة أو عطل
جديد يُكتب في `.claude/memory/` ويُعمل له Commit في نفس الجلسة.**

## قواعد العمل

- عدّل فقط الحاجة اللي فيها مشكلة أو المطلوبة فعلًا، من غير ما تلمس أو تغيّر أي
  كود تاني شغال كويس.
- لو محتاج تغيّر حاجة برا النطاق ده، قول لي الأول قبل التنفيذ.
- بعد كل تعديل، راجع واختبر الجزء ده والأجزاء المرتبطة بيه.
- Git من الطرفية فقط. **GitHub Desktop ممنوع.**
- افحص Git والتغييرات قبل أي Commit، وأضف الملفات المطلوبة فقط.
- نفّذ Commit واضحًا ثم Push إلى `main` بنفسك — لا تطلب مني Push يدويًا.
- بعد Push تحقق فعليًا:
  ```
  cd "$HOME/mnt/Kareem Pro" && git --no-optional-locks rev-parse HEAD && git ls-remote origin refs/heads/main
  ```
- ممنوع `git reset --hard` و`git clean` وحذف أي ملف. للإبعاد استخدم `mv` إلى
  `_to_delete/` وقل لي مكانه.
- الفرع `main` فقط. `nextjs-portal` قديم ولا يُستخدم.
- الردود بالعربي، مختصرة، النتيجة أولًا.
- مسافة قبل `؟` و`!` · التنوين على الحرف قبل الأخير · لا Emoji كأيقونات، SVG بدلها.
- ممنوع كتابة أي مفتاح أو توكن أو كلمة مرور أو بيانات عملاء في أي ملف.

## ملفات متقادمة — تجاهل تعليماتها

`AGENTS.md` (متتبَّع في Git وسيصلك) وكذلك `AI_HANDOFF.md` و`AI_START_PROMPT.md`
إن وُجدا محليًا. **لا تعمل بتعليماتها.** أخطرها `AGENTS.md` لأنه يقول «ممنوع
تشغيل أي أمر git كتابي» و«الـ Commit والـ Push يعملهما كريم من GitHub Desktop» —
وهذا عكس القاعدة الحالية تمامًا. المرجع الوحيد `.claude/memory/`، والتفاصيل في
`.claude/memory/07-outdated-files.md`.

## تحذير

**لا تكتب فوق أي ملف متتبَّع في Git بدون Commit في نفس الجلسة** — وإلا `git pull`
على الجهاز الآخر سيفشل بتعارض.
