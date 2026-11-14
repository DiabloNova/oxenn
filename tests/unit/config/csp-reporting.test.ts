import { describe, expect, it } from "vitest";
import { getPreviewCspHeaders } from "@/config/csp-reporting";

describe("Preview CSP reporting headers", () => {
  it("does not add CSP reporting headers outside Preview", () => {
    expect(getPreviewCspHeaders("production")).toEqual([]);
    expect(getPreviewCspHeaders("development")).toEqual([]);
    expect(getPreviewCspHeaders(undefined)).toEqual([]);
  });

  it("emits the exact origin-relative Report-Only policy on Preview", () => {
    const headers = getPreviewCspHeaders("preview");

    expect(headers).toHaveLength(2);
    expect(headers[0]).toEqual({
      key: "Reporting-Endpoints",
      value: 'csp-endpoint="/api/security/csp-report"',
    });
    expect(headers[1].key).toBe("Content-Security-Policy-Report-Only");
    expect(headers[1].value).toBe(
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
    expect(headers[1].value).not.toContain("https://");
    expect(headers[1].value).not.toContain("unsafe-inline");
    expect(headers[1].value).not.toContain("unsafe-eval");
    expect(headers[1].value).not.toContain("*");
  });
});
