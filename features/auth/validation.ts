/**
 * Turns zod issues into translation keys (`Validation.<key>`) so client-side messages follow the
 * interface language. These checks only improve the experience; Django validates everything again.
 */
const keys = new Set(["required", "invalid_format", "too_small", "too_big"]);

export const keyedZodErrors = {
  error: (issue: { code: string; minimum?: unknown; input?: unknown }) => {
    if (issue.input === undefined || issue.input === "") return "required";
    if (issue.code === "too_small" && issue.minimum === 1) return "required";
    return issue.code;
  },
};

export function validationKey(message: string | undefined): string {
  return message && keys.has(message) ? message : "invalid";
}
