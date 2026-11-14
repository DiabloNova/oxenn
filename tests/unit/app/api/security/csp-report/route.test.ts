import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/security/csp-report/route";

const PREVIEW_URL = "https://oxenn-preview.vercel.app/api/security/csp-report";

describe("POST /api/security/csp-report", () => {
  let infoSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.stubEnv("VERCEL_ENV", "preview");
    infoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("accepts a legacy CSP report and logs only sanitized report fields", async () => {
    const request = new Request(PREVIEW_URL, {
      method: "POST",
      headers: { "content-type": "application/csp-report" },
      body: JSON.stringify({
        "csp-report": {
          "document-uri":
            "https://oxenn-preview.vercel.app/fa/dashboard?token=private-token",
          "blocked-uri":
            "https://third-party.example/script.js?secret=private-value",
          "source-file":
            "https://oxenn-preview.vercel.app/_next/static/chunk.js",
          "effective-directive": "script-src-elem",
          disposition: "report",
          "script-sample": "password=must-not-be-logged",
        },
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(204);
    expect(infoSpy).toHaveBeenCalledOnce();

    const logged = String(infoSpy.mock.calls[0][1]);
    expect(logged).toContain("script-src-elem");
    expect(logged).toContain("third-party.example");
    expect(logged).not.toContain("private-token");
    expect(logged).not.toContain("private-value");
    expect(logged).not.toContain("must-not-be-logged");
    expect(logged).not.toContain("/fa/dashboard");
    expect(logged).not.toContain("/_next/static/chunk.js");
  });

  it("accepts Reporting API batches and ignores non-CSP report types", async () => {
    const request = new Request(PREVIEW_URL, {
      method: "POST",
      headers: { "content-type": "application/reports+json" },
      body: JSON.stringify([
        {
          type: "csp-violation",
          body: {
            effectiveDirective: "style-src-attr",
            disposition: "report",
            documentURL: "https://oxenn-preview.vercel.app/fa",
            blockedURL: "inline",
            statusCode: 200,
          },
        },
        {
          type: "deprecation",
          body: { id: "unrelated" },
        },
      ]),
    });

    const response = await POST(request);
    expect(response.status).toBe(204);
    expect(infoSpy).toHaveBeenCalledOnce();
    const logged = String(infoSpy.mock.calls[0][1]);
    expect(logged).toContain("style-src-attr");
    expect(logged).toContain('"blockedOrigin":"inline"');
    expect(logged).not.toContain("unrelated");
  });

  it("counts only CSP reports when enforcing the batch report limit", async () => {
    const ignoredReports = Array.from({ length: 25 }, () => ({
      type: "deprecation",
      body: { id: "ignored-entry" },
    }));
    const request = new Request(PREVIEW_URL, {
      method: "POST",
      headers: { "content-type": "application/reports+json" },
      body: JSON.stringify([
        ...ignoredReports,
        {
          type: "csp-violation",
          body: { effectiveDirective: "script-src", disposition: "report" },
        },
      ]),
    });

    expect((await POST(request)).status).toBe(204);
    expect(infoSpy).toHaveBeenCalledOnce();
    const logged = String(infoSpy.mock.calls[0][1]);
    expect(logged).toContain('"reportCount":1');
    expect(logged).not.toContain("ignored-entry");
  });

  it("accepts a single Reporting API CSP report object", async () => {
    const request = new Request(PREVIEW_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "csp-violation",
        body: {
          effectiveDirective: "connect-src",
          disposition: "report",
        },
      }),
    });

    expect((await POST(request)).status).toBe(204);
    expect(infoSpy).toHaveBeenCalledOnce();
  });

  it("returns 204 for a valid batch that contains no CSP reports", async () => {
    const request = new Request(PREVIEW_URL, {
      method: "POST",
      headers: { "content-type": "application/reports+json" },
      body: JSON.stringify([{ type: "deprecation", body: {} }]),
    });

    expect((await POST(request)).status).toBe(204);
    expect(infoSpy).not.toHaveBeenCalled();
  });

  it("rejects unsupported media types", async () => {
    const request = new Request(PREVIEW_URL, {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: "{}",
    });

    expect((await POST(request)).status).toBe(415);
    expect(infoSpy).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON and malformed top-level report envelopes", async () => {
    const malformedJson = new Request(PREVIEW_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    });
    const malformedEnvelope = new Request(PREVIEW_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ arbitrary: "data" }),
    });

    expect((await POST(malformedJson)).status).toBe(400);
    expect((await POST(malformedEnvelope)).status).toBe(400);
    expect(infoSpy).not.toHaveBeenCalled();
  });

  it("rejects declared and streamed payloads larger than the configured cap", async () => {
    const oversizedBody = "x".repeat(16 * 1024 + 1);
    const declaredOversize = new Request(PREVIEW_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "content-length": String(oversizedBody.length),
      },
      body: oversizedBody,
    });
    const streamedOversize = new Request(PREVIEW_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: oversizedBody,
    });

    expect((await POST(declaredOversize)).status).toBe(413);
    expect((await POST(streamedOversize)).status).toBe(413);
    expect(infoSpy).not.toHaveBeenCalled();
  });

  it("rejects batches that contain too many CSP reports", async () => {
    const reports = Array.from({ length: 21 }, () => ({
      type: "csp-violation",
      body: { effectiveDirective: "script-src" },
    }));
    const request = new Request(PREVIEW_URL, {
      method: "POST",
      headers: { "content-type": "application/reports+json" },
      body: JSON.stringify(reports),
    });

    expect((await POST(request)).status).toBe(413);
    expect(infoSpy).not.toHaveBeenCalled();
  });

  it("is inactive outside Vercel Preview", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    const request = new Request(PREVIEW_URL, {
      method: "POST",
      headers: { "content-type": "application/csp-report" },
      body: JSON.stringify({ "csp-report": { disposition: "report" } }),
    });

    expect((await POST(request)).status).toBe(404);
    expect(infoSpy).not.toHaveBeenCalled();
  });
});
