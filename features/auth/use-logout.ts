"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useAuthLogoutCreate } from "@/lib/api/generated/endpoints/auth/auth";
import { clearCsrfToken } from "@/lib/api/fetcher";
import { useRouter } from "@/lib/i18n/navigation";

export function useLogout() {
  const t = useTranslations("Account");
  const router = useRouter();
  const queryClient = useQueryClient();

  return useAuthLogoutCreate({
    mutation: {
      onSettled: () => {
        // Whatever the server answered, nothing from this session may stay in memory.
        queryClient.clear();
        clearCsrfToken();
        router.replace("/");
        router.refresh();
      },
      onSuccess: () => toast.success(t("loggedOut")),
    },
  });
}
