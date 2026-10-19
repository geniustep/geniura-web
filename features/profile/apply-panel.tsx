"use client";

import { CheckIcon, CircleHelpIcon, MinusIcon, PartyPopperIcon, SendIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { FormAlert } from "@/features/auth/form-parts";
import { isApiError } from "@/lib/api/errors";
import {
  jobsApplicationPreviewCreate,
  jobsApplicationsCreate,
} from "@/lib/api/generated/endpoints/applications-candidate/applications-candidate";
import { useCandidatesMeJobsMatchRetrieve } from "@/lib/api/generated/endpoints/matching/matching";
import { useAuthMeRetrieve } from "@/lib/api/generated/endpoints/me/me";
import { useCandidatesMeResumesList } from "@/lib/api/generated/endpoints/resumes/resumes";
import type { RequirementResult } from "@/lib/api/generated/model";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

type Snapshot = {
  full_name?: string;
  email?: string;
  headline?: string;
  skills?: unknown[];
  languages?: unknown[];
  experiences?: unknown[];
  educations?: unknown[];
  certifications?: unknown[];
  resume_id?: string | null;
};

const STATUS = {
  met: { icon: CheckIcon, tone: "bg-success-soft text-success" },
  not_met: { icon: MinusIcon, tone: "bg-warning-soft text-warning" },
  unknown: {
    icon: CircleHelpIcon,
    tone: "border border-dashed border-input bg-muted text-subtle-foreground",
  },
} as const;

function MatchList({
  requirements,
  labels,
}: {
  requirements: RequirementResult[];
  labels: Record<string, string>;
}) {
  const t = useTranslations("Profile.match");
  return (
    <ul className="grid gap-2">
      {requirements.map((req) => {
        const status = STATUS[req.status as keyof typeof STATUS] ?? STATUS.unknown;
        const Icon = status.icon;
        return (
          <li key={req.requirement_id} className="flex gap-3">
            <span
              className={cn(
                "mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full",
                status.tone,
              )}
            >
              <Icon className="size-3.5" aria-hidden="true" />
            </span>
            <span className="grid gap-0.5 text-sm">
              <span className="font-medium">{labels[req.requirement_id] ?? t("requirement")}</span>
              <span className="text-subtle-foreground">
                {t(`status.${req.status}` as "status.met")}
                {req.gap === "expired" ? ` · ${t("expired")}` : ""}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Apply on a public job: an explainable reading of the profile against the requirements (decision
 * support, never a verdict), then a preview built by the server of exactly what will be sent.
 */
export function ApplyPanel({
  jobId,
  requirementLabels,
}: {
  jobId: string;
  requirementLabels: Record<string, string>;
}) {
  const t = useTranslations("Profile.apply");
  const tMatch = useTranslations("Profile.match");
  const tCommon = useTranslations("Common");
  const me = useAuthMeRetrieve({ query: { retry: false, staleTime: 60_000 } });
  const signedIn = Boolean(me.data);
  const match = useCandidatesMeJobsMatchRetrieve(jobId, {
    query: { enabled: signedIn, retry: false, staleTime: 60_000 },
  });
  const resumes = useCandidatesMeResumesList({ query: { enabled: signedIn } });
  const [open, setOpen] = useState(false);
  const [resumeId, setResumeId] = useState<string>("");
  const [cover, setCover] = useState("");
  const [preview, setPreview] = useState<Snapshot | null>(null);
  const [failure, setFailure] = useState<unknown>(null);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  if (me.isPending) return <Skeleton className="h-12 rounded-full" />;
  if (!signedIn) {
    return (
      <div className="grid gap-2">
        <Link
          href={{ pathname: "/login", query: { next: `/jobs/${jobId}` } }}
          className={buttonVariants({ variant: "action", size: "lg" })}
        >
          {t("signInToApply")}
        </Link>
        <p className="text-center text-sm text-muted-foreground">{t("noFee")}</p>
      </div>
    );
  }

  const shareable = (resumes.data ?? []).filter(
    (r) => r.scanned_at && !["rejected", "deleted"].includes(r.status),
  );
  const primary = shareable.find((r) => r.is_primary);
  const requirements = match.data?.requirements ?? [];
  const met = requirements.filter((r) => r.status === "met").length;

  async function loadPreview(chosen: string) {
    setPending(true);
    setFailure(null);
    try {
      const result = await jobsApplicationPreviewCreate(jobId, { resume_id: chosen || null });
      setPreview(result.shared_data as Snapshot);
    } catch (error) {
      setFailure(error);
      setPreview(null);
    } finally {
      setPending(false);
    }
  }

  async function send() {
    setPending(true);
    setFailure(null);
    try {
      await jobsApplicationsCreate(jobId, {
        resume_id: resumeId || null,
        cover_letter: cover.trim(),
      });
      setSent(true);
    } catch (error) {
      setFailure(error);
    } finally {
      setPending(false);
    }
  }

  function start() {
    const initial = primary?.id ?? "";
    setResumeId(initial);
    setSent(false);
    setOpen(true);
    void loadPreview(initial);
  }

  const counts = preview
    ? (["skills", "languages", "experiences", "educations", "certifications"] as const).map(
        (key) => ({
          key,
          count: Array.isArray(preview[key]) ? (preview[key] as unknown[]).length : 0,
        }),
      )
    : [];

  return (
    <div className="grid gap-4">
      {match.isPending ? <Skeleton className="h-24" /> : null}
      {match.data && requirements.length ? (
        <section aria-labelledby="match-title" className="grid gap-3 rounded-2xl bg-muted p-4">
          <h3 id="match-title" className="font-display text-base font-semibold">
            {tMatch("title", { met, total: requirements.length })}
          </h3>
          <MatchList requirements={requirements} labels={requirementLabels} />
          <p className="text-xs text-muted-foreground">{tMatch("disclaimer")}</p>
          {requirements.some((r) => r.status === "unknown") ? (
            <Link
              href="/account/profile"
              className="text-sm font-semibold text-action underline-offset-4 hover:underline"
            >
              {tMatch("complete")}
            </Link>
          ) : null}
        </section>
      ) : null}
      {match.isError ? (
        <p className="text-sm text-muted-foreground">{tMatch("unavailable")}</p>
      ) : null}

      <Button variant="action" size="lg" onClick={start}>
        <SendIcon aria-hidden="true" />
        {t("apply")}
      </Button>
      <p className="text-center text-sm text-muted-foreground">{t("noFee")}</p>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent closeLabel={tCommon("close")} className="w-[min(36rem,100vw-2rem)]">
          {sent ? (
            <div className="grid justify-items-center gap-3 py-4 text-center">
              <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-success-soft">
                <PartyPopperIcon className="size-6 text-success" aria-hidden="true" />
              </span>
              <DialogTitle>{t("sentTitle")}</DialogTitle>
              <DialogDescription>{t("sentLine")}</DialogDescription>
              <Link
                href="/account/profile/access-log"
                className={buttonVariants({ variant: "outline" })}
              >
                {t("seeLog")}
              </Link>
            </div>
          ) : (
            <>
              <DialogTitle>{t("previewTitle")}</DialogTitle>
              <DialogDescription>{t("previewLine")}</DialogDescription>
              <div className="grid gap-2">
                <Label htmlFor="apply-resume">{t("resume")}</Label>
                <NativeSelect
                  id="apply-resume"
                  value={resumeId}
                  disabled={pending}
                  onChange={(e) => {
                    setResumeId(e.target.value);
                    void loadPreview(e.target.value);
                  }}
                >
                  <option value="">{t("noResume")}</option>
                  {shareable.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.display_name} · v{r.version}
                      {r.is_primary ? ` · ${t("primary")}` : ""}
                    </option>
                  ))}
                </NativeSelect>
                <p className="text-xs text-muted-foreground">{t("resumeNote")}</p>
              </div>
              {pending && !preview ? <Skeleton className="h-32" /> : null}
              {preview ? (
                <div className="grid gap-3 rounded-2xl border p-4 text-sm">
                  <p className="font-semibold">{t("theyWillSee")}</p>
                  <ul className="grid gap-1">
                    <li>
                      <bdi>{preview.full_name}</bdi> · <bdi dir="ltr">{preview.email}</bdi>
                    </li>
                    {preview.headline ? (
                      <li>
                        <bdi dir="auto">{preview.headline}</bdi>
                      </li>
                    ) : null}
                    <li className="text-subtle-foreground">
                      {counts.map(({ key, count }) => t(`counts.${key}`, { count })).join(" · ")}
                    </li>
                    <li className="text-subtle-foreground">
                      {preview.resume_id ? t("withResume") : t("withoutResume")}
                    </li>
                  </ul>
                  <p className="border-t pt-3 text-subtle-foreground">{t("notShared")}</p>
                </div>
              ) : null}
              <div className="grid gap-2">
                <Label htmlFor="apply-cover">{t("cover")}</Label>
                <Textarea
                  id="apply-cover"
                  dir="auto"
                  maxLength={5000}
                  value={cover}
                  onChange={(e) => setCover(e.target.value)}
                />
              </div>
              <p className="rounded-xl bg-secondary p-3 text-sm text-secondary-foreground">
                {t("snapshotNote")}
              </p>
              {isApiError(failure) && failure.code === "email_not_verified" ? (
                <p role="alert" className="rounded-xl bg-warning-soft p-3 text-sm text-warning">
                  {t("verifyEmail")}
                </p>
              ) : isApiError(failure) && failure.code === "duplicate_application" ? (
                <p role="alert" className="rounded-xl bg-warning-soft p-3 text-sm text-warning">
                  {t("duplicate")}
                </p>
              ) : (
                <FormAlert error={failure} />
              )}
              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  {t("cancel")}
                </Button>
                <Button variant="action" disabled={pending || !preview} onClick={() => void send()}>
                  {pending && preview ? t("sending") : t("confirm")}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
