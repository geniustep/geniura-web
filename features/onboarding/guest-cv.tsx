"use client";

import { FileCheck2Icon, LoaderCircleIcon, UploadIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GuestWorkspace } from "./guest-workspace";
import { FormAlert } from "@/features/auth/form-parts";
import {
  claimGuestDraft,
  deleteGuestDraft,
  getGuestDraft,
  sendGuestCode,
  uploadGuestDraft,
  verifyGuestCode,
} from "@/lib/api/guest-cv";
import { isApiError } from "@/lib/api/errors";
import { Link, useRouter } from "@/lib/i18n/navigation";

export function GuestCv({ signedIn = false }: { signedIn?: boolean }) {
  const t = useTranslations("GuestCv");
  const locale = useLocale();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [accountExists, setAccountExists] = useState<boolean | null>(null);
  const draft = useQuery({
    queryKey: ["guest-cv"],
    queryFn: getGuestDraft,
    retry: false,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchInterval: (query) =>
      query.state.data && ["queued", "processing"].includes(query.state.data.status) ? 2500 : false,
  });
  const missing = isApiError(draft.error) && draft.error.status === 404;
  const data = missing ? undefined : draft.data;
  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(undefined);
    try {
      await action();
    } catch (cause) {
      setError(cause);
      // Refresh expiry/proof state so an expired claim can request a new code.
      await draft.refetch();
    } finally {
      setBusy(false);
    }
  }
  if (draft.isPending) return <p role="status">{t("loading")}</p>;
  if (draft.error && !missing) {
    return (
      <section className="grid gap-4">
        <FormAlert error={draft.error} />
        <Button
          className="h-auto min-h-12 rounded-xl py-3 whitespace-normal"
          onClick={() => draft.refetch()}
        >
          {t("retry")}
        </Button>
      </section>
    );
  }
  const displayName = name ?? data?.identity.name ?? "";
  const displayEmail = email ?? data?.identity.email ?? "";
  if (process.env.NEXT_PUBLIC_ENABLE_GUEST_DRAFT_WORKSPACE === "true" && data?.status === "ready") {
    return <GuestWorkspace signedIn={signedIn} />;
  }
  return (
    <section
      className="grid gap-5 rounded-2xl border bg-card p-6 shadow-card sm:p-9"
      aria-busy={busy}
    >
      <FormAlert error={error} />
      {!data ? (
        <>
          <div className="text-center">
            <h2 className="text-2xl font-semibold">{t("title")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t("uploadHint")}</p>
          </div>
          <div className="relative grid min-h-56 content-center justify-items-center gap-4 rounded-xl border-2 border-dashed border-input bg-muted/40 p-6 text-center transition-colors focus-within:border-action focus-within:ring-2 focus-within:ring-ring hover:border-action hover:bg-secondary/50">
            <UploadIcon className="size-9 text-primary" aria-hidden="true" />
            <label
              htmlFor="guest-file"
              className="rounded-full bg-action px-6 py-3 font-semibold text-action-foreground"
            >
              {t("file")}
            </label>
            <p className="text-sm text-muted-foreground" id="guest-file-limits">
              {t("limits")}
            </p>
            <input
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-wait"
              aria-describedby="guest-file-limits"
              id="guest-file"
              type="file"
              accept=".pdf,.docx"
              disabled={busy}
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                if (!file) return;
                if (file.size > 5 * 1024 * 1024 || !/\.(pdf|docx)$/i.test(file.name)) {
                  setError(new Error(t("limits")));
                  return;
                }
                void run(async () => {
                  await uploadGuestDraft(file);
                  await draft.refetch();
                });
              }}
            />
          </div>
          <details className="text-sm text-muted-foreground">
            <summary className="flex min-h-11 cursor-pointer items-center">
              {t("draftDetails")}
            </summary>
            <p className="pb-2 leading-relaxed">{t("privacy")}</p>
          </details>
          {error instanceof Error && !isApiError(error) ? (
            <p role="alert">{error.message}</p>
          ) : null}
        </>
      ) : data.status === "queued" || data.status === "processing" ? (
        <div
          role="status"
          aria-live="polite"
          className="grid min-h-56 content-center justify-items-center gap-5 text-center"
        >
          <LoaderCircleIcon
            className="size-9 text-action motion-safe:animate-spin"
            aria-hidden="true"
          />
          <p className="text-lg font-medium">{t("processing")}</p>
        </div>
      ) : data.status === "failed" ? (
        <p role="alert">{t("failed")}</p>
      ) : data.status === "claimed" ? (
        <Link href="/account/profile" className={buttonVariants({ variant: "action" })}>
          {t("profile")}
        </Link>
      ) : (
        <>
          <div className="flex items-start gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
              <FileCheck2Icon className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="text-2xl font-semibold [overflow-wrap:anywhere]">
                {displayName.trim() ? t("welcomeName", { name: displayName.trim() }) : t("welcome")}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{t("suggestions")}</p>
            </div>
          </div>
          <div className="grid gap-2">
            <label htmlFor="guest-name">{t("name")}</label>
            <Input
              id="guest-name"
              autoComplete="name"
              maxLength={100}
              value={displayName}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          {data.identity.phone ? (
            <p className="text-sm text-muted-foreground" dir="auto">
              {t("phoneSuggestion", { phone: data.identity.phone })}
            </p>
          ) : null}
          {signedIn && data.email_verified ? (
            <Button
              className="h-auto min-h-12 rounded-xl py-3 whitespace-normal"
              variant="action"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  const result = await claimGuestDraft();
                  router.push(`/account/profile/resumes/${result.resume_id}/review`);
                })
              }
            >
              {t("claim")}
            </Button>
          ) : accountExists !== null ? (
            <>
              <p role="status">{accountExists ? t("existing") : t("newAccount")}</p>
              <Link
                href={{
                  pathname: accountExists ? "/login" : "/register",
                  query: { next: "/start?step=claim" },
                }}
                className={buttonVariants({ variant: "action" })}
              >
                {accountExists ? t("signIn") : t("register")}
              </Link>
            </>
          ) : (
            <form
              className="grid gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                void run(async () => {
                  if (sent) {
                    const proof = await verifyGuestCode(code);
                    setAccountExists(proof.account_exists);
                    await draft.refetch();
                  } else {
                    await sendGuestCode(displayEmail, locale);
                    setSent(true);
                  }
                });
              }}
            >
              <p className="border-t pt-5 text-sm text-muted-foreground">
                {signedIn ? t("sameEmail") : t("proofReason")}
              </p>
              <label htmlFor="guest-email">{t("email")}</label>
              <Input
                id="guest-email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                dir="ltr"
                value={displayEmail}
                disabled={sent || busy}
                onChange={(event) => setEmail(event.target.value)}
              />
              {sent ? (
                <>
                  <p role="status">{t("sent")}</p>
                  <label htmlFor="guest-code">{t("code")}</label>
                  <Input
                    id="guest-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    minLength={6}
                    maxLength={6}
                    required
                    dir="ltr"
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                  />
                  <Button
                    className="h-auto min-h-12 rounded-xl py-3 whitespace-normal"
                    type="button"
                    variant="link"
                    disabled={busy}
                    onClick={() => {
                      setSent(false);
                      setCode("");
                    }}
                  >
                    {t("changeEmail")}
                  </Button>
                </>
              ) : null}
              <Button
                className="h-auto min-h-12 rounded-xl py-3 whitespace-normal"
                type="submit"
                variant="action"
                disabled={busy}
              >
                {sent ? t("verify") : t("send")}
              </Button>
            </form>
          )}
        </>
      )}
      {data && !data.claimed ? (
        <Button
          className="h-auto min-h-12 rounded-xl py-3 whitespace-normal"
          variant="link"
          disabled={busy}
          onClick={() =>
            void run(async () => {
              await deleteGuestDraft();
              setName(null);
              setEmail(null);
              setSent(false);
              setAccountExists(null);
              setCode("");
              await draft.refetch();
            })
          }
        >
          {t("delete")}
        </Button>
      ) : null}
    </section>
  );
}
