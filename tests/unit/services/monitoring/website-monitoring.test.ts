import { describe, it, expect } from "vitest";
import { ChangeDetectionService } from "../../../../src/features/monitoring/services/change-detection-service";
import { RegressionDetectionService } from "../../../../src/features/monitoring/services/regression-detection-service";
import { CrawlSnapshot } from "../../../../src/features/monitoring/domain/types";

describe("Website Monitoring Foundation Tests", () => {
  const changeService = new ChangeDetectionService();
  const regressionService = new RegressionDetectionService();

  const prevSnapshot: CrawlSnapshot = {
    id: "prev-1",
    organizationId: "org-1",
    monitoringConfigId: "cfg-1",
    crawlJobId: "job-1",
    capturedAt: new Date().toISOString(),
    contentHash: "",
    extractedContent: "hello", // Case 1: Base "hello"
    snapshotMetadata: {}
  };

  describe("Change Detection Verification", () => {
    it("Identical content shouldn't trigger changes", () => {
      const sameSnapshot: CrawlSnapshot = {
        ...prevSnapshot,
        id: "same-1",
        extractedContent: "hello" // Case 1: Current is "hello"
      };
      const result = changeService.detectChanges(prevSnapshot, sameSnapshot);
      expect(result.hasChanges).toBe(false);
    });

    it("Changed content should trigger changes", () => {
      const helloWorldSnapshot: CrawlSnapshot = {
        ...prevSnapshot,
        id: "diff-1",
        extractedContent: "hello world" // Case 2: Current is "hello world"
      };
      const result = changeService.detectChanges(prevSnapshot, helloWorldSnapshot);
      expect(result.hasChanges).toBe(true);
    });

    it("Initial snapshot doesn't generate false Regression/Change boolean", () => {
      const result = changeService.detectChanges(null, prevSnapshot);
      expect(result.hasChanges).toBe(false);
    });

    it("Complete content deletion", () => {
      const emptySnapshot: CrawlSnapshot = {
        ...prevSnapshot,
        id: "empty-1",
        extractedContent: null // Case 4: Previous is "hello", current is null
      };
      const result = changeService.detectChanges(prevSnapshot, emptySnapshot);
      expect(result.hasChanges).toBe(true);
    });

    it("Hash equivalence checks with different references", () => {
      const sameExtractedSnapshotWithDifferentReference: CrawlSnapshot = {
        ...prevSnapshot,
        id: "diff-ref-1",
        extractedContent: "hello"
      };
      const result = changeService.detectChanges(prevSnapshot, sameExtractedSnapshotWithDifferentReference);
      expect(result.hasChanges).toBe(false);
    });
  });

  describe("Regression Detection Verification", () => {
    const tenPagesOneHundredUnitsContent = "u".repeat(100);
    const prevRegressionSnapshot: CrawlSnapshot = {
      ...prevSnapshot,
      extractedContent: tenPagesOneHundredUnitsContent
    };

    it("No Regression: 100 -> 100 units", () => {
      const currentRegressionSnapshotNoChanges: CrawlSnapshot = {
        ...prevSnapshot,
        extractedContent: tenPagesOneHundredUnitsContent // 100 units
      };
      const changeNoRegression = changeService.detectChanges(prevRegressionSnapshot, currentRegressionSnapshotNoChanges);
      const result = regressionService.detectRegression(changeNoRegression);
      expect(result.isRegression).toBe(false);
    });

    it("Regression: 100 units -> 59 units (41% reduction, threshold is 40%)", () => {
      const currentRegressionSnapshotUnderLimit: CrawlSnapshot = {
        ...prevSnapshot,
        extractedContent: "u".repeat(59)
      };
      const changeUnderLimit = changeService.detectChanges(prevRegressionSnapshot, currentRegressionSnapshotUnderLimit);
      const result = regressionService.detectRegression(changeUnderLimit);
      expect(result.isRegression).toBe(true);
      expect(result.severity).toBe("high");
    });

    it("Boundary Condition Regression: Exactly equal to the threshold (60 units = exactly 40% reduction of 100)", () => {
      const currentRegressionSnapshotBoundaryLimit: CrawlSnapshot = {
        ...prevSnapshot,
        extractedContent: "u".repeat(60)
      };
      const changeBoundaryLimit = changeService.detectChanges(prevRegressionSnapshot, currentRegressionSnapshotBoundaryLimit);
      const result = regressionService.detectRegression(changeBoundaryLimit);
      expect(result.isRegression).toBe(true);
      expect(result.severity).toBe("high");
    });

    it("Above Limit: 61 units (39% reduction, threshold is 40%) -> No Regression", () => {
      const currentRegressionSnapshotAboveLimit: CrawlSnapshot = {
        ...prevSnapshot,
        extractedContent: "u".repeat(61)
      };
      const changeAboveLimit = changeService.detectChanges(prevRegressionSnapshot, currentRegressionSnapshotAboveLimit);
      const result = regressionService.detectRegression(changeAboveLimit);
      expect(result.isRegression).toBe(false);
    });
  });
});
