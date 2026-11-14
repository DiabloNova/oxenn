import { describe, expect, it } from "vitest";
import { assertNoForwardedDbPushArguments } from "../../../../scripts/database/db-push";

describe("db:push wrapper argument contract", () => {
  it("accepts the fixed invocation without forwarded arguments", () => {
    expect(() => assertNoForwardedDbPushArguments([])).not.toThrow();
  });

  it.each([["--config=drizzle.config.ts"], ["--url=postgresql://other/db"], ["--force"]])(
    "rejects caller-controlled Drizzle arguments: %j",
    (argument) => {
      expect(() => assertNoForwardedDbPushArguments([argument])).toThrow(/does not accept forwarded arguments/);
    },
  );
});
