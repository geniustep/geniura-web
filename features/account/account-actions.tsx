"use client";

import { LogOutIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FormAlert } from "@/features/auth/form-parts";
import { useLogout } from "@/features/auth/use-logout";
import { useAuthEmailResendCreate } from "@/lib/api/generated/endpoints/auth/auth";

export function ResendVerificationButton() {
  const t = useTranslations("Account");
  const resend = useAuthEmailResendCreate({
    mutation: { onSuccess: () => toast.success(t("resent")) },
  });

  return (
    <div className="grid gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={resend.isPending || resend.isSuccess}
        onClick={() => resend.mutate()}
      >
        {t("resend")}
      </Button>
      <FormAlert error={resend.error} />
    </div>
  );
}

export function LogoutButton() {
  const t = useTranslations("Account");
  const logout = useLogout();

  return (
    <Button variant="outline" disabled={logout.isPending} onClick={() => logout.mutate()}>
      <LogOutIcon aria-hidden="true" />
      {t("logout")}
    </Button>
  );
}
