import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BadgeCheckIcon,
  CheckIcon,
  FileCheck2Icon,
  InfoIcon,
  LockKeyholeIcon,
  ScaleIcon,
  UsersRoundIcon,
  UserCogIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Container } from "@/components/layout/container";
import { ProvenanceTag } from "@/components/patterns/provenance-tag";
import { StatusBadge } from "@/components/patterns/status-badge";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getDirection } from "@/lib/i18n/config";
import { Link } from "@/lib/i18n/navigation";
import { routing } from "@/lib/i18n/routing";
import { buildSocialMetadata } from "@/lib/seo/social";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Employers" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    ...buildSocialMetadata({
      locale,
      pathname: `/${locale}/employers`,
      title: t("metaTitle"),
      description: t("metaDescription"),
    }),
    alternates: {
      canonical: `/${locale}/employers`,
      languages: Object.fromEntries(routing.locales.map((code) => [code, `/${code}/employers`])),
    },
  };
}

const itemKeys = ["one", "two", "three", "four"] as const;
const trust = [
  { key: "verified", icon: BadgeCheckIcon },
  { key: "privacy", icon: LockKeyholeIcon },
  { key: "human", icon: ScaleIcon },
  { key: "roles", icon: UserCogIcon },
] as const;
const steps = ["account", "verify", "publish"] as const;

export default async function EmployersPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Employers");
  const tCommon = await getTranslations("Common");
  const ForwardIcon = getDirection(locale) === "rtl" ? ArrowLeftIcon : ArrowRightIcon;

  const candidates = [
    { name: t("preview.candidateA"), status: "interview" as const, source: "verified" as const },
    { name: t("preview.candidateB"), status: "in_review" as const, source: "extracted" as const },
    { name: t("preview.candidateC"), status: "submitted" as const, source: "asserted" as const },
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
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/register" className={buttonVariants({ variant: "action", size: "lg" })}>
                {t("ctaRegister")}
                <ForwardIcon aria-hidden="true" />
              </Link>
              <a href="#how" className={buttonVariants({ variant: "outline-inverse", size: "lg" })}>
                {t("ctaHow")}
              </a>
            </div>
            <p className="flex max-w-xl gap-2 text-sm text-on-navy-subtle">
              <InfoIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {t("status")}
            </p>
          </div>

          {/* Static, labelled illustration of the applications table; no real candidate data. */}
          <figure
            aria-label={t("preview.label")}
            className="flex min-w-0 flex-col gap-4 rounded-[1.4rem] bg-card p-6 text-foreground shadow-hero"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col">
                <span className="font-semibold">{t("preview.job")}</span>
                <span className="text-sm text-muted-foreground">{t("preview.count")}</span>
              </div>
              <span className="text-xs text-muted-foreground">{t("preview.example")}</span>
            </div>
            <ul className="flex flex-col">
              {candidates.map((candidate) => (
                <li
                  key={candidate.name}
                  className="flex flex-wrap items-center justify-between gap-2 border-t py-3"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{candidate.name}</span>
                    <span className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      {t("preview.skill")} · {t("preview.language")}
                      <ProvenanceTag source={candidate.source} />
                    </span>
                  </div>
                  <StatusBadge status={candidate.status} />
                </li>
              ))}
            </ul>
            <figcaption className="rounded-xl bg-muted p-3 text-sm text-subtle-foreground">
              {t("preview.note")}
            </figcaption>
          </figure>
        </Container>
      </section>

      <section aria-labelledby="paths-title">
        <Container className="flex flex-col gap-10 py-20">
          <div className="flex flex-col gap-2">
            <h2 id="paths-title" className="text-4xl font-bold sm:text-5xl">
              {t("pathsTitle")}
            </h2>
            <p className="text-lg text-muted-foreground">{t("pathsSubtitle")}</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <PathCard
              id="publish"
              tone="navy"
              icon={FileCheck2Icon}
              eyebrow={t("publish.eyebrow")}
              title={t("publish.title")}
              body={t("publish.body")}
              items={itemKeys.map((key) => t(`publish.items.${key}`))}
              soon={tCommon("comingSoon")}
            />
            <PathCard
              id="service"
              tone="sand"
              icon={UsersRoundIcon}
              eyebrow={t("service.eyebrow")}
              title={t("service.title")}
              body={t("service.body")}
              items={itemKeys.map((key) => t(`service.items.${key}`))}
              soon={tCommon("comingSoon")}
            />
          </div>
        </Container>
      </section>

      <section aria-labelledby="trust-title" className="bg-card">
        <Container className="flex flex-col gap-10 py-20">
          <h2 id="trust-title" className="text-4xl font-bold sm:text-5xl">
            {t("trustTitle")}
          </h2>
          <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {trust.map(({ key, icon: Icon }) => (
              <li key={key} className="flex flex-col gap-3">
                <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                  <Icon className="size-6" aria-hidden="true" />
                </span>
                <h3 className="text-xl font-semibold">{t(`trust.${key}.title`)}</h3>
                <p className="text-muted-foreground">{t(`trust.${key}.body`)}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section id="how" aria-labelledby="how-title" className="scroll-mt-24">
        <Container className="grid gap-12 pt-20 pb-4 lg:grid-cols-[1fr_1.6fr]">
          <h2 id="how-title" className="text-4xl leading-tight font-bold sm:text-5xl">
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
    </>
  );
}

function PathCard({
  id,
  tone,
  icon: Icon,
  eyebrow,
  title,
  body,
  items,
  soon,
}: {
  id: string;
  tone: "navy" | "sand";
  icon: typeof CheckIcon;
  eyebrow: string;
  title: string;
  body: string;
  items: string[];
  soon: string;
}) {
  const navy = tone === "navy";
  return (
    <article
      id={id}
      className={cn(
        "flex scroll-mt-24 flex-col gap-4 rounded-3xl p-8 sm:p-10",
        navy ? "bg-navy text-white" : "bg-accent text-foreground",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <Icon className={cn("size-7", navy ? "text-gold" : "text-gold-ink")} aria-hidden="true" />
        <Badge
          variant="neutral"
          className={navy ? "bg-white/10 text-white" : "bg-white/70 text-foreground"}
        >
          {soon}
        </Badge>
      </div>
      <p
        className={cn("text-sm font-semibold", navy ? "text-gold-soft" : "text-accent-foreground")}
      >
        {eyebrow}
      </p>
      <h3 className="text-3xl leading-tight font-bold sm:text-4xl">{title}</h3>
      <p className={navy ? "text-on-navy-muted" : "text-accent-foreground"}>{body}</p>
      <ul className="mt-2 flex flex-col gap-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            <CheckIcon
              className={cn("mt-1 size-4 shrink-0", navy ? "text-gold" : "text-gold-ink")}
              aria-hidden="true"
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
