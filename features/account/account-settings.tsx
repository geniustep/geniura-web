"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormAlert, FormField } from "@/features/auth/form-parts";
import { applyServerErrors } from "@/features/auth/use-server-errors";
import { keyedZodErrors } from "@/features/auth/validation";
import { useAuthPasswordChangeCreate } from "@/lib/api/generated/endpoints/auth/auth";
import {
  getMeSessionsListQueryKey,
  useMePreferencesPartialUpdate,
} from "@/lib/api/generated/endpoints/me/me";
import { useRouter } from "@/lib/i18n/navigation";

const profileSchema = z.object({
  full_name: z.string().max(150),
  preferred_locale: z.enum(["ar", "fr", "en", "es"]),
  time_zone: z.string().min(1).max(64),
});

const passwordSchema = z
  .object({
    current_password: z.string().min(1).max(128),
    new_password: z.string().min(12).max(128),
    confirm_password: z.string().min(1),
  })
  .refine((value) => value.new_password === value.confirm_password, {
    message: "mismatch",
    path: ["confirm_password"],
  });

type ProfileInput = z.input<typeof profileSchema>;
type PasswordInput = z.input<typeof passwordSchema>;
type PasswordOutput = z.output<typeof passwordSchema>;

export type AccountInitialPreferences = {
  full_name: string;
  preferred_locale: string;
  time_zone: string;
};

export function AccountSettings({ initial }: { initial: AccountInitialPreferences }) {
  const t = useTranslations("Account.settings");
  const locale = useLocale();
  const router = useRouter();
  const [general, setGeneral] = useState<string[]>([]);

  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema, keyedZodErrors),
    defaultValues: {
      full_name: initial.full_name || "",
      preferred_locale: (["ar", "fr", "en", "es"].includes(initial.preferred_locale)
        ? initial.preferred_locale
        : locale) as ProfileInput["preferred_locale"],
      time_zone: initial.time_zone || "Africa/Casablanca",
    },
  });

  const update = useMePreferencesPartialUpdate({
    mutation: {
      onSuccess: (saved) => {
        toast.success(t("saved"));
        form.reset({
          full_name: saved.full_name || "",
          preferred_locale: (saved.preferred_locale || locale) as ProfileInput["preferred_locale"],
          time_zone: saved.time_zone || "Africa/Casablanca",
        });
        const chosenLocale = saved.preferred_locale;
        if (chosenLocale && chosenLocale !== locale && ["ar", "fr", "en", "es"].includes(chosenLocale)) {
          router.replace("/account", { locale: chosenLocale as ProfileInput["preferred_locale"] });
        } else {
          router.refresh();
        }
      },
      onError: (error) =>
        setGeneral(
          applyServerErrors(error, form.setError, ["full_name", "preferred_locale", "time_zone"]),
        ),
    },
  });

  const { errors } = form.formState;
  const fieldError = (name: keyof ProfileInput) => {
    const error = errors[name];
    return error ? { message: error.message, server: error.type === "server" } : undefined;
  };

  return (
    <section aria-labelledby="account-settings-title" className="grid gap-5">
      <div className="grid gap-1">
        <h2 id="account-settings-title" className="font-display text-xl font-semibold">
          {t("title")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>
      <form
        noValidate
        className="grid gap-5"
        onSubmit={form.handleSubmit((data) => {
          setGeneral([]);
          update.mutate({ data });
        })}
      >
        <FormAlert error={update.error} extra={general} />
        <FormField id="full_name" label={t("fullName")} error={fieldError("full_name")}>
          {(describedBy, invalid) => (
            <Input
              id="full_name"
              dir="auto"
              maxLength={150}
              autoComplete="name"
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              {...form.register("full_name")}
            />
          )}
        </FormField>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            id="preferred_locale"
            label={t("language")}
            error={fieldError("preferred_locale")}
            hint={t("languageHint")}
          >
            {(describedBy, invalid) => (
              <select
                id="preferred_locale"
                className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
                aria-describedby={describedBy}
                aria-invalid={invalid || undefined}
                {...form.register("preferred_locale")}
              >
                <option value="ar">العربية</option>
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            )}
          </FormField>
          <FormField
            id="time_zone"
            label={t("timeZone")}
            hint={t("timeZoneHint")}
            error={fieldError("time_zone")}
          >
            {(describedBy, invalid) => (
              <>
                <Input
                  id="time_zone"
                  dir="ltr"
                  list="account-time-zones"
                  maxLength={64}
                  autoComplete="off"
                  aria-describedby={describedBy}
                  aria-invalid={invalid || undefined}
                  {...form.register("time_zone")}
                />
                <datalist id="account-time-zones">
                  <option value="Africa/Casablanca" />
                  <option value="UTC" />
                  <option value="Europe/Paris" />
                  <option value="Europe/London" />
                  <option value="America/New_York" />
                  <option value="Asia/Dubai" />
                </datalist>
              </>
            )}
          </FormField>
        </div>
        <div>
          <Button type="submit" disabled={update.isPending || !form.formState.isDirty}>
            {update.isPending ? t("saving") : t("save")}
          </Button>
        </div>
      </form>
    </section>
  );
}

