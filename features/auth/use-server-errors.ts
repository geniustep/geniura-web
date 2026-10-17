"use client";

import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

import { fieldErrors, isApiError } from "@/lib/api/errors";

/**
 * Applies Django field errors to the form and returns the messages that belong to no field.
 * Server messages are already localized; the `server:` prefix tells FormField to show them as-is.
 */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
): string[] {
  if (!isApiError(error) || error.code !== "validation_error") return [];
  const { byField, general } = fieldErrors(error);
  const unmatched = [...general];
  for (const [name, message] of Object.entries(byField)) {
    if ((fields as readonly string[]).includes(name)) {
      setError(name as Path<T>, { type: "server", message });
    } else {
      unmatched.push(message);
    }
  }
  return unmatched;
}
