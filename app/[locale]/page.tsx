import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BadgeCheckIcon,
  BellRingIcon,
  BriefcaseIcon,
  Building2Icon,
  CalendarCheckIcon,
  CheckIcon,
  GraduationCapIcon,
  LockKeyholeIcon,
  ScaleIcon,
  SearchIcon,
  SendIcon,
  ShieldCheckIcon,
  UserRoundSearchIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { type ReactNode, Suspense } from "react";

import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { LatestJobs } from "@/features/home/latest-jobs";
import { getDirection } from "@/lib/i18n/config";
import { Link } from "@/lib/i18n/navigation";
import { routing } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
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

const guarantees = [
  { key: "verified", icon: BadgeCheckIcon },
  { key: "reviewed", icon: CalendarCheckIcon },
  { key: "private", icon: LockKeyholeIcon },
] as const;

const audienceItems = ["one", "two", "three"] as const;

const steps = [
  { key: "search", icon: SearchIcon },
  { key: "apply", icon: SendIcon },
  { key: "follow", icon: BellRingIcon },
] as const;

const paths = [
  { key: "jobs", icon: BriefcaseIcon },
  { key: "recruitment", icon: UsersIcon },
  { key: "skills", icon: GraduationCapIcon },
] as const;

const principles = [
  { key: "free", icon: WalletIcon },
  { key: "privacy", icon: LockKeyholeIcon },
  { key: "human", icon: ScaleIcon },
  { key: "trust", icon: ShieldCheckIcon },
] as const;

function LatestJobsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3" aria-busy="true">
      {[0, 1, 2].map((index) => (
        <Skeleton key={index} className="h-44 rounded-xl" />
      ))}
    </div>
  );
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");
  const tCommon = await getTranslations("Common");
  const tJobs = await getTranslations("Jobs");
  // Arrows point toward the reading direction.
  const ForwardIcon = getDirection(locale) === "rtl" ? ArrowLeftIcon : ArrowRightIcon;

  return (
    <>
      <div className="border-b bg-accent/60 text-accent-foreground">
        <Container className="py-2 text-center text-sm">{tCommon("underConstruction")}</Container>
      </div>

      {/* Hero: search first, with the guarantees that make an offer trustworthy beside it. */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-secondary/70 via-secondary/30 to-background">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -end-32 -top-32 size-96 rounded-full bg-primary/10 blur-3xl"
        />
        <Container className="relative grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.4fr_1fr] lg:py-24">
          <div className="flex flex-col items-start gap-6">
            <Badge variant="info">{t("eyebrow")}</Badge>
            <h1 className="text-3xl leading-tight font-bold text-balance sm:text-5xl">
              {t("title")}
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground">{t("subtitle")}</p>
            {/* Plain GET form: works before JavaScript loads and lands on the shareable results URL. */}
            <form
              role="search"
              action={`/${locale}/jobs`}
              method="get"
              className="flex w-full max-w-2xl flex-col gap-2 rounded-xl border bg-background p-2 shadow-sm sm:flex-row"
            >
              <label htmlFor="home-q" className="sr-only">
                {tJobs("search.label")}
              </label>
              <Input
                id="home-q"
                name="q"
                type="search"
                dir="auto"
                maxLength={200}
                enterKeyHint="search"
                placeholder={tJobs("search.placeholder")}
                className="h-12 border-0 shadow-none focus-visible:ring-2"
              />
              <Button type="submit" size="lg" className="h-12">
                <SearchIcon aria-hidden="true" />
                {tJobs("search.submit")}
              </Button>
            </form>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span id="home-examples" className="text-muted-foreground">
                {t("examplesLabel")}
              </span>
              <ul aria-labelledby="home-examples" className="flex flex-wrap gap-2">
                {examples.map((key) => (
                  <li key={key}>
                    <Link
                      href={{ pathname: "/jobs", query: { q: t(`examples.${key}`) } }}
                      className="inline-flex min-h-8 items-center rounded-full border bg-background px-3 hover:border-primary/50 hover:text-primary"
                    >
                      {t(`examples.${key}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <Link href="/jobs" className={buttonVariants({ variant: "link" })}>
              {t("browseAll")}
              <ForwardIcon aria-hidden="true" />
            </Link>
          </div>

          <aside
            aria-labelledby="guarantees-title"
            className="flex flex-col gap-5 rounded-2xl border bg-card p-6 shadow-sm sm:p-8"
          >
            <h2 id="guarantees-title" className="text-lg font-semibold">
              {t("guarantees.title")}
            </h2>
            <ul className="flex flex-col gap-5">
              {guarantees.map(({ key, icon: Icon }) => (
                <li key={key} className="flex gap-4">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <div className="flex flex-col gap-1">
                    <h3 className="font-semibold">{t(`guarantees.${key}.title`)}</h3>
                    <p className="text-sm text-muted-foreground">{t(`guarantees.${key}.body`)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </aside>
        </Container>
      </section>

      <section aria-labelledby="audience-title">
        <Container className="flex flex-col gap-8 py-16">
          <h2 id="audience-title" className="text-2xl font-bold">
            {t("audience.title")}
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <AudienceCard
              title={t("audience.seekers.title")}
              icon={UserRoundSearchIcon}
              items={audienceItems.map((key) => t(`audience.seekers.items.${key}`))}
              highlighted
            >
              <Link href="/jobs" className={buttonVariants({ size: "lg" })}>
                {t("audience.seekers.cta")}
                <ForwardIcon aria-hidden="true" />
              </Link>
            </AudienceCard>
            <AudienceCard
              title={t("audience.employers.title")}
              icon={Building2Icon}
              items={audienceItems.map((key) => t(`audience.employers.items.${key}`))}
            >
              {/* The employer space arrives in PHASE 5. */}
              <div className="flex flex-wrap items-center gap-3">
                <Button size="lg" variant="outline" disabled aria-describedby="cta-soon">
                  {t("audience.employers.cta")}
                </Button>
                <Badge id="cta-soon" variant="neutral">
                  {tCommon("comingSoon")}
                </Badge>
              </div>
            </AudienceCard>
          </div>
        </Container>
      </section>

      <section aria-labelledby="latest-title" className="border-y bg-muted/40">
        <Container className="flex flex-col gap-8 py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h2 id="latest-title" className="text-2xl font-bold">
                {t("latest.title")}
              </h2>
              <p className="text-muted-foreground">{t("latest.subtitle")}</p>
            </div>
            <Link href="/jobs" className={buttonVariants({ variant: "outline" })}>
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
        <Container className="flex flex-col gap-8 py-16">
          <h2 id="steps-title" className="text-2xl font-bold">
            {t("steps.title")}
          </h2>
          <ol className="grid gap-6 md:grid-cols-3">
            {steps.map(({ key, icon: Icon }, index) => (
              <li key={key} className="flex flex-col gap-3 rounded-xl border bg-card p-6">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="inline-flex size-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground"
                  >
                    {index + 1}
                  </span>
                  <Icon className="size-5 text-primary" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold">{t(`steps.${key}.title`)}</h3>
                <p className="text-muted-foreground">{t(`steps.${key}.body`)}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section aria-labelledby="paths-title" className="bg-secondary/40">
        <Container className="flex flex-col gap-8 py-16">
          <h2 id="paths-title" className="text-2xl font-bold">
            {t("pathsTitle")}
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {paths.map(({ key, icon: Icon }) => (
              <article
                key={key}
                className="flex flex-col gap-3 rounded-xl border-t-4 border-t-primary bg-card p-6 shadow-xs"
              >
                <Icon className="size-7 text-primary" aria-hidden="true" />
                <h3 className="text-lg font-semibold">{t(`paths.${key}.title`)}</h3>
                <p className="text-muted-foreground">{t(`paths.${key}.body`)}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section aria-labelledby="principles-title">
        <Container className="flex flex-col gap-8 py-16">
          <h2 id="principles-title" className="text-2xl font-bold">
            {t("principlesTitle")}
          </h2>
          <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {principles.map(({ key, icon: Icon }) => (
              <li key={key} className="flex flex-col gap-2 border-s-2 border-primary/30 ps-4">
                <Icon className="size-6 text-primary" aria-hidden="true" />
                <h3 className="font-semibold">{t(`principles.${key}.title`)}</h3>
                <p className="text-sm text-muted-foreground">{t(`principles.${key}.body`)}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section aria-labelledby="cta-title" className="pb-16">
        <Container>
          <div className="flex flex-col items-start gap-6 rounded-2xl bg-primary px-6 py-10 text-primary-foreground sm:px-10 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2">
              <h2 id="cta-title" className="text-2xl font-bold">
                {t("cta.title")}
              </h2>
              <p className="max-w-xl opacity-90">{t("cta.body")}</p>
            </div>
            <Link
              href="/jobs"
              className={cn(buttonVariants({ size: "lg", variant: "secondary" }), "shrink-0")}
            >
              <BriefcaseIcon aria-hidden="true" />
              {t("seekerCta")}
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}

function AudienceCard({
  title,
  icon: Icon,
  items,
  highlighted = false,
  children,
}: {
  title: string;
  icon: typeof BriefcaseIcon;
  items: string[];
  highlighted?: boolean;
  children: ReactNode;
}) {
  return (
    <article
      className={cn(
        "flex flex-col gap-6 rounded-2xl border bg-card p-6 sm:p-8",
        highlighted && "border-primary/40 shadow-sm",
      )}
    >
      <div className="flex items-center gap-3">
        <span className="inline-flex size-11 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <h3 className="text-xl font-semibold">{title}</h3>
      </div>
      <ul className="flex flex-1 flex-col gap-3">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <CheckIcon className="mt-1 size-4 shrink-0 text-success" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      {children}
    </article>
  );
}
