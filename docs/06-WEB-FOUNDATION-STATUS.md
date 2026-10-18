# حالة تنفيذ الواجهة — PHASE 0 → 3 (2026-10-17، الفرع dev)

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
| CI (lint، تنسيق، فحوص، اختبارات، build، audit، E2E) بلا أسرار وبلا نشر | IMPLEMENTED · TESTED | `.github/workflows/ci.yml`؛ نجاح المهمتين quality وe2e على `8773893` في [التشغيل 39072732925](https://github.com/geniustep/geniura-web/actions/runs/39072732925) |
| اللغات الأربع وترتيبها | APPROVED (2026-10-18) | `ar,fr,en,es` في `lib/i18n/config.ts` مع `messages/en.json` و`messages/es.json`؛ يتبقى اعتمادها في geniura-api |
| الهوية البصرية (ألوان، خط، شعار) | APPROVED — الاتجاه A «Nuit» (2026-10-18) | الأزرق البحري والعاجي والذهبي على الداكن فقط، وأزرق للإجراء الرئيسي؛ Readex Pro وBricolage Grotesque للعناوين وIBM Plex للنصوص (`styles/globals.css`، `styles/fonts.ts`)؛ الشعار الأصلي دون تعديل |
| Sentry / Storybook / الوضع الداكن المرئي | DEFERRED | ADR 0001 (CSP نُفّذت في PHASE 2) |
| **PHASE 2** — عقد API مصفّى ومثبّت (geniura-api@4d8472c3) مع تصحيحات موثقة | IMPLEMENTED | `contracts/`؛ 113 مسارًا، 149 عملية |
| عميل مولّد (Orval: fetch + TanStack Query + Zod) وفحص التطابق في CI | IMPLEMENTED | `lib/api/generated`، خطوة CI |
| النقل: CSRF، credentials، تجديد الرمز، أخطاء موحدة مع مرجع دعم | IMPLEMENTED · TESTED | `tests/unit/api.test.ts` |
| الدخول، التسجيل، نسيت كلمة المرور، إعادة التعيين، تأكيد البريد، حسابي، الجلسات وإنهاؤها، الخروج | IMPLEMENTED · TESTED | E2E عام + `tests/integration` ضد geniura-api محلي (8/8) |
| حماية الصفحات الخاصة من Django، `no-store`، منع open redirect، CSP | IMPLEMENTED · TESTED | E2E + integration |
| اختبارات التكامل مع Backend في CI | DEFERRED | المستودع الخلفي خاص؛ تُشغّل محليًا (`pnpm test:integration`) |
| مزامنة OpenAPI وتصحيح CSRF | IMPLEMENTED · TESTED | `contracts/source.json` و`lib/api/generated`؛ بقية تصحيحات pagination مؤجلة للمصدر |
| النطاقان geniura.com / api-geniura.geniura.com | Approved (صاحب المشروع) | إعدادات النشر في ADR 0002 للواجهة |
| **PHASE 3** — بحث الوظائف بفلاتر في URL، ترقيم صفحات، درج فلاتر للهاتف، حالات فارغة وتعطل | IMPLEMENTED · TESTED | E2E عام (دون Backend) + integration |
| تفاصيل الوظيفة: لغة/اتجاه الإعلان، المتطلبات، المؤسسة، الإبلاغ المجهول | IMPLEMENTED · TESTED | integration (بلاغ حقيقي 201) |
| JobPosting JSON-LD، canonical بلغة الإعلان، sitemap، 404 حقيقية للوظائف غير المتاحة | IMPLEMENTED · TESTED | unit + integration (Googlebot ← 404) |
| تخزين عام فقط (`'use cache'`، دقائق/ساعات) دون أي بيانات جلسة | IMPLEMENTED | ADR 0003 |
| التسميات من أول 50 قيمة في القاموس | مؤقت | بانتظار تسميات مضمّنة (البند 7) |
| slug، webhook الإبطال، البحث المحفوظ، facets | بانتظار Backend | `docs/07-BACKEND-COORDINATION.md` |
| النشر والإنتاج | خارج النطاق | لا نشر دون موافقة صريحة |

## التحقق المحلي
```bash
pnpm install
pnpm check          # lint + format + typecheck + check:css + check:messages + test
pnpm build
pnpm test:e2e       # يتطلب متصفح Chromium من Playwright
# تكامل كامل ضد geniura-api محلي (بيانات اصطناعية):
GENIURA_API_URL=http://localhost:8000 GENIURA_API_LOG=<سجل Django> pnpm test:integration
```
