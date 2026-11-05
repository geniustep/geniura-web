"use client";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpLeftIcon, FileTextIcon, LockKeyholeIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCandidatesMeRetrieve } from "@/lib/api/generated/endpoints/candidates/candidates";
import { useCandidatesMeResumesList } from "@/lib/api/generated/endpoints/resumes/resumes";
import type { Me } from "@/lib/api/generated/model";
import { getGuestDraft } from "@/lib/api/guest-cv";
import { isApiError } from "@/lib/api/errors";
import { Link } from "@/lib/i18n/navigation";
import { candidateNextAction } from "./next-action";
import { CandidateNav } from "./candidate-nav";
import { Applications } from "./applications";
import { usePendingReviews } from "./pending-reviews";

export function CandidateHome({ me }: { me: Me }) {
  const t = useTranslations("CandidateHome");
  const profile = useCandidatesMeRetrieve({ query: { retry: false, staleTime: 30_000 } });
  const resumes = useCandidatesMeResumesList({
    query: {
      retry: false,
      staleTime: 30_000,
      refetchInterval: (q) =>
        q.state.data?.some((r) =>
          ["pending_upload", "quarantined", "scanning", "processing"].includes(r.status),
        )
          ? 5000
          : false,
    },
  });
  const draft = useQuery({
    queryKey: ["guest-cv"],
    queryFn: getGuestDraft,
    retry: false,
    gcTime: 0,
    enabled: process.env.NEXT_PUBLIC_ENABLE_GUEST_DRAFT_WORKSPACE === "true",
    refetchOnWindowFocus: false,
  });
  const pending = profile.isPending || resumes.isPending || (draft.isEnabled && draft.isPending);
  const profileMissing = isApiError(profile.error) && profile.error.status === 404;
  const failed =
    (profile.isError && !profileMissing) ||
    resumes.isError ||
    (draft.isError && !(isApiError(draft.error) && draft.error.status === 404));
  const action = candidateNextAction(me, profile.data, resumes.data ?? [], draft.data);
  const completeness = profile.data?.completeness;
  const reviews = usePendingReviews(resumes.data ?? []);
  const reviewKinds = {
    headline: "headline",
    experience: "experience",
    skills: "skill",
    languages: "language",
  } as const;
  const educationReview = reviews.links.education ?? reviews.links.certification;
  const uncertainReview = reviews.loading || reviews.failed ? reviews.fallback : undefined;
  return (
    <div data-candidate-home className="grid gap-6">
      <CandidateNav />
      <header className="grid gap-1">
        <p className="text-sm text-muted-foreground">{t("title")}</p>
        <h1 className="text-2xl font-semibold sm:text-3xl">
          {me.full_name.trim() ? t("welcomeName", { name: me.full_name.trim() }) : t("welcome")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("intro")}</p>
      </header>
      {pending ? (
        <Skeleton className="h-44 rounded-2xl" aria-label={t("loading")} />
      ) : failed ? (
        <section role="status" className="rounded-2xl border bg-card p-6">
          <p>{t("loadError")}</p>
          <Button
            variant="link"
            onClick={() => {
              void profile.refetch();
              void resumes.refetch();
              if (draft.isEnabled) void draft.refetch();
            }}
          >
            {t("retry")}
          </Button>
          <Link href="/account/profile" className={buttonVariants({ variant: "outline" })}>
            {t("openProfile")}
          </Link>
        </section>
      ) : (
        <section
          aria-labelledby="next-action"
          className="flex flex-col items-start justify-between gap-5 rounded-2xl bg-primary p-6 text-primary-foreground sm:flex-row sm:items-center sm:p-8"
        >
          <div className="grid gap-2">
            <p className="text-xs font-medium text-gold">{t("nextStep")}</p>
            <h2 id="next-action" className="text-xl font-semibold sm:text-2xl">
              {t(`actions.${action.key}.title`)}
            </h2>
            <p className="max-w-xl text-sm opacity-85">{t(`actions.${action.key}.body`)}</p>
          </div>
          <Link
            href={action.href}
            className={buttonVariants({
              variant: "action",
              className: "shrink-0 whitespace-normal",
            })}
          >
            {t(`actions.${action.key}.cta`)}
            <ArrowUpLeftIcon aria-hidden="true" className="size-4 ltr:-scale-x-100" />
          </Link>
        </section>
      )}
      {draft.data &&
      !["claimed", "failed"].includes(draft.data.status) &&
      action.key !== "draft" ? (
        <Link
          href="/start?step=upload"
          className="inline-flex min-h-11 items-center gap-2 text-sm text-action"
        >
          <FileTextIcon className="size-4" aria-hidden="true" />
          {t("resumeDraft")}
        </Link>
      ) : null}
      <div className="grid items-start gap-6 lg:grid-cols-[1.15fr_1fr]">
        <section
          aria-labelledby="my-profile"
          className="grid gap-4 rounded-2xl border bg-card p-5 sm:p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="my-profile" className="text-lg font-semibold">
              {t("profile")}
            </h2>
            <Link
              href="/account/profile"
              className="inline-flex min-h-11 items-center text-sm text-action"
            >
              {t("openProfile")}
            </Link>
          </div>
          {profile.isPending ? (
            <Skeleton className="h-28" />
          ) : profile.isError && !profileMissing ? (
            <p role="status">{t("profileError")}</p>
          ) : (
            <>
              <p className="text-muted-foreground" dir="auto">
                {profile.data?.headline || t("noHeadline")}
              </p>
              <ul className="divide-y">
                {(
                  [
                    ["headline", "has_headline", "/account/profile"],
                    ["experience", "has_experience", "/account/profile#section-experiences"],
                    ["skills", "has_skills", "/account/profile#section-skills"],
                    ["languages", "has_languages", "/account/profile#section-languages"],
                  ] as const
                ).map(([key, flag, href]) => (
                  <li key={key} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span>{t(`sections.${key}`)}</span>
                    <Link
                      href={
                        reviews.links[reviewKinds[key]] ??
                        (!completeness?.[flag] ? uncertainReview : undefined) ??
                        href
                      }
                      className="inline-flex min-h-11 items-center gap-2 text-action"
                    >
                      <span className="text-muted-foreground">
                        {t(
                          reviews.links[reviewKinds[key]]
                            ? completeness?.[flag]
                              ? "hasInformationPending"
                              : "pendingInformation"
                            : uncertainReview && !completeness?.[flag]
                              ? reviews.loading
                                ? "checkingInformation"
                                : "reviewInformation"
                              : completeness?.[flag]
                                ? "hasInformation"
                                : "addInformation",
                        )}
                      </span>
                      <span className="sr-only">{t(`sections.${key}`)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href={educationReview ?? uncertainReview ?? "/account/profile#section-educations"}
                className="text-sm text-action hover:underline"
              >
                {t("education")}
                {educationReview ? ` · ${t("pendingInformation")}` : ""}
              </Link>
              {reviews.failed ? (
                <div role="status" className="text-sm text-muted-foreground">
                  <p>{t("reviewStatusError")}</p>
                  <Button variant="link" onClick={() => void reviews.retry()}>
                    {t("retry")}
                  </Button>
                </div>
              ) : null}
              {profile.data ? (
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <LockKeyholeIcon className="size-4 shrink-0" aria-hidden="true" />
                  {t(`visibility.${profile.data?.visibility ?? "private"}`)}
                </p>
              ) : null}
            </>
          )}
        </section>
        <div className="grid gap-6">
          <section
            aria-labelledby="my-applications"
            className="rounded-2xl border bg-card p-5 sm:p-6"
          >
            <h2 id="my-applications" className="mb-3 text-lg font-semibold">
              {t("applications")}
            </h2>
            <Applications />
          </section>
          <section
            aria-labelledby="my-cv"
            className="grid gap-3 rounded-2xl border bg-card p-5 sm:p-6"
          >
            <h2 id="my-cv" className="text-lg font-semibold">
              {t("resumes")}
            </h2>
            <p className="text-sm text-muted-foreground">{t("resumeManageHint")}</p>
            <Link
              href="/account/profile/resumes"
              className="inline-flex min-h-11 items-center text-sm text-action"
            >
              {t("manageResumes")}
            </Link>
          </section>
        </div>
      </div>
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-secondary p-5">
        <div>
          <h2 className="font-semibold">{t("jobs")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("jobsBody")}</p>
        </div>
        <Link href="/jobs" className={buttonVariants({ variant: "outline" })}>
          {t("explore")}
        </Link>
      </section>
      <div className="flex flex-wrap gap-5 text-sm text-muted-foreground">
        <Link
          href="/account/profile/privacy"
          className="inline-flex min-h-11 items-center hover:underline"
        >
          {t("privacy")}
        </Link>
        <Link href="/account" className="inline-flex min-h-11 items-center hover:underline">
          {t("settings")}
        </Link>
      </div>
    </div>
  );
}
