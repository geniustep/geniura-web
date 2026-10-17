import type { ReactNode } from "react";

import "@/styles/globals.css";

// The real root layout (with <html lang dir>) lives in app/[locale]/layout.tsx, because the
// document language and direction depend on the locale segment.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
