const CSP_REPORT_PATH = "/api/security/csp-report";

export interface ResponseHeader {
  key: string;
  value: string;
}

/**
 * Builds a narrow discovery-only CSP policy for a Vercel Preview request.
 *
 * This helper is called from the request-time Proxy, not next.config.ts, so
 * the Preview gate is evaluated for each request rather than frozen at build.
 * The policy must not be promoted to enforcement without reviewing reports
 * from the final frontend.
 */
export function getPreviewCspHeaders(
  vercelEnv: string | undefined,
): ResponseHeader[] {
  if (vercelEnv !== "preview") {
    return [];
  }

  const reportUrl = CSP_REPORT_PATH;
  const policy = [
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
    "report-uri " + reportUrl,
  ].join("; ");

  return [
    {
      key: "Reporting-Endpoints",
      value: 'csp-endpoint="' + reportUrl + '"',
    },
    {
      key: "Content-Security-Policy-Report-Only",
      value: policy,
    },
  ];
}
