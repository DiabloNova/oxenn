import assert from "node:assert/strict";
import { ChangeDetectionService } from "../../../src/features/monitoring/services/change-detection-service";
import { RegressionDetectionService } from "../../../src/features/monitoring/services/regression-detection-service";
import { CrawlSnapshot } from "../../../src/features/monitoring/domain/types";

export async function testWebsiteMonitoringFoundation() {
  console.log("Running Website Monitoring Foundation Tests...");

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

  const sameSnapshot: CrawlSnapshot = {
    ...prevSnapshot,
    id: "same-1",
    extractedContent: "hello" // Case 1: Current is "hello"
  };

  const helloWorldSnapshot: CrawlSnapshot = {
    ...prevSnapshot,
    id: "diff-1",
    extractedContent: "hello world" // Case 2: Current is "hello world"
  };

  const emptySnapshot: CrawlSnapshot = {
    ...prevSnapshot,
    id: "empty-1",
    extractedContent: null // Case 4: Previous is "hello", current is null
  };

  // Case 5: Testing deterministic hashing equality
  const sameExtractedSnapshotWithDifferentReference: CrawlSnapshot = {
    ...prevSnapshot,
    id: "diff-ref-1",
    extractedContent: "hello"
  };

  // ----------------------------------------------------
  // Change Detection Verify Cases
  // ----------------------------------------------------

  // Case 1: Identical content shouldn't trigger changes
  const case1 = changeService.detectChanges(prevSnapshot, sameSnapshot);
  assert.equal(case1.hasChanges, false);

  // Case 2: Changed content should trigger changes
  const case2 = changeService.detectChanges(prevSnapshot, helloWorldSnapshot);
  assert.equal(case2.hasChanges, true);

  // Case 3: Initial snapshot doesn't generate false Regression/Change boolean
  const case3 = changeService.detectChanges(null, prevSnapshot);
  assert.equal(case3.hasChanges, false);

  // Case 4: Complete content deletion
  const case4 = changeService.detectChanges(prevSnapshot, emptySnapshot);
  assert.equal(case4.hasChanges, true);

  // Case 5: Hash equivalence checks
  const case5 = changeService.detectChanges(prevSnapshot, sameExtractedSnapshotWithDifferentReference);
  assert.equal(case5.hasChanges, false);

  // ----------------------------------------------------
  // Regression Detection Verify Cases
  // ----------------------------------------------------
  const tenPagesOneHundredUnitsContent = "u".repeat(100);
  const prevRegressionSnapshot: CrawlSnapshot = {
    ...prevSnapshot,
    extractedContent: tenPagesOneHundredUnitsContent
  };

  const currentRegressionSnapshotNoChanges: CrawlSnapshot = {
    ...prevSnapshot,
    extractedContent: tenPagesOneHundredUnitsContent // 100 units
  };

  // No Regression: 100 -> 100 units
  const changeNoRegression = changeService.detectChanges(prevRegressionSnapshot, currentRegressionSnapshotNoChanges);
  const reg1 = regressionService.detectRegression(changeNoRegression);
  assert.equal(reg1.isRegression, false);

  // Regression: 100 units -> 59 units (41% reduction, threshold is 40%)
  const currentRegressionSnapshotUnderLimit: CrawlSnapshot = {
    ...prevSnapshot,
    extractedContent: "u".repeat(59)
  };

  const changeUnderLimit = changeService.detectChanges(prevRegressionSnapshot, currentRegressionSnapshotUnderLimit);
  const reg2 = regressionService.detectRegression(changeUnderLimit);
  assert.equal(reg2.isRegression, true);
  assert.equal(reg2.severity, "high");

  // Boundary Condition Regression: Exactly equal to the threshold (60 units = exactly 40% reduction of 100)
  const currentRegressionSnapshotBoundaryLimit: CrawlSnapshot = {
    ...prevSnapshot,
    extractedContent: "u".repeat(60)
  };

  const changeBoundaryLimit = changeService.detectChanges(prevRegressionSnapshot, currentRegressionSnapshotBoundaryLimit);
  const reg3 = regressionService.detectRegression(changeBoundaryLimit);
  assert.equal(reg3.isRegression, true);
  assert.equal(reg3.severity, "high");

  // Above Limit: 61 units (39% reduction, threshold is 40%) -> No Regression
  const currentRegressionSnapshotAboveLimit: CrawlSnapshot = {
    ...prevSnapshot,
    extractedContent: "u".repeat(61)
  };

  const changeAboveLimit = changeService.detectChanges(prevRegressionSnapshot, currentRegressionSnapshotAboveLimit);
  const reg4 = regressionService.detectRegression(changeAboveLimit);
  assert.equal(reg4.isRegression, false);

  console.log("✅ Website Monitoring Foundation Tests Passed!");
}
