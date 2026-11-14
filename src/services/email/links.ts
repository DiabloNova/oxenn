/**
 * Builds absolute links for email actions from the configured public application origin.
 * Production links must be HTTPS and must never fall back to localhost.
 */
export function buildEmailActionUrl(path: string, token: string): string {
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const appUrl = configuredOrigin || (process.env.NODE_ENV === "production" ? "" : "http://localhost:3000");

  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is required for production email delivery.");
  }

  let origin: URL;
  try {
    origin = new URL(appUrl);
  } catch {
    throw new Error("NEXT_PUBLIC_APP_URL must be a valid absolute URL.");
  }

  if (
    (origin.protocol !== "https:" && origin.protocol !== "http:") ||
    origin.username ||
    origin.password ||
    origin.pathname !== "/" ||
    origin.search ||
    origin.hash ||
    (process.env.NODE_ENV === "production" && origin.protocol !== "https:")
  ) {
    throw new Error("NEXT_PUBLIC_APP_URL must be a safe HTTPS origin in production.");
  }

  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new Error("Email action path must be origin-relative.");
  }

  const url = new URL(path, origin.origin);
  if (url.origin !== origin.origin) {
    throw new Error("Email action URL must remain on the configured application origin.");
  }
  url.searchParams.set("token", token);
  return url.toString();
}
