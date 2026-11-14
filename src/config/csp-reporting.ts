const CSP_REPORT_PATH = "/api/security/csp-report";
const LEGACY_REPORT_TO_MAX_AGE_SECONDS = 86_400;

export interface ResponseHeader {
  key: string;
  value: string;
}

/**
 * Builds a narrow discovery-only CSP policy for a Vercel Preview request.
 *
 * This helper is called from the request-time Proxy, not next.config.ts, so
 * the Preview gate and legacy Report-To endpoint are evaluated for each
 * request and use the exact origin the browser visited.
 */
export function getPreviewCspHeaders(
  vercelEnv: string | undefined,
  requestOrigin: string,
): ResponseHeader[] {
  if (vercelEnv !== "preview") {
    return [];
  }

  const origin = getSecureOrigin(requestOrigin);
  if (!origin) {
    return [];
  }

  const reportUrl = CSP_REPORT_PATH;
  const legacyReportTo = JSON.stringify({
    group: "csp-endpoint",
    max_age: LEGACY_REPORT_TO_MAX_AGE_SECONDS,
    endpoints: [{ url: origin + CSP_REPORT_PATH }],
  });
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
      key: "Report-To",
      value: legacyReportTo,
    },
    {
      key: "Content-Security-Policy-Report-Only",
      value: policy,
    },
  ];
}

function getSecureOrigin(value: string): string | null {
  try {
    const parsed = new URL(value);
    if (
      parsed.protocol !== "https:" ||
      !parsed.hostname ||
      parsed.username ||
      parsed.password ||
      parsed.port ||
      parsed.pathname !== "/" ||
      parsed.search ||
      parsed.hash ||
      parsed.origin !== value
    ) {
      return null;
    }

    return parsed.origin;
  } catch {
    return null;
  }
}
