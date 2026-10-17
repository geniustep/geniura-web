# حالة تنفيذ الواجهة — PHASE 0 + PHASE 1 (2026-10-17، الفرع dev)

المفاتيح: **IMPLEMENTED** (كود موجود) · **TESTED** (اختبار آلي ناجح) · **DEFERRED** (مؤجل) · **NOT APPROVED** (قرار غير متخذ).

| البند | الحالة | الدليل |
|---|---|---|
| مشروع Next.js 16.4 / React 19.3 / TypeScript 6 strict | IMPLEMENTED · TESTED | `pnpm build` و`pnpm typecheck` |
| Cache Components + Partial Prefetching + React Compiler | IMPLEMENTED · TESTED | `next.config.ts`؛ `/ar` و`/fr` مولّدتان ثابتتين في البناء |
| توجيه اللغات `/ar` `/fr`، `lang`/`dir`، تفاوض Accept-Language، 404 محلية | IMPLEMENTED · TESTED | `tests/e2e/foundation.spec.ts` |
| تبديل اللغة مع الحفاظ على الصفحة | IMPLEMENTED · TESTED | E2E |
| رموز التصميم ومكونات ui/patterns وصفحة design-system (غير مفهرسة) | IMPLEMENTED · TESTED | Vitest + E2E |
| إتاحة الوصول (axe: لا مخالفات serious/critical، WCAG 2.2 AA) على الرئيسية بالاتجاهين | TESTED | E2E desktop + mobile |
| قائمة الهاتف (Dialog: تركيز، Escape) | IMPLEMENTED · TESTED | E2E mobile |
| رؤوس الأمان، إخفاء `x-powered-by` | IMPLEMENTED · TESTED | E2E |
| منع الفهرسة قبل الإطلاق (robots + `noindex`) | IMPLEMENTED · TESTED | E2E |
| فحص الخصائص المنطقية (RTL) وتطابق ملفات الرسائل | IMPLEMENTED | `pnpm check:css`، `pnpm check:messages` |
| CI (lint، تنسيق، فحوص، اختبارات، build، audit، E2E) بلا أسرار وبلا نشر | IMPLEMENTED | `.github/workflows/ci.yml` |
| اللغات الأربع وترتيبها | NOT APPROVED | `ar,fr` مؤقتًا في `lib/i18n/config.ts` |
| الهوية البصرية (ألوان، خط، شعار) | NOT APPROVED | قيم مؤقتة موسومة في الكود |
| Sentry / CSP / Storybook / الوضع الداكن المرئي | DEFERRED | ADR 0001 |
| أي اتصال بالـAPI أو مصادقة أو بيانات حقيقية | DEFERRED | PHASE 2، بعد إصلاح عقد OpenAPI في Backend |
| النشر والإنتاج | خارج النطاق | لا نشر دون موافقة صريحة |

## التحقق المحلي
```bash
pnpm install
pnpm check          # lint + format + typecheck + check:css + check:messages + test
pnpm build
pnpm test:e2e       # يتطلب متصفح Chromium من Playwright
```
