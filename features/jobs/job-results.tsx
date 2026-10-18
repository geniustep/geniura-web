import { SearchXIcon, ServerCrashIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { SearchParams } from "nuqs/server";

import { EmptyState } from "@/components/patterns/empty-state";
import { isApiError } from "@/lib/api/errors";
import { getJobsPage, getVocabulary } from "@/lib/api/public";
import { loadJobSearchParams, toApiParams } from "@/lib/jobs/search-params";

import { JobCard } from "./job-card";
import { JobsPagination } from "./pagination";

export async function JobResults({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const t = await getTranslations("Jobs.results");
  const state = await loadJobSearchParams(searchParams);

  let data;
  try {
    data = await Promise.all([getJobsPage(toApiParams(state)), getVocabulary()]);
  } catch (error) {
    // The API refuses deep pages (> 200) with a 404: explain instead of failing.
    if (isApiError(error) && error.status === 404) {
      return (
        <EmptyState icon={SearchXIcon} title={t("emptyTitle")} description={t("depthLimit")} />
      );
    }
    return (
      <EmptyState icon={ServerCrashIcon} title={t("errorTitle")} description={t("errorBody")} />
    );
  }

  const [page, vocabulary] = data;
  if (page.count === 0) {
    return <EmptyState icon={SearchXIcon} title={t("emptyTitle")} description={t("emptyBody")} />;
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="font-medium text-subtle-foreground" role="status">
        {t("count", { count: page.count })}
      </p>
      <ul className="flex flex-col gap-5">
        {page.results.map((job) => (
          <li key={job.id}>
            <JobCard job={job} vocabulary={vocabulary} />
          </li>
        ))}
      </ul>
      <JobsPagination state={state} count={page.count} />
    </div>
  );
}
