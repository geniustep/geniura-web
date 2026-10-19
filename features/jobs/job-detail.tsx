import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BadgeCheckIcon,
  CalendarClockIcon,
  ClipboardCheckIcon,
  GlobeIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { ApplyPanel } from "@/features/profile/apply-panel";
import type { JobRequirement, PublicJob } from "@/lib/api/generated/model";
import { getDirection } from "@/lib/i18n/config";
import { Link } from "@/lib/i18n/navigation";
import { pickLabel, type Vocabulary } from "@/lib/jobs/labels";

import { formatDate, formatSalary, salaryPeriod } from "./format";
import { Monogram } from "./monogram";
import { ReportJobDialog } from "./report-job-dialog";

function Paragraphs({ text }: { text: string }) {
  // Plain text from the API, rendered as text nodes (never as HTML).
  return (
    <>
      {text
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line, index) => (
          <p key={index}>{line}</p>
        ))}
    </>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="font-display text-lg font-semibold">{children}</dd>
    </div>
  );
}

type JobsT = ReturnType<typeof useTranslations<"Jobs">>;

/** The requirement in words, in the interface language (shared by the list and the match card). */
function requirementSubject(
  requirement: JobRequirement,
  vocabulary: Vocabulary,
  t: JobsT,
  locale: string,
): string | undefined {
  const languageNames = new Intl.DisplayNames([locale], { type: "language" });
  let subject: string | undefined;
  switch (requirement.kind) {
    case "skill":
      subject = requirement.skill
        ? pickLabel(vocabulary.skills[requirement.skill], locale)
        : undefined;
      if (subject && requirement.skill_level && requirement.skill_level !== "unspecified") {
        subject = `${subject} (${t(`skillLevel.${requirement.skill_level}`)})`;
      }
      break;
    case "occupation_experience":
      subject = requirement.occupation
        ? pickLabel(vocabulary.occupations[requirement.occupation], locale)
        : undefined;
      if (requirement.min_years != null) {
        subject = `${subject ?? ""} · ${t("detail.experienceYears", { years: requirement.min_years })}`;
      }
      break;
    case "language":
      subject = requirement.language_code ? languageNames.of(requirement.language_code) : undefined;
      break;
    case "education":
      subject = requirement.education_level
        ? t(`educationLevel.${requirement.education_level}`)
        : undefined;
      break;
    case "certification":
    case "license":
      subject = requirement.certification_name || undefined;
      break;
  }
  return subject;
}

function RequirementItem({
  requirement,
  vocabulary,
}: {
  requirement: JobRequirement;
  vocabulary: Vocabulary;
}) {
  const t = useTranslations("Jobs");
  const locale = useLocale();
  const subject = requirementSubject(requirement, vocabulary, t, locale);

  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t py-3 first:border-t-0">
      <Badge variant={requirement.is_mandatory ? "primary" : "neutral"}>
        {requirement.is_mandatory ? t("detail.mandatory") : t("detail.optional")}
      </Badge>
      <span className="text-sm text-muted-foreground">
        {t(`requirementKind.${requirement.kind}`)}
      </span>
      <span className="font-medium">{subject ?? t("detail.unknownLabel")}</span>
      {requirement.description ? (
        <p className="w-full text-sm text-muted-foreground" dir="auto">
          {requirement.description}
        </p>
      ) : null}
    </li>
  );
}

