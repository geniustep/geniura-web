import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  FileCheck2Icon,
  MapPinIcon,
  SearchIcon,
  UsersRoundIcon,
  WalletIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LatestJobs } from "@/features/home/latest-jobs";
import { getVocabulary } from "@/lib/api/public";
import { getDirection } from "@/lib/i18n/config";
import { Link } from "@/lib/i18n/navigation";
import { routing } from "@/lib/i18n/routing";
import { vocabularyOptions } from "@/lib/jobs/labels";
import { jsonLdScript } from "@/lib/seo/json-ld";
import { buildSiteIdentityGraph } from "@/lib/seo/site-identity";
import { buildSocialMetadata } from "@/lib/seo/social";
import { cn } from "@/lib/utils";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    ...buildSocialMetadata({
      locale,
      pathname: `/${locale}`,
      title: t("title"),
      description: t("description"),
    }),
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries([
        ...routing.locales.map((code) => [code, `/${code}`]),
        ["x-default", `/${routing.defaultLocale}`],
      ]),
    },
  };
}

const examples = ["one", "two", "three", "four"] as const;
const steps = ["search", "apply", "follow"] as const;

const chipClass =
  "inline-flex min-h-9 items-center rounded-full border border-white/20 bg-white/8 px-4 text-sm font-medium text-white hover:bg-white/15";

function LatestJobsSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-2" aria-busy="true">
      {[0, 1, 2, 3].map((index) => (
        <Skeleton key={index} className="h-60 rounded-2xl" />
      ))}
    </div>
  );
}

