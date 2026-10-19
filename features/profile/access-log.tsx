"use client";

import {
  BadgeCheckIcon,
  DownloadIcon,
  EyeIcon,
  HandshakeIcon,
  HistoryIcon,
  SendIcon,
  ShieldOffIcon,
  TimerOffIcon,
  UndoIcon,
  UserRoundCheckIcon,
  XIcon,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

import { EmptyState } from "@/components/patterns/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { FormAlert } from "@/features/auth/form-parts";
import { useCandidatesMeAccessLogRetrieve } from "@/lib/api/generated/endpoints/candidates/candidates";
import type { AccessLogEventKindEnum } from "@/lib/api/generated/model";

const ICONS: Record<AccessLogEventKindEnum, typeof EyeIcon> = {
  application_submitted: SendIcon,
  application_withdrawn: UndoIcon,
  application_viewed: EyeIcon,
  resume_downloaded: DownloadIcon,
  share_requested: HandshakeIcon,
  share_accepted: UserRoundCheckIcon,
  share_declined: XIcon,
  share_expired: TimerOffIcon,
  share_revoked: ShieldOffIcon,
  item_verified: BadgeCheckIcon,
};

/** Who received or opened the candidate's data, newest first. Organizations, never individuals. */
export function AccessLog() {
  const t = useTranslations("Profile.accessLog");
  const format = useFormatter();
  const log = useCandidatesMeAccessLogRetrieve({ query: { staleTime: 30_000 } });

  if (log.isPending) return <Skeleton className="h-96" />;
  if (!log.data) return <FormAlert error={log.error} />;
  const { summary, events, organization_activity_visible: orgVisible } = log.data;

  return (
    <div className="grid gap-6">
      <dl className="grid gap-3 sm:grid-cols-3">
        {(
          [
            ["organizations_with_access", summary.organizations_with_access],
            ["resume_downloads", orgVisible ? summary.resume_downloads : null],
            ["share_requests_pending", summary.share_requests_pending],
          ] as const
        ).map(([key, value]) => (
          <div key={key} className="grid gap-1 rounded-2xl bg-card p-5 shadow-card">
            <dt className="text-sm text-muted-foreground">{t(`summary.${key}`)}</dt>
            <dd className="font-display text-3xl font-bold tabular-nums">{value ?? "—"}</dd>
          </div>
        ))}
      </dl>
      {!orgVisible ? (
        <p className="rounded-2xl bg-muted p-4 text-sm text-subtle-foreground">
          {t("orgActivityHidden")}
        </p>
      ) : null}

      {events.length === 0 ? (
        <EmptyState icon={HistoryIcon} title={t("emptyTitle")} description={t("emptyLine")} />
      ) : (
        <ol className="grid rounded-2xl bg-card p-6 shadow-card">
          {events.map((event, index) => {
            const Icon = ICONS[event.kind];
            return (
              <li
                key={`${event.kind}-${event.occurred_at}-${index}`}
                className="grid grid-cols-[2.5rem_1fr] gap-3 pb-5 last:pb-0"
              >
                <span className="relative flex justify-center">
                  <span className="z-10 inline-flex size-9 items-center justify-center rounded-full bg-secondary">
                    <Icon className="size-4 text-secondary-foreground" aria-hidden="true" />
                  </span>
                  {index < events.length - 1 ? (
                    <span
                      aria-hidden="true"
                      className="absolute top-9 bottom-[-1.25rem] w-px bg-border"
                    />
                  ) : null}
                </span>
                <span className="grid gap-0.5 pt-1">
                  <time className="text-xs text-muted-foreground" dateTime={event.occurred_at}>
                    {format.dateTime(new Date(event.occurred_at), {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </time>
                  <span className="font-medium">
                    {t(`kinds.${event.kind}`, {
                      organization: event.organization_name || t("anOrganization"),
                    })}
                  </span>
                  {event.job_title ? (
                    <span className="text-sm text-muted-foreground">
                      <bdi dir="auto">{event.job_title}</bdi>
                    </span>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ol>
      )}
      <p className="text-xs text-muted-foreground">{t("footnote")}</p>
    </div>
  );
}
