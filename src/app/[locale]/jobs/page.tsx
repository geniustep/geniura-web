import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicJobs } from "@/lib/api/public-jobs";
import { isLocale, t } from "@/lib/i18n";

export const metadata: Metadata = { title: "Jobs" };

function single(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : Array.isArray(value) ? value[0] ?? "" : "";
}

export default async function JobsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const copy = t(locale);
  const queryParams = await searchParams;
  const q = single(queryParams.q).trim().slice(0, 120);
  const rawPage = Number(single(queryParams.page));
  const page = Number.isInteger(rawPage) && rawPage > 0 ? Math.min(rawPage, 200) : 1;
  const result = await getPublicJobs(q, page);
  const queryString = (targetPage: number) => {
    const values = new URLSearchParams();
    if (q) values.set("q", q);
    values.set("page", String(targetPage));
    return `/${locale}/jobs?${values.toString()}`;
  };

  return (
    <section>
      <h1>{copy.jobs}</h1>
      <form method="get" action={`/${locale}/jobs`} role="search" className="search">
        <input type="search" name="q" defaultValue={q} placeholder={copy.searchHint} aria-label={copy.searchHint} />
        <button type="submit">{copy.search}</button>
      </form>
      {result.kind === "unavailable" ? (
        <div role="status" className="empty">{copy.unavailable}</div>
      ) : (
        <>
          <p className="lead">{result.count} {copy.results}</p>
          {result.results.length === 0 ? <div className="empty">{copy.noJobs}</div> : (
            <div className="job-grid">
              {result.results.map((job) => (
                <article className="job-card" key={job.id}>
                  <Link href={`/${locale}/jobs/${job.id}`}>{job.title}</Link>
                  <div className="meta">
                    {job.organization?.display_name && <span>{job.organization.display_name}</span>}
                    {job.contract_type && <span>{copy.contract}: {job.contract_type}</span>}
                    {job.work_mode && <span>{copy.workMode}: {job.work_mode}</span>}
                  </div>
                </article>
              ))}
            </div>
          )}
          <nav className="pager" aria-label={copy.jobs}>
            {page > 1 && result.previous && <Link href={queryString(page - 1)}>{copy.previous}</Link>}
            {result.next && <Link href={queryString(page + 1)}>{copy.next}</Link>}
          </nav>
        </>
      )}
    </section>
  );
}
