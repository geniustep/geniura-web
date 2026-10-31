import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BriefcaseBusinessIcon,
  GraduationCapIcon,
  LanguagesIcon,
  LockKeyholeIcon,
  FileTextIcon,
  SearchIcon,
  MapPinIcon,
  Building2Icon,
  ShieldCheckIcon,
  ListChecksIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { Container } from "@/components/layout/container";
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
  const h = await getTranslations("Home.profileFirst");
  const tJobs = await getTranslations("Jobs");
  const ForwardIcon = getDirection(locale) === "rtl" ? ArrowLeftIcon : ArrowRightIcon;
  const profileSections = [
    ["experience", BriefcaseBusinessIcon],
    ["education", GraduationCapIcon],
    ["skills", ListChecksIcon],
    ["languages", LanguagesIcon],
  ] as const;
  const benefits = [
    ["organise", FileTextIcon],
    ["browse", SearchIcon],
    ["privacy", LockKeyholeIcon],
  ] as const;
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(buildSiteIdentityGraph()) }}
      />
      <section className="bg-navy text-white">
        <Container className="grid items-center gap-9 py-9 sm:py-12 lg:grid-cols-[1.12fr_1fr] lg:gap-16">
          <div className="flex min-w-0 flex-col items-center gap-5 text-center sm:items-start sm:text-start">
            <h1 className="font-display text-4xl leading-[1.25] font-bold sm:text-5xl lg:text-7xl rtl:leading-[1.4]">
              {h("titleLead")} <span className="block text-gold">{h("titleAccent")}</span>
            </h1>
            <h2 className="max-w-2xl text-xl font-semibold sm:text-2xl">{h("promise")}</h2>
            <p className="max-w-xl text-base leading-relaxed text-on-navy-muted sm:text-lg">
              {h("description")}
            </p>
            <div className="mt-1 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
              <Link
                href={{ pathname: "/register", query: { next: `/${locale}/account/profile` } }}
                className={buttonVariants({
                  variant: "action",
                  size: "lg",
                  className: "rounded-xl text-center whitespace-normal",
                })}
              >
                {h("createProfile")}
              </Link>
              <Link
                href="/employers"
                className={buttonVariants({
                  variant: "outline-inverse",
                  size: "lg",
                  className: "rounded-xl text-center whitespace-normal",
                })}
              >
                {h("employerAction")}
              </Link>
            </div>
            <Link
              href="/jobs"
              className="inline-flex min-h-11 items-center gap-3 text-sm text-on-navy-info hover:underline"
            >
              {h("browseWithoutAccount")}
              <ForwardIcon className="size-5 shrink-0" aria-hidden="true" />
            </Link>
          </div>
          <figure
            aria-label={h("previewLabel")}
            className="min-w-0 rounded-xl bg-card p-5 text-card-foreground shadow-float sm:p-6"
          >
            <figcaption className="mb-4 text-xs text-muted-foreground">
              {h("previewLabel")}
            </figcaption>
            <div className="flex gap-5">
              <aside
                aria-label={h("profileTitle")}
                className="hidden w-32 shrink-0 flex-col gap-5 border-e pe-4 text-sm lg:flex"
              >
                {profileSections.map(([key, Icon]) => (
                  <span key={key} className="flex items-center gap-2">
                    <Icon className="size-5 shrink-0 text-action" aria-hidden="true" />
                    {h(key)}
                  </span>
                ))}
              </aside>
              <div className="min-w-0 flex-1">
                <h2 className="mb-2 hidden text-lg font-semibold sm:block">{h("profileTitle")}</h2>
                <dl>
                  {profileSections.map(([key, Icon]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between gap-4 border-b py-3 sm:block"
                    >
                      <dt className="flex items-center gap-2 text-sm font-semibold">
                        <Icon className="size-5 shrink-0 text-action" aria-hidden="true" />
                        {h(key)}
                      </dt>
                      <dd className="text-xs text-muted-foreground sm:mt-2 sm:ps-7">
                        {h(`${key}Hint`)}
                      </dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-4 text-center sm:text-start">
                  <p className="flex items-center justify-center gap-2 text-sm font-semibold sm:justify-start">
                    <LockKeyholeIcon className="size-4 shrink-0" aria-hidden="true" />
                    {h("privateTitle")}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {h("privateBody")}
                  </p>
                </div>
              </div>
            </div>
          </figure>
        </Container>
      </section>
      <section aria-label={h("benefitsLabel")} className="bg-background">
        <Container className="grid divide-y py-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {benefits.map(([key, Icon]) => (
            <article
              key={key}
              className="flex items-center gap-4 py-4 sm:flex-col sm:px-6 sm:text-center"
            >
              <Icon className="size-7 shrink-0" aria-hidden="true" />
              <div>
                <h2 className="text-base font-semibold">{h(`${key}Title`)}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{h(`${key}Body`)}</p>
              </div>
            </article>
          ))}
        </Container>
      </section>
      <section aria-labelledby="latest-title">
        <Container className="flex flex-col gap-6 py-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="latest-title" className="text-2xl font-bold">
              {t("latest.title")}
            </h2>
            <Link href="/jobs" className={buttonVariants({ variant: "link" })}>
              {t("latest.all")}
              <ForwardIcon aria-hidden="true" />
            </Link>
          </div>
          <form
            role="search"
            action={`/${locale}/jobs`}
            method="get"
            className="flex w-full flex-col gap-2 rounded-xl border bg-card p-2 text-foreground sm:flex-row"
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

          <Suspense
            fallback={
              <div className="grid gap-5 lg:grid-cols-2" aria-busy="true">
                <Skeleton className="h-48 rounded-xl" />
                <Skeleton className="h-48 rounded-xl" />
              </div>
            }
          >
            <LatestJobs />
          </Suspense>
        </Container>
      </section>
      <section id="how" aria-labelledby="steps-title">
        <Container className="py-6">
          <h2 id="steps-title" className="mb-6 text-2xl font-bold">
            {h("stepsTitle")}
          </h2>
          <ol className="grid gap-6 sm:grid-cols-3">
            {["create", "review", "explore"].map((key, index) => (
              <li key={key} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary font-display text-xl text-secondary-foreground"
                >
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-base font-semibold">{h(`${key}Title`)}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{h(`${key}Body`)}</p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>
      <section>
        <Container className="py-8">
          <div className="flex flex-wrap items-center gap-5 rounded-xl bg-secondary p-6">
            <Building2Icon className="size-8 shrink-0" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold">{h("employerTitle")}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{h("employerBody")}</p>
            </div>
            <Link
              href="/employers"
              className={buttonVariants({
                size: "lg",
                className: "w-full rounded-xl text-center whitespace-normal sm:w-auto",
              })}
            >
              {h("employerLink")}
              <ForwardIcon aria-hidden="true" />
            </Link>
          </div>
          <p className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
            <ShieldCheckIcon className="size-5" aria-hidden="true" />
            <span>{h("trust")}</span>
          </p>
        </Container>
      </section>
    </>
  );
}
