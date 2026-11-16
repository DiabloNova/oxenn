export const SESSION_SECRET_PLACEHOLDER = "change-this-to-a-secure-32-character-secret-in-production";
export const SESSION_SECRET_MIN_LENGTH = 32;

/** Normalize values consistently with dotenv-style quoted env-file values. */
export function normalizeEnvValue(value: string | undefined): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "";

  const quote = trimmed[0];
  if (quote === '"' || quote === "'") {
    let closingQuote = -1;
    let escaped = false;
    for (let index = 1; index < trimmed.length; index += 1) {
      const character = trimmed[index];
      if (quote === '"' && character === "\\" && !escaped) {
        escaped = true;
        continue;
      }
      if (character === quote && !escaped) {
        closingQuote = index;
        break;
      }
      escaped = false;
    }

    if (closingQuote > 0) {
      const trailing = trimmed.slice(closingQuote + 1).trimStart();
      if (!trailing || trailing.startsWith("#")) {
        return trimmed.slice(1, closingQuote).trim();
      }
    }
    return trimmed;
  }

  // dotenv treats a hash preceded by whitespace as an inline comment.
  return trimmed.replace(/\s+#.*$/, "").trim();
}

export function isValidSessionSecret(value: string): boolean {
  return value.length >= SESSION_SECRET_MIN_LENGTH && value !== SESSION_SECRET_PLACEHOLDER;
}
