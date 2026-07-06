# Maintenance Store - GitHub Pages Version

هذه هي النسخة النظيفة المناسبة للرفع على GitHub Pages.

## الملفات المطلوبة للنشر

ارفع محتويات هذا المجلد كما هي إلى repository في GitHub:

- `index.html`
- `app.js`
- `styles.css`
- `config.js`
- `github-storage.js`
- `assets/`
- `data/application-data.json`

## ملاحظة مهمة

GitHub Pages يستضيف ملفات ثابتة فقط، ولا يشغل خادم لحفظ البيانات.
لذلك هذه النسخة تستخدم Supabase لحفظ البيانات المشتركة بين المستخدمين.

## إعداد Supabase

1. أنشئ مشروعاً مجانياً في Supabase.
2. افتح SQL Editor.
3. شغل ملف `supabase-schema-for-github-pages.sql`.
4. من Project Settings > API انسخ:
   - Project URL
   - anon public key
5. افتح `config.js` وضع القيم في:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

لا تضع service_role key داخل `config.js`.

## إعداد GitHub Pages

1. أنشئ repository جديداً في GitHub.
2. ارفع ملفات هذا المجلد إلى جذر repository.
3. من Settings > Pages:
   - Source: Deploy from a branch
   - Branch: main
   - Folder: /root
4. بعد دقائق سيظهر رابط مثل:
   `https://USERNAME.github.io/REPOSITORY/`

## تنبيه أمني

هذه طريقة مناسبة للتجربة الداخلية المبدئية. أي شخص لديه رابط التطبيق يمكنه استخدام نفس صلاحية الحفظ إذا كانت سياسة Supabase مفتوحة كما في ملف SQL.
للاستخدام النهائي أو البيانات الحساسة، الأفضل نقل الحفظ إلى خادم Node.js مثل نسخة Render السابقة أو إضافة نظام دخول حقيقي من Supabase.
