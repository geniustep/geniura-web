"use client";

import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/account/profile", key: "profile" },
  { href: "/account/profile/resumes", key: "resumes" },
  { href: "/account/profile/privacy", key: "privacy" },
  { href: "/account/profile/access-log", key: "accessLog" },
] as const;

/** The candidate's space, one place: profile, CV versions, who can see it, and who did. */
export function ProfileNav() {
  const t = useTranslations("Profile.nav");
  const pathname = usePathname();
  const home = useTranslations("CandidateHome");
  return (
    <nav aria-label={t("label")} className="max-w-full min-w-0 overflow-x-auto pb-1">
      <ul className="flex w-max gap-1 rounded-full bg-card p-1 shadow-card">
        <li>
          <Link
            href="/account/home"
            className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold hover:bg-muted"
          >
            {home("overview")}
          </Link>
        </li>
        {TABS.map((tab) => {
          const current =
            tab.href === "/account/profile" ? pathname === tab.href : pathname.startsWith(tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold whitespace-nowrap",
                  current
                    ? "bg-primary text-primary-foreground"
                    : "text-subtle-foreground hover:bg-muted",
                )}
              >
                {t(tab.key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
