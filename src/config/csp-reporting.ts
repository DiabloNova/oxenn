const CSP_REPORT_PATH = "/api/security/csp-report";

export interface ResponseHeader {
  key: string;
  value: string;
}

/**
 * Builds a discovery-only CSP policy for a Vercel Preview deployment.
 *
 * The policy deliberately avoids inline-script/style allowances and third-party
 * wildcards so Preview can reveal the resources the current UI actually uses.
 * It is Report-Only and must not be promoted to enforcement without reviewing
 * reports from the final frontend.
 */
export function getPreviewCspHeaders(
  vercelEnv: string | undefined,
  vercelUrl: string | undefined,
): ResponseHeader[] {
  if (vercelEnv !== "preview") {
    return [];
  }

  const origin = getPreviewOrigin(vercelUrl);
  if (!origin) {
    return [];
  }

  const reportUrl = new URL(CSP_REPORT_PATH, origin).toString();
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

function getPreviewOrigin(vercelUrl: string | undefined): string | null {
  if (
    !vercelUrl ||
    vercelUrl.length > 253 ||
    vercelUrl !== vercelUrl.trim() ||
    /[\\/?#@]/.test(vercelUrl)
  ) {
    return null;
  }

  try {
    const parsed = new URL("https://" + vercelUrl);
    if (
      parsed.protocol !== "https:" ||
      parsed.username ||
      parsed.password ||
      parsed.port ||
      parsed.pathname !== "/" ||
      parsed.search ||
      parsed.hash ||
      parsed.hostname.toLowerCase() !== vercelUrl.toLowerCase()
    ) {
      return null;
    }

    return parsed.origin;
  } catch {
    return null;
  }
}
