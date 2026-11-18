import { afterEach, describe, expect, it, vi } from "vitest";
import { parseDotenvValue, resolveMode, validateEnv } from "../../../scripts/env-check";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("resolveMode", () => {
  it("uses APP_MODE when no explicit mode is provided", () => {
    vi.stubEnv("APP_MODE", "migrate");

    expect(resolveMode()).toBe("migrate");
  });

  it("prefers an explicit mode argument over APP_MODE", () => {
    vi.stubEnv("APP_MODE", "migrate");

    expect(resolveMode("test")).toBe("test");
  });

  it("defaults to dev when neither source provides a mode", () => {
    vi.stubEnv("APP_MODE", "");

    expect(resolveMode()).toBe("dev");
  });

  it.each(["dev", "build", "migrate", "test"])("accepts the supported mode %s", (mode) => {
    expect(resolveMode(mode)).toBe(mode);
  });

  it("rejects an unsupported explicit mode", () => {
    expect(() => resolveMode("staging")).toThrow(
      "Unsupported environment mode 'staging'. Expected one of: dev, build, migrate, test.",
    );
  });

  it("rejects an unsupported APP_MODE instead of bypassing validation", () => {
    vi.stubEnv("APP_MODE", "staging");

    expect(() => resolveMode()).toThrow(
      "Unsupported environment mode 'staging'. Expected one of: dev, build, migrate, test.",
    );
  });
});



describe("production build email configuration", () => {
  it("allows a Vercel Preview build without a database, session secret, or email provider", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("SESSION_SECRET", "");
    vi.stubEnv("EMAIL_PROVIDER", "");
    vi.stubEnv("MAILEROO_API_KEY", "");
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("EMAIL_FROM_ADDRESS", "");

    expect(validateEnv("build")).toMatchObject({
      mode: "build",
      missing: [],
      invalid: [],
      valid: true,
    });
  });

  it("requires session and email configuration when a Preview build has a database", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("DATABASE_URL", "postgresql://app:secret@127.0.0.1:5432/oxenn_preview");
    vi.stubEnv("SESSION_SECRET", "");
    vi.stubEnv("EMAIL_PROVIDER", "maileroo");
    vi.stubEnv("MAILEROO_API_KEY", "");
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("EMAIL_FROM_ADDRESS", "");

    const result = validateEnv("build");
    expect(result.missing).toEqual(expect.arrayContaining(["SESSION_SECRET", "MAILEROO_API_KEY"]));
    expect(result.invalid).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "EMAIL_FROM_ADDRESS" }),
    ]));
  });

  it("still validates a supplied Preview database URL and sender address", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("DATABASE_URL", "not-a-postgres-url");
    vi.stubEnv("EMAIL_FROM_ADDRESS", "not-an-email");

    const result = validateEnv("build");
    expect(result.invalid).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "DATABASE_URL" }),
      expect.objectContaining({ name: "EMAIL_FROM_ADDRESS" }),
    ]));
  });

  it("keeps database, session, and email requirements strict for Production builds", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("SESSION_SECRET", "");
    vi.stubEnv("EMAIL_PROVIDER", "maileroo");
    vi.stubEnv("MAILEROO_API_KEY", "");
    vi.stubEnv("EMAIL_FROM_ADDRESS", "");

    const result = validateEnv("build");
    expect(result.missing).toEqual(expect.arrayContaining([
      "DATABASE_URL",
      "SESSION_SECRET",
      "MAILEROO_API_KEY",
    ]));
    expect(result.invalid).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "EMAIL_FROM_ADDRESS" }),
    ]));
  });

  function stubProductionBase() {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATABASE_URL", "postgresql://app:secret@127.0.0.1:5432/oxenn");
    vi.stubEnv("SESSION_SECRET", "valid-session-secret-with-more-than-32-chars");
    vi.stubEnv("EMAIL_PROVIDER", "maileroo");
    vi.stubEnv("MAILEROO_API_KEY", "maileroo-test-key");
    vi.stubEnv("EMAIL_FROM_ADDRESS", "noreply@example.com");
  }

  it("rejects empty provider values instead of defaulting them", () => {
    stubProductionBase();
    vi.stubEnv("EMAIL_PROVIDER", "");
    expect(validateEnv("build").invalid).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "EMAIL_PROVIDER" }),
    ]));
  });

  it("treats whitespace-only provider keys as missing", () => {
    stubProductionBase();
    vi.stubEnv("MAILEROO_API_KEY", "   ");
    expect(validateEnv("build").missing).toContain("MAILEROO_API_KEY");
  });

  it("preserves literal hash fragments in runtime session secrets", () => {
    vi.stubEnv("DATABASE_URL", "postgresql://app:secret@127.0.0.1:5432/oxenn");
    vi.stubEnv("SESSION_SECRET", "1234567890123456789012345678901 # retained");
    expect(validateEnv("dev")).toMatchObject({ missing: [], invalid: [], valid: true });
  });

  it("requires the selected provider key and a valid sender address", () => {
    stubProductionBase();
    vi.stubEnv("MAILEROO_API_KEY", "");
    vi.stubEnv("EMAIL_FROM_ADDRESS", "not-an-email");
    const result = validateEnv("build");
    expect(result.missing).toContain("MAILEROO_API_KEY");
    expect(result.invalid).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "EMAIL_FROM_ADDRESS" }),
    ]));
  });

  it("accepts a fully configured Maileroo sender", () => {
    stubProductionBase();
    expect(validateEnv("build")).toMatchObject({ missing: [], invalid: [], valid: true });
  });

  it("requires the selected Resend key when Resend is explicitly selected", () => {
    stubProductionBase();
    vi.stubEnv("EMAIL_PROVIDER", "resend");
    vi.stubEnv("RESEND_API_KEY", "");
    expect(validateEnv("build").missing).toContain("RESEND_API_KEY");
  });

  it("rejects unsupported production email providers", () => {
    stubProductionBase();
    vi.stubEnv("EMAIL_PROVIDER", "unknown");
    expect(validateEnv("build").invalid).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "EMAIL_PROVIDER" }),
    ]));
  });
});

