import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DevEmailSender, ProductionEmailSender } from "@/services/email/adapters";

describe("DevEmailSender", () => {
  it("redacts recipient addresses and authentication tokens from development logs", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    try {
      const rawToken = "sensitive-authentication-token";
      await new DevEmailSender().send({
        to: "private.user@example.com",
        templateId: "password_reset",
        params: { url: "https://oxenn.ir/en/forgot-password?token=" + rawToken },
      });
      const output = JSON.stringify(logSpy.mock.calls);
      expect(output).not.toContain("private.user@example.com");
      expect(output).not.toContain(rawToken);
      expect(output).toContain("REDACTED");
    } finally {
      logSpy.mockRestore();
    }
  });
});

describe("ProductionEmailSender", () => {
  beforeEach(() => {
    vi.stubEnv("EMAIL_PROVIDER", "maileroo");
    vi.stubEnv("MAILEROO_SENDING_KEY", "test-sending-key");
    vi.stubEnv("EMAIL_FROM_ADDRESS", "noreply@oxenn.ir");
    vi.stubEnv("EMAIL_FROM_NAME", "Oxenn");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("requires the Maileroo provider and a sending key", () => {
    vi.stubEnv("EMAIL_PROVIDER", "unsupported");
    expect(() => new ProductionEmailSender()).toThrow('EMAIL_PROVIDER must be set to "maileroo"');

    vi.stubEnv("EMAIL_PROVIDER", "maileroo");
    vi.stubEnv("MAILEROO_SENDING_KEY", "");
    expect(() => new ProductionEmailSender()).toThrow("MAILEROO_SENDING_KEY is not configured");

    vi.stubEnv("MAILEROO_SENDING_KEY", "test-sending-key");
    vi.stubEnv("EMAIL_FROM_ADDRESS", "not-an-email");
    expect(() => new ProductionEmailSender()).toThrow("EMAIL_FROM_ADDRESS must be a valid email address");
  });

  it("sends a verification message through Maileroo without enabling tracking", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { reference_id: "mail-ref-1" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const sender = new ProductionEmailSender();
    await sender.send({
      to: "user@example.com",
      templateId: "verification",
      params: { url: "https://oxenn.ir/en/verify-email?token=opaque-token" },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://smtp.maileroo.com/api/v2/emails");
    expect(request.method).toBe("POST");
    expect(new Headers(request.headers).get("X-Api-Key")).toBe("test-sending-key");

    const body = JSON.parse(String(request.body));
    expect(body.from).toEqual({ address: "noreply@oxenn.ir", display_name: "Oxenn" });
    expect(body.to).toEqual({ address: "user@example.com" });
    expect(body.subject).toBe("Verify your Oxenn email address");
    expect(body.html).toContain("Verify your email address");
    expect(body.plain).toContain("https://oxenn.ir/en/verify-email?token=opaque-token");
    expect(body.tracking).toBe(false);
  });

  it("escapes workspace names before adding them to HTML", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await new ProductionEmailSender().send({
      to: "user@example.com",
      templateId: "workspace_invitation",
      params: {
        url: "https://oxenn.ir/invitations/opaque-token",
        workspaceName: '<img src=x onerror="alert(1)">',
      },
    });

    const body = JSON.parse(String((fetchMock.mock.calls[0] as [string, RequestInit])[1].body));
    expect(body.html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(body.html).not.toContain('<img src=x onerror="alert(1)">');
  });

  it("fails closed when Maileroo rejects the request", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: false }), { status: 401 })),
    );

    await expect(
      new ProductionEmailSender().send({
        to: "user@example.com",
        templateId: "password_reset",
        params: { url: "https://oxenn.ir/en/forgot-password?token=opaque-token" },
      }),
    ).rejects.toThrow("Maileroo email delivery failed (HTTP 401)");
  });

  it("rejects email actions without a URL", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      new ProductionEmailSender().send({
        to: "user@example.com",
        templateId: "verification",
        params: {},
      }),
    ).rejects.toThrow("Email action URL is required");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects non-HTTP(S) action URLs before contacting Maileroo", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      new ProductionEmailSender().send({
        to: "user@example.com",
        templateId: "verification",
        params: { url: "javascript:alert(1)" },
      }),
    ).rejects.toThrow("Email action URL must use HTTP or HTTPS");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
