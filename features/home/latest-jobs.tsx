import { InboxIcon, ServerCrashIcon } from "lucide-react";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/patterns/empty-state";
import { JobCard } from "@/features/jobs/job-card";
import { getJobsPage, getVocabulary } from "@/lib/api/public";

const LATEST_COUNT = 4;

export async function LatestJobs() {
  // Rendered per request so that an API outage during the build is never baked into the page.
  await connection();
  const t = await getTranslations("Home.latest");
  const tResults = await getTranslations("Jobs.results");

  let data;
  try {
    data = await Promise.all([
      getJobsPage({ sort: "newest", page_size: LATEST_COUNT }),
      getVocabulary(),
    ]);
  } catch {
    return (
      <EmptyState
        icon={ServerCrashIcon}
        title={tResults("errorTitle")}
        description={tResults("errorBody")}
      />
    );
  }

  const [page, vocabulary] = data;
  if (page.results.length === 0) {
    return <EmptyState icon={InboxIcon} title={t("emptyTitle")} description={t("emptyBody")} />;
  }

  return (
    <ul className="grid gap-5 lg:grid-cols-2">
      {page.results.slice(0, LATEST_COUNT).map((job) => (
        <li key={job.id} className="grid">
          <JobCard job={job} vocabulary={vocabulary} headingLevel="h3" />
        </li>
      ))}
    </ul>
  );
}
