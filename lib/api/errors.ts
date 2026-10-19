import type { ErrorResponse } from "./generated/model";

/**
 * Error thrown by the API client. Mirrors the Django envelope {code, message, details, request_id}
 * so it satisfies the generated `ErrorResponse` type, and adds the HTTP status.
 * `message` comes from the server and is never shown verbatim: the UI translates `code`.
 */
export class ApiError extends Error implements ErrorResponse {
  readonly status: number;
  readonly code: string;
  readonly details: Record<string, unknown>;
  readonly request_id: string;

  constructor(status: number, body: Partial<ErrorResponse> | undefined) {
    super(body?.message ?? `HTTP ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.code = body?.code ?? (status === 0 ? "network_error" : "unknown_error");
    this.details = (body?.details as Record<string, unknown> | undefined) ?? {};
    this.request_id = body?.request_id ?? "";
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** Prefer the stable CSRF error code. Support legacy staging until it is upgraded. */
export function isCsrfFailure(error: ApiError): boolean {
  return (
    error.status === 403 &&
    (error.code === "csrf_failed" ||
      (error.code === "permission_denied" && error.message.startsWith("CSRF failed")))
  );
}

/**
 * Field errors from `details.fields`. Django returns either {field: [messages]} or, for
 * non-field errors, a plain list of messages. Messages are already localized by Django
 * (Accept-Language), so they can be shown as-is.
 */
export function fieldErrors(error: ApiError): {
  byField: Record<string, string>;
  general: string[];
} {
  const fields = error.details.fields;
  if (Array.isArray(fields)) {
    return { byField: {}, general: fields.map(String) };
  }
  if (fields && typeof fields === "object") {
    const byField: Record<string, string> = {};
    const general: string[] = [];
    for (const [name, messages] of Object.entries(fields as Record<string, unknown>)) {
      const text = Array.isArray(messages) ? messages.map(String).join(" ") : String(messages);
      if (name === "non_field_errors") general.push(text);
      else byField[name] = text;
    }
    return { byField, general };
  }
  return { byField: {}, general: [] };
}

/** Codes that have a dedicated translated message under `Errors.api`. */
export const knownErrorCodes = [
  "invalid_credentials",
  "invalid_token",
  "invalid_current_password",
  "not_authenticated",
  "permission_denied",
  "csrf_failed",
  "not_found",
  "rate_limited",
  "validation_error",
  "network_error",
  "precondition_failed",
  "share_request_expired",
  "duplicate_application",
  "email_not_verified",
  "resume_not_ready",
  "resume_limit_reached",
  "file_too_large",
] as const;

export type KnownErrorCode = (typeof knownErrorCodes)[number];

export function errorMessageKey(error: unknown): KnownErrorCode | "unknown_error" {
  if (!isApiError(error)) return "unknown_error";
  return (knownErrorCodes as readonly string[]).includes(error.code)
    ? (error.code as KnownErrorCode)
    : "unknown_error";
}
