import type { ReactNode } from "react";

/** Navy band with the page title, then the form on a raised white card (direction A). */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="bg-navy-grid pt-14 pb-32 text-white">
        <div className="mx-auto flex w-full max-w-md flex-col gap-2 px-4">
          <h1 className="text-4xl font-bold">{title}</h1>
          {subtitle ? <p className="text-lg text-on-navy-muted">{subtitle}</p> : null}
        </div>
      </div>
      <div className="mx-auto -mt-20 w-full max-w-md px-4 pb-20">
        <div className="flex flex-col gap-6 rounded-3xl bg-card p-6 shadow-float sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
