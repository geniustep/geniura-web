# ADR 0001 — حزمة تقنيات الواجهة

- التاريخ: 2026-10-17 — الحالة: Accepted (technical) بموافقة صاحب المشروع على بدء PHASE 0 وPHASE 1.
- المرجع: تقرير «دراسة تقنية ومعمارية واجهة Next.js» (2026-10-17).

## القرار
- **Next.js 16.4.2** (App Router) مع `cacheComponents` و`partialPrefetching` و`reactCompiler`، على Node.js runtime فقط.
- **React 19.3.1**، **TypeScript 6.0** بوضع صارم (`strict`، `noUncheckedIndexedAccess`).
  لا TypeScript 7 حاليًا: typescript-eslint لا يدعم إلا `<6.1`.
- **Tailwind CSS 4.3** مع رموز تصميم في `styles/globals.css`، ومكونات على نمط shadcn مبنية على **Base UI 1.9**
  ومملوكة داخل المستودع (`components/ui`).
- **next-intl 4.14** مع بادئة لغة دائمة (`/ar`، `/fr`). قائمة اللغات **مؤقتة** (`ar,fr` كما في `GENIURA_LOCALES`
  الخلفي) إلى حين اعتماد اللغات الأربع.
- الخطوط ذاتية الاستضافة من `@fontsource` (IBM Plex Sans Arabic + IBM Plex Sans) — **هوية مؤقتة**.
- الجودة: ESLint 10 + eslint-config-next، Prettier، Vitest 5 + Testing Library، Playwright + axe-core.
- مدير الحزم: pnpm 10 (`packageManager`)، وNode 24 في CI (`.nvmrc`).

## قواعد ملزمة
- Django (geniura-api) هو مصدر الحقيقة للبيانات والصلاحيات؛ لا قواعد أعمال ولا اتصال بقاعدة البيانات من الواجهة.
- `proxy.ts` للتفاوض على اللغة فقط، وليس طبقة تفويض.
- لا تخزين مؤقت على الخادم لأي بيانات مرتبطة بجلسة (يُفعّل مع PHASE 2).
- خصائص CSS منطقية فقط (`ms-`/`me-`/`start-`/`end-`)؛ يفرضها `pnpm check:css`.
- رموز API (الحالات، المصادر) لا تُترجم في API؛ تسمياتها في `messages/*.json`، ويفحص التطابق `pnpm check:messages`.
- لا فهرسة قبل الإطلاق: `NEXT_PUBLIC_ALLOW_INDEXING=false` افتراضيًا (robots يمنع كل شيء و`noindex`).

## مؤجل عمدًا
- Sentry ومراقبة الأخطاء: بعد قرار موقع استضافة البيانات.
- Content-Security-Policy: في PHASE 2 بعد معرفة نطاق الـAPI وتقسيم الصفحات (ثابتة/دينامية).
- Storybook: صفحة `/[locale]/design-system` الداخلية تغطي مراجعة PHASE 1 حاليًا.
- TanStack Query وnuqs وOrval: مع PHASE 2–3.
