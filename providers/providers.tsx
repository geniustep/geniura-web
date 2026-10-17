"use client";

import { DirectionProvider } from "@base-ui/react/direction-provider";
import { QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { useState, type ReactNode } from "react";
import { Toaster } from "sonner";

import { makeQueryClient } from "@/lib/api/query-client";

type ProvidersProps = {
  direction: "rtl" | "ltr";
  children: ReactNode;
};

export function Providers({ direction, children }: ProvidersProps) {
  // One client per browser tab; never shared across requests on the server.
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>
        <DirectionProvider direction={direction}>
          {children}
          <Toaster
            dir={direction}
            position={direction === "rtl" ? "bottom-left" : "bottom-right"}
          />
        </DirectionProvider>
      </NuqsAdapter>
    </QueryClientProvider>
  );
}
