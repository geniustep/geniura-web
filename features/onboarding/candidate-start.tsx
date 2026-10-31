"use client";

import { FileTextIcon, LockKeyholeIcon, PencilLineIcon, UploadIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FormAlert } from "@/features/auth/form-parts";
import { ResumesPanel } from "@/features/profile/resumes-panel";
import { isApiError } from "@/lib/api/errors";
import { useAuthMeRetrieve } from "@/lib/api/generated/endpoints/me/me";
import { useCandidatesMeResumesList } from "@/lib/api/generated/endpoints/resumes/resumes";
import { Link } from "@/lib/i18n/navigation";

export function CandidateStart() {
  const t = useTranslations("CandidateStart");
  const locale = useLocale();
  const query = useSearchParams();
  const [step, setStep] = useState<"choose" | "upload" | "manual">(() =>
    query.get("step") === "upload"
      ? "upload"
      : query.get("step") === "manual"
        ? "manual"
        : "choose",
  );
  const me = useAuthMeRetrieve({ query: { retry: false, staleTime: 60_000 } });
  const resumes = useCandidatesMeResumesList({ query: { enabled: !!me.data, retry: false } });
  const guest = isApiError(me.error) && me.error.status === 401;
  const next = `/${locale}/start?step=${step === "manual" ? "manual" : "upload"}`;
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
    <div className="mx-auto grid w-full max-w-3xl gap-7">
      <div className="grid gap-3 rounded-xl bg-card p-6 shadow-card">
        {me.data ? (
          <p className="text-lg font-semibold">
            {me.data.full_name.trim()
              ? t("welcomeName", { name: me.data.full_name.trim() })
              : t("welcome")}
          </p>
        ) : null}
        <p className="text-base leading-relaxed text-muted-foreground">{t("description")}</p>
      </div>
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
        <section className="grid gap-5 rounded-xl border bg-card p-6 sm:p-9">
          <UploadIcon className="size-9 text-action" aria-hidden="true" />
          <h2 className="text-2xl font-semibold">{t("uploadTitle")}</h2>
          <p className="text-muted-foreground">{t("uploadBody")}</p>
          <Button
            variant="action"
            size="lg"
            className="justify-self-start rounded-xl"
            onClick={() => setStep("upload")}
          >
            {t("uploadAction")}
          </Button>
          <p className="text-sm text-muted-foreground">{t("limits")}</p>
          <div className="border-t pt-4">
            <Button
              variant="link"
              className="h-auto min-h-11 px-0 text-start whitespace-normal"
              onClick={() => setStep("manual")}
            >
              <PencilLineIcon aria-hidden="true" />
              {t("manualAction")}
            </Button>
          </div>
        </section>
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
      {step !== "choose" ? (
        <Button variant="link" onClick={() => setStep("choose")} className="justify-self-start">
          {t("back")}
        </Button>
      ) : null}
      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <LockKeyholeIcon className="mt-1 size-4 shrink-0" aria-hidden="true" />
        {t("privacy")}
      </p>
      <Link href="/jobs" className="text-sm text-action hover:underline">
        {t("browse")}
      </Link>
    </div>
  );
}
