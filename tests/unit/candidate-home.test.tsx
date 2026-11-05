import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { candidateNextAction } from "@/features/candidate/next-action";
import { CandidateHome } from "@/features/candidate/candidate-home";
import { ApiError } from "@/lib/api/errors";
import type { CandidateProfile, Me, Resume } from "@/lib/api/generated/model";
import ar from "@/messages/ar.json";
const api = vi.hoisted(() => ({
  profile: vi.fn(),
  resumes: vi.fn(),
  applications: vi.fn(),
  pendingReviews: vi.fn(),
}));
vi.mock("@/lib/api/generated/endpoints/candidates/candidates", () => ({
  useCandidatesMeRetrieve: api.profile,
}));
vi.mock("@/lib/api/generated/endpoints/resumes/resumes", () => ({
  useCandidatesMeResumesList: api.resumes,
}));
vi.mock("@/lib/api/generated/endpoints/applications-candidate/applications-candidate", () => ({
  useCandidatesMeApplicationsList: api.applications,
}));
vi.mock("@/features/candidate/pending-reviews", async () => ({
  ...(await vi.importActual("@/features/candidate/pending-reviews")),
  usePendingReviews: api.pendingReviews,
}));
vi.mock("@/lib/i18n/navigation", () => ({
  usePathname: () => "/account/home",
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
const me = { full_name: "أمينة", is_email_verified: true } as Me;
const profile = {
  headline: "مطورة",
  visibility: "private",
  completeness: {
    has_headline: true,
    has_skills: true,
    has_experience: false,
    has_languages: false,
  },
} as CandidateProfile;
const resume = (status: Resume["status"]) =>
  ({ id: "resume-1", status, created_at: "2026-11-04T10:00:00Z" }) as Resume;
afterEach(cleanup);
beforeEach(() => {
  vi.resetAllMocks();
  api.pendingReviews.mockReturnValue({ links: {}, loading: false, failed: false });
  api.profile.mockReturnValue({ data: profile, isPending: false, isError: false });
  api.resumes.mockReturnValue({ data: [], isPending: false, isError: false });
  api.applications.mockReturnValue({
    data: { results: [], next: null },
    isPending: false,
    isError: false,
  });
});
function setup() {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <NextIntlClientProvider locale="ar" messages={ar}>
        <CandidateHome me={me} />
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );
}
describe("candidate next step", () => {
  it("prioritizes verification and preserves a guest draft destination", () => {
    const draft = { status: "ready" } as Parameters<typeof candidateNextAction>[3];
    expect(candidateNextAction({ ...me, is_email_verified: false }, profile, [], draft).key).toBe(
      "verify",
    );
    expect(candidateNextAction(me, profile, [], draft)).toEqual({
      key: "draft",
      href: "/start?step=upload",
    });
  });
  it("routes pending extraction to its review instead of claiming it is complete", () => {
    expect(candidateNextAction(me, profile, [resume("review_required")])).toEqual({
      key: "review",
      href: "/account/profile/resumes/resume-1/review",
    });
    expect(candidateNextAction(me, undefined, [resume("processing")]).key).toBe("processing");
  });
  it("keeps a failed guest upload reachable for recovery", () => {
    expect(
      candidateNextAction(me, profile, [], { status: "failed" } as Parameters<
        typeof candidateNextAction
      >[3]),
    ).toEqual({ key: "failed", href: "/start?step=upload" });
  });
  it("allows a manual profile without requiring a CV or optional sections", () => {
    expect(candidateNextAction(me, profile, []).key).toBe("jobs");
    expect(candidateNextAction(me, undefined, []).key).toBe("profile");
  });
  it("does not promote an old upload failure above a newer usable version", () => {
    expect(
      candidateNextAction(me, profile, [
        { ...resume("failed"), created_at: "2025-01-01" },
        resume("reviewed"),
      ]).key,
    ).toBe("jobs");
  });
});
describe("candidate home", () => {
  it("greets the candidate and shows truthful empty applications", () => {
    setup();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("أمينة");
    expect(screen.getByText(ar.CandidateHome.noApplications)).toBeVisible();
    expect(
      screen.getByRole("heading", { name: ar.CandidateHome.actions.jobs.title }),
    ).toBeVisible();
  });
  it("links only known pending sections directly to their extracted item", () => {
    api.pendingReviews.mockReturnValue({
      links: {
        experience: "/account/profile/resumes/resume-1/review#review-item-exp-1",
        skill: "/account/profile/resumes/resume-1/review#review-item-skill-1",
      },
      loading: false,
      failed: false,
    });
    setup();
    const experience = screen.getAllByText(ar.CandidateHome.sections.experience)[0]!.closest("li")!;
    const skill = screen.getAllByText(ar.CandidateHome.sections.skills)[0]!.closest("li")!;
    expect(within(experience).getByRole("link")).toHaveTextContent(
      ar.CandidateHome.pendingInformation,
    );
    expect(within(experience).getByRole("link")).toHaveAttribute(
      "href",
      "/account/profile/resumes/resume-1/review#review-item-exp-1",
    );
    expect(within(skill).getByRole("link")).toHaveTextContent(
      ar.CandidateHome.hasInformationPending,
    );
    const language = screen.getAllByText(ar.CandidateHome.sections.languages)[0]!.closest("li")!;
    expect(within(language).getByRole("link")).toHaveTextContent(ar.CandidateHome.addInformation);
  });
  it("does not describe missing extraction details as empty profile sections", () => {
    api.pendingReviews.mockReturnValue({
      links: {},
      loading: false,
      failed: true,
      fallback: "/account/profile/resumes/resume-1/review",
    });
    setup();
    expect(screen.getByText(ar.CandidateHome.reviewStatusError)).toBeVisible();
    const experience = screen.getAllByText(ar.CandidateHome.sections.experience)[0]!.closest("li")!;
    expect(within(experience).getByRole("link")).toHaveTextContent(
      ar.CandidateHome.reviewInformation,
    );
    expect(within(experience).queryByText(ar.CandidateHome.addInformation)).not.toBeInTheDocument();
  });
  it("shows API failure separately from zero applications", () => {
    api.applications.mockReturnValue({ isError: true, isPending: false });
    setup();
    expect(screen.getByText(ar.CandidateHome.applicationsError)).toBeVisible();
    expect(screen.queryByText(ar.CandidateHome.noApplications)).not.toBeInTheDocument();
  });
  it("does not infer the next action or privacy from a profile outage", () => {
    api.profile.mockReturnValue({
      isError: true,
      isPending: false,
      error: new ApiError(503, { code: "unavailable" }),
    });
    setup();
    expect(screen.getByText(ar.CandidateHome.loadError)).toBeVisible();
    expect(screen.queryByText(ar.CandidateHome.visibility.private)).not.toBeInTheDocument();
  });
  it("shows the actual application status without internal snapshot data", () => {
    api.applications.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        next: null,
        results: [
          {
            id: "application-1",
            job: { id: "job-1", title: "وظيفة مصطنعة للاختبار", organization_name: "مؤسسة اختبار" },
            status: "interview",
            submitted_at: "2026-11-01T00:00:00Z",
            snapshot: { internal: "must not render" },
          },
        ],
      },
    });
    setup();
    expect(screen.getByText(ar.CandidateHome.statuses.interview)).toBeVisible();
    expect(screen.queryByText("must not render")).not.toBeInTheDocument();
  });
});
