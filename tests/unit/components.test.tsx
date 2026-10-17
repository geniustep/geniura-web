import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import ar from "@/messages/ar.json";
import fr from "@/messages/fr.json";
import { ProvenanceTag } from "@/components/patterns/provenance-tag";
import { StatusBadge } from "@/components/patterns/status-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function withLocale(locale: "ar" | "fr", ui: ReactNode) {
  return (
    <NextIntlClientProvider locale={locale} messages={locale === "ar" ? ar : fr}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe("StatusBadge", () => {
  it("shows the translated label, never the raw API code", () => {
    render(withLocale("ar", <StatusBadge status="in_review" />));
    expect(screen.getByText("قيد المراجعة")).toBeInTheDocument();
    expect(screen.queryByText("in_review")).not.toBeInTheDocument();
  });

  it("follows the active locale", () => {
    render(withLocale("fr", <StatusBadge status="shortlisted" />));
    expect(screen.getByText("Présélectionnée")).toBeInTheDocument();
  });
});

describe("ProvenanceTag", () => {
  it("labels extracted data as extracted, not verified", () => {
    render(withLocale("ar", <ProvenanceTag source="extracted" />));
    expect(screen.getByText("مستخرج وأكدتَه")).toBeInTheDocument();
    expect(screen.queryByText("متحقَّق منه")).not.toBeInTheDocument();
  });
});

describe("Button", () => {
  it("renders a native button that can be disabled", () => {
    render(<Button disabled>إرسال</Button>);
    expect(screen.getByRole("button", { name: "إرسال" })).toBeDisabled();
  });
});

describe("cn", () => {
  it("lets later Tailwind classes win", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});
