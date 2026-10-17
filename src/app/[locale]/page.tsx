import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, t } from "@/lib/i18n";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const copy = t(locale);
  return (
    <>
      <section className="hero">
        <p className="eyebrow">Geniura · {copy.brandPurpose}</p>
        <h1>{copy.heading}</h1>
        <p className="lead">{copy.intro}</p>
        <Link className="primary-link" href={`/${locale}/jobs`}>{copy.explore}</Link>
      </section>
      <section className="panel-grid" aria-label={copy.brandPurpose}>
        <article className="panel"><h2>{copy.forCandidates}</h2><p>{copy.candidateText}</p></article>
        <article className="panel"><h2>{copy.forEmployers}</h2><p>{copy.employerText}</p></article>
      </section>
    </>
  );
}
