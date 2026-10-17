import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BadgeCheckIcon,
  BriefcaseIcon,
  CalendarClockIcon,
  CalendarIcon,
  GlobeIcon,
  GraduationCapIcon,
  MapPinIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { JobRequirement, PublicJob } from "@/lib/api/generated/model";
import { getDirection } from "@/lib/i18n/config";
import { Link } from "@/lib/i18n/navigation";
import { pickLabel, type Vocabulary } from "@/lib/jobs/labels";

import { formatDate, formatSalary, salaryPeriod } from "./format";
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

function Fact({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 text-muted-foreground [&_svg]:size-5">{icon}</span>
      <div className="grid gap-0.5">
        <dt className="text-sm text-muted-foreground">{label}</dt>
        <dd className="font-medium">{children}</dd>
      </div>
    </div>
  );
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

  return (
    <li className="flex flex-wrap items-center gap-2 rounded-lg border p-3">
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
  const city = job.location ? pickLabel(vocabulary.locations[job.location], locale) : undefined;
  const salary = formatSalary(format, job.salary);
  const period = salaryPeriod(job.salary);
  const BackIcon = getDirection(locale) === "rtl" ? ArrowRightIcon : ArrowLeftIcon;
  const languageName = new Intl.DisplayNames([locale], { type: "language" }).of(job.source_locale);

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/jobs"
        className="inline-flex w-fit items-center gap-2 text-sm text-primary hover:underline"
      >
        <BackIcon className="size-4" aria-hidden="true" />
        {t("detail.back")}
      </Link>

      <header className="flex flex-col gap-3 border-b pb-6">
        <h1 className="text-2xl font-bold sm:text-3xl" lang={job.source_locale} dir={direction}>
          {job.title}
        </h1>
        <p className="flex flex-wrap items-center gap-2 text-muted-foreground">
          <bdi className="font-medium text-foreground">{job.organization.name}</bdi>
          {job.organization.is_verified ? (
            <span className="inline-flex items-center gap-1 text-success">
              <BadgeCheckIcon className="size-4" aria-hidden="true" />
              {t("card.verified")}
            </span>
          ) : null}
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="info">{t(`contractType.${job.contract_type}`)}</Badge>
          <Badge variant="info">{t(`workMode.${job.work_mode}`)}</Badge>
          <Badge variant="neutral">{t(`schedule.${job.schedule}`)}</Badge>
          {job.is_reviewed ? <Badge variant="outline">{t("card.reviewed")}</Badge> : null}
          {job.source_locale !== locale && languageName ? (
            <Badge variant="outline">{t("card.language", { language: languageName })}</Badge>
          ) : null}
        </div>
      </header>

      <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-8" lang={job.source_locale} dir={direction}>
          <section aria-labelledby="job-description" className="flex flex-col gap-3">
            <h2
              id="job-description"
              className="text-xl font-semibold"
              lang={locale}
              dir={getDirection(locale)}
            >
              {t("detail.description")}
            </h2>
            <div className="flex flex-col gap-3 leading-relaxed">
              <Paragraphs text={job.description} />
            </div>
          </section>
          {job.responsibilities ? (
            <section aria-labelledby="job-responsibilities" className="flex flex-col gap-3">
              <h2
                id="job-responsibilities"
                className="text-xl font-semibold"
                lang={locale}
                dir={getDirection(locale)}
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
              className="flex flex-col gap-3"
              lang={locale}
              dir={getDirection(locale)}
            >
              <h2 id="job-requirements" className="text-xl font-semibold">
                {t("detail.requirements")}
              </h2>
              <ul className="flex flex-col gap-2">
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

        <aside className="flex flex-col gap-6">
          <section className="flex flex-col gap-3 rounded-xl border bg-muted/40 p-5">
            <h2 className="font-semibold">{t("detail.applyTitle")}</h2>
            <Button disabled aria-describedby="apply-soon">
              {t("detail.apply")}
            </Button>
            <p id="apply-soon" className="text-sm text-muted-foreground">
              {t("detail.applySoon")}
            </p>
          </section>

          <section
            aria-labelledby="job-facts"
            className="flex flex-col gap-4 rounded-xl border p-5"
          >
            <h2 id="job-facts" className="font-semibold">
              {t("detail.details")}
            </h2>
            <dl className="flex flex-col gap-4">
              <Fact icon={<MapPinIcon />} label={t("detail.location")}>
                {[city, job.address_text].filter(Boolean).join(" — ") ||
                  t(`workMode.${job.work_mode}`)}
              </Fact>
              {salary ? (
                <Fact icon={<WalletIcon />} label={t("card.salary")}>
                  <bdi>{salary}</bdi>{" "}
                  {period ? t(`salaryPeriod.${period}` as "salaryPeriod.month") : null}
                </Fact>
              ) : null}
              <Fact icon={<UsersIcon />} label={t("detail.positions")}>
                {format.number(job.positions_count)}
              </Fact>
              {job.experience_min_years != null ? (
                <Fact icon={<BriefcaseIcon />} label={t("detail.experience")}>
                  {t("detail.experienceYears", { years: job.experience_min_years })}
                </Fact>
              ) : null}
              {job.education_level ? (
                <Fact icon={<GraduationCapIcon />} label={t("detail.education")}>
                  {t(`educationLevel.${job.education_level}` as "educationLevel.none")}
                </Fact>
              ) : null}
              {job.published_at ? (
                <Fact icon={<CalendarIcon />} label={t("detail.published")}>
                  {formatDate(format, job.published_at)}
                </Fact>
              ) : null}
              {job.expires_at ? (
                <Fact icon={<CalendarClockIcon />} label={t("detail.expires")}>
                  {formatDate(format, job.expires_at)}
                </Fact>
              ) : null}
            </dl>
          </section>

          <section
            aria-labelledby="job-organization"
            className="flex flex-col gap-3 rounded-xl border p-5"
          >
            <h2 id="job-organization" className="font-semibold">
              {t("detail.organization")}
            </h2>
            <p className="font-medium">
              <bdi>{job.organization.name}</bdi>
            </p>
            {job.organization.website && /^https?:\/\//i.test(job.organization.website) ? (
              <a
                href={job.organization.website}
                rel="noopener noreferrer nofollow"
                target="_blank"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <GlobeIcon className="size-4" aria-hidden="true" />
                <bdi dir="ltr">{job.organization.website.replace(/^https?:\/\//, "")}</bdi>
              </a>
            ) : null}
            {job.organization.is_verified ? (
              <p className="text-sm text-muted-foreground">{t("detail.verifiedNote")}</p>
            ) : null}
          </section>

          <ReportJobDialog jobId={job.id} />
        </aside>
      </div>
    </div>
  );
}