describe("dotenv value parsing", () => {
  it("strips unquoted inline comments while preserving the value", () => {
    expect(parseDotenvValue("change-this-to-a-secure-32-character-secret-in-production # local note"))
      .toBe("change-this-to-a-secure-32-character-secret-in-production");
  });

  it("preserves hashes inside matching quoted values and strips trailing comments", () => {
    expect(parseDotenvValue("\"secret # retained\" # local note")).toBe("secret # retained");
    expect(parseDotenvValue("\x27secret # retained\x27 # local note")).toBe("secret # retained");
  });

  it("treats an empty assignment followed by an inline comment as empty", () => {
    expect(parseDotenvValue(" # Required in production")).toBe("");
  });

  it("keeps malformed quoted values intact so validation rejects them", () => {
    expect(parseDotenvValue("\"unterminated")).toBe("\"unterminated");
    expect(parseDotenvValue("\"quoted\" trailing")).toBe("\"quoted\" trailing");
  });
});

describe("validateEnv db:push settings", () => {
  function stubBaseEnvironment(mode: "dev" | "test") {
    vi.stubEnv("DATABASE_URL", "postgresql://app:secret@127.0.0.1:5432/oxenn");
    if (mode === "dev") vi.stubEnv("SESSION_SECRET", "a-session-secret-with-at-least-32-characters");
  }

  it("rejects a session secret shorter than 32 characters in dev mode", () => {
    stubBaseEnvironment("dev");
    vi.stubEnv("SESSION_SECRET", "too-short-secret");
    const result = validateEnv("dev");
    expect(result.invalid).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "SESSION_SECRET" }),
    ]));
  });

  it("rejects the example SESSION_SECRET placeholder in dev mode", () => {
    stubBaseEnvironment("dev");
    vi.stubEnv("SESSION_SECRET", "change-this-to-a-secure-32-character-secret-in-production");
    const result = validateEnv("dev");
    expect(result.invalid).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "SESSION_SECRET" }),
    ]));
  });


  it("normalizes quoted environment secrets before validating their length", () => {
    stubBaseEnvironment("dev");
    vi.stubEnv("SESSION_SECRET", '"too-short-secret"');
    expect(validateEnv("dev").invalid).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "SESSION_SECRET" }),
    ]));
  });

  it("rejects the placeholder even when it is quoted", () => {
    stubBaseEnvironment("dev");
    vi.stubEnv("SESSION_SECRET", '"change-this-to-a-secure-32-character-secret-in-production"');
    expect(validateEnv("dev").invalid).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "SESSION_SECRET" }),
    ]));
  });

  it.each(["dev", "test"] as const)("reports missing paired db:push settings as missing in %s mode", (mode) => {
    stubBaseEnvironment(mode);
    vi.stubEnv("ALLOW_DB_PUSH", "true");
    vi.stubEnv("DB_PUSH_TARGET_ID", "");
    vi.stubEnv("DB_PUSH_DATABASE_URL", "");

    const result = validateEnv(mode);
    expect(result.missing).toEqual(expect.arrayContaining(["DB_PUSH_TARGET_ID", "DB_PUSH_DATABASE_URL"]));
    expect(result.invalid.some((item) => item.name === "DB_PUSH_TARGET_ID" || item.name === "DB_PUSH_DATABASE_URL")).toBe(false);
  });

  it("rejects quoted db:push approval values instead of treating them as enabled", () => {
    stubBaseEnvironment("dev");
    vi.stubEnv("ALLOW_DB_PUSH", "\"true\"");

    const result = validateEnv("dev");
    expect(result.invalid).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "ALLOW_DB_PUSH" }),
    ]));
    expect(result.missing).not.toContain("DB_PUSH_TARGET_ID");
    expect(result.missing).not.toContain("DB_PUSH_DATABASE_URL");
  });

  it("rejects quoted database URLs because the runtime would receive the quotes", () => {
    stubBaseEnvironment("dev");
    vi.stubEnv("DATABASE_URL", "\"postgresql://app:secret@127.0.0.1:5432/oxenn\"");

    expect(validateEnv("dev").invalid).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "DATABASE_URL" }),
    ]));
  });

  it("trims db:push target values consistently with the runtime guard", () => {
    stubBaseEnvironment("dev");
    vi.stubEnv("ALLOW_DB_PUSH", "true");
    vi.stubEnv("DB_PUSH_TARGET_ID", " reviewed-target ");
    vi.stubEnv("DB_PUSH_DATABASE_URL", " postgresql://push:secret@127.0.0.1:5432/disposable ");

    const result = validateEnv("dev");
    expect(result.invalid.map((item) => item.name)).not.toEqual(expect.arrayContaining(["DB_PUSH_TARGET_ID", "DB_PUSH_DATABASE_URL"]));
    expect(result.missing).not.toContain("DB_PUSH_TARGET_ID");
    expect(result.missing).not.toContain("DB_PUSH_DATABASE_URL");
  });

  it("reports malformed target IDs and push URLs as invalid", () => {
    stubBaseEnvironment("dev");
    vi.stubEnv("ALLOW_DB_PUSH", "true");
    vi.stubEnv("DB_PUSH_TARGET_ID", "Not a valid target!");
    vi.stubEnv("DB_PUSH_DATABASE_URL", "not-a-postgres-url");

    const result = validateEnv("dev");
    expect(result.invalid.map((item) => item.name)).toEqual(expect.arrayContaining(["DB_PUSH_TARGET_ID", "DB_PUSH_DATABASE_URL"]));
    expect(result.missing.some((name) => name === "DB_PUSH_TARGET_ID" || name === "DB_PUSH_DATABASE_URL")).toBe(false);
  });

  it("ignores db:push-only variables in migrate mode", () => {
    vi.stubEnv("DATABASE_URL", "postgresql://app:secret@127.0.0.1:5432/oxenn");
    vi.stubEnv("ALLOW_DB_PUSH", "true");
    vi.stubEnv("DB_PUSH_TARGET_ID", "invalid target");
    vi.stubEnv("DB_PUSH_DATABASE_URL", "not-a-postgres-url");

    expect(validateEnv("migrate")).toMatchObject({ mode: "migrate", missing: [], invalid: [], valid: true });
  });
});
