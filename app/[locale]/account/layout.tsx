import type { Metadata } from "next";
import type { ReactNode } from "react";

// Private space: never indexed; responses also carry `Cache-Control: private, no-store`
// (next.config.ts) so no shared cache can keep a user's page.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AccountLayout({ children }: { children: ReactNode }) {
  return children;
}
