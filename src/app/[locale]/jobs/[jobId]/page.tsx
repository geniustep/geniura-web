import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicJob } from "@/lib/api/public-jobs";
import { isLocale, t } from "@/lib/i18n";

export const metadata: Metadata = { title: "Job details" };

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ locale: string; jobId: string }>;
}) {
  const { locale, jobId } = await params;
  if (!isLocale(locale)) notFound();
  const copy = t(locale);
  const response = await getPublicJob(jobId);
  if (response.kind === "not-found") notFound();
  return (
    <article>
      <Link href={`/${locale}/jobs`}>← {copy.back}</Link>
      {response.kind === "unavailable" ? (
        <div className="empty" role="status">{copy.unavailable}</div>
      ) : (
        <>
          <h1>{response.job.title}</h1>
          <div className="meta">
            {response.job.organization?.display_name && <span>{response.job.organization.display_name}</span>}
            {response.job.contract_type && <span>{copy.contract}: {response.job.contract_type}</span>}
            {response.job.work_mode && <span>{copy.workMode}: {response.job.work_mode}</span>}
          </div>
          <section className="panel" style={{ marginTop: 32 }}>
            <h2>{copy.details}</h2>
            <p className="detail-copy">{response.job.description || copy.noDescription}</p>
          </section>
          <p className="lead">{copy.preview}</p>
        </>
      )}
    </article>
  );
}
