# عقد الـAPI للواجهة

`openapi.web.v1.yaml` نسخة مشتقة من عقد geniura-api (المستودع الخاص) ومثبّتة على commit محدد.
لا تحتوي كود Backend، بل شكل الطلبات والاستجابات العامة فقط.

## ما يحدث عند البناء
`scripts/contract/build-web-contract.mjs`:
1. يحذف مسارات فريق Geniura الداخلية (`/api/v1/staff/`).
2. يطبّق تصحيحات موثقة في `overrides.json` لسلوك تحققنا منه في الكود وعلى نسخة محلية غير معدّلة من الخادم:
   - 13 قائمة تعيد `{count, next, previous, results}` بينما يصفها العقد كمصفوفة.
   - 4 قوائم قاموس تعيد `{count, results, locale}`.
   - مخطط موحّد للأخطاء `ErrorResponse` مضاف كاستجابة `default` لكل عملية.
3. يحذف المخططات غير المستعملة، ويكتب `source.json` (commit المصدر، SHA-256 للمدخل والمخرج).

كل تصحيح يجب أن يُصلح في geniura-api ثم يُحذف من `overrides.json`. السكربت يفشل إذا أصبح المسار
المصحَّح موصوفًا بشكل مختلف في المصدر، حتى لا يبقى تصحيح قديم.

## التحديث
```bash
# من نسخة محلية من geniura-api على الـcommit المطلوب
pnpm api:contract ../geniura-api/docs/openapi/openapi.yaml <commit>
pnpm api:generate
pnpm check
```
ثم طلب دمج يراجعه إنسان. CI يعيد التوليد ويفشل إذا اختلف `lib/api/generated` عن العقد المثبّت.

## حماية العقد من تسريب واجهات فريق Geniura
يُستبعد كل مسار تحت `/api/v1/staff/` وأي عملية تحمل وسمًا ينتهي بـ`(staff)` حتى لو كانت خارج هذا المسار؛ مثال ذلك تنزيل وثائق تحقق المؤسسات عبر `/api/v1/files/verification-documents/{token}`. يجب تشغيل المولد من نسخة محلية موثوقة من مستودع Backend الخاص، ثم مراجعة عدد المسارات والمخططات المصدّرة واختبار التطابق بعد تشغيل Orval. لا يُنشر أصل OpenAPI الخاص كاملًا في المستودع العام.

## مزامنة 2026-10-18 — geniura-api@4d8472c3
- العقد الحالي: **113 مسارًا، 149 عملية** و224 مخططًا، مصدره Backend commit `4d8472c33a92b387f21e7107f714c325a4fbe2f8`.
- `source.json.sourceSha256` يطابق **مدخل OpenAPI عامًا مصفّى** أنشئ للتوليد؛ ليس بصمة الملف الأصلي الكامل في المستودع الخاص. بصمة Git blob الأصلية متاحة في `upstreamGitBlobSha`. لا يُنشر الملف الأصلي أو مخططات الإدارة الداخلية في هذا المستودع.
- ملفات `lib/api/generated` مولّدة عبر Orval 8.43.0 وتخضع لفحص إعادة التوليد في CI.
- لا يزال `contracts/overrides.json` يطبّق 13 تصحيح ترقيم صفحات، و4 تصحيحات قواميس، وغلاف الأخطاء؛ لم تتغير هذه العقود في مصدر Backend.
- تنزيل ملف تحقق المؤسسة الموقّع مخصص لفريق الثقة، لذلك يبقى مستبعدًا من عقد الواجهة العامة.

## مزامنة 2026-10-19 — geniura-api@ec0890a5 (الملف المهني v1.1)
- المصدر: فرع `feat/candidate-profile-v1-1` في geniura-api، commit `ec0890a5ae22a7f07bcd870add6540aa776a464f`.
- العقد: **114 مسارًا، 150 عملية**. الجديد: `GET /api/v1/candidates/me/access-log`، و`completeness.has_shareable_resume`،
  و`existing_object` على عناصر الاستخراج مع إجراء المراجعة `update_existing`، و`expires_at` وحالة `expired` لطلبات المشاركة،
  و`organization_name` على الموافقات.
- التزامن التفاؤلي: Django يعيد `ETag` ويقبل `If-Match` على `PATCH /candidates/me` وعلى عناصر الملف؛ الـBFF يمرر
  `If-Match` ذهابًا و`ETag` إيابًا. التعارض يعود `412 precondition_failed`.
- `source.json.sourceSha256` هنا بصمة الملف الخاص الكامل عند هذا الـcommit (البصمة فقط؛ الملف نفسه غير منشور).

## مزامنة 2026-10-31 — مسودة السيرة للضيف
- المصدر: geniura-api commit `5b14e360eec32b308d6b52b4eadb7cbf89957e22`، عبر `manage.py spectacular` من الشفرة نفسها، وليس لقطة `docs/openapi/openapi.yaml` القديمة.
- العقد: **118 مسارًا و156 عملية**. أضيفت مسارات الضيف الأربعة وولّد عميل Orval مجددًا.
- `sourceSha256` بصمة المخطط المولد الكامل، و`outputSha256` بصمة النسخة العامة المصفاة. لم يُنشر المخطط الخاص.
- حُفظت واجهة تحقق صغيرة فوق العميل المولد في `lib/api/guest-cv.ts` لفحص الاستجابات قبل عرض بيانات المسودة.
