import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { SearchParams } from "nuqs/server";
import { Suspense } from "react";

import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/patterns/page-header";
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
    <div className="flex flex-col gap-4" aria-busy="true">
      {[0, 1, 2].map((index) => (
        <Skeleton key={index} className="h-36 rounded-xl" />
      ))}
    </div>
  );
}

export default async function JobsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Jobs");

  return (
    <Container className="flex flex-col gap-8 py-10">
      <PageHeader title={t("title")} description={t("subtitle")} />
      <Suspense fallback={<Skeleton className="h-[4.5rem]" />}>
        <SearchBarSection />
      </Suspense>
      <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
        <Suspense fallback={<Skeleton className="h-10 lg:h-96" />}>
          <FiltersSection />
        </Suspense>
        <Suspense fallback={<ResultsSkeleton />}>
          <JobResults searchParams={searchParams} />
        </Suspense>
      </div>
    </Container>
  );
}
