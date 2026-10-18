import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-2xl bg-card px-6 py-14 text-center shadow-card",
        className,
      )}
    >
      <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-secondary">
        <Icon className="size-6 text-secondary-foreground" aria-hidden="true" />
      </span>
      <h3 className="text-xl font-semibold">{title}</h3>
      {description ? <p className="max-w-md text-muted-foreground">{description}</p> : null}
      {action}
    </div>
  );
}
