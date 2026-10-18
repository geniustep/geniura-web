# ADR 0002 — ربط الـAPI والمصادقة في الواجهة

- التاريخ: 2026-10-17 — الحالة: Accepted (technical)، بقرارات صاحب المشروع: نسخة عقد مصفّاة،
  تصحيحات موثقة في نسخة الواجهة، والنطاقان `geniura.com` و`api-geniura.geniura.com`.
- يكمّل ADR 0002 في geniura-api (جلسات Django + CSRF).

## القرار
- **العقد:** `contracts/openapi.web.v1.yaml` (انظر `contracts/README.md`)، مصدره geniura-api@239ebd9.
- **العميل:** Orval 8 يولّد أنواع TypeScript ودوال fetch وHooks لـ TanStack Query ومخططات Zod في
  `lib/api/generated` (لا تعديل يدوي؛ CI يتحقق من التطابق).
- **النقل:** `lib/api/fetcher.ts` واحد للخادم والمتصفح:
  - المتصفح يستدعي `NEXT_PUBLIC_API_BASE_URL` مباشرة مع `credentials: include`.
  - الطرق غير الآمنة تستعمل قيمة `csrf_token` المقنّعة المعادة في JSON من `GET /auth/csrf`
    ضمن `X-CSRFToken` (بدون قراءة Cookie محصورة بمضيف API)؛ عند رفض `csrf_failed` يُجدَّد الرمز
    مرة واحدة ويعاد الطلب، وبعد الدخول والخروج يُنسى الرمز القديم ليُجلب عند الطلب التالي.
    حتى تحديث Staging يُقبل شكل الخطأ القديم `permission_denied` فقط إذا تطابق نص CSRF.
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
- لا يلزم توسيع `CSRF_COOKIE_DOMAIN` لقراءة CSRF: رمز JSON يعمل مع Cookie محصورة بمضيف API.
- الصفحات الخاصة التي تتحقق من الجلسة داخل خادم Next.js لا تستطيع استلام Cookie جلسة محصورة بمضيف API؛
  تظل هذه الوظيفة معطلة تشغيليًا حتى اعتماد نطاق جلسة مناسب بعد مراجعة أمنية أو استخدام BFF.
- معاينات Vercel على `vercel.app` تقع خارج موقع `geniura.com`، ولا يُعد دخول حقيقي بواسطة
  Cookies `SameSite=Lax` فيها اختبارًا صحيحًا؛ استخدم نطاق معاينة تابعًا لـ`geniura.com` أو BFF لاحقًا.
- `CORS_ALLOWED_ORIGINS` و`CSRF_TRUSTED_ORIGINS` = `https://geniura.com`.
- `NEXT_PUBLIC_API_BASE_URL=https://api-geniura.geniura.com` وقت البناء.

## مؤجل
- MSW للاختبارات على مستوى المكونات (الاختبارات الحالية تحاكي `fetch` مباشرة وتغطي التكامل الحقيقي محليًا).
- MFA (Backend، قبل الإطلاق لحسابات فريق Geniura).

## شرط التحقق المتكامل
- النسخة الجديدة من Django على `geniura-api/dev` تعيد `csrf_failed` لكل رفض CSRF، وتستعمل Cookie
  `geniura_csrftoken` محصورة بمضيف API و`HttpOnly`، مع تسليم الرمز مقنّعًا في JSON.
- لا يمكن اعتبار تسجيل الدخول متكاملًا على `vercel.app` أو API ما زال يعيد 503.
- لا تغيّر `SESSION_COOKIE_DOMAIN` إلى `.geniura.com` قبل مراجعة أمنية للنطاقات الفرعية
  والتحقق من إطلاق نطاق الواجهة؛ البديل BFF يحتاج تنفيذًا وتدقيقًا منفصلًا.
- ينبغي تجديد `contracts/openapi.web.v1.yaml` و`lib/api/generated` معًا بواسطة
  `pnpm api:contract` و`pnpm api:generate` على نسخة محلية من عقد Backend الأحدث، قبل تجميد V1.
