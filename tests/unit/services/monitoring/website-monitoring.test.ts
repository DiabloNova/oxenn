import { describe, it, expect } from 'vitest';
import { ChangeDetectionService } from "@/features/monitoring/services/change-detection-service";
import { RegressionDetectionService } from "@/features/monitoring/services/regression-detection-service";
import { CrawlSnapshot } from "@/features/monitoring/domain/types";

describe('Website Monitoring Foundation', () => {
  const changeService = new ChangeDetectionService();
  const regressionService = new RegressionDetectionService();

  const prevSnapshot: CrawlSnapshot = {
    id: "prev-1",
    organizationId: "org-1",
    monitoringConfigId: "cfg-1",
    crawlJobId: "job-1",
    capturedAt: new Date().toISOString(),
    contentHash: "",
    extractedContent: "hello",
    snapshotMetadata: {}
  };

  const sameSnapshot: CrawlSnapshot = {
    ...prevSnapshot,
    id: "same-1",
    extractedContent: "hello"
  };

  const helloWorldSnapshot: CrawlSnapshot = {
    ...prevSnapshot,
    id: "diff-1",
    extractedContent: "hello world"
  };

  const emptySnapshot: CrawlSnapshot = {
    ...prevSnapshot,
    id: "empty-1",
    extractedContent: null
  };

  const sameExtractedSnapshotWithDifferentReference: CrawlSnapshot = {
    ...prevSnapshot,
    id: "diff-ref-1",
    extractedContent: "hello"
  };

  describe('Change Detection', () => {
    it('detects content changes correctly across snapshot edge cases', () => {
      expect(changeService.detectChanges(prevSnapshot, sameSnapshot).hasChanges).toBe(false);
      expect(changeService.detectChanges(prevSnapshot, helloWorldSnapshot).hasChanges).toBe(true);
      expect(changeService.detectChanges(null, prevSnapshot).hasChanges).toBe(false);
      expect(changeService.detectChanges(prevSnapshot, emptySnapshot).hasChanges).toBe(true);
      expect(changeService.detectChanges(prevSnapshot, sameExtractedSnapshotWithDifferentReference).hasChanges).toBe(false);
    });
  });

  describe('Regression Detection', () => {
    it('detects regressions based on content reduction thresholds', () => {
      const tenPagesOneHundredUnitsContent = "u".repeat(100);
      const prevRegressionSnapshot: CrawlSnapshot = {
        ...prevSnapshot,
        extractedContent: tenPagesOneHundredUnitsContent
      };

      const currentRegressionSnapshotNoChanges: CrawlSnapshot = {
        ...prevSnapshot,
        extractedContent: tenPagesOneHundredUnitsContent
      };

      const changeNoRegression = changeService.detectChanges(prevRegressionSnapshot, currentRegressionSnapshotNoChanges);
      const reg1 = regressionService.detectRegression(changeNoRegression);
      expect(reg1.isRegression).toBe(false);

      const currentRegressionSnapshotUnderLimit: CrawlSnapshot = {
        ...prevSnapshot,
        extractedContent: "u".repeat(59)
      };

      const changeUnderLimit = changeService.detectChanges(prevRegressionSnapshot, currentRegressionSnapshotUnderLimit);
      const reg2 = regressionService.detectRegression(changeUnderLimit);
      expect(reg2.isRegression).toBe(true);
      expect(reg2.severity).toBe("high");

      const currentRegressionSnapshotBoundaryLimit: CrawlSnapshot = {
        ...prevSnapshot,
        extractedContent: "u".repeat(60)
      };

      const changeBoundaryLimit = changeService.detectChanges(prevRegressionSnapshot, currentRegressionSnapshotBoundaryLimit);
      const reg3 = regressionService.detectRegression(changeBoundaryLimit);
      expect(reg3.isRegression).toBe(true);
      expect(reg3.severity).toBe("high");

      const currentRegressionSnapshotAboveLimit: CrawlSnapshot = {
        ...prevSnapshot,
        extractedContent: "u".repeat(61)
      };

      const changeAboveLimit = changeService.detectChanges(prevRegressionSnapshot, currentRegressionSnapshotAboveLimit);
      const reg4 = regressionService.detectRegression(changeAboveLimit);
      expect(reg4.isRegression).toBe(false);
    });
  });
});
