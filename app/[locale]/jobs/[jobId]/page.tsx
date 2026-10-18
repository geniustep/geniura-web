import { FileQuestionIcon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { Container } from "@/components/layout/container";
import { EmptyState } from "@/components/patterns/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { JobDetail } from "@/features/jobs/job-detail";
import type { PublicJob } from "@/lib/api/generated/model";
import { getJob, getVocabulary } from "@/lib/api/public";
import { env } from "@/lib/env";
import { hasLocale } from "next-intl";
import { routing } from "@/lib/i18n/routing";
import { pickLabel, type Vocabulary } from "@/lib/jobs/labels";
import { buildJobPostingJsonLd } from "@/lib/seo/job-posting";
import { jsonLdScript } from "@/lib/seo/json-ld";
import { buildSocialMetadata } from "@/lib/seo/social";

type Props = { params: Promise<{ locale: string; jobId: string }> };

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The job's own language is canonical: other interface languages show the same content. */
function canonicalPath(jobId: string, sourceLocale: string, fallback: string) {
  const locale = hasLocale(routing.locales, sourceLocale) ? sourceLocale : fallback;
  return `/${locale}/jobs/${jobId}`;
}

// Metadata resolves before streaming for crawlers, so `notFound()` here gives search engines a real
// 404 for unknown or expired jobs (not a "soft 404" page with status 200). An API outage is not
// reported as a 404.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, jobId } = await params;
  if (!uuid.test(jobId)) notFound();
  let job: PublicJob | null;
  try {
    job = await getJob(jobId);
  } catch {
    return { robots: { index: false, follow: false } };
  }
  if (!job) notFound();

  const description = job.description.replace(/\s+/g, " ").trim().slice(0, 160);
  const title = `${job.title} — ${job.organization.name}`;
  const pathname = canonicalPath(job.id, job.source_locale, locale);
  const socialLocale = hasLocale(routing.locales, job.source_locale) ? job.source_locale : locale;
  return {
    title,
    description,
    alternates: { canonical: pathname },
    ...buildSocialMetadata({ locale: socialLocale, pathname, title, description, type: "article" }),
  };
}

async function JobContent({ params }: Props) {
  const { locale, jobId } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Jobs.detail");
  if (!uuid.test(jobId)) notFound();

  let job;
  let vocabulary: Vocabulary = { locations: {}, occupations: {}, sectors: {}, skills: {} };
  try {
    job = await getJob(jobId);
    vocabulary = await getVocabulary().catch(() => vocabulary);
  } catch {
    return (
      <Container className="py-16">
        <EmptyState
          icon={FileQuestionIcon}
          title={t("notFoundTitle")}
          description={t("notFoundBody")}
        />
      </Container>
    );
  }
  if (!job) notFound();

  const url = new URL(
    canonicalPath(job.id, job.source_locale, locale),
    env.NEXT_PUBLIC_SITE_URL,
  ).toString();
  const jsonLd = buildJobPostingJsonLd(job, {
    url,
    cityName: job.location
      ? pickLabel(vocabulary.locations[job.location], job.source_locale)
      : undefined,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }}
      />
      <JobDetail job={job} vocabulary={vocabulary} />
    </>
  );
}

// The job id is request data: everything that depends on it streams inside Suspense.
// Unknown jobs never reach this page with a 200: proxy.ts answers them with a 404 first.
export default function JobPage({ params }: Props) {
  return (
    <Suspense
      fallback={
        <>
          <div className="bg-navy-grid">
            <Container className="flex flex-col gap-5 pt-8 pb-32" aria-busy="true">
              <Skeleton className="h-5 w-32 bg-white/10" />
              <Skeleton className="h-14 w-2/3 bg-white/10" />
            </Container>
          </div>
          <Container className="-mt-22 pb-20">
            <Skeleton className="h-72 rounded-2xl" />
          </Container>
        </>
      }
    >
      <JobContent params={params} />
    </Suspense>
  );
}
