"use client";

import { DirectionProvider } from "@base-ui/react/direction-provider";
import type { ReactNode } from "react";
import { Toaster } from "sonner";

type ProvidersProps = {
  direction: "rtl" | "ltr";
  children: ReactNode;
};

// Server state (TanStack Query) and URL state (nuqs) providers arrive with PHASE 2–3.
export function Providers({ direction, children }: ProvidersProps) {
  return (
    <DirectionProvider direction={direction}>
      {children}
      <Toaster dir={direction} position={direction === "rtl" ? "bottom-left" : "bottom-right"} />
    </DirectionProvider>
  );
}
