import { QueryClient } from "@tanstack/react-query";

import { isApiError } from "./errors";

const RETRYABLE_STATUS = new Set([0, 502, 503, 504]);

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        // Reads retry twice on network or gateway failures only; never on 4xx.
        retry: (failureCount, error) =>
          failureCount < 2 && isApiError(error) && RETRYABLE_STATUS.has(error.status),
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000),
      },
      // Mutations are never retried automatically (they may not be idempotent).
      mutations: { retry: false },
    },
  });
}
