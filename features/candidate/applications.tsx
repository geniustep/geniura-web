"use client";
import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { useCandidatesMeApplicationsList } from "@/lib/api/generated/endpoints/applications-candidate/applications-candidate";
import type {
  CandidateApplication,
  PaginatedCandidateApplicationPage,
} from "@/lib/api/generated/model";
import { apiFetch } from "@/lib/api/fetcher";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/lib/i18n/navigation";

export function ApplicationRows({ rows }: { rows: CandidateApplication[] }) {
  const t = useTranslations("CandidateHome");
  const format = useFormatter();
  return (
    <ul className="divide-y">
      {rows.map((row) => (
        <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="min-w-0">
            <p className="font-semibold [overflow-wrap:anywhere]" dir="auto">
              {row.job.title}
            </p>
            <p className="text-sm text-muted-foreground" dir="auto">
              {row.job.organization_name}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("submittedOn", {
                date: format.dateTime(new Date(row.submitted_at), { dateStyle: "medium" }),
              })}
            </p>
          </div>
          <div className="grid justify-items-end gap-2">
            <span className="rounded-full bg-secondary px-3 py-1 text-sm">
              {t(`statuses.${row.status}`)}
            </span>
            <Link
              href={`/jobs/${row.job.id}`}
              className="inline-flex min-h-11 items-center text-sm text-action hover:underline"
            >
              {t("viewJob")}
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
export function Applications({ full = false }: { full?: boolean }) {
  const t = useTranslations("CandidateHome");
  const first = useCandidatesMeApplicationsList({ query: { retry: false, staleTime: 30_000 } });
  const [next, setNext] = useState<string | null>(null);
  const [additional, setAdditional] = useState<CandidateApplication[]>([]);
  const page = useQuery({
    queryKey: ["candidate-applications-page", next],
    enabled: !!next,
    retry: false,
    queryFn: async () => {
      const url = new URL(next!, "https://geniura.invalid");
      if (url.pathname !== "/api/v1/candidates/me/applications")
        throw new Error("Invalid pagination path");
      return apiFetch<PaginatedCandidateApplicationPage>(url.pathname + url.search);
    },
  });
  const failure = first.isError || page.isError;
  if (first.isPending) return <Skeleton className="h-36 rounded-xl" aria-label={t("loading")} />;
  if (first.isError)
    return (
      <div role="status">
        <p>{t("applicationsError")}</p>
        <Button variant="link" onClick={() => first.refetch()}>
          {t("retry")}
        </Button>
      </div>
    );
  const rows = [
    ...(first.data?.results ?? []),
    ...additional,
    ...(page.data?.results ?? []),
  ].filter((row, i, all) => all.findIndex((x) => x.id === row.id) === i);
  if (!rows.length)
    return (
      <div className="grid justify-items-start gap-3 py-3">
        <p className="text-sm text-muted-foreground">{t("noApplications")}</p>
        <Link href="/jobs" className={buttonVariants({ variant: "outline" })}>
          {t("explore")}
        </Link>
      </div>
    );
  rows.sort((a, b) => b.submitted_at.localeCompare(a.submitted_at));
  const nextUrl = page.data ? page.data.next : first.data?.next;
  return (
    <>
      <ApplicationRows rows={full ? rows : rows.slice(0, 3)} />
      {!full ? (
        <Link
          href="/account/applications"
          className="inline-flex min-h-11 items-center text-sm text-action hover:underline"
        >
          {t("allApplications")}
        </Link>
      ) : nextUrl ? (
        <Button
          variant="outline"
          disabled={page.isFetching}
          onClick={() => {
            setAdditional(rows);
            setNext(nextUrl);
          }}
        >
          {t("more")}
        </Button>
      ) : null}
      {failure ? (
        <p role="alert">
          {t("applicationsError")}{" "}
          <Button variant="link" onClick={() => page.refetch()}>
            {t("retry")}
          </Button>
        </p>
      ) : null}
    </>
  );
}
