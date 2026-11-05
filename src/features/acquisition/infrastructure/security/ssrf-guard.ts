import { isIP } from "node:net";
import { Resolver as DnsResolver } from "node:dns/promises";
import { CrawlError } from "../../domain/errors";
import { isBlockedIp, isIpLiteral } from "@/core/network/ip-address-policy";

export type HostValidationResult =
  | { ok: true; ips: string[] }
  | { ok: false; error: CrawlError; rule: string };
export type Resolver = (
  host: string,
  signal?: AbortSignal
) => Promise<Array<{ address: string; family: number }>>;

const defaultResolver: Resolver = async (host, signal) => {
  const resolver = new DnsResolver();
  const cancel = () => resolver.cancel();
  if (signal?.aborted) throw new Error("DNS lookup cancelled");
  signal?.addEventListener("abort", cancel, { once: true });
  try {
    const results = await Promise.allSettled([
      resolver.resolve4(host).then(addresses =>
        addresses.map(address => ({ address, family: 4 }))
      ),
      resolver.resolve6(host).then(addresses =>
        addresses.map(address => ({ address, family: 6 }))
      )
    ]);
    if (signal?.aborted) throw new Error("DNS lookup cancelled");
    const fatalFailure = results.find(result =>
      result.status === "rejected" &&
      (result.reason as { code?: string } | undefined)?.code !== "ENODATA"
    );
    if (fatalFailure?.status === "rejected") throw fatalFailure.reason;
    const records = results.flatMap(result =>
      result.status === "fulfilled" ? result.value : []
    );
    if (!records.length) {
      const noData = results.find(result => result.status === "rejected");
      throw noData?.status === "rejected" ? noData.reason : new Error("empty DNS result");
    }
    return records;
  } finally {
    signal?.removeEventListener("abort", cancel);
  }
};

function blockedHostname(host: string): string | undefined {
  const value = host.toLowerCase().replace(/\.$/, "");
  if (value === "localhost" || value.endsWith(".localhost")) {
    return "localhost";
  }
  if (
    value.endsWith(".local") ||
    value.endsWith(".internal") ||
    value.endsWith(".lan") ||
    value.endsWith(".home.arpa")
  ) {
    return "internal-hostname";
  }
  if (!value.includes(".") && isIP(value) === 0) {
    return "single-label-hostname";
  }
  return undefined;
}

export async function resolveAndValidateHost(
  host: string,
  resolver: Resolver = defaultResolver,
  signal?: AbortSignal
): Promise<HostValidationResult> {
  const hostname = host.replace(/^\[|\]$/g, "");
  const nameRule = blockedHostname(hostname);
  if (nameRule) {
    return {
      ok: false,
      rule: nameRule,
      error: new CrawlError("SSRF_BLOCKED", "Host rejected by SSRF policy", {
        rule: nameRule
      })
    };
  }
  const literal = isBlockedIp(hostname);
  if (isIpLiteral(hostname)) {
    return literal.blocked
      ? {
          ok: false,
          rule: literal.rule ?? "blocked-ip",
          error: new CrawlError("SSRF_BLOCKED", "IP rejected by SSRF policy", {
            rule: literal.rule ?? "blocked-ip"
          })
        }
      : { ok: true, ips: [hostname] };
  }
  try {
    const records = await resolver(hostname, signal);
    if (signal?.aborted) throw new Error("DNS lookup cancelled");
    if (!records.length) {
      throw new Error("empty DNS result");
    }
    const blocked = records
      .map(record => isBlockedIp(record.address))
      .find(result => result.blocked);
    if (blocked) {
      return {
        ok: false,
        rule: blocked.rule ?? "blocked-resolved-ip",
        error: new CrawlError(
          "SSRF_BLOCKED",
          "Resolved address rejected by SSRF policy",
          { rule: blocked.rule ?? "blocked-resolved-ip" }
        )
      };
    }
    return { ok: true, ips: records.map(record => record.address) };
  } catch (cause) {
    if (signal?.aborted) throw cause;
    return {
      ok: false,
      rule: "dns-failure",
      error: new CrawlError(
        "DNS_FAILURE",
        "Host resolution failed",
        {},
        { cause }
      )
    };
  }
}
