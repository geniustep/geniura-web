import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import {
  MAX_PAGE,
  PAGE_SIZE,
  serializeJobSearch,
  type JobSearchState,
} from "@/lib/jobs/search-params";
import { cn } from "@/lib/utils";

/** Real links (crawlable, work without JavaScript), not infinite scroll. */
export function JobsPagination({ state, count }: { state: JobSearchState; count: number }) {
  const t = useTranslations("Jobs.pagination");
  const total = Math.min(Math.ceil(count / PAGE_SIZE), MAX_PAGE);
  const current = Math.min(Math.max(state.page, 1), Math.max(total, 1));
  if (total <= 1) return null;

  const href = (page: number) =>
    serializeJobSearch("/jobs", { ...state, page: page === 1 ? null : page });
  const linkClass = buttonVariants({ variant: "outline", size: "sm" });

  return (
    <nav aria-label={t("label")} className="flex items-center justify-between gap-4">
      {current > 1 ? (
        <Link href={href(current - 1)} className={linkClass} rel="prev">
          <ChevronRightIcon className="ltr:hidden" aria-hidden="true" />
          <ChevronLeftIcon className="rtl:hidden" aria-hidden="true" />
          {t("previous")}
        </Link>
      ) : (
        <span />
      )}
      <span className="text-sm text-muted-foreground" aria-current="page">
        {t("page", { page: current, total })}
      </span>
      {current < total ? (
        <Link href={href(current + 1)} className={cn(linkClass)} rel="next">
          {t("next")}
          <ChevronLeftIcon className="ltr:hidden" aria-hidden="true" />
          <ChevronRightIcon className="rtl:hidden" aria-hidden="true" />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
