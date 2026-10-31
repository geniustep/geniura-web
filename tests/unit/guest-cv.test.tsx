import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GuestCv } from "@/features/onboarding/guest-cv";
import { ApiError } from "@/lib/api/errors";
import ar from "@/messages/ar.json";

const api = vi.hoisted(() => ({
  getGuestDraft: vi.fn(),
  uploadGuestDraft: vi.fn(),
  deleteGuestDraft: vi.fn(),
  sendGuestCode: vi.fn(),
  verifyGuestCode: vi.fn(),
  claimGuestDraft: vi.fn(),
  push: vi.fn(),
}));
vi.mock("@/lib/api/guest-cv", () => api);
vi.mock("@/lib/i18n/navigation", () => ({
  useRouter: () => ({ push: api.push }),
  Link: ({
    href,
    children,
    ...props
  }: {
    href: string | { pathname: string; query: Record<string, string> };
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
const ready = {
  status: "ready",
  expires_at: "2026-11-01T00:00:00Z",
  identity: {
    name: "أمينة بن علي",
    email: "amina@example.test",
    phone: "+21620123456",
    verified: false,
  },
  email_verified: false,
  claimed: false,
};
function setup(signedIn = false) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  render(
    <QueryClientProvider client={client}>
      <NextIntlClientProvider locale="ar" messages={ar}>
        <GuestCv signedIn={signedIn} />
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  vi.resetAllMocks();
  api.getGuestDraft.mockResolvedValue(ready);
});
afterEach(cleanup);
describe("guest CV onboarding", () => {
  it("uploads before authentication without checking an account", async () => {
    api.getGuestDraft
      .mockRejectedValueOnce(new ApiError(404, {}))
      .mockResolvedValue({ ...ready, status: "processing", identity: {} });
    api.uploadGuestDraft.mockResolvedValue({ ...ready, status: "queued" });
    setup();
    const input = await screen.findByLabelText(ar.GuestCv.file);
    fireEvent.change(input, {
      target: { files: [new File(["synthetic"], "cv.pdf", { type: "application/pdf" })] },
    });
    await screen.findByText(ar.GuestCv.processing);
    expect(api.uploadGuestDraft).toHaveBeenCalledOnce();
    expect(api.verifyGuestCode).not.toHaveBeenCalled();
    expect(api.claimGuestDraft).not.toHaveBeenCalled();
  });
  it("greets with an editable unverified name and reveals the login route only after proof", async () => {
    api.verifyGuestCode.mockResolvedValue({ verified: true, account_exists: true });
    setup();
    await screen.findByText("مرحبًا أمينة بن علي");
    fireEvent.change(screen.getByLabelText(ar.GuestCv.name), { target: { value: "أمينة" } });
    expect(screen.getByText("مرحبًا أمينة")).toBeVisible();
    expect(screen.queryByRole("link", { name: ar.GuestCv.signIn })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: ar.GuestCv.send }));
    await screen.findByLabelText(ar.GuestCv.code);
    expect(api.sendGuestCode).toHaveBeenCalledWith("amina@example.test", "ar");
    fireEvent.change(screen.getByLabelText(ar.GuestCv.code), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: ar.GuestCv.verify }));
    expect(await screen.findByRole("link", { name: ar.GuestCv.signIn })).toHaveAttribute(
      "href",
      "/login?next=%2Fstart%3Fstep%3Dclaim",
    );
  });
  it("claims only on an explicit click after login and opens existing review", async () => {
    api.getGuestDraft.mockResolvedValue({ ...ready, email_verified: true });
    api.claimGuestDraft.mockResolvedValue({ resume_id: "resume-1" });
    setup(true);
    const button = await screen.findByRole("button", { name: ar.GuestCv.claim });
    expect(api.claimGuestDraft).not.toHaveBeenCalled();
    fireEvent.click(button);
    await waitFor(() =>
      expect(api.push).toHaveBeenCalledWith("/account/profile/resumes/resume-1/review"),
    );
  });
  it("refreshes an expired claim so the signed-in owner can request a new code", async () => {
    api.getGuestDraft
      .mockResolvedValueOnce({ ...ready, email_verified: true })
      .mockResolvedValue(ready);
    api.claimGuestDraft.mockRejectedValue(new ApiError(403, { code: "guest_claim_not_allowed" }));
    setup(true);
    fireEvent.click(await screen.findByRole("button", { name: ar.GuestCv.claim }));
    await screen.findByRole("button", { name: ar.GuestCv.send });
    expect(api.claimGuestDraft).toHaveBeenCalledOnce();
  });
  it("lets the owner delete private draft data", async () => {
    setup();
    const button = await screen.findByRole("button", { name: ar.GuestCv.delete });
    api.getGuestDraft.mockRejectedValue(new ApiError(404, {}));
    fireEvent.click(button);
    await screen.findByLabelText(ar.GuestCv.file);
    expect(api.deleteGuestDraft).toHaveBeenCalledOnce();
  });
});
