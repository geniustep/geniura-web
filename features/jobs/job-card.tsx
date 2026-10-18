import { BadgeCheckIcon } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";

import type { PublicJobList } from "@/lib/api/generated/model";
import { getDirection } from "@/lib/i18n/config";
import { Link } from "@/lib/i18n/navigation";
import { pickLabel, type Vocabulary } from "@/lib/jobs/labels";
import { cn } from "@/lib/utils";

import { formatDate, formatSalary, salaryPeriod } from "./format";
import { Monogram } from "./monogram";

type JobCardProps = {
  job: PublicJobList;
  vocabulary: Vocabulary;
  /** Heading level of the job title, to fit the outline of the page that lists the card. */
  headingLevel?: "h2" | "h3";
};

const chip = "rounded-full bg-muted px-3 py-0.5 text-sm text-subtle-foreground";

/**
 * Fixed reading order (UX doc §8): title, organisation, place and terms, then the salary state,
 * which is always shown — "not disclosed" when the posting gives no amount, never a blank.
 */
export function JobCard({ job, vocabulary, headingLevel: Heading = "h2" }: JobCardProps) {
  const t = useTranslations("Jobs");
  const locale = useLocale();
  const format = useFormatter();
  const city = job.location ? pickLabel(vocabulary.locations[job.location], locale) : undefined;
  const salary = formatSalary(format, job.salary);
  const period = salaryPeriod(job.salary);
  const posted = formatDate(format, job.published_at);
  const expires = formatDate(format, job.expires_at);
  const languageName =
    job.source_locale !== locale
      ? new Intl.DisplayNames([locale], { type: "language" }).of(job.source_locale)
      : undefined;

  const meta = [
    posted ? t("card.posted", { date: posted }) : null,
    expires ? t("card.expires", { date: expires }) : null,
    job.is_reviewed ? t("card.reviewed") : null,
  ].filter(Boolean);

  return (
    <article className="group relative flex h-full flex-col gap-5 rounded-2xl bg-card p-6 shadow-card transition-shadow hover:shadow-float sm:p-7">
      <div className="flex items-start gap-4">
        <Monogram name={job.organization.name} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {/* The posting keeps its own language and direction inside the translated interface. */}
          <Heading
            className="text-xl leading-snug font-semibold sm:text-2xl"
            lang={job.source_locale}
            dir={getDirection(job.source_locale)}
          >
            <Link
              href={`/jobs/${job.id}`}
              className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-ring"
            >
              {job.title}
            </Link>
          </Heading>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <bdi className="font-medium">{job.organization.name}</bdi>
            {job.organization.is_verified ? (
              <span className="inline-flex items-center gap-1 text-sm font-medium text-success">
                <BadgeCheckIcon className="size-4" aria-hidden="true" />
                {t("card.verified")}
              </span>
            ) : null}
            {languageName ? (
              <span className="rounded-md bg-muted px-2 text-sm text-subtle-foreground">
                {t("card.language", { language: languageName })}
              </span>
            ) : null}
          </p>
        </div>
      </div>

      <ul className="flex flex-wrap gap-2">
        {city ? <li className={chip}>{city}</li> : null}
        <li className={chip}>{t(`workMode.${job.work_mode}`)}</li>
        <li className={chip}>{t(`contractType.${job.contract_type}`)}</li>
        <li className={chip}>{t(`schedule.${job.schedule}`)}</li>
      </ul>

      <div className="mt-auto flex flex-wrap items-end justify-between gap-4 border-t pt-4">
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="sr-only">{t("card.salary")}</p>
          {salary ? (
            <p className="font-display text-2xl font-bold">
              <bdi>{salary}</bdi>
              {period ? (
                <span className="ms-2 font-sans text-sm font-normal text-muted-foreground">
                  {t(`salaryPeriod.${period}` as "salaryPeriod.month")}
                </span>
              ) : null}
            </p>
          ) : (
            <p className="font-display text-2xl font-semibold text-muted-foreground">
              {t("card.notDisclosed")}
            </p>
          )}
          {meta.length > 0 ? (
            <p className="text-sm text-muted-foreground">{meta.join(" · ")}</p>
          ) : null}
        </div>
        {/* Visual affordance only: the whole card is the link (no second tab stop). */}
        <span
          aria-hidden="true"
          className={cn(
            "inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground",
            "transition-colors group-hover:bg-primary/90",
          )}
        >
          {t("card.view")}
        </span>
      </div>
    </article>
  );
}
