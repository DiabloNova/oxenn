import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Repository Behavioral Pattern Verification", () => {
  it("strictly follows TenantContextManager constraints", async () => {
    const repoFiles = [
      'monitoring-alert-repository.ts',
      'monitoring-config-repository.ts',
      'crawl-snapshot-repository.ts'
    ];

    for (const file of repoFiles) {
      const repoPath = path.resolve(process.cwd(), 'src/features/monitoring/repositories', file);
      const repoText = await fs.promises.readFile(repoPath, 'utf-8');

      expect(repoText.includes('TenantContextManager.getRequiredTenantId()')).toBe(true);
      expect(repoText.includes('TenantContextManager.getContext()')).toBe(true);
    }
  });
});
