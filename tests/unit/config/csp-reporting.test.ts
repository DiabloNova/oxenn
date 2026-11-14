import { describe, expect, it } from "vitest";
import { getPreviewCspHeaders } from "@/config/csp-reporting";

describe("Preview CSP reporting headers", () => {
  const previewOrigin = "https://oxenn-git-rf-006-oxenn.vercel.app";

  it("does not add CSP reporting headers outside Preview", () => {
    expect(getPreviewCspHeaders("production", previewOrigin)).toEqual([]);
    expect(getPreviewCspHeaders("development", previewOrigin)).toEqual([]);
    expect(getPreviewCspHeaders(undefined, previewOrigin)).toEqual([]);
  });

  it("emits modern, legacy, and CSP report endpoints for the request origin", () => {
    const headers = getPreviewCspHeaders("preview", previewOrigin);

    expect(headers).toHaveLength(3);
    expect(headers[0]).toEqual({
      key: "Reporting-Endpoints",
      value: 'csp-endpoint="/api/security/csp-report"',
    });
    expect(headers[1]).toEqual({
      key: "Report-To",
      value: JSON.stringify({
        group: "csp-endpoint",
        max_age: 86_400,
        endpoints: [
          { url: previewOrigin + "/api/security/csp-report" },
        ],
      }),
    });
    expect(headers[2].key).toBe("Content-Security-Policy-Report-Only");
    expect(headers[2].value).toBe(
      [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self'",
        "img-src 'self' data: blob:",
        "font-src 'self' data:",
        "connect-src 'self'",
        "frame-src 'self'",
        "worker-src 'self' blob:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "report-to csp-endpoint",
        "report-uri /api/security/csp-report",
      ].join("; "),
    );
    expect(headers[2].value).not.toContain("unsafe-inline");
    expect(headers[2].value).not.toContain("unsafe-eval");
    expect(headers[2].value).not.toContain("*");
  });

  it("uses whichever Preview origin served the document", () => {
    const origin = "https://custom-preview.example.test";
    const headers = getPreviewCspHeaders("preview", origin);
    const legacy = JSON.parse(headers[1].value) as {
      endpoints: Array<{ url: string }>;
    };

    expect(headers[0].value).toBe(
      'csp-endpoint="/api/security/csp-report"',
    );
    expect(legacy.endpoints[0].url).toBe(
      origin + "/api/security/csp-report",
    );
  });

  it.each([
    "",
    "http://preview.example.test",
    "https://preview.example.test/path",
    "https://user@preview.example.test",
    "https://preview.example.test?target=elsewhere",
    "https://preview.example.test#fragment",
  ])("fails closed when the Preview request origin is invalid: %s", (origin) => {
    expect(getPreviewCspHeaders("preview", origin)).toEqual([]);
  });
});
