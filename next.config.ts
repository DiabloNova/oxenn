import type { NextConfig } from "next";
import { getPreviewCspHeaders } from "./src/config/csp-reporting";

/**
 * Baseline security headers applied to every route.
 * CSP is enabled in Report-Only mode on Vercel Preview deployments only.
 * Production remains unchanged until reports from the redesigned frontend
 * have been reviewed and an enforcement policy is explicitly approved.
 */
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const previewCspHeaders = getPreviewCspHeaders(
  process.env.VERCEL_ENV,
  process.env.VERCEL_URL,
);

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [...securityHeaders, ...previewCspHeaders],
      },
    ];
  },
};

export default nextConfig;