/** Only plain web links are rendered (defence in depth against `javascript:` URLs). */
export function JobDetail({ job, vocabulary }: { job: PublicJob; vocabulary: Vocabulary }) {
  const t = useTranslations("Jobs");
  const locale = useLocale();
  const format = useFormatter();
  const direction = getDirection(job.source_locale);
  const uiDirection = getDirection(locale);
  const city = job.location ? pickLabel(vocabulary.locations[job.location], locale) : undefined;
  const salary = formatSalary(format, job.salary);
  const period = salaryPeriod(job.salary);
  const BackIcon = uiDirection === "rtl" ? ArrowRightIcon : ArrowLeftIcon;
  const languageName = new Intl.DisplayNames([locale], { type: "language" }).of(job.source_locale);
  const place =
    [city, job.address_text].filter(Boolean).join(" — ") || t(`workMode.${job.work_mode}`);
  const published = formatDate(format, job.published_at);
  const expires = formatDate(format, job.expires_at);

  const sectionTitle = "text-2xl font-bold";

  return (
    <>
      <section className="bg-navy-grid text-white">
        <Container className="flex flex-col gap-5 pt-8 pb-32">
          <Link
            href="/jobs"
            className="inline-flex w-fit items-center gap-2 text-sm text-on-navy-muted hover:text-white"
          >
            <BackIcon className="size-4" aria-hidden="true" />
            {t("detail.back")}
          </Link>
          <div className="flex flex-wrap items-center gap-5">
            <Monogram name={job.organization.name} size="lg" />
            <div className="flex min-w-0 flex-col gap-1">
              <h1
                className="text-4xl leading-tight font-bold sm:text-5xl"
                lang={job.source_locale}
                dir={direction}
              >
                {job.title}
              </h1>
              <p className="text-lg text-on-navy-muted">
                <bdi>{job.organization.name}</bdi> · {place}
              </p>
            </div>
          </div>
          <ul aria-label={t("detail.badgesTitle")} className="flex flex-wrap gap-2.5">
            {job.organization.is_verified ? (
              <li className="inline-flex items-center gap-1.5 rounded-full border border-on-navy-success/40 bg-on-navy-success/14 px-3.5 py-1 text-sm font-medium text-on-navy-success">
                <BadgeCheckIcon className="size-4" aria-hidden="true" />
                {t("card.verified")}
              </li>
            ) : null}
            {job.is_reviewed ? (
              <li className="inline-flex items-center gap-1.5 rounded-full border border-on-navy-info/45 bg-on-navy-info/14 px-3.5 py-1 text-sm font-medium text-on-navy-info">
                <ClipboardCheckIcon className="size-4" aria-hidden="true" />
                {t("card.reviewed")}
              </li>
            ) : null}
            <li className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/8 px-3.5 py-1 text-sm font-medium">
              <span aria-hidden="true" className="size-2 rounded-full bg-on-navy-live" />
              {t("detail.open")}
            </li>
            {job.source_locale !== locale && languageName ? (
              <li className="inline-flex items-center rounded-full border border-white/25 px-3.5 py-1 text-sm">
                {t("card.language", { language: languageName })}
              </li>
            ) : null}
          </ul>
        </Container>
      </section>

      <Container className="-mt-22 grid items-start gap-8 pb-20 lg:grid-cols-[1fr_22rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-5 rounded-2xl bg-card p-6 shadow-float sm:grid-cols-3 sm:p-7">
            <Fact label={t("card.salary")}>
              {salary ? (
                <>
                  <bdi>{salary}</bdi>{" "}
                  {period ? (
                    <span className="font-sans text-sm font-normal text-muted-foreground">
                      {t(`salaryPeriod.${period}` as "salaryPeriod.month")}
                    </span>
                  ) : null}
                </>
              ) : (
                <span className="text-muted-foreground">{t("card.notDisclosed")}</span>
              )}
            </Fact>
            <Fact label={t("filters.contractType")}>{t(`contractType.${job.contract_type}`)}</Fact>
            <Fact label={t("filters.workMode")}>{t(`workMode.${job.work_mode}`)}</Fact>
            <Fact label={t("filters.schedule")}>{t(`schedule.${job.schedule}`)}</Fact>
            {job.experience_min_years != null ? (
              <Fact label={t("detail.experience")}>
                {t("detail.experienceYears", { years: job.experience_min_years })}
              </Fact>
            ) : null}
            {job.education_level ? (
              <Fact label={t("detail.education")}>
                {t(`educationLevel.${job.education_level}` as "educationLevel.none")}
              </Fact>
            ) : null}
            <Fact label={t("detail.positions")}>{format.number(job.positions_count)}</Fact>
            {published ? <Fact label={t("detail.published")}>{published}</Fact> : null}
            {expires ? <Fact label={t("detail.expires")}>{expires}</Fact> : null}
          </dl>

          <div className="flex flex-col gap-8 rounded-2xl bg-card p-6 shadow-card sm:p-9">
            <section
              aria-labelledby="job-description"
              className="flex max-w-3xl flex-col gap-3"
              lang={job.source_locale}
              dir={direction}
            >
              <h2 id="job-description" className={sectionTitle} lang={locale} dir={uiDirection}>
                {t("detail.description")}
              </h2>
              <div className="flex flex-col gap-3 leading-relaxed">
                <Paragraphs text={job.description} />
              </div>
            </section>
            {job.responsibilities ? (
              <section
                aria-labelledby="job-responsibilities"
                className="flex max-w-3xl flex-col gap-3 border-t pt-7"
                lang={job.source_locale}
                dir={direction}
              >
                <h2
                  id="job-responsibilities"
                  className={sectionTitle}
                  lang={locale}
                  dir={uiDirection}
                >
                  {t("detail.responsibilities")}
                </h2>
                <div className="flex flex-col gap-2 leading-relaxed">
                  <Paragraphs text={job.responsibilities} />
                </div>
              </section>
            ) : null}
            {job.requirements.length > 0 ? (
              <section
                aria-labelledby="job-requirements"
                className="flex max-w-3xl flex-col gap-3 border-t pt-7"
              >
                <h2 id="job-requirements" className={sectionTitle}>
                  {t("detail.requirements")}
                </h2>
                <ul className="flex flex-col">
                  {job.requirements.map((requirement) => (
                    <RequirementItem
                      key={requirement.id}
                      requirement={requirement}
                      vocabulary={vocabulary}
                    />
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <section
            aria-labelledby="job-organization"
            className="flex flex-col gap-3 rounded-2xl bg-accent p-6 text-foreground sm:p-8"
          >
            <p className="text-sm font-semibold text-accent-foreground">
              {t("detail.organization")}
            </p>
            <h2 id="job-organization" className={sectionTitle}>
              <bdi>{job.organization.name}</bdi>
            </h2>
            {job.organization.website && /^https?:\/\//i.test(job.organization.website) ? (
              <a
                href={job.organization.website}
                rel="noopener noreferrer nofollow"
                target="_blank"
                className="inline-flex w-fit items-center gap-2 font-medium underline-offset-4 hover:underline"
              >
                <GlobeIcon className="size-4" aria-hidden="true" />
                <bdi dir="ltr">{job.organization.website.replace(/^https?:\/\//, "")}</bdi>
              </a>
            ) : null}
            {job.organization.is_verified ? (
              <p className="flex max-w-2xl gap-2 text-sm text-accent-foreground">
                <ShieldCheckIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {t("detail.verifiedNote")}
              </p>
            ) : null}
          </section>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
          <section
            aria-labelledby="apply-title"
            className="flex flex-col gap-5 rounded-3xl bg-card p-7 shadow-float"
          >
            <h2 id="apply-title" className="sr-only">
              {t("detail.applyTitle")}
            </h2>
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">{t("card.salary")}</span>
              {salary ? (
                <span className="font-display text-2xl font-bold">
                  <bdi>{salary}</bdi>
                </span>
              ) : (
                <span className="font-display text-2xl font-semibold text-muted-foreground">
                  {t("card.notDisclosed")}
                </span>
              )}
              {salary && period ? (
                <span className="text-sm text-muted-foreground">
                  {t(`salaryPeriod.${period}` as "salaryPeriod.month")}
                </span>
              ) : null}
            </div>
            {expires ? (
              <p className="flex items-center gap-3 rounded-2xl bg-muted p-4">
                <CalendarClockIcon className="size-5 shrink-0 text-action" aria-hidden="true" />
                <span>
                  <span className="block text-sm text-muted-foreground">{t("detail.expires")}</span>
                  <span className="font-semibold">{expires}</span>
                </span>
              </p>
            ) : null}
            <ApplyPanel
              jobId={job.id}
              requirementLabels={Object.fromEntries(
                job.requirements.map((requirement) => [
                  requirement.id,
                  requirementSubject(requirement, vocabulary, t, locale) ??
                    t(`requirementKind.${requirement.kind}`),
                ]),
              )}
            />
          </section>
          <ReportJobDialog jobId={job.id} />
        </aside>
      </Container>
    </>
  );
}
