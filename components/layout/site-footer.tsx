import { ArrowLeftIcon, ArrowRightIcon, CheckIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { buttonVariants } from "@/components/ui/button";
import { getDirection, locales } from "@/lib/i18n/config";
import { Link } from "@/lib/i18n/navigation";

import { BrandMark } from "./brand-mark";
import { Container } from "./container";

const linkClass = "text-foreground underline-offset-4 hover:text-action hover:underline";

/**
 * Navy call to action (the logo never sits on it), then the light brand area with the live links.
 * Sections that are not open yet are listed as "coming soon" text, never as links to missing pages.
 */
export function SiteFooter() {
  const t = useTranslations("Footer");
  const tCommon = useTranslations("Common");
  const tLanguages = useTranslations("Languages");
  const locale = useLocale();
  const ForwardIcon = getDirection(locale) === "rtl" ? ArrowLeftIcon : ArrowRightIcon;

  const principles = [t("trustFree"), t("trustPrivate"), t("trustHuman")];

  return (
    <footer className="mt-auto bg-card">
      <Container className="pt-16">
        <div className="flex flex-col gap-6 rounded-3xl bg-navy-grid px-7 py-10 text-white sm:px-12 sm:py-12 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex max-w-2xl flex-col gap-2">
            <p className="font-display text-3xl leading-tight font-bold sm:text-4xl">
              {t("ctaTitle")}
            </p>
            <p className="text-lg text-on-navy-muted">{t("ctaBody")}</p>
          </div>
          <Link
            href="/jobs"
            className={buttonVariants({ variant: "action", size: "lg", className: "shrink-0" })}
          >
            {t("ctaButton")}
            <ForwardIcon aria-hidden="true" />
          </Link>
        </div>
      </Container>

      <Container className="grid grid-cols-2 gap-x-6 gap-y-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_0.8fr] md:gap-12">
        <div className="col-span-2 flex flex-col items-start gap-4 md:col-span-1">
          <BrandMark />
          <p className="max-w-sm text-muted-foreground">{t("tagline")}</p>
          <ul aria-label={t("trustTitle")} className="flex flex-col gap-2">
            {principles.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm font-medium">
                <CheckIcon className="size-4 shrink-0 text-success" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <nav aria-labelledby="footer-seekers" className="flex flex-col gap-4">
          <h2 id="footer-seekers" className="text-sm font-semibold text-gold-ink">
            {t("seekers")}
          </h2>
          <ul className="flex flex-col gap-3">
            <li>
              <Link href="/jobs" className={linkClass}>
                {t("browseJobs")}
              </Link>
            </li>
            <li>
              <Link href="/register" className={linkClass}>
                {t("createAccount")}
              </Link>
            </li>
            <li>
              <Link href="/login" className={linkClass}>
                {t("signIn")}
              </Link>
            </li>
          </ul>
        </nav>

        <div className="col-span-2 flex flex-col gap-4 md:col-span-1">
          <h2 className="text-sm font-semibold text-gold-ink">{t("employers")}</h2>
          <ul className="flex flex-col gap-3 text-muted-foreground">
            {[t("publishJob"), t("recruitmentService"), t("skills")].map((item) => (
              <li key={item} className="flex flex-wrap items-center gap-2">
                {item}
                <span className="rounded-full bg-muted px-2 text-xs text-subtle-foreground">
                  {tCommon("comingSoon")}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <nav aria-labelledby="footer-language" className="flex flex-col gap-4">
          <h2 id="footer-language" className="text-sm font-semibold text-gold-ink">
            {t("language")}
          </h2>
          <ul className="flex flex-col gap-3">
            {locales.map((code) => (
              <li key={code}>
                <Link
                  href="/"
                  locale={code}
                  lang={code}
                  dir={getDirection(code)}
                  aria-current={code === locale ? "true" : undefined}
                  className={code === locale ? "font-semibold text-foreground" : linkClass}
                >
                  {tLanguages(code)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>

      <div className="border-t">
        <Container className="flex flex-col gap-2 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>{t("rights")}</p>
          <p className="max-w-xl">{t("promise")}</p>
        </Container>
      </div>
    </footer>
  );
}
