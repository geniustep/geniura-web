# ADR 0002 — ربط الـAPI والمصادقة في الواجهة

- التاريخ: 2026-10-17 — الحالة: Accepted (technical)، بقرارات صاحب المشروع: نسخة عقد مصفّاة،
  تصحيحات موثقة في نسخة الواجهة، والنطاقان `geniura.com` و`api-geniura.geniura.com`.
- يكمّل ADR 0002 في geniura-api (جلسات Django + CSRF).

## القرار
- **العقد:** `contracts/openapi.web.v1.yaml` (انظر `contracts/README.md`)، مصدره geniura-api@4d8472c3 (مزامنة 2026-10-18).
- **العميل:** Orval 8 يولّد أنواع TypeScript ودوال fetch وHooks لـ TanStack Query ومخططات Zod في
  `lib/api/generated` (لا تعديل يدوي؛ CI يتحقق من التطابق).
- **النقل:** `lib/api/fetcher.ts` واحد للخادم والمتصفح:
  - المتصفح يستدعي `/api/bff/**` من نفس المضيف مع `credentials: include`، ويصل BFF إلى Django من الخادم.
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
- **CSP:** ثابتة بلا nonce (للحفاظ على القشرة الثابتة)، تسمح باتصال المتصفح بالموقع نفسه فقط، وتمنع
  الإطار والإضافات. `'unsafe-inline'` للسكربتات قيد معروف حتى اعتماد SRI.

## شروط النشر (لوكيل النشر/Backend)
- لا يلزم توسيع `CSRF_COOKIE_DOMAIN` لقراءة CSRF: رمز JSON يعمل مع Cookie محصورة بمضيف API.
- يتولى BFF إعادة إصدار Cookie جلسة محصورة بمضيف Next.js مع الاحتفاظ بإعدادات الحماية؛
  يمكن للخادم الوصول إليها أثناء SSR دون تغيير `SESSION_COOKIE_DOMAIN` في Django.
- معاينات `vercel.app` تستخدم الآن BFF من نفس المضيف؛ يمكن إجراء اختبار دخول فعلي بعد
  تأهيل API Staging، لكن لا يعتبر جاهزًا حتى نجاح اختبارات الجلسات وCSRF على بيئة حقيقية.
- لا يحتاج متصفح Next.js عبر BFF إلى CORS مباشر مع Django. يظل سماح CORS مقيدًا للأصول
  الأخرى التي يعتمدها وكيل الخادم، ولا يُوسع إلى `*.vercel.app`.
- `API_BASE_URL` هو أصل Django الذي يستخدمه BFF على الخادم. إن غاب، يُستخدم
  `NEXT_PUBLIC_API_BASE_URL=https://api-geniura.geniura.com` كعنوان خادمي احتياطي.

## مؤجل
- MSW للاختبارات على مستوى المكونات (الاختبارات الحالية تحاكي `fetch` مباشرة وتغطي التكامل الحقيقي محليًا).
- MFA (Backend، قبل الإطلاق لحسابات فريق Geniura).

## شرط التحقق المتكامل
- النسخة الجديدة من Django على `geniura-api/dev` تعيد `csrf_failed` لكل رفض CSRF، وتستعمل Cookie
  `geniura_csrftoken` محصورة بمضيف API و`HttpOnly`، مع تسليم الرمز مقنّعًا في JSON.
- لا يمكن اعتبار تسجيل الدخول متكاملًا ما دام API يعيد 503؛ تشغيل BFF البرمجي وحده لا يكفي.
- لا تغيّر `SESSION_COOKIE_DOMAIN` إلى `.geniura.com`؛ نُفّذ بديل BFF في Next.js،
  لكنه ينتظر اختبار تكامل واقعي ومراجعة أمنية قبل الاعتماد للإطلاق.
- جرى تحديث `contracts/openapi.web.v1.yaml` و`lib/api/generated` معًا من Backend
  `4d8472c3`، بعد استبعاد عمليات فريق Geniura واختبار بناء Next.js.
- يظل اختبار المصادقة الحقيقي على Staging غير منجز، ولا يُستنتج من نجاح CI اعتماد
  `SESSION_COOKIE_DOMAIN` أو جاهزية API العام.

## P0 — وسيط BFF للجلسات (2026-10-18)

- يستخدم المتصفح `/api/bff/**` على مضيف Next.js نفسه لجميع اتصالات Orval بدلاً من
  استدعاء Django عبر CORS. يتصل خادم Next.js بعنوان `API_BASE_URL` أو بعنوان API العام.
- تُحصر طلبات الوسيط في **113 مسارًا و149 طريقة** من عقد OpenAPI العام. لا تمر مسارات
  فريق Geniura أو روابط تنزيل وثائق التحقق الداخلية. يظل Django مصدر التفويض.
- ينقل الوسيط فقط `geniura_sid` و`geniura_csrftoken` بين المتصفح وDjango.
  يحتفظ بسمتي `HttpOnly` و`Secure` كما صدرتا من Django، مع حذف `Domain`
  من Set-Cookie حتى تكون Cookies حصرية لمضيف الواجهة. صفحات SSR تستطيع بذلك
  استقبال الجلسة وتوجيهها إلى Django.
- يجب أن يحمل كل طلب غير آمن Origin مطابقًا لمضيف الواجهة أو Referer من المضيف نفسه.
  بعد التحقق، يرسل الوسيط Origin لخادم Django وفق وجهة الطلب الموثوقة، مع الحفاظ
  على Cookie الحماية و`X-CSRFToken`. لا يتم تجاوز تحققات Django.
- الاستجابات `private, no-store` دون تمرير Cookies غير مسموح بها أو تحويلات 3xx.
- تحديث قائمة المسارات: عند تغيير عقد OpenAPI العام يجب إعادة توليد القائمة
  `lib/api/bff-routes.ts` والتحقق من مطابقتها لمساراته وطرقه.
- لا تغيير في إعدادات Django أو النشر أو الإنتاج. اختبار Staging الحقيقي للجلسة،
  وتدوير CSRF بعد الدخول، وعمليات الملفات، والكوكيز عند الخروج مطلوب قبل الإطلاق.