/** City list of the hero search; the keyword field works on its own if the vocabulary is down. */
async function LocationSelect({
  id,
  name,
  anyLabel,
}: {
  id: string;
  name: string;
  anyLabel: string;
}) {
  await connection();
  const locale = await getLocale();
  let options: { id: string; label: string }[] = [];
  try {
    options = vocabularyOptions((await getVocabulary()).locations, locale);
  } catch {
    options = [];
  }
  return (
    <select
      id={id}
      name={options.length > 0 ? name : undefined}
      disabled={options.length === 0}
      className="h-8 w-full appearance-none bg-transparent text-lg text-foreground outline-none disabled:text-muted-foreground"
      defaultValue=""
    >
      <option value="">{anyLabel}</option>
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");
  const tCommon = await getTranslations("Common");
  const tJobs = await getTranslations("Jobs");
  const tStatus = await getTranslations("Status.application");
  // Arrows point toward the reading direction.
  const ForwardIcon = getDirection(locale) === "rtl" ? ArrowLeftIcon : ArrowRightIcon;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(buildSiteIdentityGraph()) }}
      />
      {/* Hero: navy band, search first, and a labelled example of what follow-up looks like. */}
      <section className="bg-navy-grid text-white">
        <Container className="grid items-center gap-14 py-16 sm:py-20 lg:grid-cols-[1.35fr_1fr] lg:py-24">
          <div className="flex min-w-0 flex-col items-start gap-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/50 px-4 py-1 text-sm font-medium text-gold-soft">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-gold" />
              {t("eyebrow")}
            </span>
            <h1 className="max-w-3xl text-5xl leading-[1.08] font-bold tracking-tight sm:text-6xl lg:text-7xl lg:leading-[1.05] rtl:leading-[1.25]">
              {t("titleLead")} <span className="text-gold">{t("titleAccent")}</span>
            </h1>
            <p className="max-w-xl text-lg text-on-navy-muted sm:text-xl">{t("subtitle")}</p>

            {/* Plain GET form: works before JavaScript loads and lands on the shareable results URL. */}
            <form
              role="search"
              action={`/${locale}/jobs`}
              method="get"
              className="mt-2 flex w-full max-w-3xl flex-col gap-2 rounded-[1.25rem] bg-card p-2 text-foreground shadow-hero sm:flex-row"
            >
              <div className="flex flex-[2] items-center gap-3 px-4 py-2">
                <SearchIcon className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <label htmlFor="home-q" className="text-xs font-semibold text-subtle-foreground">
                    {tJobs("search.label")}
                  </label>
                  <input
                    id="home-q"
                    name="q"
                    type="search"
                    dir="auto"
                    maxLength={200}
                    enterKeyHint="search"
                    placeholder={t("searchPlaceholder")}
                    className="h-8 w-full min-w-0 bg-transparent text-lg outline-none placeholder:text-muted-foreground"
                  />
                </div>
              </div>
              <div aria-hidden="true" className="my-2 hidden w-px bg-border sm:block" />
              <div className="flex flex-1 items-center gap-3 border-t px-4 py-2 sm:border-t-0">
                <MapPinIcon className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <label
                    htmlFor="home-location"
                    className="text-xs font-semibold text-subtle-foreground"
                  >
                    {tJobs("search.location")}
                  </label>
                  <Suspense
                    fallback={
                      <select
                        id="home-location"
                        disabled
                        className="h-8 w-full appearance-none bg-transparent text-lg text-muted-foreground outline-none"
                      >
                        <option>{tJobs("search.anyLocation")}</option>
                      </select>
                    }
                  >
                    <LocationSelect
                      id="home-location"
                      name="location"
                      anyLabel={tJobs("search.anyLocation")}
                    />
                  </Suspense>
                </div>
              </div>
              <Button type="submit" variant="action" size="lg" className="h-16 rounded-2xl px-9">
                {tJobs("search.submit")}
              </Button>
            </form>
            <p className="text-sm text-on-navy-subtle">{t("searchHint")}</p>
            <div className="flex flex-wrap items-center gap-2">
              <span id="home-examples" className="text-sm text-on-navy-subtle">
                {t("examplesLabel")}
              </span>
              <ul aria-labelledby="home-examples" className="flex flex-wrap gap-2">
                {examples.map((key) => (
                  <li key={key}>
                    <Link
                      href={{ pathname: "/jobs", query: { q: t(`examples.${key}`) } }}
                      className={chipClass}
                    >
                      {t(`examples.${key}`)}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href={{ pathname: "/jobs", query: { work_mode: "remote" } }}
                    className={chipClass}
                  >
                    {tJobs("workMode.remote")}
                  </Link>
                </li>
                <li>
                  <Link
                    href={{ pathname: "/jobs", query: { contract_type: "permanent" } }}
                    className={chipClass}
                  >
                    {tJobs("contractType.permanent")}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <ApplicationPreview
            labels={{
              label: t("preview.label"),
              example: t("preview.example"),
              jobTitle: t("preview.jobTitle"),
              company: t("preview.company"),
              monogram: t("preview.monogram"),
              submitted: tStatus("submitted"),
              submittedOn: t("preview.submittedOn"),
              inReview: tStatus("in_review"),
              reviewOn: t("preview.reviewOn"),
              interview: tStatus("interview"),
              interviewOn: t("preview.interviewOn"),
              decision: t("preview.decision"),
              freeTitle: t("free.title"),
              freeBody: t("free.body"),
            }}
          />
        </Container>
      </section>

      <section aria-labelledby="latest-title">
        <Container className="flex flex-col gap-8 py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h2 id="latest-title" className="text-4xl font-bold sm:text-5xl">
                {t("latest.title")}
              </h2>
              <p className="text-muted-foreground">{t("latest.subtitle")}</p>
            </div>
            <Link href="/jobs" className={buttonVariants({ variant: "link", size: "md" })}>
              {t("latest.all")}
              <ForwardIcon aria-hidden="true" />
            </Link>
          </div>
          <Suspense fallback={<LatestJobsSkeleton />}>
            <LatestJobs />
          </Suspense>
        </Container>
      </section>

      <section aria-labelledby="steps-title">
        <Container className="grid gap-12 py-12 lg:grid-cols-[1fr_1.6fr]">
          <h2 id="steps-title" className="text-4xl leading-tight font-bold sm:text-5xl">
            {t("steps.title")}
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

      {/* The employer space and the recruitment service are not open yet: no live links. */}
      <section aria-label={t("employers.eyebrow")}>
        <Container className="grid gap-5 pt-12 pb-24 md:grid-cols-2">
          <ServiceCard
            tone="navy"
            icon={FileCheck2Icon}
            eyebrow={t("employers.eyebrow")}
            title={t("employers.title")}
            body={t("employers.body")}
            cta={t("employers.cta")}
            soon={tCommon("comingSoon")}
          />
          <ServiceCard
            tone="sand"
            icon={UsersRoundIcon}
            eyebrow={t("service.eyebrow")}
            title={t("service.title")}
            body={t("service.body")}
            cta={t("service.cta")}
            soon={tCommon("comingSoon")}
          />
        </Container>
      </section>
    </>
  );
}

type PreviewLabels = Record<
  | "label"
  | "example"
  | "jobTitle"
  | "company"
  | "monogram"
  | "submitted"
  | "submittedOn"
  | "inReview"
  | "reviewOn"
  | "interview"
  | "interviewOn"
  | "decision"
  | "freeTitle"
  | "freeBody",
  string
>;

/** Static, clearly labelled illustration: it shows the follow-up, it is not a real application. */
function ApplicationPreview({ labels }: { labels: PreviewLabels }) {
  const done = [
    { label: labels.submitted, date: labels.submittedOn },
    { label: labels.inReview, date: labels.reviewOn },
  ];
  return (
    <figure aria-label={labels.label} className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-5 rounded-[1.4rem] bg-card p-6 text-foreground shadow-hero">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="inline-flex size-11 items-center justify-center rounded-xl bg-secondary font-display font-bold text-secondary-foreground"
            >
              {labels.monogram}
            </span>
            <div className="flex flex-col">
              <span className="font-semibold">{labels.jobTitle}</span>
              <span className="text-sm text-muted-foreground">{labels.company}</span>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">{labels.example}</span>
        </div>
        <ol className="flex flex-col">
          {done.map((step) => (
            <li key={step.label} className="flex gap-3.5">
              <div className="flex flex-col items-center">
                <span className="inline-flex size-5.5 items-center justify-center rounded-full bg-success text-success-foreground">
                  <CheckIcon className="size-3" strokeWidth={3} aria-hidden="true" />
                </span>
                <span aria-hidden="true" className="h-6 w-0.5 bg-success" />
              </div>
              <div className="flex flex-1 justify-between gap-2">
                <span className="font-medium">{step.label}</span>
                <span className="text-sm text-muted-foreground">{step.date}</span>
              </div>
            </li>
          ))}
          <li className="flex gap-3.5">
            <div className="flex flex-col items-center">
              <span
                aria-hidden="true"
                className="size-5.5 rounded-full border-3 border-action bg-card"
              />
              <span aria-hidden="true" className="h-6 w-0.5 bg-border" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-action">{labels.interview}</span>
              <span className="text-sm text-subtle-foreground">{labels.interviewOn}</span>
            </div>
          </li>
          <li className="flex gap-3.5">
            <span
              aria-hidden="true"
              className="size-5.5 rounded-full border-2 border-dashed border-input"
            />
            <span className="text-muted-foreground">{labels.decision}</span>
          </li>
        </ol>
      </div>
      <div className="flex w-[82%] items-center gap-3.5 self-end rounded-2xl border border-white/15 bg-navy-raised p-4 shadow-hero">
        <WalletIcon className="size-6 shrink-0 text-gold" aria-hidden="true" />
        <div className="flex flex-col">
          <span className="font-semibold">{labels.freeTitle}</span>
          <span className="text-sm text-on-navy-muted">{labels.freeBody}</span>
        </div>
      </div>
    </figure>
  );
}

function ServiceCard({
  tone,
  icon: Icon,
  eyebrow,
  title,
  body,
  cta,
  soon,
}: {
  tone: "navy" | "sand";
  icon: typeof WalletIcon;
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  soon: string;
}) {
  const navy = tone === "navy";
  const soonId = `soon-${tone}`;
  return (
    <article
      className={cn(
        "flex min-h-80 flex-col gap-4 rounded-3xl p-8 sm:p-10",
        navy ? "bg-navy text-white" : "bg-accent text-foreground",
      )}
    >
      <Icon className={cn("size-7", navy ? "text-gold" : "text-gold-ink")} aria-hidden="true" />
      <p
        className={cn("text-sm font-semibold", navy ? "text-gold-soft" : "text-accent-foreground")}
      >
        {eyebrow}
      </p>
      <h2 className="text-3xl leading-tight font-bold sm:text-4xl">{title}</h2>
      <p className={cn("max-w-md", navy ? "text-on-navy-muted" : "text-accent-foreground")}>
        {body}
      </p>
      <div className="mt-auto flex flex-wrap items-center gap-3 pt-4">
        <Button size="lg" variant={navy ? "inverse" : "primary"} disabled aria-describedby={soonId}>
          {cta}
        </Button>
        <Badge
          id={soonId}
          variant="neutral"
          className={navy ? "bg-white/10 text-white" : "bg-white/70 text-foreground"}
        >
          {soon}
        </Badge>
      </div>
    </article>
  );
}
