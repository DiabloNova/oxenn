export function sanitizeErrorMessage(msg: string, dbUrl?: string): string {
  let sanitized = msg;
  if (dbUrl) {
    sanitized = sanitized.split(dbUrl).join("[REDACTED_DATABASE_URL]");
  }
  // Redact any postgres:// or postgresql:// URLs
  sanitized = sanitized.replace(/postgres(?:ql)?:\/\/[^\s"']+/gi, "[REDACTED_DATABASE_URL]");
  // Redact password parameters or user:pass patterns
  sanitized = sanitized.replace(/:[^:@\s]+@/g, ":[REDACTED_PASSWORD]@");
  return sanitized;
}
