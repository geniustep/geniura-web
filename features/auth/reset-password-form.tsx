"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRoundIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { EmptyState } from "@/components/patterns/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthPasswordResetConfirmCreate } from "@/lib/api/generated/endpoints/auth/auth";
import { AuthPasswordResetConfirmCreateBody } from "@/lib/api/generated/zod/auth/auth.zod";
import { Link } from "@/lib/i18n/navigation";

import { FormAlert, FormField } from "./form-parts";
import { applyServerErrors } from "./use-server-errors";
import { keyedZodErrors } from "./validation";

type Input = z.input<typeof AuthPasswordResetConfirmCreateBody>;
type Output = z.output<typeof AuthPasswordResetConfirmCreateBody>;

/** `uid` and `token` come from the link Django emails (`/reset-password?uid=…&token=…`). */
export function ResetPasswordForm({ uid, token }: { uid: string; token: string }) {
  const t = useTranslations("Auth");
  const [general, setGeneral] = useState<string[]>([]);
  const form = useForm<Input, unknown, Output>({
    resolver: zodResolver(AuthPasswordResetConfirmCreateBody, keyedZodErrors),
    defaultValues: { uid, token, new_password: "" },
  });
  const confirm = useAuthPasswordResetConfirmCreate({
    mutation: {
      onError: (error) => setGeneral(applyServerErrors(error, form.setError, ["new_password"])),
    },
  });
  const { errors } = form.formState;

  if (!uid || !token) {
    return <FormAlert error={undefined} extra={[t("reset.missingLink")]} />;
  }

  if (confirm.isSuccess) {
    return (
      <EmptyState
        icon={KeyRoundIcon}
        title={t("reset.doneTitle")}
        description={t("reset.doneBody")}
        action={
          <Link href="/login" className="text-sm font-medium text-action hover:underline">
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
        confirm.mutate({ data });
      })}
    >
      <FormAlert error={confirm.error} extra={general} />
      <FormField
        id="new_password"
        label={t("fields.newPassword")}
        error={
          errors.new_password && {
            message: errors.new_password.message,
            server: errors.new_password.type === "server",
          }
        }
      >
        {(describedBy, invalid) => (
          <Input
            id="new_password"
            type="password"
            dir="ltr"
            autoComplete="new-password"
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            {...form.register("new_password")}
          />
        )}
      </FormField>
      <Button type="submit" size="lg" disabled={confirm.isPending}>
        {confirm.isPending ? t("submitting") : t("reset.submit")}
      </Button>
    </form>
  );
}
