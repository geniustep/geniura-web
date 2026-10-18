import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1 rounded-full border px-3 py-0.5 text-xs font-medium whitespace-nowrap [&_svg]:size-3",
  {
    variants: {
      variant: {
        neutral: "border-transparent bg-muted text-subtle-foreground",
        primary: "border-transparent bg-primary text-primary-foreground",
        info: "border-transparent bg-secondary text-secondary-foreground",
        success: "border-transparent bg-success-soft text-success",
        warning: "border-transparent bg-warning-soft text-warning",
        danger: "border-transparent bg-destructive/10 text-destructive",
        outline: "text-foreground",
        accent: "border-transparent bg-accent text-accent-foreground",
        // Paid promotion: an outline in dark gold, never filled, so it cannot read as a check.
        promoted: "rounded-md border-gold-ink bg-transparent font-semibold text-gold-ink",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

type BadgeProps = ComponentProps<"span"> & VariantProps<typeof badgeVariants>;

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants, type BadgeProps };
