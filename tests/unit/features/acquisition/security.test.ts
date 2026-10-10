import { describe, it, expect } from "vitest";
import { isBlockedIp, resolveAndValidateHost } from "@/features/acquisition/infrastructure/security/ssrf-guard";

describe("testSecurity", () => {
  it("runs", async () => {
  for (const ip of [
    "0.0.0.0", "10.1.1.1", "100.64.0.1", "127.0.0.1",
    "169.254.169.254", "172.16.0.1", "192.0.2.1", "192.168.1.1",
    "198.18.0.1", "224.0.0.1", "240.0.0.1", "::", "::1",
    "fc00::1", "fe80::1", "ff02::1", "ff00::1", "2001:db8::1",
    "::ffff:127.0.0.1", "::127.0.0.1", "2130706433", "0177.0.0.1"
  ]) {
    expect(isBlockedIp(ip).blocked).toEqual(true, ip);
  }
  expect(isBlockedIp("2606:4700::1111").blocked).toEqual(false);
  expect(isBlockedIp("::ffff:8.8.8.8").blocked).toEqual(false);
  expect(isBlockedIp("::").rule).toEqual("unspecified");
  expect(isBlockedIp("::1").rule).toEqual("loopback");
  expect(isBlockedIp("::ffff:127.0.0.1").rule).toEqual("mapped-loopback");
  expect(isBlockedIp("64:ff9b::7f00:1").rule).toEqual("nat64");
  for (const host of [
    "localhost", "a.localhost", "x.internal", "x.lan",
    "x.home.arpa", "singlelabel"
  ]) {
    const result = await resolveAndValidateHost(host, async () => []);
    expect(result.ok).toEqual(false, host);
  }
  const dnsFailure = await resolveAndValidateHost(
    "missing.example",
    async () => {
      throw new Error("NXDOMAIN");
    }
  );
  expect(dnsFailure.ok).toEqual(false);
  if (!dnsFailure.ok) {
    expect(dnsFailure.error.code).toEqual("DNS_FAILURE");
  }
  const mixed = await resolveAndValidateHost(
    "mixed.example",
    async () => [
      { address: "2606:4700::1111", family: 6 },
      { address: "10.0.0.1", family: 4 }
    ]
  );
  expect(mixed.ok).toEqual(false);
  });
});
