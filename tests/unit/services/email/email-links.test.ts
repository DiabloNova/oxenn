import { afterEach, describe, expect, it, vi } from "vitest";
import { buildEmailActionUrl } from "@/services/email/links";

describe("email action URL builder", () => {
  const previousAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  afterEach(() => {
    vi.unstubAllEnvs();
    if (previousAppUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = previousAppUrl;
  });

  it("builds a tokenized link on the configured application origin", () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.NEXT_PUBLIC_APP_URL = "https://app.oxenn.example";
    expect(buildEmailActionUrl("/en/verify-email", "abc 123"))
      .toBe("https://app.oxenn.example/en/verify-email?token=abc+123");
  });

  it("requires an absolute HTTPS origin in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.NEXT_PUBLIC_APP_URL = "http://app.oxenn.example";
    expect(() => buildEmailActionUrl("/en/verify-email", "token"))
      .toThrow("NEXT_PUBLIC_APP_URL must be a safe HTTPS origin in production");
    delete process.env.NEXT_PUBLIC_APP_URL;
    expect(() => buildEmailActionUrl("/en/verify-email", "token"))
      .toThrow("NEXT_PUBLIC_APP_URL is required for production email delivery");
  });

  it("rejects a path-bearing application URL because configuration must be an origin", () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.NEXT_PUBLIC_APP_URL = "https://app.oxenn.example/nested";
    expect(() => buildEmailActionUrl("/en/verify-email", "token"))
      .toThrow("NEXT_PUBLIC_APP_URL must be a safe HTTPS origin in production");
  });

  it("rejects external and protocol-relative action paths", () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.NEXT_PUBLIC_APP_URL = "https://app.oxenn.example";
    expect(() => buildEmailActionUrl("//attacker.example/path", "token"))
      .toThrow("Email action path must be origin-relative");
    expect(() => buildEmailActionUrl("https://attacker.example/path", "token"))
      .toThrow("Email action path must be origin-relative");
  });
});
