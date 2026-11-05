// Local-only synthetic API fixture. Never imported by the application.
import { createServer } from "node:http";
const me = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "candidate@example.test",
  full_name: "أمينة",
  signup_intent: "candidate",
  preferred_locale: "ar",
  time_zone: "Africa/Casablanca",
  is_email_verified: true,
  date_joined: "2026-11-01T00:00:00Z",
  staff_roles: [],
  memberships: [],
};
const id = "00000000-0000-4000-8000-000000000002";
const reviewed = new Set();
createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  const session = (req.headers.cookie ?? "").match(/geniura_sid=([^;]+)/)?.[1];
  const state = session?.split("__")[0];
  const done = reviewed.has(session);
  const send = (status, data) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  };
  if (url.pathname === "/api/v1/auth/csrf") return send(200, { csrf_token: "a".repeat(64) });
  if (url.pathname === "/api/v1/auth/login") {
    res.setHeader("Set-Cookie", "geniura_sid=complete; Path=/; HttpOnly; SameSite=Lax");
    return send(200, me);
  }
  if (url.pathname === "/api/v1/auth/me")
    return send(
      state ? 200 : 401,
      state ? { ...me, is_email_verified: state !== "unverified" } : { code: "not_authenticated" },
    );
  if (url.pathname === "/api/v1/onboarding/guest-cv")
    return state === "draft"
      ? send(200, {
          status: "ready",
          expires_at: "2099-01-01T00:00:00Z",
          identity: { name: "Synthetic" },
          email_verified: false,
          claimed: false,
        })
      : send(404, { code: "not_found" });
  if (url.pathname === "/api/v1/candidates/me")
    return state === "outage"
      ? send(503, { code: "unavailable" })
      : send(200, {
          id,
          headline: state === "new" ? "" : "مطورة برمجيات",
          visibility: "private",
          completeness: {
            has_headline: state !== "new",
            has_city: false,
            has_skills: true,
            has_experience: true,
            has_languages: true,
            has_resume: state === "review",
            has_shareable_resume: false,
          },
        });
  if (url.pathname === "/api/v1/candidates/me/resumes")
    return send(
      200,
      state === "review"
        ? [
            {
              id,
              status: done ? "reviewed" : "review_required",
              created_at: "2026-11-01T00:00:00Z",
              display_name: "synthetic.pdf",
            },
          ]
        : [],
    );
  if (url.pathname === `/api/v1/candidates/me/resumes/${id}/review` && req.method === "POST") {
    req.resume();
    reviewed.add(session);
    return send(200, { confirmed: 2, corrected: 0, dismissed: 0, updated: 0 });
  }
  if (url.pathname === `/api/v1/candidates/me/resumes/${id}/extraction`)
    return send(200, {
      resume_id: id,
      resume_status: done ? "reviewed" : "review_required",
      display_status: "",
      status: "ready",
      parser: "synthetic-test",
      error_code: "",
      items: [
        {
          id: "experience-item",
          kind: "experience",
          payload: { title: "Synthetic role", employer_name: "Synthetic employer" },
          confidence: "0.8",
          evidence_snippet: "",
          review_status: done ? "confirmed" : "pending",
          existing_object: null,
          applied_object_id: null,
          applied_object_type: "",
          reviewed_at: null,
        },
        {
          id: "language-item",
          kind: "language",
          payload: { language_code: "fr", level: "B2" },
          confidence: "0.8",
          evidence_snippet: "",
          review_status: done ? "confirmed" : "pending",
          existing_object: null,
          applied_object_id: null,
          applied_object_type: "",
          reviewed_at: null,
        },
        {
          id: "skill-item",
          kind: "skill",
          payload: { label: "Synthetic skill" },
          confidence: "0.8",
          evidence_snippet: "",
          review_status: "confirmed",
          existing_object: null,
          applied_object_id: "saved-skill",
          applied_object_type: "skill",
          reviewed_at: null,
        },
      ],
    });
  if (url.pathname === "/api/v1/candidates/me/applications") {
    if (state === "outage") return send(503, { code: "unavailable" });
    const page = url.searchParams.get("page");
    return send(200, {
      count: state === "complete" ? 2 : 0,
      next:
        state === "complete" && !page
          ? "http://localhost:3104/api/v1/candidates/me/applications?page=2"
          : null,
      previous: null,
      results:
        state === "complete"
          ? [
              {
                id: page ? "application-2" : "application-1",
                job: {
                  id,
                  title: page ? "وظيفة اختبار ثانية" : "وظيفة اختبار",
                  organization_name: "مؤسسة اختبار",
                  status: "published",
                },
                status: page ? "submitted" : "interview",
                submitted_at: "2026-11-01T00:00:00Z",
              },
            ]
          : [],
    });
  }
  if (url.pathname.startsWith("/api/v1/taxonomy/"))
    return send(200, { count: 0, results: [], locale: "ar" });
  return send(404, { code: "not_found" });
}).listen(Number(process.env.CANDIDATE_FIXTURE_PORT ?? 3104), "127.0.0.1");
