"use client";

import { Menu } from "@base-ui/react/menu";
import { LogInIcon, LogOutIcon, MonitorSmartphoneIcon, UserRoundIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthMeRetrieve } from "@/lib/api/generated/endpoints/me/me";
import { Link } from "@/lib/i18n/navigation";

import { useLogout } from "./use-logout";

const itemClass =
  "flex h-10 w-full items-center gap-2 rounded-md px-3 text-sm outline-none data-highlighted:bg-muted [&_svg]:size-4";

/**
 * Session-aware header area. It runs in the browser so the public page shell stays static and
 * cacheable; the user's identity is never rendered on the server into a shared page.
 */
export function UserMenu() {
  const t = useTranslations("UserMenu");
  const tHeader = useTranslations("Header");
  const me = useAuthMeRetrieve({ query: { retry: false, staleTime: 60_000 } });
  const logout = useLogout();

  if (me.isPending) return <Skeleton className="h-10 w-24" />;

  if (!me.data) {
    return (
      <Link href="/login" className={buttonVariants({ variant: "outline" })}>
        <LogInIcon aria-hidden="true" />
        <span className="hidden sm:inline">{tHeader("signIn")}</span>
        <span className="sr-only sm:hidden">{tHeader("signIn")}</span>
      </Link>
    );
  }

  const displayName = me.data.full_name || me.data.email;

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={t("label")}
        className="inline-flex h-10 max-w-48 items-center gap-2 rounded-md px-2 text-sm font-medium hover:bg-muted data-popup-open:bg-muted"
      >
        <span
          aria-hidden="true"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
        >
          <UserRoundIcon className="size-4" />
        </span>
        <bdi className="hidden truncate sm:inline">{displayName}</bdi>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={6} align="end" className="z-50 outline-none">
          <Menu.Popup className="min-w-52 rounded-lg border bg-popover p-1 text-popover-foreground shadow-md outline-none">
            <div className="px-3 py-2 text-xs text-muted-foreground">
              <bdi>{me.data.email}</bdi>
            </div>
            <Menu.LinkItem render={<Link href="/account" />} className={itemClass}>
              <UserRoundIcon aria-hidden="true" />
              {t("account")}
            </Menu.LinkItem>
            <Menu.LinkItem render={<Link href="/account/sessions" />} className={itemClass}>
              <MonitorSmartphoneIcon aria-hidden="true" />
              {t("sessions")}
            </Menu.LinkItem>
            <Menu.Separator className="my-1 h-px bg-border" />
            <Menu.Item
              className={itemClass}
              disabled={logout.isPending}
              onClick={() => logout.mutate()}
            >
              <LogOutIcon aria-hidden="true" />
              {t("logout")}
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
