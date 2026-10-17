"use client";

// Last-resort boundary when the locale layout itself fails; it cannot rely on translations.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body
        style={{ fontFamily: "system-ui, sans-serif", padding: "3rem 1.5rem", textAlign: "center" }}
      >
        <h1>حدث خطأ غير متوقع · Une erreur inattendue s’est produite</h1>
        <button
          type="button"
          onClick={() => reset()}
          style={{ marginTop: "1.5rem", padding: "0.75rem 1.5rem" }}
        >
          إعادة المحاولة · Réessayer
        </button>
      </body>
    </html>
  );
}
