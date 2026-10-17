import { BadgeCheckIcon, BriefcaseIcon, CalendarIcon, MapPinIcon, WalletIcon } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import type { PublicJobList } from "@/lib/api/generated/model";
import { getDirection } from "@/lib/i18n/config";
import { Link } from "@/lib/i18n/navigation";
import { pickLabel, type Vocabulary } from "@/lib/jobs/labels";

import { formatDate, formatSalary, salaryPeriod } from "./format";

export function JobCard({ job, vocabulary }: { job: PublicJobList; vocabulary: Vocabulary }) {
  const t = useTranslations("Jobs");
  const locale = useLocale();
  const format = useFormatter();
  const city = job.location ? pickLabel(vocabulary.locations[job.location], locale) : undefined;
  const salary = formatSalary(format, job.salary);
  const period = salaryPeriod(job.salary);
  const posted = formatDate(format, job.published_at);

  return (
    <article className="group relative flex flex-col gap-3 rounded-xl border bg-card p-5 transition-colors hover:border-primary/50">
      <div className="flex flex-col gap-1">
        {/* The posting keeps its own language and direction inside the translated interface. */}
        <h2
          className="text-lg font-semibold"
          lang={job.source_locale}
          dir={getDirection(job.source_locale)}
        >
          <Link
            href={`/jobs/${job.id}`}
            className="after:absolute after:inset-0 focus-visible:outline-none"
          >
            {job.title}
          </Link>
        </h2>
        <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <bdi>{job.organization.name}</bdi>
          {job.organization.is_verified ? (
            <span className="inline-flex items-center gap-1 text-success">
              <BadgeCheckIcon className="size-4" aria-hidden="true" />
              {t("card.verified")}
            </span>
          ) : null}
        </p>
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        {city ? (
          <li className="inline-flex items-center gap-1">
            <MapPinIcon className="size-4" aria-hidden="true" />
            {city}
          </li>
        ) : null}
        <li className="inline-flex items-center gap-1">
          <BriefcaseIcon className="size-4" aria-hidden="true" />
          {t(`contractType.${job.contract_type}`)}
        </li>
        {salary ? (
          <li className="inline-flex items-center gap-1">
            <WalletIcon className="size-4" aria-hidden="true" />
            <span>
              <bdi>{salary}</bdi>{" "}
              {period ? t(`salaryPeriod.${period}` as "salaryPeriod.month") : null}
            </span>
          </li>
        ) : null}
        {posted ? (
          <li className="inline-flex items-center gap-1">
            <CalendarIcon className="size-4" aria-hidden="true" />
            {t("card.posted", { date: posted })}
          </li>
        ) : null}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Badge variant="info">{t(`workMode.${job.work_mode}`)}</Badge>
        <Badge variant="neutral">{t(`schedule.${job.schedule}`)}</Badge>
        {job.is_reviewed ? <Badge variant="outline">{t("card.reviewed")}</Badge> : null}
      </div>
    </article>
  );
}
