"use client";

import { HistoryIcon, InboxIcon, LockKeyholeIcon, RadarIcon, UsersRoundIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/patterns/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FormAlert } from "@/features/auth/form-parts";
import { isApiError } from "@/lib/api/errors";
import {
  candidatesMeConsentsRevokeCreate,
  candidatesMeShareRequestsRespondCreate,
  candidatesMeVisibilityPartialUpdate,
  useCandidatesMeConsentsList,
  useCandidatesMeRetrieve,
  useCandidatesMeShareRequestsList,
} from "@/lib/api/generated/endpoints/candidates/candidates";
import {
  CandidateVisibilityEnum,
  type CandidateVisibilityEnum as Visibility,
} from "@/lib/api/generated/model";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

import { useRefreshProfile } from "./api";

const ICONS = {
  private: LockKeyholeIcon,
  applications_only: UsersRoundIcon,
  discoverable: RadarIcon,
} as const;

/**
 * Two independent axes (paper v1.1, section 05): one visibility state for the whole profile, and
 * permissions granted organization by organization. Changing one never cancels the other.
 */
export function PrivacyPanel() {
  const t = useTranslations("Profile");
  const format = useFormatter();
  const refresh = useRefreshProfile();
  const profile = useCandidatesMeRetrieve({ query: { staleTime: 30_000 } });
  const shares = useCandidatesMeShareRequestsList({ query: { staleTime: 30_000 } });
  const consents = useCandidatesMeConsentsList({ query: { staleTime: 30_000 } });
  const [busy, setBusy] = useState<string | null>(null);
  const [failure, setFailure] = useState<unknown>(null);

  async function run(key: string, action: () => Promise<unknown>, success: string) {
    setBusy(key);
    setFailure(null);
    try {
      await action();
      toast.success(success);
    } catch (error) {
      if (isApiError(error) && error.code === "share_request_expired")
        toast.error(t("privacy.expired"));
      else setFailure(error);
    } finally {
      setBusy(null);
      await refresh();
    }
  }

  if (profile.isPending) return <Skeleton className="h-96" />;
  if (!profile.data) return <FormAlert error={profile.error} />;

  const current = profile.data.visibility;
  const paused = current === "discoverable" && profile.data.availability === "not_looking";
  const pending = (shares.data ?? []).filter((s) => s.status === "pending");
  const answered = (shares.data ?? []).filter((s) => s.status !== "pending");
  const activeConsents = (consents.data ?? []).filter(
    (c) => c.is_active && c.purpose === "share_with_organization",
  );

  return (
    <div className="grid gap-6">
      <FormAlert error={failure} />
      <section
        aria-labelledby="visibility-title"
        className="grid gap-4 rounded-2xl bg-card p-6 shadow-float sm:p-8"
      >
        <div className="grid gap-1">
          <h2 id="visibility-title" className="text-xl font-semibold">
            {t("privacy.visibilityTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("privacy.visibilityHint")}</p>
        </div>
        <fieldset className="grid gap-3">
          <legend className="sr-only">{t("privacy.visibilityTitle")}</legend>
          {Object.values(CandidateVisibilityEnum).map((value: Visibility) => {
            const Icon = ICONS[value];
            const checked = current === value;
            return (
              <label
                key={value}
                className={cn(
                  "flex cursor-pointer gap-4 rounded-2xl border-2 p-4 transition-colors",
                  checked ? "border-action bg-secondary/40" : "border-border hover:bg-muted",
                )}
              >
                <input
                  type="radio"
                  name="visibility"
                  value={value}
                  checked={checked}
                  disabled={busy !== null}
                  className="mt-1 size-5 accent-[var(--action)]"
                  onChange={() =>
                    void run(
                      "visibility",
                      () => candidatesMeVisibilityPartialUpdate({ visibility: value }),
                      t("privacy.visibilitySaved"),
                    )
                  }
                />
                <span className="grid gap-1">
                  <span className="flex items-center gap-2 font-semibold">
                    <Icon className="size-4 text-action" aria-hidden="true" />
                    {t(`visibility.${value}.short`)}
                  </span>
                  <span className="text-sm text-subtle-foreground">
                    {t(`visibility.${value}.long`)}
                  </span>
                </span>
              </label>
            );
          })}
        </fieldset>
        {paused ? (
          <p className="rounded-xl bg-warning-soft p-3 text-sm text-warning">
            {t("visibility.paused")}
          </p>
        ) : null}
        <p className="text-sm text-muted-foreground">{t("privacy.independence")}</p>
      </section>

      <section
        aria-labelledby="requests-title"
        className="grid gap-4 rounded-2xl bg-card p-6 shadow-card"
      >
        <h2 id="requests-title" className="text-lg font-semibold">
          {t("privacy.requestsTitle")}
        </h2>
        {shares.isPending ? <Skeleton className="h-24" /> : null}
        {!shares.isPending && pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("privacy.noRequests")}</p>
        ) : null}
        <ul className="grid gap-3">
          {pending.map((share) => (
            <li key={share.id} className="grid gap-3 rounded-2xl border p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="grid gap-0.5">
                  <span className="font-semibold">
                    <bdi>{share.organization_name}</bdi>
                  </span>
                  <span className="text-sm text-muted-foreground">
                    <bdi dir="auto">{share.order_title}</bdi>
                  </span>
                </div>
                {share.expires_at ? (
                  <Badge variant="warning">
                    {t("privacy.expiresOn", {
                      date: format.dateTime(new Date(share.expires_at), { dateStyle: "medium" }),
                    })}
                  </Badge>
                ) : null}
              </div>
              {share.message ? (
                <p className="rounded-xl bg-muted p-3 text-sm" dir="auto">
                  {share.message}
                </p>
              ) : null}
              <p className="text-sm text-subtle-foreground">{t("privacy.requestExplain")}</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="action"
                  disabled={busy !== null}
                  onClick={() =>
                    void run(
                      share.id,
                      () => candidatesMeShareRequestsRespondCreate(share.id, { accept: true }),
                      t("privacy.accepted"),
                    )
                  }
                >
                  {t("privacy.accept")}
                </Button>
                <Button
                  variant="outline"
                  disabled={busy !== null}
                  onClick={() =>
                    void run(
                      share.id,
                      () => candidatesMeShareRequestsRespondCreate(share.id, { accept: false }),
                      t("privacy.declined"),
                    )
                  }
                >
                  {t("privacy.decline")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
        {answered.length ? (
          <details className="text-sm">
            <summary className="cursor-pointer font-medium">
              {t("privacy.answered", { count: answered.length })}
            </summary>
            <ul className="mt-2 grid gap-1">
              {answered.map((share) => (
                <li key={share.id} className="flex flex-wrap justify-between gap-2 border-t py-2">
                  <bdi>{share.organization_name}</bdi>
                  <Badge variant="neutral">{t(`privacy.status.${share.status}`)}</Badge>
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </section>

      <section
        aria-labelledby="consents-title"
        className="grid gap-4 rounded-2xl bg-card p-6 shadow-card"
      >
        <div className="grid gap-1">
          <h2 id="consents-title" className="text-lg font-semibold">
            {t("privacy.consentsTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("privacy.consentsHint")}</p>
        </div>
        {consents.isPending ? <Skeleton className="h-16" /> : null}
        {!consents.isPending && activeConsents.length === 0 ? (
          <EmptyState
            icon={InboxIcon}
            title={t("privacy.noConsents")}
            className="py-8 shadow-none"
          />
        ) : null}
        <ul className="grid gap-2">
          {activeConsents.map((consent) => (
            <li
              key={consent.id}
              className="flex flex-wrap items-center justify-between gap-3 border-t pt-3 first:border-t-0"
            >
              <span className="grid gap-0.5">
                <span className="font-medium">
                  <bdi>{consent.organization_name ?? "—"}</bdi>
                </span>
                <span className="text-sm text-muted-foreground">
                  {t("privacy.grantedOn", {
                    date: format.dateTime(new Date(consent.granted_at), { dateStyle: "medium" }),
                  })}
                </span>
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={busy !== null}
                onClick={() =>
                  void run(
                    consent.id,
                    () => candidatesMeConsentsRevokeCreate(consent.id),
                    t("privacy.revoked"),
                  )
                }
              >
                {t("privacy.revoke")}
              </Button>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">{t("privacy.revokeLimit")}</p>
      </section>

      <Link
        href="/account/profile/access-log"
        className={buttonVariants({ variant: "outline", className: "justify-self-start" })}
      >
        <HistoryIcon aria-hidden="true" />
        {t("links.accessLog")}
      </Link>
    </div>
  );
}
