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
