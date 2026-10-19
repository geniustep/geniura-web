"use client";

import {
  CircleCheckIcon,
  DownloadIcon,
  FileTextIcon,
  LoaderCircleIcon,
  RotateCcwIcon,
  ShieldAlertIcon,
  StarIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useId, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/patterns/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { FormAlert } from "@/features/auth/form-parts";
import {
  candidatesMeResumesCompleteCreate,
  candidatesMeResumesContentCreate,
  candidatesMeResumesDestroy,
  candidatesMeResumesDownloadUrlRetrieve,
  candidatesMeResumesPrimaryCreate,
  candidatesMeResumesRetryExtractionCreate,
  candidatesMeResumesUploadIntentCreate,
  useCandidatesMeResumesList,
} from "@/lib/api/generated/endpoints/resumes/resumes";
import type { Resume } from "@/lib/api/generated/model";
import { Link } from "@/lib/i18n/navigation";

import { useRefreshProfile } from "./api";

const MAX_BYTES = 5 * 1024 * 1024;
const WORKING = new Set(["pending_upload", "quarantined", "scanning", "ready", "processing"]);

type Stage = "scan" | "read" | "review" | "done" | "failed" | "rejected";

function stageOf(resume: Resume): Stage {
  if (resume.status === "rejected") return "rejected";
  if (resume.status === "failed") return "failed";
  if (resume.status === "review_required") return "review";
  if (resume.status === "reviewed") return "done";
  if (resume.scanned_at) return "read";
  return "scan";
}

function StatusLine({ resume }: { resume: Resume }) {
  const t = useTranslations("Profile.resumes");
  const stage = stageOf(resume);
  switch (stage) {
    case "scan":
    case "read":
      return (
        <span className="flex items-center gap-2 text-sm text-action" role="status">
          <LoaderCircleIcon
            className="size-4 animate-spin motion-reduce:animate-none"
            aria-hidden="true"
          />
          {t(`stage.${stage}`)}
        </span>
      );
    case "review":
      return <Badge variant="info">{t("stage.review")}</Badge>;
    case "done":
      return (
        <Badge variant="success">
          <CircleCheckIcon aria-hidden="true" />
          {t("stage.done")}
        </Badge>
      );
    case "failed":
      return <Badge variant="warning">{t("stage.failed")}</Badge>;
    case "rejected":
      return (
        <Badge variant="danger">
          <ShieldAlertIcon aria-hidden="true" />
          {t("stage.rejected")}
        </Badge>
      );
  }
}

function UploadForm({ onUploaded }: { onUploaded: () => Promise<unknown> }) {
  const t = useTranslations("Profile.resumes");
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const [failure, setFailure] = useState<unknown>(null);
  const [pending, setPending] = useState(false);

  function choose(chosen: File | null) {
    setProblem(null);
    setFailure(null);
    if (!chosen) return setFile(null);
    const type = chosen.name.toLowerCase().endsWith(".pdf")
      ? "pdf"
      : chosen.name.toLowerCase().endsWith(".docx")
        ? "docx"
        : null;
    if (!type) return setProblem(t("wrongType"));
    if (chosen.size > MAX_BYTES) return setProblem(t("tooLarge"));
    setFile(chosen);
    if (!name) setName(chosen.name.replace(/\.(pdf|docx)$/i, "").slice(0, 80));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!file) return setProblem(t("chooseFile"));
    setPending(true);
    setFailure(null);
    try {
      const intent = await candidatesMeResumesUploadIntentCreate({
        display_name: name.trim() || file.name.slice(0, 80),
        file_type: file.name.toLowerCase().endsWith(".pdf") ? "pdf" : "docx",
        size: file.size,
        make_primary: true,
      });
      await candidatesMeResumesContentCreate(intent.resume.id, { file });
      await candidatesMeResumesCompleteCreate(intent.resume.id);
      toast.success(t("uploaded"));
      setFile(null);
      setName("");
      if (input.current) input.current.value = "";
      await onUploaded();
    } catch (error) {
      setFailure(error);
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-4 rounded-2xl bg-card p-6 shadow-float sm:p-8"
      noValidate
    >
      <div className="grid gap-1">
        <h2 className="text-xl font-semibold">{t("uploadTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("uploadHint")}</p>
      </div>
      <label
        htmlFor={`${id}-file`}
        className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-input p-8 text-center hover:bg-muted"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          choose(e.dataTransfer.files[0] ?? null);
        }}
      >
        <UploadIcon className="size-7 text-action" aria-hidden="true" />
        <span className="font-semibold">{file ? file.name : t("dropHere")}</span>
        <span className="text-sm text-muted-foreground">{t("limits")}</span>
        <input
          ref={input}
          id={`${id}-file`}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="sr-only"
          aria-describedby={problem ? `${id}-problem` : undefined}
          onChange={(e) => choose(e.target.files?.[0] ?? null)}
          disabled={pending}
        />
      </label>
      {problem ? (
        <p id={`${id}-problem`} className="text-sm text-destructive">
          {problem}
        </p>
      ) : null}
      <div className="grid gap-2">
        <Label htmlFor={`${id}-name`}>{t("displayName")}</Label>
        <Input
          id={`${id}-name`}
          dir="auto"
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={pending}
        />
        <p className="text-xs text-muted-foreground">{t("displayNameHint")}</p>
      </div>
      <p className="rounded-xl bg-muted p-3 text-sm text-subtle-foreground">{t("scanNote")}</p>
      <FormAlert error={failure} />
      <Button
        type="submit"
        variant="action"
        size="lg"
        disabled={pending}
        className="justify-self-start"
      >
        {pending ? t("uploading") : t("upload")}
      </Button>
    </form>
  );
}

function ResumeRow({ resume, refresh }: { resume: Resume; refresh: () => Promise<unknown> }) {
  const t = useTranslations("Profile.resumes");
  const format = useFormatter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const stage = stageOf(resume);
  const downloadable = Boolean(resume.scanned_at) && stage !== "rejected";

  async function act(action: () => Promise<unknown>, success?: string) {
    setBusy(true);
    try {
      await action();
      if (success) toast.success(success);
    } catch {
      toast.error(t("actionFailed"));
    } finally {
      setBusy(false);
      setConfirming(false);
      await refresh();
    }
  }

  async function download() {
    setBusy(true);
    try {
      const signed = await candidatesMeResumesDownloadUrlRetrieve(resume.id);
      // A plain link click: the browser downloads the file streamed by the BFF (Content-Disposition).
      const link = document.createElement("a");
      link.href = `/api/bff${signed.url}`;
      link.rel = "noopener";
      link.click();
    } catch {
      toast.error(t("actionFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="grid gap-3 border-t py-5 first:border-t-0 sm:grid-cols-[auto_1fr_auto] sm:items-center">
      <span className="inline-flex size-12 items-center justify-center rounded-xl bg-secondary text-xs font-bold text-secondary-foreground uppercase">
        {resume.file_type}
      </span>
      <div className="grid min-w-0 gap-1">
        <p className="flex flex-wrap items-center gap-2 font-semibold">
          <bdi dir="auto">{resume.display_name}</bdi>
          {resume.is_primary ? (
            <Badge variant="primary">
              <StarIcon aria-hidden="true" />
              {t("primary")}
            </Badge>
          ) : null}
        </p>
        <p className="text-sm text-muted-foreground">
          {t("meta", {
            version: resume.version,
            date: format.dateTime(new Date(resume.created_at), { dateStyle: "medium" }),
          })}
        </p>
        <StatusLine resume={resume} />
        {stage === "failed" ? (
          <p className="text-sm text-subtle-foreground">{t("failedExplain")}</p>
        ) : null}
        {stage === "rejected" ? (
          <p className="text-sm text-subtle-foreground">{t("rejectedExplain")}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-1 sm:justify-end">
        {stage === "review" ? (
          <Link
            href={`/account/profile/resumes/${resume.id}/review`}
            className={buttonVariants({ variant: "action", size: "sm" })}
          >
            {t("review")}
          </Link>
        ) : null}
        {stage === "failed" ? (
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => void act(() => candidatesMeResumesRetryExtractionCreate(resume.id))}
          >
            <RotateCcwIcon aria-hidden="true" />
            {t("retry")}
          </Button>
        ) : null}
        {!resume.is_primary && downloadable ? (
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() =>
              void act(() => candidatesMeResumesPrimaryCreate(resume.id), t("primarySet"))
            }
          >
            {t("makePrimary")}
          </Button>
        ) : null}
        {downloadable ? (
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => void download()}
            aria-label={t("downloadLabel", { name: resume.display_name })}
          >
            <DownloadIcon aria-hidden="true" />
          </Button>
        ) : null}
        {confirming ? (
          <>
            <Button
              size="sm"
              variant="destructive"
              disabled={busy}
              onClick={() => void act(() => candidatesMeResumesDestroy(resume.id), t("deleted"))}
            >
              {t("confirmDelete")}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
              {t("cancel")}
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setConfirming(true)}
            aria-label={t("deleteLabel", { name: resume.display_name })}
          >
            <Trash2Icon aria-hidden="true" />
          </Button>
        )}
      </div>
      {confirming ? (
        <p className="text-sm text-subtle-foreground sm:col-span-3">{t("deleteNote")}</p>
      ) : null}
    </li>
  );
}

/** Versions of the CV, their safety and reading status, and the review of what was read. */
export function ResumesPanel() {
  const t = useTranslations("Profile.resumes");
  const refreshAll = useRefreshProfile();
  const resumes = useCandidatesMeResumesList({
    query: {
      // Keep checking while a file is being scanned or read; stop as soon as nothing is in progress.
      refetchInterval: (query) =>
        (query.state.data ?? []).some((r) => WORKING.has(r.status)) ? 3000 : false,
    },
  });
  const rows = (resumes.data ?? []).filter((r) => r.status !== "deleted");

  return (
    <div className="grid gap-6">
      <UploadForm onUploaded={refreshAll} />
      <section
        aria-labelledby="versions"
        className="grid gap-2 rounded-2xl bg-card p-6 shadow-card"
      >
        <h2 id="versions" className="text-lg font-semibold">
          {t("versionsTitle")}
        </h2>
        {resumes.isPending ? <Skeleton className="h-24" /> : null}
        {resumes.error ? <FormAlert error={resumes.error} /> : null}
        {!resumes.isPending && rows.length === 0 ? (
          <EmptyState
            icon={FileTextIcon}
            title={t("emptyTitle")}
            description={t("emptyLine")}
            className="py-8 shadow-none"
          />
        ) : null}
        <ul>
          {rows.map((resume) => (
            <ResumeRow key={resume.id} resume={resume} refresh={refreshAll} />
          ))}
        </ul>
        {rows.some((r) => WORKING.has(r.status)) ? (
          <p className="text-sm text-muted-foreground">{t("leaveNote")}</p>
        ) : null}
      </section>
    </div>
  );
}
