import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { SearchParams } from "nuqs/server";
import { Suspense } from "react";

import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/skeleton";
import { JobResults } from "@/features/jobs/job-results";
import { FiltersSection, SearchBarSection } from "@/features/jobs/search-controls";
import { routing } from "@/lib/i18n/routing";
import { buildSocialMetadata } from "@/lib/seo/social";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Jobs" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    ...buildSocialMetadata({
      locale,
      pathname: `/${locale}/jobs`,
      title: t("metaTitle"),
      description: t("metaDescription"),
    }),
    // Filtered result pages are not canonical: only the bare listing is.
    alternates: {
      canonical: `/${locale}/jobs`,
      languages: Object.fromEntries(routing.locales.map((code) => [code, `/${code}/jobs`])),
    },
  };
}

function ResultsSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true">
      {[0, 1, 2].map((index) => (
        <Skeleton key={index} className="h-56 rounded-2xl" />
      ))}
    </div>
  );
}

export default async function JobsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Jobs");

  return (
    <>
      <section className="bg-navy-grid text-white">
        <Container className="flex flex-col gap-3 pt-14 pb-28">
          <p className="text-sm font-medium text-gold-soft">{t("eyebrow")}</p>
          <h1 className="text-4xl font-bold sm:text-6xl">{t("title")}</h1>
          <p className="max-w-2xl text-lg text-on-navy-muted">{t("subtitle")}</p>
        </Container>
      </section>
      <Container className="-mt-18 flex flex-col gap-8 pb-20">
        <div className="rounded-[1.25rem] bg-card p-4 shadow-float sm:p-5">
          <Suspense fallback={<Skeleton className="h-[4.5rem]" />}>
            <SearchBarSection />
          </Suspense>
        </div>
        <div className="grid gap-8 lg:grid-cols-[17rem_1fr]">
          <Suspense fallback={<Skeleton className="h-11 rounded-full lg:h-96 lg:rounded-2xl" />}>
            <FiltersSection />
          </Suspense>
          <Suspense fallback={<ResultsSkeleton />}>
            <JobResults searchParams={searchParams} />
          </Suspense>
        </div>
      </Container>
    </>
  );
}
