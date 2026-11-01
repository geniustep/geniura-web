import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GuestWorkspace } from "@/features/onboarding/guest-workspace";
import ar from "@/messages/ar.json";

const api = vi.hoisted(() => ({
  retrieve: vi.fn(),
  save: vi.fn(),
  register: vi.fn(),
  complete: vi.fn(),
  send: vi.fn(),
  verify: vi.fn(),
  claim: vi.fn(),
  login: vi.fn(),
  reset: vi.fn(),
  push: vi.fn(),
}));
vi.mock("@/lib/api/generated/endpoints/guest-onboarding/guest-onboarding", () => ({
  onboardingGuestCvWorkspaceRetrieve: api.retrieve,
  onboardingGuestCvWorkspacePartialUpdate: api.save,
  onboardingGuestCvRegistrationCreate: api.register,
  onboardingGuestCvCompleteCreate: api.complete,
}));
vi.mock("@/lib/api/guest-cv", () => ({
  sendGuestCode: api.send,
  verifyGuestCode: api.verify,
  claimGuestDraft: api.claim,
  deleteGuestDraft: vi.fn(),
}));
vi.mock("@/lib/api/generated/endpoints/auth/auth", () => ({
  authLoginCreate: api.login,
  authPasswordResetRequestCreate: api.reset,
}));
vi.mock("@/lib/i18n/navigation", () => ({ useRouter: () => ({ push: api.push }) }));
vi.mock("@/features/profile/skill-picker", () => ({ SkillPicker: () => null }));
const initial = {
  revision: 0,
  identity: { name: "أمينة", email: "amina@example.test", phone: "" },
  items: [],
  registration_prepared: false,
};
function setup() {
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <NextIntlClientProvider locale="ar" messages={ar}>
        <GuestWorkspace signedIn={false} />
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  vi.resetAllMocks();
  api.retrieve.mockResolvedValue(initial);
  api.save.mockImplementation(async (data) => ({
    ...data,
    revision: 1,
    registration_prepared: false,
  }));
});
afterEach(cleanup);
describe("guest professional draft", () => {
  it("edits and saves before registration or email proof", async () => {
    setup();
    const name = await screen.findByLabelText(ar.GuestWorkspace.name);
    fireEvent.change(name, { target: { value: "أمينة المعدلة" } });
    fireEvent.click(screen.getByRole("button", { name: ar.GuestWorkspace.save }));
    await waitFor(() => expect(api.save).toHaveBeenCalledOnce());
    expect(api.save).toHaveBeenCalledWith(
      expect.objectContaining({ identity: expect.objectContaining({ name: "أمينة المعدلة" }) }),
    );
    expect(api.send).not.toHaveBeenCalled();
    expect(api.register).not.toHaveBeenCalled();
  });
  it("shows one section at a time and preserves unsaved edits when switching", async () => {
    setup();
    fireEvent.change(await screen.findByLabelText(ar.GuestWorkspace.name), {
      target: { value: "اسم معدل" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: new RegExp(ar.GuestWorkspace.kinds.experience) }),
    );
    expect(screen.queryByLabelText(ar.GuestWorkspace.name)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: ar.GuestWorkspace.identity }));
    expect(screen.getByLabelText(ar.GuestWorkspace.name)).toHaveValue("اسم معدل");
    expect(api.save).not.toHaveBeenCalled();
  });
  it("stages registration and sends activation only after finishing the draft", async () => {
    setup();
    await screen.findByLabelText(ar.GuestWorkspace.name);
    fireEvent.click(screen.getByRole("button", { name: ar.GuestWorkspace.accountSection }));
    await screen.findByLabelText(ar.GuestWorkspace.password);
    fireEvent.change(screen.getByLabelText(ar.GuestWorkspace.password), {
      target: { value: "Synthetic-Password-284!" },
    });
    fireEvent.click(screen.getByRole("button", { name: ar.GuestWorkspace.create }));
    await waitFor(() => expect(api.register).toHaveBeenCalledOnce());
    expect(api.send).not.toHaveBeenCalled();
    expect(api.complete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: ar.GuestWorkspace.finish }));
    const send = await screen.findByRole("button", { name: ar.GuestWorkspace.sendCode });
    fireEvent.click(send);
    await screen.findByLabelText(ar.GuestWorkspace.code);
    expect(api.send).toHaveBeenCalledWith("amina@example.test", "ar");
    api.verify.mockResolvedValue({ verified: true, account_exists: false });
    api.complete.mockResolvedValue({ resume_id: "resume-1" });
    fireEvent.change(screen.getByLabelText(ar.GuestWorkspace.code), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: ar.GuestWorkspace.activate }));
    await waitFor(() =>
      expect(api.push).toHaveBeenCalledWith("/account/profile/resumes/resume-1/review"),
    );
  });
  it("offers password recovery without leaving or discarding the draft", async () => {
    setup();
    await screen.findByLabelText(ar.GuestWorkspace.name);
    fireEvent.click(screen.getByRole("button", { name: ar.GuestWorkspace.accountSection }));
    fireEvent.click(screen.getByRole("button", { name: ar.GuestWorkspace.haveAccount }));
    fireEvent.click(screen.getByRole("button", { name: ar.GuestWorkspace.forgot }));
    await waitFor(() => expect(api.reset).toHaveBeenCalledWith({ email: "amina@example.test" }));
    fireEvent.click(screen.getByRole("button", { name: ar.GuestWorkspace.identity }));
    expect(screen.getByLabelText(ar.GuestWorkspace.name)).toHaveValue("أمينة");
    expect(api.push).not.toHaveBeenCalled();
  });
});
