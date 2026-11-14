import { describe, expect, it } from "vitest";
import { getPreviewCspHeaders } from "@/config/csp-reporting";

describe("Preview CSP reporting headers", () => {
  const previewUrl = "oxenn-git-rf-006-oxenn.vercel.app";

  it("does not add CSP reporting headers to Production", () => {
    expect(getPreviewCspHeaders("production", previewUrl)).toEqual([]);
  });

  it("does not add CSP reporting headers to local development", () => {
    expect(getPreviewCspHeaders("development", "localhost:3000")).toEqual([]);
    expect(getPreviewCspHeaders(undefined, previewUrl)).toEqual([]);
  });

  it("emits an absolute same-origin Reporting API endpoint on Preview", () => {
    const headers = getPreviewCspHeaders("preview", previewUrl);

    expect(headers).toHaveLength(2);
    expect(headers[0]).toEqual({
      key: "Reporting-Endpoints",
      value:
        'csp-endpoint="https://' +
        previewUrl +
        '/api/security/csp-report"',
    });
    expect(headers[1].key).toBe("Content-Security-Policy-Report-Only");
    expect(headers[1].value).toContain("default-src 'self'");
    expect(headers[1].value).toContain("script-src 'self'");
    expect(headers[1].value).toContain("style-src 'self'");
    expect(headers[1].value).toContain("object-src 'none'");
    expect(headers[1].value).toContain("frame-ancestors 'none'");
    expect(headers[1].value).toContain("report-to csp-endpoint");
    expect(headers[1].value).toContain(
      "report-uri https://" + previewUrl + "/api/security/csp-report",
    );
    expect(headers[1].value).not.toContain("unsafe-inline");
    expect(headers[1].value).not.toContain("unsafe-eval");
  });

  it.each([
    undefined,
    "",
    "https://example.com",
    "example.com/path",
    "user@example.com",
    "example.com?target=elsewhere",
    "example.com#fragment",
    "example.com:443",
    " example.com",
  ])("fails closed when the Preview deployment host is invalid: %s", (host) => {
    expect(getPreviewCspHeaders("preview", host)).toEqual([]);
  });
});
