"use client";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/lib/i18n/navigation";

export function CandidateNav() {
  const t = useTranslations("CandidateHome");
  const path = usePathname();
  return (
    <nav aria-label={t("navigation")} className="overflow-x-auto pb-2">
      <ul className="flex w-max gap-1 rounded-xl border bg-card p-1">
        {[
          ["/account/home", "overview"],
          ["/account/profile", "profile"],
          ["/jobs", "jobs"],
          ["/account/applications", "applications"],
          ["/account", "settings"],
        ].map(([href, key]) => (
          <li key={key}>
            <Link
              href={href!}
              aria-current={
                path === href ||
                (href === "/account/profile" && path.startsWith("/account/profile/"))
                  ? "page"
                  : undefined
              }
              className={`inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-medium ${path === href || (href === "/account/profile" && path.startsWith("/account/profile/")) ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              {t(key as "overview")}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
