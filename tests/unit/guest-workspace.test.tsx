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
  skills: vi.fn(),
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
vi.mock("@/lib/api/generated/endpoints/taxonomy/taxonomy", () => ({
  useTaxonomySkillsList: api.skills,
}));
vi.mock("@/features/profile/skill-picker", () => ({
  SkillPicker: ({
    value,
    vocabulary,
  }: {
    value: string;
    vocabulary: { skills: Record<string, { ar?: string }> };
  }) => <span>{vocabulary.skills[value]?.ar}</span>,
}));
const initial = {
  revision: 0,
  identity: { name: "أمينة", email: "amina@example.test", phone: "" },
  items: [],
  registration_prepared: false,
};
function setup(draftKey?: string) {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <NextIntlClientProvider locale="ar" messages={ar}>
        <GuestWorkspace signedIn={false} draftKey={draftKey} />
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  vi.resetAllMocks();
  sessionStorage.clear();
  api.retrieve.mockResolvedValue(initial);
  api.skills.mockReturnValue({
    data: {
      results: [{ id: "skill-1", labels: { ar: "إدارة المشاريع", fr: "Gestion de projet" } }],
    },
    isPending: false,
  });
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
  it("automatically saves edits without registration", async () => {
    setup();
    fireEvent.change(await screen.findByLabelText(ar.GuestWorkspace.name), {
      target: { value: "اسم محفوظ تلقائيا" },
    });
    await waitFor(() => expect(api.save).toHaveBeenCalledOnce(), { timeout: 2000 });
    await screen.findByText(ar.GuestWorkspace.saved);
    expect(api.register).not.toHaveBeenCalled();
  });
  it("retains edits made while a previous save is in flight", async () => {
    let resolve!: (value: unknown) => void;
    api.save.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    setup();
    const name = await screen.findByLabelText(ar.GuestWorkspace.name);
    fireEvent.change(name, { target: { value: "الأول" } });
    await waitFor(() => expect(api.save).toHaveBeenCalledOnce(), { timeout: 2000 });
    fireEvent.change(name, { target: { value: "الأخير" } });
    resolve({ ...initial, revision: 1, identity: { ...initial.identity, name: "الأول" } });
    await waitFor(() => expect(api.save).toHaveBeenCalledTimes(2));
    expect(api.save.mock.calls[1]?.[0]).toMatchObject({
      revision: 1,
      identity: { name: "الأخير" },
    });
    expect(name).toHaveValue("الأخير");
  });
  it("recovers pending edits and the selected section after remount", async () => {
    const key = new Date(Date.now() + 86400000).toISOString();
    const view = setup(key);
    fireEvent.change(await screen.findByLabelText(ar.GuestWorkspace.name), {
      target: { value: "قبل التحديث" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: new RegExp(ar.GuestWorkspace.kinds.experience) }),
    );
    view.unmount();
    setup(key);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: new RegExp(ar.GuestWorkspace.kinds.experience) }),
      ).toHaveAttribute("aria-pressed", "true"),
    );
    fireEvent.click(screen.getByRole("button", { name: ar.GuestWorkspace.identity }));
    expect(screen.getByLabelText(ar.GuestWorkspace.name)).toHaveValue("قبل التحديث");
  });
  it("keeps failed saves editable and allows an explicit retry", async () => {
    api.save.mockRejectedValueOnce(new Error("offline"));
    setup();
    fireEvent.change(await screen.findByLabelText(ar.GuestWorkspace.name), {
      target: { value: "محفوظ محليا" },
    });
    await screen.findByText(ar.GuestWorkspace.saveFailed, {}, { timeout: 2000 });
    expect(screen.getByLabelText(ar.GuestWorkspace.name)).toHaveValue("محفوظ محليا");
    fireEvent.click(screen.getByRole("button", { name: ar.GuestWorkspace.save }));
    await screen.findByText(ar.GuestWorkspace.saved);
    expect(api.save).toHaveBeenCalledTimes(2);
  });
  it("does not restore a recovery copy from a different draft or older server revision", async () => {
    const key = new Date(Date.now() + 86400000).toISOString();
    sessionStorage.setItem(
      `geniura:guest-workspace:${key}`,
      JSON.stringify({
        value: { ...initial, identity: { ...initial.identity, name: "قديم" } },
        pending: true,
        section: "identity",
      }),
    );
    api.retrieve.mockResolvedValue({ ...initial, revision: 2 });
    setup(key);
    expect(await screen.findByLabelText(ar.GuestWorkspace.name)).toHaveValue(initial.identity.name);
    expect(api.save).not.toHaveBeenCalled();
  });
  it("shows the dictionary label for extracted skills that only contain an ID", async () => {
    api.retrieve.mockResolvedValue({
      ...initial,
      items: [
        { kind: "skill", payload: { skill_id: "skill-1" }, source_index: 0 },
        { kind: "skill", payload: {}, source_index: null },
      ],
    });
    setup();
    await screen.findByLabelText(ar.GuestWorkspace.name);
    fireEvent.click(
      screen.getByRole("button", { name: new RegExp(ar.GuestWorkspace.kinds.skill) }),
    );
    expect(screen.getByText("إدارة المشاريع")).toBeVisible();
    expect(screen.getByText(ar.GuestWorkspace.skillNeedsSelection)).toBeVisible();
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
