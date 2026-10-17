"use client";

import { CircleAlertIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";
import { errorMessageKey, isApiError } from "@/lib/api/errors";

import { validationKey } from "./validation";

type FieldProps = {
  id: string;
  label: string;
  hint?: string;
  /** Server message (already localized by Django) or a client validation key. */
  error?: { message?: string; server?: boolean };
  children: (describedBy: string | undefined, invalid: boolean) => ReactNode;
};

export function FormField({ id, label, hint, error, children }: FieldProps) {
  const t = useTranslations("Validation");
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error?.message ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children(describedBy, Boolean(errorId))}
      {hint ? (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {errorId ? (
        <p id={errorId} className="text-sm text-destructive">
          {error?.server ? error.message : t(validationKey(error?.message))}
        </p>
      ) : null}
    </div>
  );
}

/** Translated summary of an API error, with the request id support can trace. */
export function FormAlert({ error, extra }: { error: unknown; extra?: string[] }) {
  const t = useTranslations("Errors");
  if (!error && !extra?.length) return null;
  const requestId = isApiError(error) ? error.request_id : "";

  return (
    <div
      role="alert"
      className="flex gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm"
    >
      <CircleAlertIcon className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
      <div className="grid gap-1">
        {error ? <p>{t(`api.${errorMessageKey(error)}`)}</p> : null}
        {extra?.map((message) => (
          <p key={message}>{message}</p>
        ))}
        {requestId ? (
          <p className="text-xs text-muted-foreground" dir="ltr">
            {t("reference", { id: requestId })}
          </p>
        ) : null}
      </div>
    </div>
  );
}
