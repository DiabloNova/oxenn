import { describe, expect, it } from "vitest";
import { getSafeLocaleReturnTo } from "@/services/auth/return-to";

describe("getSafeLocaleReturnTo", () => {
  it("accepts locale roots and nested same-locale destinations with query state", () => {
    expect(getSafeLocaleReturnTo("/en", "en")).toBe("/en");
    expect(getSafeLocaleReturnTo("/en/pricing?plan=Professional", "en")).toBe("/en/pricing?plan=Professional");
    expect(getSafeLocaleReturnTo("/fa/dashboard/profile", "fa")).toBe("/fa/dashboard/profile");
  });

  it.each([
    "//evil.example/path",
    "https://evil.example/path",
    "/fa/dashboard",
    "/en/../admin",
    "/en/%2e%2e/admin",
    "/en%2f%2fevil.example",
    "/en%5cevil",
    "/en\\\\evil",
    "",
  ])("rejects unsafe destination %s", (destination) => {
    expect(getSafeLocaleReturnTo(destination, "en")).toBeNull();
  });
});
