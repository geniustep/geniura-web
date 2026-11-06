"use client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, buttonVariants } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrganizationsList } from "@/lib/api/generated/endpoints/organizations/organizations";
import { organizationsJobsList } from "@/lib/api/generated/endpoints/jobs-organization/jobs-organization";
import type { Organization, PaginatedOrgJobPage } from "@/lib/api/generated/model";
import { Link } from "@/lib/i18n/navigation";

export function EmployerWorkspace() {
  const t = useTranslations("EmployerWorkspace");
  const orgs = useOrganizationsList({ query: { retry: false, staleTime: 0 } });
  const [selected, setSelected] = useState("");
  const org = orgs.data?.results.find((item) => item.id === selected) ?? orgs.data?.results[0];
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <Link href="/employers/new" className={buttonVariants({ variant: "primary" })}>
          {t("create")}
        </Link>
      </header>
      {orgs.isPending ? (
        <Skeleton className="h-56 rounded-2xl" />
      ) : orgs.isError ? (
        <div role="alert" className="space-y-3">
          <p>{t("error")}</p>
          <Button onClick={() => void orgs.refetch()}>{t("retry")}</Button>
        </div>
      ) : !org ? (
        <section className="rounded-2xl border bg-card p-6">
          <h2 className="font-semibold">{t("emptyOrg")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("emptyOrgBody")}</p>
        </section>
      ) : (
        <>
          <section className="space-y-3 rounded-2xl border bg-card p-5">
            {orgs.data && orgs.data.results.length > 1 ? (
              <>
                <label htmlFor="employer-org" className="text-sm font-medium">
                  {t("organization")}
                </label>
                <NativeSelect
                  id="employer-org"
                  value={org.id}
                  onChange={(e) => setSelected(e.target.value)}
                >
                  {orgs.data.results.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.trade_name || item.legal_name}
                    </option>
                  ))}
                </NativeSelect>
              </>
            ) : (
              <h2 className="font-semibold">{org.trade_name || org.legal_name}</h2>
            )}
            <p className="text-sm text-muted-foreground">
              {t("orgStatus")}: {t(`organizationStates.${org.status}`)}
            </p>
          </section>
          <OrganizationJobs key={org.id} org={org} />
        </>
      )}
    </div>
  );
}
function OrganizationJobs({ org }: { org: Organization }) {
  const t = useTranslations("EmployerWorkspace");
  const jobs = useInfiniteQuery({
    queryKey: ["employer-workspace-jobs", org.id],
    initialPageParam: "",
    queryFn: ({ pageParam, signal }) => {
      if (!pageParam) return organizationsJobsList(org.id, undefined, { signal });
      const next = new URL(pageParam, "https://api.invalid");
      const path = `/api/v1/organizations/${org.id}/jobs`;
      if (next.pathname.replace(/\/$/, "") !== path) throw new Error("Invalid pagination path");
      return apiFetch<PaginatedOrgJobPage>(`${path}${next.search}`, { method: "GET", signal });
    },
    getNextPageParam: (page) => page.next || undefined,
    retry: false,
    staleTime: 0,
  });
  const items = jobs.data?.pages.flatMap((page) => page.results) ?? [];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{t("jobs")}</h2>
        <Button variant="outline" disabled={jobs.isFetching} onClick={() => void jobs.refetch()}>
          {t("refresh")}
        </Button>
      </div>
      {jobs.isPending ? (
        <Skeleton className="h-56 rounded-2xl" />
      ) : jobs.isError ? (
        <p role="alert">{t("error")}</p>
      ) : !items.length ? (
        <p className="rounded-2xl border bg-card p-6">{t("emptyJobs")}</p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{t("submissionNote")}</p>
          <ul className="space-y-3">
            {items.map((job) => (
              <li key={job.id} className="rounded-2xl border bg-card p-5">
                <details>
                  <summary className="cursor-pointer space-y-2">
                    <span className="font-semibold">{job.title}</span>
                    <span className="ms-3 inline-block rounded-full bg-muted px-3 py-1 text-xs">
                      {t(`states.${job.status}`)}
                    </span>
                  </summary>
                  <div className="mt-4 space-y-3 border-t pt-4 text-sm">
                    <p>
                      {t("review")}: {t(`reviewStates.${job.review_status}`)}
                    </p>
                    <p className="whitespace-pre-wrap">{job.description}</p>
                    {job.responsibilities ? (
                      <p className="whitespace-pre-wrap">{job.responsibilities}</p>
                    ) : null}
                    <p className="text-xs break-all text-muted-foreground">
                      {t("reference")}: {job.id}
                    </p>
                    {job.status === "published" ? (
                      <Link
                        href={`/jobs/${job.id}`}
                        className="inline-flex min-h-11 items-center text-action"
                      >
                        {t("viewPublic")}
                      </Link>
                    ) : null}
                  </div>
                </details>
              </li>
            ))}
          </ul>
          {jobs.hasNextPage ? (
            <Button
              variant="outline"
              disabled={jobs.isFetchingNextPage}
              onClick={() => void jobs.fetchNextPage()}
            >
              {t("more")}
            </Button>
          ) : null}
        </>
      )}
    </section>
  );
}
