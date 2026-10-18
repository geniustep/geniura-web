import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  /** Small label above the title (e.g. the section of the site). */
  eyebrow?: string;
  className?: string;
};

export function PageHeader({ title, description, actions, eyebrow, className }: PageHeaderProps) {
  return (
    <div
      className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}
    >
      <div className="flex flex-col gap-2">
        {eyebrow ? <p className="text-sm font-medium text-gold-ink">{eyebrow}</p> : null}
        <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
        {description ? (
          <p className="max-w-2xl text-lg text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
    </div>
  );
}
