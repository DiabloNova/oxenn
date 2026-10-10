import { describe, it, expect } from "vitest";
import { CrawlError } from "@/features/acquisition/domain/errors";
import {
  assertTransition,
  canTransition,
  retryFailedJob
} from "@/features/acquisition/domain/job-state-machine";

describe("testStateMachine", () => {
  it("runs", () => {
  const statuses = [
    "PENDING", "QUEUED", "RUNNING", "SUCCEEDED",
    "PARTIAL", "FAILED", "CANCELLED"
  ] as const;
  for (const status of statuses) {
    for (const target of statuses) {
      if (!canTransition(status, target)) {
        expect(() => assertTransition(status, target)).toThrow(expect.objectContaining({ code: "POLICY_VIOLATION" }));
      }
    }
  }
  expect(retryFailedJob("FAILED")).toEqual("QUEUED");
  expect(() => retryFailedJob("CANCELLED")).toThrow();
  assertTransition("RUNNING", "QUEUED");
  });
});
