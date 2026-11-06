import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProfileWorkspace } from "@/features/profile/profile-workspace";
import ar from "@/messages/ar.json";
const api = vi.hoisted(() => ({ education: vi.fn() }));
vi.mock("@/lib/api/generated/endpoints/candidates/candidates", async () => ({
  ...(await vi.importActual("@/lib/api/generated/endpoints/candidates/candidates")),
  useCandidatesMeRetrieve: () => ({
    data: {
      headline: "Test profile",
      city: null,
      visibility: "private",
      availability: "immediate",
      profile_updated_at: "2026-11-01T00:00:00Z",
    },
    isPending: false,
  }),
  useCandidatesMeEducationsList: api.education,
  useCandidatesMeExperiencesList: () => ({ data: { results: [] }, isPending: false }),
  useCandidatesMeSkillsList: () => ({ data: { results: [] }, isPending: false }),
  useCandidatesMeLanguagesList: () => ({ data: { results: [] }, isPending: false }),
  useCandidatesMeCertificationsList: () => ({ data: { results: [] }, isPending: false }),
}));
vi.mock("@/lib/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("@/features/profile/item-dialog", () => ({
  ItemDialog: ({ item }: { item?: { degree: string } }) => (
    <div role="dialog">{item?.degree ?? "New education"}</div>
  ),
}));
vi.mock("@/features/profile/identity-dialog", () => ({
  IdentityDialog: () => <div role="dialog">Identity</div>,
}));
function select(section: string) {
  act(() => {
    window.location.hash = `section-${section}`;
    window.dispatchEvent(new Event("hashchange"));
  });
}
function setup() {
  api.education.mockReturnValue({
    data: {
      results: [{ id: "one", degree: "Existing education", institution: "", source: "extracted" }],
    },
    isPending: false,
  });
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <NextIntlClientProvider locale="ar" messages={ar}>
        <ProfileWorkspace
          vocabulary={{ locations: {}, occupations: {}, sectors: {}, skills: {} }}
        />
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );
}
afterEach(() => {
  cleanup();
  window.location.hash = "";
});
describe("compact profile workspace", () => {
  it("opens an incoming section link and preserves existing edit actions", () => {
    window.location.hash = "section-educations";
    setup();
    expect(screen.getByText("Existing education")).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", {
        name: ar.Profile.item.editLabel.replace("{name}", "Existing education"),
      }),
    );
    expect(screen.getByRole("dialog")).toHaveTextContent("Existing education");
  });
  it("switches sections without rendering every list and restores the selected section on remount", () => {
    setup();
    select("educations");
    expect(screen.getByText("Existing education")).toBeVisible();
    select("languages");
    expect(screen.queryByText("Existing education")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: ar.Profile.sections.languages.title }),
    ).toBeVisible();
    cleanup();
    setup();
    expect(
      screen.getByRole("heading", { name: ar.Profile.sections.languages.title }),
    ).toBeVisible();
  });
  it("keeps the add action and handles an unknown section safely", () => {
    window.location.hash = "section-unknown";
    setup();
    expect(screen.getByRole("heading", { name: "Test profile" })).toBeVisible();
    select("educations");
    fireEvent.click(screen.getByRole("button", { name: ar.Profile.item.add }));
    expect(screen.getByRole("dialog")).toHaveTextContent("New education");
  });
});
