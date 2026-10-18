import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  CircleDashedIcon,
  CompassIcon,
  FileSearchIcon,
  HandshakeIcon,
  InfoIcon,
  LinkIcon,
  ShieldOffIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { getDirection } from "@/lib/i18n/config";
import { Link } from "@/lib/i18n/navigation";
import { routing } from "@/lib/i18n/routing";
import { buildSocialMetadata } from "@/lib/seo/social";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Skills" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    ...buildSocialMetadata({
      locale,
      pathname: `/${locale}/skills`,
      title: t("metaTitle"),
      description: t("metaDescription"),
    }),
    alternates: {
      canonical: `/${locale}/skills`,
      languages: Object.fromEntries(routing.locales.map((code) => [code, `/${code}/skills`])),
    },
  };
}

const steps = ["choose", "compare", "decide"] as const;
const principles = [
  { key: "optional", icon: CompassIcon },
  { key: "job", icon: LinkIcon },
  { key: "noPromise", icon: ShieldOffIcon },
  { key: "source", icon: FileSearchIcon },
] as const;

export default async function SkillsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Skills");
  const ForwardIcon = getDirection(locale) === "rtl" ? ArrowLeftIcon : ArrowRightIcon;

  const matches = [
    { label: t("preview.match1"), note: t("preview.match1Note") },
    { label: t("preview.match2"), note: t("preview.match2Note") },
  ];

  return (
    <>
      <section className="bg-navy-grid text-white">
        <Container className="grid items-center gap-14 py-16 sm:py-20 lg:grid-cols-[1.3fr_1fr] lg:py-24">
          <div className="flex min-w-0 flex-col items-start gap-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/50 px-4 py-1 text-sm font-medium text-gold-soft">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-gold" />
              {t("eyebrow")}
            </span>
            <h1 className="max-w-3xl text-5xl leading-[1.08] font-bold tracking-tight sm:text-6xl rtl:leading-[1.25]">
              {t("titleLead")} <span className="text-gold">{t("titleAccent")}</span>
            </h1>
            <p className="max-w-xl text-lg text-on-navy-muted sm:text-xl">{t("subtitle")}</p>
            <Link
              href="/jobs"
              className={buttonVariants({ variant: "action", size: "lg", className: "mt-2" })}
            >
              {t("ctaJobs")}
              <ForwardIcon aria-hidden="true" />
            </Link>
            <p className="flex max-w-xl gap-2 text-sm text-on-navy-subtle">
              <InfoIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {t("status")}
            </p>
          </div>

          {/* Static, labelled illustration of an explained comparison; no real profile data. */}
          <figure
            aria-label={t("preview.label")}
            className="flex min-w-0 flex-col gap-4 rounded-[1.4rem] bg-card p-6 text-foreground shadow-hero"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="font-semibold">{t("preview.job")}</span>
              <span className="text-xs text-muted-foreground">{t("preview.example")}</span>
            </div>
            <ul className="flex flex-col gap-3">
              {matches.map((item) => (
                <li key={item.label} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex size-5.5 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground">
                    <CheckIcon className="size-3" strokeWidth={3} aria-hidden="true" />
                  </span>
                  <span className="flex flex-col">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-sm text-muted-foreground">{item.note}</span>
                  </span>
                </li>
              ))}
              <li className="flex items-start gap-3">
                <CircleDashedIcon
                  className="mt-0.5 size-5.5 shrink-0 text-warning"
                  aria-hidden="true"
                />
                <span className="flex flex-col">
                  <span className="font-medium">{t("preview.gap")}</span>
                  <span className="text-sm text-warning">{t("preview.gapNote")}</span>
                </span>
              </li>
            </ul>
            <figcaption className="flex flex-col gap-1 rounded-xl bg-accent p-4">
              <span className="font-semibold">{t("preview.suggestion")}</span>
              <span className="text-sm text-accent-foreground">{t("preview.optional")}</span>
            </figcaption>
          </figure>
        </Container>
      </section>

      <section aria-labelledby="steps-title">
        <Container className="grid gap-12 py-20 lg:grid-cols-[1fr_1.6fr]">
          <h2 id="steps-title" className="text-4xl leading-tight font-bold sm:text-5xl">
            {t("stepsTitle")}
          </h2>
          <ol className="flex flex-col border-b">
            {steps.map((key, index) => (
              <li key={key} className="flex gap-7 border-t py-6">
                <span
                  aria-hidden="true"
                  className="min-w-14 font-display text-4xl leading-none font-bold text-action"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="flex flex-col gap-1">
                  <h3 className="text-xl font-semibold">{t(`steps.${key}.title`)}</h3>
                  <p className="text-muted-foreground">{t(`steps.${key}.body`)}</p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section aria-labelledby="principles-title" className="bg-card">
        <Container className="flex flex-col gap-10 py-20">
          <h2 id="principles-title" className="text-4xl font-bold sm:text-5xl">
            {t("principlesTitle")}
          </h2>
          <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {principles.map(({ key, icon: Icon }) => (
              <li key={key} className="flex flex-col gap-3">
                <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                  <Icon className="size-6" aria-hidden="true" />
                </span>
                <h3 className="text-xl font-semibold">{t(`principles.${key}.title`)}</h3>
                <p className="text-muted-foreground">{t(`principles.${key}.body`)}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section aria-labelledby="partners-title">
        <Container className="pt-20 pb-4">
          <div className="flex flex-col gap-4 rounded-3xl bg-accent p-8 sm:flex-row sm:items-center sm:gap-8 sm:p-10">
            <HandshakeIcon className="size-10 shrink-0 text-gold-ink" aria-hidden="true" />
            <div className="flex flex-col gap-2">
              <h2 id="partners-title" className="text-3xl font-bold">
                {t("partnersTitle")}
              </h2>
              <p className="max-w-3xl text-accent-foreground">{t("partnersBody")}</p>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
