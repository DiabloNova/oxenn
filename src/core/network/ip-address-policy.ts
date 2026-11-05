import { isIP } from "node:net";

function ipv4Number(value: string): number | null {
  const parts = value.split(".");
  if (parts.length === 1 && /^\d+$/.test(value)) {
    const n = Number(value);
    return Number.isSafeInteger(n) && n <= 0xffffffff ? n : null;
  }
  if (parts.length !== 4) {
    return null;
  }
  const nums = parts.map(part => {
    if (!part || !/^(?:0[xX][0-9a-fA-F]+|0[0-7]*|[0-9]+)$/.test(part)) {
      return -1;
    }
    const n = part.toLowerCase().startsWith("0x")
      ? parseInt(part.slice(2), 16)
      : part.length > 1 && part.startsWith("0")
        ? parseInt(part, 8)
        : parseInt(part, 10);
    return n <= 255 ? n : -1;
  });
  return nums.some(n => n < 0)
    ? null
    : nums[0] * 0x1000000 +
        nums[1] * 0x10000 +
        nums[2] * 0x100 +
        nums[3];
}

function inV4(value: number, start: number, bits: number): boolean {
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return ((value >>> 0) & mask) === (start & mask);
}

function parseV6(value: string): bigint | null {
  const input = value.toLowerCase().replace(/^\[|\]$/g, "");
  const halves = input.split("::");
  if (halves.length > 2) {
    return null;
  }
  const left = halves[0] ? halves[0].split(":") : [];
  const right = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const expand = (part: string): number[] => {
    if (part.includes(".")) {
      const n = ipv4Number(part);
      return n === null ? [] : [n >>> 16, n & 0xffff];
    }
    return /^[0-9a-f]{1,4}$/.test(part) ? [parseInt(part, 16)] : [];
  };
  const groups = [...left.flatMap(expand), ...right.flatMap(expand)];
  if (halves.length === 1 && groups.length !== 8) {
    return null;
  }
  if (halves.length === 2 && groups.length >= 8) {
    return null;
  }
  const all =
    halves.length === 2
      ? [
          ...left.flatMap(expand),
          ...Array(8 - groups.length).fill(0),
          ...right.flatMap(expand)
        ]
      : groups;
  return all.reduce(
    (result, group) => (result << BigInt(16)) | BigInt(group),
    BigInt(0)
  );
}

function inV6(value: bigint, prefix: bigint, bits: number): boolean {
  const mask =
    bits === 0
      ? BigInt(0)
      : (BigInt(2) ** BigInt(128) - BigInt(1)) ^
        (BigInt(2) ** BigInt(128 - bits) - BigInt(1));
  return (value & mask) === (prefix & mask);
}

export function isBlockedIp(ip: string): { blocked: boolean; rule?: string } {
  const family = isIP(ip);
  const v4 = ipv4Number(ip);
  if (family === 4 || v4 !== null) {
    const ipv4 = v4 as number;
    const rules: Array<[number, number, string]> = [
      [0, 8, "unspecified"],
      [0x0a000000, 8, "private-rfc1918"],
      [0x64400000, 10, "cgnat"],
      [0x7f000000, 8, "loopback"],
      [0xa9fe0000, 16, "link-local"],
      [0xac100000, 12, "private-rfc1918"],
      [0xc0000000, 24, "special-use"],
      [0xc0000200, 24, "documentation"],
      [0xc0586300, 24, "6to4-relay"],
      [0xc0a80000, 16, "private-rfc1918"],
      [0xc6120000, 15, "benchmark"],
      [0xc6336400, 24, "documentation"],
      [0xcb007100, 24, "documentation"],
      [0xe0000000, 4, "multicast"],
      [0xf0000000, 4, "reserved"],
      [0xffffffff, 32, "limited-broadcast"]
    ];
    const match = rules.find(([start, bits]) => inV4(ipv4, start, bits));
    return match
      ? { blocked: true, rule: match[2] }
      : { blocked: false };
  }
  if (family !== 6) {
    return { blocked: true, rule: "invalid-ip" };
  }
  const value = parseV6(ip);
  if (value === null) {
    return { blocked: true, rule: "invalid-ipv6" };
  }
  if (value === BigInt(0)) {
    return { blocked: true, rule: "unspecified" };
  }
  if (value === BigInt(1)) {
    return { blocked: true, rule: "loopback" };
  }
  const low = value & BigInt(0xffffffff);
  const high96 = value >> BigInt(32);
  if (high96 === BigInt(0xffff) || high96 === BigInt(0)) {
    const mapped = isBlockedIp(
      `${Number((low >> BigInt(24)) & BigInt(255))}.${Number(
        (low >> BigInt(16)) & BigInt(255)
      )}.${Number((low >> BigInt(8)) & BigInt(255))}.${Number(
        low & BigInt(255)
      )}`
    );
    if (mapped.blocked) {
      return { blocked: true, rule: `mapped-${mapped.rule}` };
    }
    if (high96 === BigInt(0xffff)) {
      return { blocked: false };
    }
  }
  const globallyReachableSpecial: Array<[bigint, number]> = [
    [parseV6("2001:1::1") as bigint, 128],
    [parseV6("2001:1::2") as bigint, 128],
    [parseV6("2001:1::3") as bigint, 128],
    [parseV6("2001:3::") as bigint, 32],
    [parseV6("2001:4:112::") as bigint, 48],
    [parseV6("2001:20::") as bigint, 28],
    [parseV6("2001:30::") as bigint, 28]
  ];
  const isAllowedSpecial = globallyReachableSpecial.some(([prefix, bits]) =>
    inV6(value, prefix, bits)
  );
  const rules: Array<[bigint, number, string]> = [
    [parseV6("fc00::") as bigint, 7, "unique-local"],
    [parseV6("fe80::") as bigint, 10, "link-local"],
    [parseV6("ff00::") as bigint, 8, "multicast"],
    [parseV6("2001:db8::") as bigint, 32, "documentation"],
    [parseV6("2002::") as bigint, 16, "6to4-transition"],
    [parseV6("3ffe::") as bigint, 16, "deprecated-6bone"],
    [parseV6("3fff::") as bigint, 20, "documentation"],
    [parseV6("64:ff9b::") as bigint, 96, "nat64"],
    [parseV6("64:ff9b:1::") as bigint, 48, "local-use-nat64"],
    [parseV6("100::") as bigint, 64, "discard-only"]
  ];
  const match = rules.find(([prefix, bits]) => inV6(value, prefix, bits));
  if (match) return { blocked: true, rule: match[2] };
  if (!inV6(value, parseV6("2000::") as bigint, 3)) {
    return { blocked: true, rule: "non-global-unicast" };
  }
  if (inV6(value, parseV6("2001::") as bigint, 23) && !isAllowedSpecial) {
    return { blocked: true, rule: "special-purpose" };
  }
  return { blocked: false };
}


export function isIpLiteral(value: string): boolean {
  return isIP(value) !== 0 || ipv4Number(value) !== null;
}

export function isPublicIpv6Address(value: string): boolean {
  return isIP(value) === 6 && !isBlockedIp(value).blocked;
}

export function isPublicIpAddress(value: string): boolean {
  return isIpLiteral(value) && !isBlockedIp(value).blocked;
}
