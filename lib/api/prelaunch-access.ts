/**
 * Prelaunch API ingress credential. Browser requests never carry this secret.
 * Only Next.js server-side requests to the exact HTTPS API origin may include it.
 * Do not use NEXT_PUBLIC_* for the credential or log outgoing request headers.
 */
export const PRELAUNCH_ACCESS_HEADER = "X-Geniura-Prelaunch-Key";
const APPROVED_API_ORIGIN = "https://api-geniura.geniura.com";

export function addPrelaunchAccessHeader(headers: Headers, destination: string): void {
  if (typeof window !== "undefined") return;
  const secret = process.env.GENIURA_PRELAUNCH_API_KEY;
  if (!secret) return;

  let target: URL;
  try {
    target = new URL(destination);
  } catch {
    return;
  }
  if (target.origin !== APPROVED_API_ORIGIN) return;

  if (!/^[A-Za-z0-9_-]{43,128}$/.test(secret)) {
    throw new Error("Invalid GENIURA_PRELAUNCH_API_KEY configuration");
  }
  headers.set(PRELAUNCH_ACCESS_HEADER, secret);
}
