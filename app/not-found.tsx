// Fallback for requests outside any locale segment (the proxy redirects almost all of them).
export default function RootNotFound() {
  return (
    <html lang="ar" dir="rtl">
      <body
        style={{ fontFamily: "system-ui, sans-serif", padding: "3rem 1.5rem", textAlign: "center" }}
      >
        <h1>الصفحة غير موجودة · Page introuvable</h1>
        {/* A different root layout needs a full document load, so plain anchors are intended. */}
        {/* eslint-disable @next/next/no-html-link-for-pages */}
        <p>
          <a href="/ar">العربية</a> · <a href="/fr">Français</a>
        </p>
        {/* eslint-enable @next/next/no-html-link-for-pages */}
      </body>
    </html>
  );
}
