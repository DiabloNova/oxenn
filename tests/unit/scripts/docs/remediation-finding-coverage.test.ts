import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const findingsDirectory = path.join(root, "ai_tasks/problem-register/findings");
const categoriesDirectory = path.join(root, "ai_tasks/problem-register/categories");
const expectedFindingCount = 97;
const expectedHistoricalFindings = ["086-VER-005.md", "087-VER-006.md"];

function readRepositoryFile(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assertExactlyOnce(actual: string[], expected: string[]): void {
  expect(actual).toHaveLength(expected.length);
  expect(new Set(actual).size).toBe(expected.length);
  expect([...actual].sort()).toEqual([...expected].sort());
}

function findingFiles(): string[] {
  const entries = fs.readdirSync(findingsDirectory, { withFileTypes: true });
  const invalidEntries = entries
    .filter((entry) => !entry.isFile() || !/^\d{3}-[A-Z0-9-]+\.md$/.test(entry.name))
    .map((entry) => entry.name);

  expect(invalidEntries).toEqual([]);

  const files = entries.map((entry) => entry.name).sort();
  expect(files).toHaveLength(expectedFindingCount);
  expect(files.map((file) => Number(file.slice(0, 3)))).toEqual(
    Array.from({ length: expectedFindingCount }, (_, index) => index + 1),
  );
  return files;
}

describe("remediation finding coverage contract", () => {
  it("keeps exactly 97 numbered, unique finding records", () => {
    const files = findingFiles();
    expect(new Set(files).size).toBe(expectedFindingCount);
  });

  it("assigns every finding to exactly one primary category and keeps declared counts aligned", () => {
    const files = findingFiles();
    const categoryEntries = fs
      .readdirSync(categoriesDirectory, { withFileTypes: true })
      .filter((entry) => entry.isFile() && /^\d{2}-.+\.md$/.test(entry.name))
      .map((entry) => entry.name)
      .sort();
    const categoryIndex = readRepositoryFile("ai_tasks/problem-register/categories/README.md");
    const indexEntries = Array.from(
      categoryIndex.matchAll(/^\d+\.\s+\[[^\]]+\]\(\.\/([^)]+)\)\s+—\s+(\d+)\s+findings\s*$/gm),
      (match) => ({ file: match[1], count: Number(match[2]) }),
    );

    expect(categoryEntries).toHaveLength(8);
    expect(indexEntries.map((entry) => entry.file).sort()).toEqual(categoryEntries);
    expect(indexEntries).toHaveLength(categoryEntries.length);
    expect(categoryIndex).toContain("Total individual records: 97.");

    const categoryAssignments: string[] = [];
    for (const categoryFile of categoryEntries) {
      const content = readRepositoryFile(`ai_tasks/problem-register/categories/${categoryFile}`);
      const declaredCount = content.match(/^## Findings \((\d+)\)$/m);
      expect(declaredCount).toBeTruthy();

      const links = Array.from(
        content.matchAll(/\[[^\]]+\]\(\.\.\/findings\/([^\s)]+)\)/g),
        (match) => match[1],
      );
      const indexCount = indexEntries.find((entry) => entry.file === categoryFile)?.count;
      expect(Number(declaredCount?.[1])).toBe(links.length);
      expect(indexCount).toBe(links.length);
      categoryAssignments.push(...links);
    }

    assertExactlyOnce(categoryAssignments, files);
  });

  it("places every finding exactly once in an implementation wave or the historical exception section", () => {
    const files = findingFiles();
    const sequence = readRepositoryFile("ai_tasks/problem-register/IMPLEMENTATION_SEQUENCE.md");
    const waveHeadings: string[] = [];
    const waveAssignments: Array<{ file: string; line: string }> = [];
    const historicalAssignments: Array<{ file: string; line: string }> = [];
    let placement: "wave" | "historical" | null = null;

    for (const line of sequence.split(/\r?\n/)) {
      const waveHeading = line.match(/^### (Wave \d+)\s+—/);
      if (waveHeading) {
        placement = "wave";
        waveHeadings.push(waveHeading[1]);
        continue;
      }
      if (/^## Historical \/ Non-executable Findings\s*$/.test(line)) {
        placement = "historical";
        continue;
      }
      if (/^##\s/.test(line)) {
        placement = null;
        continue;
      }

      if (!placement) continue;
      const link = line.match(/^\s*-\s+\[([^\]]+)\]\(\.\/findings\/([^\s)]+)\)(.*)$/);
      if (!link) continue;

      const assignment = { file: link[2], line };
      if (placement === "wave") waveAssignments.push(assignment);
      else historicalAssignments.push(assignment);
    }

    expect(waveHeadings).toHaveLength(7);
    expect(waveAssignments).toHaveLength(95);
    expect(historicalAssignments.map((item) => item.file).sort()).toEqual(expectedHistoricalFindings);
    assertExactlyOnce(
      [...waveAssignments, ...historicalAssignments].map((item) => item.file),
      files,
    );

    for (const assignment of historicalAssignments) {
      expect(assignment.line).toContain("Blocked");
      expect(assignment.line).toContain("HISTORICAL_ONLY");
      expect(assignment.line).toContain("DO NOT RUN");
      expect(assignment.line).toMatch(/Do not (?:execute|run)/i);
    }
  });

  it("preserves the Blocked status and DO NOT RUN safety annotation for VER-005 and VER-006", () => {
    const progress = readRepositoryFile("ai_tasks/problem-register/REMEDIATION_PROGRESS.md");

    for (const [findingId, filename] of [
      ["VER-005", expectedHistoricalFindings[0]],
      ["VER-006", expectedHistoricalFindings[1]],
    ]) {
      const rows = progress.split(/\r?\n/).filter((line) => line.includes(`[${findingId}]`));
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatch(/\|\s*Blocked\s*\|/);
      expect(rows[0]).toContain("DO NOT RUN");

      const finding = fs.readFileSync(path.join(findingsDirectory, filename), "utf8");
      expect(finding).toContain("HISTORICAL_ONLY / DO NOT RUN");
      expect(finding).toMatch(/Do not (?:execute|run)/i);
    }
  });
});
