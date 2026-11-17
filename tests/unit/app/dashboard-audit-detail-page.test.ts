import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getPremiumAuditById: vi.fn(),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
  notFound: mocks.notFound,
}));

vi.mock("@/services/auth/session", () => ({
  getSession: mocks.getSession,
}));

vi.mock("@/services/audits/dashboard-audits", () => ({
  getPremiumAuditById: mocks.getPremiumAuditById,
}));

import AuditDetailPage from "@/app/[locale]/dashboard/audits/[id]/page";

const authenticatedSession = {
  user: { id: "user-1", workspaceId: "workspace-1" },
};

const audit = {
  id: "audit-123",
  url: "https://example.com",
  score: 82,
  grade: "B",
  pagesAnalyzed: 4,
  createdAt: "2026-11-17T10:00:00.000Z",
  metrics: { contentQuality: 91 },
  issues: [],
  recommendations: [],
};

function renderPage(locale = "en", id = audit.id) {
  return AuditDetailPage({
    params: Promise.resolve({ locale, id }),
  });
}

describe("premium audit detail page authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue(authenticatedSession);
    mocks.getPremiumAuditById.mockResolvedValue(audit);
    mocks.redirect.mockImplementation((destination: string) => {
      throw new Error(`REDIRECT:${destination}`);
    });
    mocks.notFound.mockImplementation(() => {
      throw new Error("NOT_FOUND");
    });
  });

  it.each(["en", "fa"])(
    "redirects unauthenticated users to the %s login route before loading audit data",
    async (locale) => {
      mocks.getSession.mockResolvedValue(null);

      await expect(renderPage(locale)).rejects.toThrow(
        `REDIRECT:/${locale}/login?returnTo=${encodeURIComponent(
          `/${locale}/dashboard/audits/${audit.id}`,
        )}`,
      );

      expect(mocks.getSession).toHaveBeenCalledOnce();
      expect(mocks.getPremiumAuditById).not.toHaveBeenCalled();
    },
  );

  it("redirects a session without workspace context without exposing audit data", async () => {
    mocks.getSession.mockResolvedValue({
      user: { id: "user-1", workspaceId: null },
    });

    await expect(renderPage("fa")).rejects.toThrow(
      `REDIRECT:/fa/login?returnTo=${encodeURIComponent(
        `/fa/dashboard/audits/${audit.id}`,
      )}`,
    );

    expect(mocks.getPremiumAuditById).not.toHaveBeenCalled();
  });

  it("loads and renders the audit for an authenticated workspace member", async () => {
    const result = await renderPage("en");

    expect(mocks.getSession).toHaveBeenCalledOnce();
    expect(mocks.getPremiumAuditById).toHaveBeenCalledWith(audit.id, authenticatedSession);
    expect(mocks.getSession.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.getPremiumAuditById.mock.invocationCallOrder[0],
    );
    expect(result).toBeTruthy();
  });

  it("preserves not-found behavior when the audit is missing or inaccessible", async () => {
    mocks.getPremiumAuditById.mockResolvedValue(null);

    await expect(renderPage()).rejects.toThrow("NOT_FOUND");
    expect(mocks.getPremiumAuditById).toHaveBeenCalledWith(audit.id, authenticatedSession);
  });

  it("propagates unexpected session infrastructure errors instead of redirecting", async () => {
    const infrastructureError = new Error("Unable to retrieve session");
    mocks.getSession.mockRejectedValue(infrastructureError);

    await expect(renderPage()).rejects.toBe(infrastructureError);

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(mocks.getPremiumAuditById).not.toHaveBeenCalled();
  });

  it.each(["en", "fa"])(
    "keeps the %s return destination local and safely encodes an untrusted route segment",
    async (locale) => {
      const hostileId = "//evil.example/path?next=https://attacker.example";
      mocks.getSession.mockResolvedValue(null);

      await expect(renderPage(locale, hostileId)).rejects.toThrow("REDIRECT:");

      const destination = mocks.redirect.mock.calls[0][0] as string;
      const loginUrl = new URL(destination, "https://oxenn.example");
      const returnTo = loginUrl.searchParams.get("returnTo");

      expect(loginUrl.pathname).toBe(`/${locale}/login`);
      expect(returnTo).toBe(`/${locale}/dashboard/audits/${hostileId}`);
      expect(returnTo).toMatch(new RegExp(`^/${locale}/dashboard/audits/`));
      expect(returnTo).not.toMatch(/^https?:\/\//);
      expect(destination).toContain(encodeURIComponent(returnTo ?? ""));
    },
  );
});
