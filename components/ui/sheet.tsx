"use client";

import { Dialog } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

// Side panel built on Base UI Dialog (focus trap, Escape, scroll lock, aria wiring).
// "start"/"end" are logical sides, so the panel opens from the correct edge in RTL and LTR.

const Sheet = Dialog.Root;
const SheetTrigger = Dialog.Trigger;
const SheetClose = Dialog.Close;

type SheetContentProps = ComponentProps<typeof Dialog.Popup> & {
  side?: "start" | "end";
  closeLabel: string;
};

function SheetContent({
  className,
  children,
  side = "end",
  closeLabel,
  ...props
}: SheetContentProps) {
  return (
    <Dialog.Portal>
      <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />
      <Dialog.Popup
        data-slot="sheet-content"
        className={cn(
          "fixed inset-y-0 z-50 flex w-[min(22rem,100vw-3rem)] flex-col gap-4 bg-background p-6 shadow-lg transition-transform duration-200 ease-out outline-none",
          side === "end"
            ? "end-0 border-s data-ending-style:translate-x-full data-starting-style:translate-x-full rtl:data-ending-style:-translate-x-full rtl:data-starting-style:-translate-x-full"
            : "start-0 border-e data-ending-style:-translate-x-full data-starting-style:-translate-x-full rtl:data-ending-style:translate-x-full rtl:data-starting-style:translate-x-full",
          className,
        )}
        {...props}
      >
        {children}
        <Dialog.Close
          className="absolute end-4 top-4 inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={closeLabel}
        >
          <XIcon className="size-5" aria-hidden="true" />
        </Dialog.Close>
      </Dialog.Popup>
    </Dialog.Portal>
  );
}

function SheetTitle({ className, ...props }: ComponentProps<typeof Dialog.Title>) {
  return <Dialog.Title className={cn("text-lg font-semibold", className)} {...props} />;
}

function SheetDescription({ className, ...props }: ComponentProps<typeof Dialog.Description>) {
  return (
    <Dialog.Description className={cn("text-sm text-muted-foreground", className)} {...props} />
  );
}

export { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger };
