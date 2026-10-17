# Geniura Web
المستودع العام لواجهة Geniura متعددة اللغات: منصة الوظائف، فضاء الباحث عن عمل، بوابة المؤسسات، والواجهات المصرح بها لفريق Geniura.

**الحالة الحالية: PHASE 0 + PHASE 1 على فرع dev — أساس تقني ونظام تصميم وتعدد لغات. لا اتصال بالـAPI ولا نشر بعد.** التفاصيل في [حالة التنفيذ](docs/06-WEB-FOUNDATION-STATUS.md) و[ADR 0001](docs/adr/0001-web-stack.md).

## حدود المستودع
- تقنية الواجهة: Next.js 16 + React 19 + TypeScript (انظر ADR 0001).
- مصدر الحقيقة وقواعد الأعمال والبيانات الخاصة في المستودع **الخاص** geniustep/geniura-api.
- يحظر نشر المفاتيح والبيانات الشخصية ووثائق المرشحين وأسرار API في هذا المستودع العام.
- لا ننسخ قواعد الصلاحيات إلى الواجهة كمصدر قرار؛ كل إذن يتحقق منه النظام الخلفي.

## الوثائق
- [ميثاق المنتج](docs/01-PRODUCT-CHARTER.md)
- [رحلات المستخدم](docs/02-USER-JOURNEYS.md)
- [عقد التكامل للواجهة](docs/03-INTEGRATION-BOUNDARY.md)
- [اللغات وإتاحة الوصول](docs/04-I18N-UX-ACCESSIBILITY.md)
- [القرارات ونطاق التنفيذ](docs/05-DECISIONS-AND-SCOPE.md)
- [حالة تنفيذ الواجهة](docs/06-WEB-FOUNDATION-STATUS.md)
- [ADR 0001 — حزمة تقنيات الواجهة](docs/adr/0001-web-stack.md)

## التشغيل المحلي
```bash
pnpm install
cp .env.example .env.local
pnpm dev            # http://localhost:3000 → /ar
pnpm check          # lint + format + typecheck + فحوص RTL والرسائل + اختبارات
pnpm build && pnpm test:e2e
```

## تنظيم العمل
الفرع الرئيسي main لوثائق/إصدارات معتمدة؛ فرع dev للعمل التطويري لاحقًا. لا يبدأ تطوير الواجهة قبل مراجعة العقد التقني ونطاق V1، ولا نشر للإنتاج دون موافقة صريحة.

الموقع: https://geniura.com — ذكر النطاق لا يعني أن التطبيق منشور.