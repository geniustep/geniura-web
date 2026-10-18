"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const Dialog = BaseDialog.Root;
const DialogTrigger = BaseDialog.Trigger;
const DialogClose = BaseDialog.Close;

function DialogContent({
  className,
  children,
  closeLabel,
  ...props
}: ComponentProps<typeof BaseDialog.Popup> & { closeLabel: string }) {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop className="fixed inset-0 z-40 bg-black/40 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
      <BaseDialog.Popup
        className={cn(
          "fixed inset-0 z-50 m-auto grid h-fit max-h-[calc(100dvh-2rem)] w-[min(32rem,100vw-2rem)] gap-4 overflow-y-auto rounded-2xl bg-card p-6 shadow-float outline-none",
          className,
        )}
        {...props}
      >
        {children}
        <BaseDialog.Close
          className="absolute end-3 top-3 inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={closeLabel}
        >
          <XIcon className="size-5" aria-hidden="true" />
        </BaseDialog.Close>
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  );
}

function DialogTitle({ className, ...props }: ComponentProps<typeof BaseDialog.Title>) {
  return (
    <BaseDialog.Title
      className={cn("pe-8 font-display text-xl font-semibold", className)}
      {...props}
    />
  );
}

function DialogDescription({ className, ...props }: ComponentProps<typeof BaseDialog.Description>) {
  return (
    <BaseDialog.Description className={cn("text-sm text-muted-foreground", className)} {...props} />
  );
}

export { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger };
