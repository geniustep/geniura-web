"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthLoginCreate } from "@/lib/api/generated/endpoints/auth/auth";
import { getAuthMeRetrieveQueryKey } from "@/lib/api/generated/endpoints/me/me";
import { AuthLoginCreateBody } from "@/lib/api/generated/zod/auth/auth.zod";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";
import { Link, useRouter } from "@/lib/i18n/navigation";

import { FormAlert, FormField } from "./form-parts";
import { applyServerErrors } from "./use-server-errors";
import { keyedZodErrors } from "./validation";

type Input = z.input<typeof AuthLoginCreateBody>;
type Output = z.output<typeof AuthLoginCreateBody>;

export function LoginForm({ next }: { next?: string }) {
  const t = useTranslations("Auth");
  const router = useRouter();
  const queryClient = useQueryClient();
  const [general, setGeneral] = useState<string[]>([]);
  const form = useForm<Input, unknown, Output>({
    resolver: zodResolver(AuthLoginCreateBody, keyedZodErrors),
    defaultValues: { email: "", password: "" },
  });
  const login = useAuthLoginCreate({
    mutation: {
      onSuccess: (me) => {
        // A new session starts: drop anything cached for a previous visitor.
        queryClient.clear();
        queryClient.setQueryData(getAuthMeRetrieveQueryKey(), me);
        router.replace(safeRedirectPath(next));
        router.refresh();
      },
      onError: (error) =>
        setGeneral(applyServerErrors(error, form.setError, ["email", "password"])),
    },
  });
  const { errors } = form.formState;

  return (
    <form
      noValidate
      className="grid gap-5"
      onSubmit={form.handleSubmit((data) => {
        setGeneral([]);
        login.mutate({ data });
      })}
    >
      <FormAlert error={login.error} extra={general} />
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
            autoComplete="current-password"
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            {...form.register("password")}
          />
        )}
      </FormField>
      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-sm text-primary hover:underline">
          {t("login.forgot")}
        </Link>
      </div>
      <Button type="submit" size="lg" disabled={login.isPending}>
        {login.isPending ? t("submitting") : t("login.submit")}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {t("login.noAccount")}{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          {t("login.toRegister")}
        </Link>
      </p>
    </form>
  );
}
