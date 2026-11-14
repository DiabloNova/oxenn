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

  // VERCEL_URL is only a deployment/Preview gate. The endpoint itself is an
  // origin-relative path so branch aliases and custom Preview domains report
  // back to the exact origin that served the document.
  if (!isValidPreviewHost(vercelUrl)) {
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

function isValidPreviewHost(vercelUrl: string | undefined): boolean {
  if (
    !vercelUrl ||
    vercelUrl.length > 253 ||
    vercelUrl !== vercelUrl.trim() ||
    /[\\/?#@]/.test(vercelUrl)
  ) {
    return false;
  }

  try {
    const parsed = new URL("https://" + vercelUrl);
    return (
      parsed.protocol === "https:" &&
      !parsed.username &&
      !parsed.password &&
      !parsed.port &&
      parsed.pathname === "/" &&
      !parsed.search &&
      !parsed.hash &&
      parsed.hostname.toLowerCase() === vercelUrl.toLowerCase()
    );
  } catch {
    return false;
  }
}
