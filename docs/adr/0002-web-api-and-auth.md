# ADR 0002 — ربط الـAPI والمصادقة في الواجهة

- التاريخ: 2026-10-17 — الحالة: Accepted (technical)، بقرارات صاحب المشروع: نسخة عقد مصفّاة،
  تصحيحات موثقة في نسخة الواجهة، والنطاقان `geniura.com` و`api.geniura.com`.
- يكمّل ADR 0002 في geniura-api (جلسات Django + CSRF).

## القرار
- **العقد:** `contracts/openapi.web.v1.yaml` (انظر `contracts/README.md`)، مصدره geniura-api@239ebd9.
- **العميل:** Orval 8 يولّد أنواع TypeScript ودوال fetch وHooks لـ TanStack Query ومخططات Zod في
  `lib/api/generated` (لا تعديل يدوي؛ CI يتحقق من التطابق).
- **النقل:** `lib/api/fetcher.ts` واحد للخادم والمتصفح:
  - المتصفح يستدعي `NEXT_PUBLIC_API_BASE_URL` مباشرة مع `credentials: include`.
  - الطرق غير الآمنة ترسل قيمة Cookie `geniura_csrftoken` في `X-CSRFToken`؛ عند رفض CSRF يُجدَّد الرمز
    مرة واحدة ويعاد الطلب.
  - الأخطاء تتحول إلى `ApiError {status, code, message, details, request_id}`؛ الواجهة تترجم `code`
    ولا تعرض `message` الخام، وتعرض `request_id` كمرجع دعم.
- **الخادم:** `lib/api/server.ts` (`server-only`) يمرّر Cookie الجلسة وCSRF فقط، ولا يُستعمل داخل `'use cache'`.
  الصفحات الخاصة تسأل Django عن الجلسة (`/auth/me`) داخل Suspense وتعيد التوجيه إلى الدخول إن لم توجد.
  `proxy.ts` ليس طبقة تفويض.
- **الذاكرة المؤقتة:** لا تخزين على الخادم لبيانات الجلسة؛ `/[locale]/account/**` ترسل
  `Cache-Control: private, no-store`؛ `queryClient.clear()` عند الدخول والخروج.
- **الترويسة:** حالة المستخدم في مكوّن عميل، حتى تبقى قشرة الصفحات العامة ثابتة ومشتركة دون أي بيانات شخصية.
- **روابط البريد:** Django يرسل `/verify-email?token=…` و`/reset-password?uid=…&token=…` دون لغة؛ `proxy.ts`
  يضيفها. التأكيد يتطلب نقرة (POST) ولا يحدث بمجرد فتح الرابط.
- **CSP:** ثابتة بلا nonce (للحفاظ على القشرة الثابتة)، تسمح بالاتصال بالموقع وأصل الـAPI فقط، وتمنع
  الإطار والإضافات. `'unsafe-inline'` للسكربتات قيد معروف حتى اعتماد SRI.

## شروط النشر (لوكيل النشر/Backend)
- `SESSION_COOKIE_DOMAIN=.geniura.com` (ومعه CSRF_COOKIE_DOMAIN): بدونه لا يستطيع JavaScript على
  `geniura.com` قراءة رمز CSRF، ولا يصل Cookie الجلسة إلى خادم Next.js، فتتعطل المصادقة.
- `CORS_ALLOWED_ORIGINS` و`CSRF_TRUSTED_ORIGINS` = `https://geniura.com`.
- `NEXT_PUBLIC_API_BASE_URL=https://api.geniura.com` وقت البناء.

## مؤجل
- MSW للاختبارات على مستوى المكونات (الاختبارات الحالية تحاكي `fetch` مباشرة وتغطي التكامل الحقيقي محليًا).
- MFA (Backend، قبل الإطلاق لحسابات فريق Geniura).
