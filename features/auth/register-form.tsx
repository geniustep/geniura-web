"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheckIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { EmptyState } from "@/components/patterns/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthRegisterCreate } from "@/lib/api/generated/endpoints/auth/auth";
import { AuthRegisterCreateBody } from "@/lib/api/generated/zod/auth/auth.zod";
import { Link } from "@/lib/i18n/navigation";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";

import { FormAlert, FormField } from "./form-parts";
import { applyServerErrors } from "./use-server-errors";
import { keyedZodErrors } from "./validation";

// The form always sends an explicit intent and locale; the rest of the shape is the contract's.
const schema = AuthRegisterCreateBody.extend({ signup_intent: z.enum(["candidate", "employer"]) });
type Input = z.input<typeof schema>;
type Output = z.output<typeof schema>;
const intents = ["candidate", "employer"] as const;

export function RegisterForm({ next }: { next?: string }) {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const [general, setGeneral] = useState<string[]>([]);
  const form = useForm<Input, unknown, Output>({
    resolver: zodResolver(schema, keyedZodErrors),
    defaultValues: {
      email: "",
      password: "",
      full_name: "",
      signup_intent: "candidate",
      preferred_locale: locale,
    },
  });
  const register = useAuthRegisterCreate({
    mutation: {
      onError: (error) =>
        setGeneral(applyServerErrors(error, form.setError, ["email", "password", "full_name"])),
    },
  });
  const { errors } = form.formState;

  if (register.isSuccess) {
    // Same answer whether or not the address exists (the API never reveals it).
    return (
      <EmptyState
        icon={MailCheckIcon}
        title={t("register.doneTitle")}
        description={t("register.doneBody")}
        action={
          <Link
            href={{
              pathname: "/login",
              query: next ? { next: safeRedirectPath(next) } : undefined,
            }}
            className="text-sm font-medium text-action hover:underline"
          >
            {t("backToLogin")}
          </Link>
        }
      />
    );
  }

  return (
    <form
      noValidate
      className="grid gap-5"
      onSubmit={form.handleSubmit((data) => {
        setGeneral([]);
        register.mutate({ data });
      })}
    >
      <FormAlert error={register.error} extra={general} />
      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-medium">{t("register.intentLabel")}</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {intents.map((intent) => (
            <label
              key={intent}
              className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-input px-3.5 text-sm has-checked:border-action has-checked:bg-secondary"
            >
              <input
                type="radio"
                value={intent}
                className="accent-action"
                {...form.register("signup_intent")}
              />
              {t(`register.intent.${intent}`)}
            </label>
          ))}
        </div>
      </fieldset>
      <FormField
        id="full_name"
        label={`${t("fields.fullName")} (${t("fields.optional")})`}
        error={
          errors.full_name && {
            message: errors.full_name.message,
            server: errors.full_name.type === "server",
          }
        }
      >
        {(describedBy, invalid) => (
          <Input
            id="full_name"
            dir="auto"
            autoComplete="name"
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            {...form.register("full_name")}
          />
        )}
      </FormField>
      <FormField
        id="email"
        label={t("fields.email")}
        error={
          errors.email && { message: errors.email.message, server: errors.email.type === "server" }
        }
      >
        {(describedBy, invalid) => (
          <Input
            id="email"
            type="email"
            dir="ltr"
            autoComplete="email"
            inputMode="email"
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            {...form.register("email")}
          />
        )}
      </FormField>
      <FormField
        id="password"
        label={t("fields.password")}
        error={
          errors.password && {
            message: errors.password.message,
            server: errors.password.type === "server",
          }
        }
      >
        {(describedBy, invalid) => (
          <Input
            id="password"
            type="password"
            dir="ltr"
            autoComplete="new-password"
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            {...form.register("password")}
          />
        )}
      </FormField>
      <Button type="submit" size="lg" disabled={register.isPending}>
        {register.isPending ? t("submitting") : t("register.submit")}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {t("register.hasAccount")}{" "}
        <Link
          href={{ pathname: "/login", query: next ? { next: safeRedirectPath(next) } : undefined }}
          className="font-medium text-action hover:underline"
        >
          {t("register.toLogin")}
        </Link>
      </p>
    </form>
  );
}
