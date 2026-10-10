import { describe, it, expect } from "vitest";
import { inngest } from "@/lib/inngest/client";
import { helloWorld, scheduledMonitoring } from "@/lib/inngest/functions";
import { GET, POST, PUT } from "@/app/api/inngest/route";

describe("Inngest integration tests", () => {
  it("1. Verify Inngest client is initialized", () => {
    expect(inngest).toBeTruthy();
    expect(inngest.id).toBe("seorchable");
  });

  it("2. Verify functions exist", () => {
    expect(helloWorld).toBeTruthy();
    expect(helloWorld.name).toBe("hello-world");
    expect(scheduledMonitoring).toBeTruthy();
    expect(scheduledMonitoring.name).toBe("scheduled-monitoring-placeholder");
  });

  it("3. Verify Route handlers exist", () => {
    expect(GET).toBeTruthy();
    expect(POST).toBeTruthy();
    expect(PUT).toBeTruthy();
  });
});
