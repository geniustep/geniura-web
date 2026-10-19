"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { isApiError } from "@/lib/api/errors";

/**
 * Optimistic concurrency (paper v1.1, section 09): every write sends the version the screen was
 * built from. Django answers 412 `precondition_failed` when the row changed on another device,
 * and saves nothing; the screen then shows both versions instead of overwriting silently.
 */
export function ifMatch(version: string | null | undefined): RequestInit | undefined {
  return version ? { headers: { "If-Match": `"${version}"` } } : undefined;
}

export function isConflict(error: unknown): boolean {
  return isApiError(error) && error.code === "precondition_failed";
}

/** Refresh every query under the candidate's own space after a write. */
export function useRefreshProfile() {
  const queryClient = useQueryClient();
  return useCallback(
    () =>
      queryClient.invalidateQueries({
        predicate: (query) => String(query.queryKey[0] ?? "").startsWith("/api/v1/candidates/me"),
      }),
    [queryClient],
  );
}

/** Empty form values become null for nullable API fields (dates, foreign keys). */
export function cleanPayload<T extends Record<string, unknown>>(
  values: T,
  nullable: readonly string[],
) {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) continue;
    out[key] = value === "" && nullable.includes(key) ? null : value;
  }
  return out;
}