export function ChangePasswordForm() {
  const t = useTranslations("Account.security");
  const queryClient = useQueryClient();
  const [general, setGeneral] = useState<string[]>([]);
  const form = useForm<PasswordInput, unknown, PasswordOutput>({
    resolver: zodResolver(passwordSchema, keyedZodErrors),
    defaultValues: { current_password: "", new_password: "", confirm_password: "" },
  });

  const change = useAuthPasswordChangeCreate({
    mutation: {
      onSuccess: () => {
        form.reset();
        setGeneral([]);
        toast.success(t("changed"));
        return queryClient.invalidateQueries({ queryKey: getMeSessionsListQueryKey() });
      },
      onError: (error) =>
        setGeneral(
          applyServerErrors(error, form.setError, ["current_password", "new_password"]),
        ),
    },
  });

  const { errors } = form.formState;
  const fieldError = (name: keyof PasswordInput) => {
    const error = errors[name];
    return error ? { message: error.message, server: error.type === "server" } : undefined;
  };

  return (
    <section aria-labelledby="account-password-title" className="grid gap-5">
      <div className="grid gap-1">
        <h2 id="account-password-title" className="font-display text-xl font-semibold">
          {t("title")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>
      <form
        noValidate
        className="grid gap-5"
        onSubmit={form.handleSubmit(({ current_password, new_password }) => {
          setGeneral([]);
          change.mutate({ data: { current_password, new_password } });
        })}
      >
        <FormAlert error={change.error} extra={general} />
        <FormField
          id="current_password"
          label={t("currentPassword")}
          error={fieldError("current_password")}
        >
          {(describedBy, invalid) => (
            <Input
              id="current_password"
              type="password"
              dir="ltr"
              autoComplete="current-password"
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              {...form.register("current_password")}
            />
          )}
        </FormField>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            id="new_password"
            label={t("newPassword")}
            hint={t("passwordHint")}
            error={fieldError("new_password")}
          >
            {(describedBy, invalid) => (
              <Input
                id="new_password"
                type="password"
                dir="ltr"
                autoComplete="new-password"
                aria-describedby={describedBy}
                aria-invalid={invalid || undefined}
                {...form.register("new_password")}
              />
            )}
          </FormField>
          <FormField
            id="confirm_password"
            label={t("confirmPassword")}
            error={fieldError("confirm_password")}
          >
            {(describedBy, invalid) => (
              <Input
                id="confirm_password"
                type="password"
                dir="ltr"
                autoComplete="new-password"
                aria-describedby={describedBy}
                aria-invalid={invalid || undefined}
                {...form.register("confirm_password")}
              />
            )}
          </FormField>
        </div>
        <p className="text-sm text-muted-foreground">{t("sessionsHint")}</p>
        <div>
          <Button type="submit" disabled={change.isPending}>
            {change.isPending ? t("saving") : t("save")}
          </Button>
        </div>
      </form>
    </section>
  );
}
