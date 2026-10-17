"use client";

import { useQueryClient } from "@tanstack/react-query";
import { MailCheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { EmptyState } from "@/components/patterns/empty-state";
import { Button } from "@/components/ui/button";
import { useAuthEmailVerifyCreate } from "@/lib/api/generated/endpoints/auth/auth";
import { getAuthMeRetrieveQueryKey } from "@/lib/api/generated/endpoints/me/me";
import { Link } from "@/lib/i18n/navigation";

import { FormAlert } from "./form-parts";

/**
 * Verification needs an explicit click (POST), never an automatic request on page load:
 * mail scanners open links, and a GET must not change state.
 */
export function VerifyEmailPanel({ token }: { token: string }) {
  const t = useTranslations("Auth");
  const tMenu = useTranslations("UserMenu");
  const queryClient = useQueryClient();
  const verify = useAuthEmailVerifyCreate({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getAuthMeRetrieveQueryKey() }),
    },
  });

  if (!token) return <FormAlert error={undefined} extra={[t("verify.missingLink")]} />;

  if (verify.isSuccess) {
    return (
      <EmptyState
        icon={MailCheckIcon}
        title={t("verify.doneTitle")}
        description={t("verify.doneBody")}
        action={
          <Link href="/account" className="text-sm font-medium text-primary hover:underline">
            {tMenu("account")}
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid gap-5">
      <FormAlert error={verify.error} />
      <Button
        size="lg"
        disabled={verify.isPending}
        onClick={() => verify.mutate({ data: { token } })}
      >
        {verify.isPending ? t("submitting") : t("verify.submit")}
      </Button>
    </div>
  );
}
