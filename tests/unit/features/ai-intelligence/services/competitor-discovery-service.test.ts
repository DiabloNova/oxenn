import { describe, it, expect } from "vitest";
import { isValidHostname } from "@/features/ai-intelligence/services/competitor-discovery-service";

describe("isValidHostname", () => {
  it("should return true for valid hostnames", () => {
    expect(isValidHostname("example.com")).toBe(true);
    expect(isValidHostname("sub.example.com")).toBe(true);
    expect(isValidHostname("my-brand.com")).toBe(true);
    expect(isValidHostname("a.com")).toBe(true);
    expect(isValidHostname("example.co.uk")).toBe(true);
    const longPart = "a".repeat(61);
    expect(isValidHostname(`${longPart}a.com`)).toBe(true);
  });

  it("should return false for empty or falsy values", () => {
    expect(isValidHostname("")).toBe(false);
    expect(isValidHostname(null as unknown as string)).toBe(false);
    expect(isValidHostname(undefined as unknown as string)).toBe(false);
  });

  it("should return false for missing dots (not a full hostname)", () => {
    expect(isValidHostname("localhost")).toBe(false);
    expect(isValidHostname("example")).toBe(false);
  });

  it("should return false for hostnames with spaces inside parts", () => {
    expect(isValidHostname("example .com")).toBe(false);
    expect(isValidHostname("exam ple.com")).toBe(false);
  });

  it("should handle padding spaces (trims internally)", () => {
    expect(isValidHostname("  example.com  ")).toBe(true);
  });

  it("should return false for invalid characters (slashes, colons, @, etc)", () => {
    expect(isValidHostname("http://example.com")).toBe(false);
    expect(isValidHostname("example.com/path")).toBe(false);
    expect(isValidHostname("example.com:80")).toBe(false);
    expect(isValidHostname("user@example.com")).toBe(false);
  });

  it("should return false if any part exceeds 63 characters", () => {
    const tooLongPart = "a".repeat(64);
    expect(isValidHostname(`${tooLongPart}.com`)).toBe(false);
  });

  it("should return false if parts start or end with a hyphen", () => {
    expect(isValidHostname("-example.com")).toBe(false);
    expect(isValidHostname("example-.com")).toBe(false);
    expect(isValidHostname("example.-com")).toBe(false);
    expect(isValidHostname("example.com-")).toBe(false);
  });

  it("should return false for consecutive dots (empty parts)", () => {
    expect(isValidHostname("example..com")).toBe(false);
    expect(isValidHostname(".example.com")).toBe(false);
    expect(isValidHostname("example.com.")).toBe(false);
  });
});
