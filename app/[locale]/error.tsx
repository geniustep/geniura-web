"use client";

import { TriangleAlertIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Container } from "@/components/layout/container";
import { EmptyState } from "@/components/patterns/empty-state";
import { Button } from "@/components/ui/button";

// The error object is deliberately not rendered: messages may carry internal details.
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Error");

  return (
    <Container className="py-16">
      <EmptyState
        icon={TriangleAlertIcon}
        title={t("title")}
        description={t("body")}
        action={<Button onClick={() => reset()}>{t("retry")}</Button>}
      />
    </Container>
  );
}
