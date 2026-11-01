"use client";

import { FileTextIcon, LockKeyholeIcon, PencilLineIcon, UploadIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FormAlert } from "@/features/auth/form-parts";
import { GuestCv } from "@/features/onboarding/guest-cv";
import { ResumesPanel } from "@/features/profile/resumes-panel";
import { isApiError } from "@/lib/api/errors";
import { useAuthMeRetrieve } from "@/lib/api/generated/endpoints/me/me";
import { useCandidatesMeResumesList } from "@/lib/api/generated/endpoints/resumes/resumes";
import { Link } from "@/lib/i18n/navigation";

export function CandidateStart() {
  const t = useTranslations("CandidateStart");
  const query = useSearchParams();
  const [step, setStep] = useState<"choose" | "upload" | "manual">(() =>
    ["upload", "claim"].includes(query.get("step") ?? "")
      ? "upload"
      : query.get("step") === "manual"
        ? "manual"
        : "choose",
  );
  const me = useAuthMeRetrieve({ query: { retry: false, staleTime: 60_000 } });
  const resumes = useCandidatesMeResumesList({ query: { enabled: !!me.data, retry: false } });
  const guest = isApiError(me.error) && me.error.status === 401;
  const next = `/start?step=${step === "manual" ? "manual" : "upload"}`;
  const pendingReview = resumes.data?.find((resume) => resume.status === "review_required");

  if (me.isPending) return <Skeleton className="h-72 rounded-xl" aria-label={t("loading")} />;
  if (!me.data && !guest && step !== "choose") {
    return (
      <div className="grid gap-4">
        <FormAlert error={me.error} />
        <Button onClick={() => me.refetch()}>{t("retry")}</Button>
      </div>
    );
  }

  return (
    <div data-start-content className="mx-auto grid w-full max-w-2xl gap-3">
      {me.data ? (
        <p className="text-center text-lg font-semibold">
          {me.data.full_name.trim()
            ? t("welcomeName", { name: me.data.full_name.trim() })
            : t("welcome")}
        </p>
      ) : null}
      {me.data && pendingReview ? (
        <section className="grid gap-3 rounded-xl border bg-card p-6">
          <h2 className="text-xl font-semibold">{t("reviewTitle")}</h2>
          <p className="text-muted-foreground">{t("reviewBody")}</p>
          <Link
            href={`/account/profile/resumes/${pendingReview.id}/review`}
            className={buttonVariants({
              variant: "action",
              size: "lg",
              className: "justify-self-start whitespace-normal",
            })}
          >
            {t("reviewAction")}
          </Link>
        </section>
      ) : null}
      {step === "choose" ? (
        <section className="grid justify-items-center gap-5 rounded-2xl border bg-card px-6 py-9 text-center shadow-card sm:px-12 sm:py-12">
          <span className="flex size-16 items-center justify-center rounded-2xl bg-secondary">
            <UploadIcon className="size-7 text-primary" aria-hidden="true" />
          </span>
          <h2 className="text-2xl font-semibold">{t("uploadTitle")}</h2>
          <p className="text-muted-foreground">{t("uploadBody")}</p>
          <Button
            variant="action"
            size="lg"
            className="w-full rounded-xl sm:w-auto sm:min-w-64"
            onClick={() => setStep("upload")}
          >
            {t("uploadAction")}
          </Button>
          <p className="text-sm text-muted-foreground">{t("limits")}</p>
          <div className="mt-1 w-full border-t pt-4">
            <Button
              variant="link"
              className="h-auto min-h-11 px-0 whitespace-normal"
              onClick={() => setStep("manual")}
            >
              <PencilLineIcon aria-hidden="true" />
              {t("manualAction")}
            </Button>
          </div>
        </section>
      ) : process.env.NEXT_PUBLIC_ENABLE_GUEST_CV === "true" &&
        step === "upload" &&
        (!me.data ||
          query.get("step") === "claim" ||
          process.env.NEXT_PUBLIC_ENABLE_GUEST_DRAFT_WORKSPACE === "true") ? (
        <GuestCv signedIn={!!me.data} />
      ) : !me.data ? (
        <section className="grid gap-4 rounded-xl border bg-card p-6 sm:p-9">
          <LockKeyholeIcon className="size-8 text-action" aria-hidden="true" />
          <h2 className="text-2xl font-semibold">{t("authTitle")}</h2>
          <p className="text-muted-foreground">{t("authBody")}</p>
          <p className="rounded-xl bg-muted p-4 text-sm text-subtle-foreground">{t("authNote")}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={{ pathname: "/login", query: { next } }}
              className={buttonVariants({ variant: "action", size: "lg", className: "rounded-xl" })}
            >
              {t("signIn")}
            </Link>
            <Link
              href={{ pathname: "/register", query: { next } }}
              className={buttonVariants({
                variant: "outline",
                size: "lg",
                className: "rounded-xl",
              })}
            >
              {t("register")}
            </Link>
          </div>
        </section>
      ) : step === "upload" ? (
        <div className="grid gap-4">
          <p className="text-sm text-muted-foreground">{t("reviewPromise")}</p>
          <ResumesPanel />
        </div>
      ) : (
        <section className="grid gap-4 rounded-xl border bg-card p-6">
          <FileTextIcon className="size-8 text-action" aria-hidden="true" />
          <h2 className="text-2xl font-semibold">{t("manualTitle")}</h2>
          <p className="text-muted-foreground">{t("manualBody")}</p>
          <Link
            href="/account/profile"
            className={buttonVariants({
              variant: "action",
              size: "lg",
              className: "justify-self-start rounded-xl",
            })}
          >
            {t("openProfile")}
          </Link>
        </section>
      )}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm">
        {step !== "choose" ? (
          <Button
            variant="link"
            onClick={() => setStep("choose")}
            className="min-h-11 px-0 text-muted-foreground"
          >
            {t("back")}
          </Button>
        ) : (
          <span />
        )}
        <Link
          href="/jobs"
          className="inline-flex min-h-11 items-center text-action hover:underline"
        >
          {t("browse")}
        </Link>
      </div>
      <details className="text-center text-sm text-muted-foreground">
        <summary className="mx-auto flex min-h-11 w-fit cursor-pointer list-none items-center gap-2 rounded-md px-3 hover:bg-muted">
          <LockKeyholeIcon className="size-4" aria-hidden="true" />
          {t("privacyLabel")}
        </summary>
        <p className="mx-auto mt-2 max-w-lg leading-relaxed">{t("privacy")}</p>
      </details>
    </div>
  );
}
