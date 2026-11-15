import { describe, expect, it } from "vitest";
import { generateUserId } from "../../../src/services/auth/user-id";

describe("User ID Generation", () => {
  it("generates IDs in the expected usr-UUID format", () => {
    expect(generateUserId()).toMatch(/^usr-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it("generates unique IDs across 10,000 iterations", () => {
    const ids = new Set<string>();
    for (let index = 0; index < 10_000; index += 1) ids.add(generateUserId());
    expect(ids.size).toBe(10_000);
  });
});
