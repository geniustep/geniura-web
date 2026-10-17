"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { EmptyState } from "@/components/patterns/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthPasswordResetRequestCreate } from "@/lib/api/generated/endpoints/auth/auth";
import { AuthPasswordResetRequestCreateBody } from "@/lib/api/generated/zod/auth/auth.zod";
import { Link } from "@/lib/i18n/navigation";

import { FormAlert, FormField } from "./form-parts";
import { keyedZodErrors } from "./validation";

type Input = z.input<typeof AuthPasswordResetRequestCreateBody>;
type Output = z.output<typeof AuthPasswordResetRequestCreateBody>;

export function ForgotPasswordForm() {
  const t = useTranslations("Auth");
  const form = useForm<Input, unknown, Output>({
    resolver: zodResolver(AuthPasswordResetRequestCreateBody, keyedZodErrors),
    defaultValues: { email: "" },
  });
  const request = useAuthPasswordResetRequestCreate();
  const { errors } = form.formState;

  if (request.isSuccess) {
    return (
      <EmptyState
        icon={MailCheckIcon}
        title={t("forgot.doneTitle")}
        description={t("forgot.doneBody")}
        action={
          <Link href="/login" className="text-sm font-medium text-primary hover:underline">
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
      onSubmit={form.handleSubmit((data) => request.mutate({ data }))}
    >
      <FormAlert error={request.error} />
      <FormField
        id="email"
        label={t("fields.email")}
        error={errors.email && { message: errors.email.message }}
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
      <Button type="submit" size="lg" disabled={request.isPending}>
        {request.isPending ? t("submitting") : t("forgot.submit")}
      </Button>
      <Link href="/login" className="text-center text-sm text-primary hover:underline">
        {t("backToLogin")}
      </Link>
    </form>
  );
}
