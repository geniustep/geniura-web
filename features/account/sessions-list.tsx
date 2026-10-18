"use client";

import { useQueryClient } from "@tanstack/react-query";
import { MonitorSmartphoneIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";

import { EmptyState } from "@/components/patterns/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FormAlert } from "@/features/auth/form-parts";
import {
  getMeSessionsListQueryKey,
  useMeSessionsList,
  useMeSessionsRevokeCreate,
} from "@/lib/api/generated/endpoints/me/me";

export function SessionsList() {
  const t = useTranslations("Account.sessions");
  const format = useFormatter();
  const queryClient = useQueryClient();
  const sessions = useMeSessionsList();
  const revoke = useMeSessionsRevokeCreate({
    mutation: {
      onSuccess: () => {
        toast.success(t("revoked"));
        return queryClient.invalidateQueries({ queryKey: getMeSessionsListQueryKey() });
      },
    },
  });

  if (sessions.isPending) {
    return (
      <div className="grid gap-3" aria-busy="true">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
    );
  }
  if (sessions.isError) return <FormAlert error={sessions.error} />;
  if (sessions.data.length === 0)
    return <EmptyState icon={MonitorSmartphoneIcon} title={t("empty")} />;

  const date = (value?: string) =>
    value ? format.dateTime(new Date(value), { dateStyle: "medium", timeStyle: "short" }) : "—";

  return (
    <div className="grid gap-3">
      <FormAlert error={revoke.error} />
      <ul className="grid gap-3">
        {sessions.data.map((session) => (
          <li
            key={session.id}
            className="flex flex-col gap-3 rounded-2xl bg-muted p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="grid gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <bdi className="font-medium" dir="ltr">
                  {session.user_agent || t("unknownDevice")}
                </bdi>
                {session.is_current ? <Badge variant="success">{t("current")}</Badge> : null}
              </div>
              <p className="text-sm text-muted-foreground">
                {t("lastSeen")}: {date(session.last_seen_at)} · {t("started")}:{" "}
                {date(session.created_at)}
                {session.ip_prefix ? (
                  <>
                    {" · "}
                    <bdi dir="ltr">{session.ip_prefix}</bdi>
                  </>
                ) : null}
              </p>
            </div>
            {session.is_current ? null : (
              <Button
                variant="outline"
                size="sm"
                disabled={revoke.isPending}
                onClick={() => revoke.mutate({ sessionId: session.id })}
              >
                {t("revoke")}
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
