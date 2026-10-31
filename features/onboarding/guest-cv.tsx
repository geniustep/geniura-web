"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
        <Button className="h-auto min-h-11 py-3 whitespace-normal" onClick={() => draft.refetch()}>
          {t("retry")}
        </Button>
      </section>
    );
  }
  const displayName = name ?? data?.identity.name ?? "";
  const displayEmail = email ?? data?.identity.email ?? "";
  return (
    <section className="grid gap-5 rounded-xl border bg-card p-6 sm:p-9" aria-busy={busy}>
      <FormAlert error={error} />
      {!data ? (
        <>
          <h2 className="text-2xl font-semibold">{t("title")}</h2>
          <p className="text-muted-foreground">{t("privacy")}</p>
          <label htmlFor="guest-file">{t("file")}</label>
          <Input
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
          <p className="text-sm text-muted-foreground">{t("limits")}</p>
          {error instanceof Error && !isApiError(error) ? (
            <p role="alert">{error.message}</p>
          ) : null}
        </>
      ) : data.status === "queued" || data.status === "processing" ? (
        <p role="status" aria-live="polite">
          {t("processing")}
        </p>
      ) : data.status === "failed" ? (
        <p role="alert">{t("failed")}</p>
      ) : data.status === "claimed" ? (
        <Link href="/account/profile" className={buttonVariants({ variant: "action" })}>
          {t("profile")}
        </Link>
      ) : (
        <>
          <h2 className="text-2xl font-semibold">
            {displayName.trim() ? t("welcomeName", { name: displayName.trim() }) : t("welcome")}
          </h2>
          <p className="text-muted-foreground">{t("suggestions")}</p>
          <label htmlFor="guest-name">{t("name")}</label>
          <Input
            id="guest-name"
            autoComplete="name"
            maxLength={100}
            value={displayName}
            onChange={(event) => setName(event.target.value)}
          />
          {data.identity.phone ? (
            <p className="text-sm">{t("phoneSuggestion", { phone: data.identity.phone })}</p>
          ) : null}
          {signedIn && data.email_verified ? (
            <Button
              className="h-auto min-h-11 py-3 whitespace-normal"
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
              <p>{signedIn ? t("sameEmail") : t("proofReason")}</p>
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
                    className="h-auto min-h-11 py-3 whitespace-normal"
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
                className="h-auto min-h-11 py-3 whitespace-normal"
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
      {data ? (
        <Button
          className="h-auto min-h-11 py-3 whitespace-normal"
          variant="outline"
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
