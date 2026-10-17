import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, supportedLocales, t } from "@/lib/i18n";
import "../globals.css";

export const metadata: Metadata = {
  title: { default: "Geniura", template: "%s | Geniura" },
  description: "Geniura — opportunités, recrutement, évaluation et développement professionnel.",
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return supportedLocales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const copy = t(locale);
  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <body>
        <div className="notice">{copy.foundation}</div>
        <header className="header">
          <div className="shell header-inner">
            <Link className="wordmark" href={`/${locale}`} aria-label="Geniura">Geniura</Link>
            <nav className="nav" aria-label={locale === "ar" ? "التنقل الرئيسي" : "Navigation principale"}>
              <Link href={`/${locale}`}>{copy.home}</Link>
              <Link href={`/${locale}/jobs`}>{copy.jobs}</Link>
              <Link className="language-link" lang={locale === "ar" ? "fr" : "ar"} href={locale === "ar" ? "/fr" : "/ar"}>
                {locale === "ar" ? "Français" : "العربية"}
              </Link>
            </nav>
          </div>
        </header>
        <main className="shell" id="main-content">{children}</main>
        <footer className="footer"><div className="shell">© Geniura — {copy.foundation}</div></footer>
      </body>
    </html>
  );
}
