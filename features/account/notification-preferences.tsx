"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FormAlert } from "@/features/auth/form-parts";
import {
  getMeNotificationPreferencesRetrieveQueryKey,
  useMeNotificationPreferencesPartialUpdate,
  useMeNotificationPreferencesRetrieve,
} from "@/lib/api/generated/endpoints/notifications/notifications";
import type { PreferenceItemRequest } from "@/lib/api/generated/model";

const categories = [
  "security",
  "applications",
  "interviews",
  "organization",
  "recruitment",
  "assessments",
  "training",
  "messages",
  "trust",
  "privacy",
] as const;
const channels = ["in_app", "email", "whatsapp"] as const;

const preferenceKey = (category: string, channel: string) => `${category}:${channel}`;

export function NotificationPreferences() {
  const t = useTranslations("Account.notifications");
  const queryClient = useQueryClient();
  const [edits, setEdits] = useState<Record<string, boolean>>({});
  const query = useMeNotificationPreferencesRetrieve();
  const save = useMeNotificationPreferencesPartialUpdate({
    mutation: {
      onSuccess: (response) => {
        queryClient.setQueryData(getMeNotificationPreferencesRetrieveQueryKey(), response);
        setEdits({});
        toast.success(t("saved"));
      },
    },
  });

  const rows = query.data?.preferences ?? [];
  const changes: PreferenceItemRequest[] = rows
    .filter((item) => {
      const key = preferenceKey(item.category, item.channel);
      return (
        item.available &&
        !(item.category === "security" && item.channel === "in_app") &&
        Object.hasOwn(edits, key) &&
        edits[key] !== item.enabled
      );
    })
    .map((item) => ({
      category: item.category as PreferenceItemRequest["category"],
      channel: item.channel as PreferenceItemRequest["channel"],
      enabled: edits[preferenceKey(item.category, item.channel)] ?? item.enabled,
    }));

  return (
    <section aria-labelledby="account-notifications-title" className="grid gap-5">
      <div className="grid gap-1">
        <h2 id="account-notifications-title" className="font-display text-xl font-semibold">
          {t("title")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>
      {query.isPending ? (
        <div className="grid gap-3" aria-busy="true">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : query.isError ? (
        <div className="grid gap-3">
          <FormAlert error={query.error} />
          <Button type="button" variant="outline" onClick={() => query.refetch()}>
            {t("retry")}
          </Button>
        </div>
      ) : (
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (changes.length) save.mutate({ data: { preferences: changes } });
          }}
        >
          <FormAlert error={save.error} />
          <div className="grid gap-2">
            {categories.map((category) => (
              <div
                key={category}
                className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
              >
                <p className="font-medium">{t(`categories.${category}`)}</p>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                  {channels.map((channel) => {
                    const item = rows.find(
                      (entry) => entry.category === category && entry.channel === channel,
                    );
                    if (!item) return null;
                    const key = preferenceKey(category, channel);
                    const mandatory = category === "security" && channel === "in_app";
                    const disabled = !item.available || mandatory || save.isPending;
                    const checked = edits[key] ?? item.enabled;
                    return (
                      <label
                        key={key}
                        className="flex min-h-8 items-center gap-2 text-sm"
                        title={
                          !item.available
                            ? t("unavailable")
                            : mandatory
                              ? t("mandatory")
                              : undefined
                        }
                      >
                        <input
                          type="checkbox"
                          aria-label={`${t(`categories.${category}`)} — ${t(`channels.${channel}`)}`}
                          className="size-4 accent-action"
                          checked={checked}
                          disabled={disabled}
                          onChange={(event) =>
                            setEdits((previous) => ({ ...previous, [key]: event.target.checked }))
                          }
                        />
                        <span className={disabled && !mandatory ? "text-muted-foreground" : ""}>
                          {t(`channels.${channel}`)}
                          {!item.available ? ` (${t("unavailable")})` : ""}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">{t("mandatoryHint")}</p>
          <div>
            <Button type="submit" disabled={!changes.length || save.isPending}>
              {save.isPending ? t("saving") : t("save")}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
