import { Button as BaseButton } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors select-none disabled:pointer-events-none disabled:opacity-50 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        // Main call to action of a screen (search, apply): one per area.
        action: "bg-action text-action-foreground hover:bg-action/90",
        // On navy bands.
        inverse: "bg-white text-navy hover:bg-white/90",
        "outline-inverse": "border border-on-navy-muted text-white hover:bg-white/10",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline: "border border-input bg-card hover:bg-muted",
        ghost: "hover:bg-muted",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        link: "rounded-md text-action underline-offset-4 hover:underline",
      },
      size: {
        // Heights keep touch targets ≥ 24×24 CSS px (WCAG 2.2, 2.5.8); md/lg are ≥ 40px.
        sm: "h-9 px-4",
        md: "h-11 px-5",
        lg: "h-13 px-7 text-base",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

type ButtonProps = ComponentProps<typeof BaseButton> & VariantProps<typeof buttonVariants>;

function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <BaseButton
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
