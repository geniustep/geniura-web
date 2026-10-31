import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/errors";
import ar from "@/messages/ar.json";
import { CandidateStart } from "@/features/onboarding/candidate-start";

const state = vi.hoisted(() => ({
  me: {} as Record<string, unknown>,
  resumes: [] as unknown[],
  step: "",
}));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(state.step ? { step: state.step } : {}),
}));
vi.mock("@/lib/api/generated/endpoints/me/me", () => ({ useAuthMeRetrieve: () => state.me }));
vi.mock("@/lib/api/generated/endpoints/resumes/resumes", () => ({
  useCandidatesMeResumesList: () => ({ data: state.resumes }),
}));
vi.mock("@/features/profile/resumes-panel", () => ({
  ResumesPanel: () => <div data-testid="authenticated-upload" />,
}));
vi.mock("@/lib/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...props
  }: {
    href: string | { pathname: string; query?: Record<string, string> };
    children: React.ReactNode;
  }) => (
    <a
      {...props}
      href={typeof href === "string" ? href : `${href.pathname}?${new URLSearchParams(href.query)}`}
    >
      {children}
    </a>
  ),
}));
function setup() {
  render(
    <NextIntlClientProvider locale="ar" messages={ar}>
      <CandidateStart />
    </NextIntlClientProvider>,
  );
}
afterEach(() => {
  cleanup();
  state.step = "";
  state.resumes = [];
});
describe("candidate onboarding", () => {
  it("offers upload first without uploading or revealing an account", () => {
    state.me = { error: new ApiError(401, { code: "not_authenticated" }), isPending: false };
    setup();
    fireEvent.click(screen.getByRole("button", { name: "أضف سيرتك الذاتية" }));
    expect(screen.queryByTestId("authenticated-upload")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "تسجيل الدخول" })).toHaveAttribute(
      "href",
      "/login?next=%2Fstart%3Fstep%3Dupload",
    );
    expect(screen.getByText(/لم يُرفع أي ملف/)).toBeVisible();
  });
  it("preserves the manual route through authentication", () => {
    state.me = { error: new ApiError(401, {}), isPending: false };
    setup();
    fireEvent.click(screen.getByRole("button", { name: "أدخل معلوماتي يدويًا" }));
    expect(screen.getByRole("link", { name: "إنشاء حساب" })).toHaveAttribute(
      "href",
      "/register?next=%2Fstart%3Fstep%3Dmanual",
    );
  });
  it("resumes the authenticated upload and greets only with the account name", () => {
    state.step = "upload";
    state.me = { data: { full_name: "محمد" }, isPending: false };
    setup();
    expect(screen.getByTestId("authenticated-upload")).toBeInTheDocument();
    expect(screen.getByText("مرحبًا، محمد.")).toBeVisible();
  });
  it("links to pending review without automatically accepting extraction", () => {
    state.me = { data: { full_name: "" }, isPending: false };
    state.resumes = [{ id: "resume-1", status: "review_required" }];
    setup();
    expect(screen.getByRole("link", { name: "راجع المعلومات المستخرجة" })).toHaveAttribute(
      "href",
      "/account/profile/resumes/resume-1/review",
    );
  });
  it("does not treat a backend outage as an anonymous session", () => {
    const retry = vi.fn();
    state.me = {
      error: new ApiError(503, { code: "service_unavailable" }),
      isPending: false,
      refetch: retry,
    };
    setup();
    fireEvent.click(screen.getByRole("button", { name: "أضف سيرتك الذاتية" }));
    expect(screen.queryByRole("link", { name: "إنشاء حساب" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "إعادة المحاولة" }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
