import { describe, expect, it } from "vitest";
import fs from "node:fs";

const expectedFindingCount = 97;
const expectedHistoricalFindings = ["086-VER-005.md", "087-VER-006.md"];

const categoryDocuments = [
  {
    file: "01-security-tenant-boundaries.md",
    content: fs.readFileSync("ai_tasks/problem-register/categories/01-security-tenant-boundaries.md", "utf8"),
  },
  {
    file: "02-persistence-schema-contracts.md",
    content: fs.readFileSync("ai_tasks/problem-register/categories/02-persistence-schema-contracts.md", "utf8"),
  },
  {
    file: "03-ai-evidence-provider-integrity.md",
    content: fs.readFileSync("ai_tasks/problem-register/categories/03-ai-evidence-provider-integrity.md", "utf8"),
  },
  {
    file: "04-commercial-catalog-entitlements.md",
    content: fs.readFileSync("ai_tasks/problem-register/categories/04-commercial-catalog-entitlements.md", "utf8"),
  },
  {
    file: "05-workflows-crawl-background-execution.md",
    content: fs.readFileSync("ai_tasks/problem-register/categories/05-workflows-crawl-background-execution.md", "utf8"),
  },
  {
    file: "06-frontend-localization-assets-product-scope.md",
    content: fs.readFileSync("ai_tasks/problem-register/categories/06-frontend-localization-assets-product-scope.md", "utf8"),
  },
  {
    file: "07-ci-testing-developer-tooling.md",
    content: fs.readFileSync("ai_tasks/problem-register/categories/07-ci-testing-developer-tooling.md", "utf8"),
  },
  {
    file: "08-documentation-provenance-governance.md",
    content: fs.readFileSync("ai_tasks/problem-register/categories/08-documentation-provenance-governance.md", "utf8"),
  },
];

const historicalFindings = [
  {
    id: "VER-005",
    filename: "086-VER-005.md",
    content: fs.readFileSync("ai_tasks/problem-register/findings/086-VER-005.md", "utf8"),
  },
  {
    id: "VER-006",
    filename: "087-VER-006.md",
    content: fs.readFileSync("ai_tasks/problem-register/findings/087-VER-006.md", "utf8"),
  },
];

function assertExactlyOnce(actual: string[], expected: string[]): void {
  expect(actual).toHaveLength(expected.length);
  expect(new Set(actual).size).toBe(expected.length);
  expect([...actual].sort()).toEqual([...expected].sort());
}

function findingFiles(): string[] {
  const entries = fs.readdirSync("ai_tasks/problem-register/findings", { withFileTypes: true });
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
      .readdirSync("ai_tasks/problem-register/categories", { withFileTypes: true })
      .filter((entry) => entry.isFile() && /^\d{2}-.+\.md$/.test(entry.name))
      .map((entry) => entry.name)
      .sort();
    const categoryIndex = fs.readFileSync("ai_tasks/problem-register/categories/README.md", "utf8");
    const indexEntries = Array.from(
      categoryIndex.matchAll(/^\d+\.\s+\[[^\]]+\]\(\.\/([^)]+)\)\s+—\s+(\d+)\s+findings\s*$/gm),
      (match) => ({ file: match[1], count: Number(match[2]) }),
    );

    expect(categoryEntries).toHaveLength(8);
    expect(indexEntries.map((entry) => entry.file).sort()).toEqual(categoryEntries);
    expect(indexEntries).toHaveLength(categoryEntries.length);
    expect(categoryIndex).toContain("Total individual records: 97.");
    expect(categoryDocuments.map((document) => document.file).sort()).toEqual(categoryEntries);

    const categoryAssignments: string[] = [];
    for (const document of categoryDocuments) {
      const declaredCount = document.content.match(/^## Findings \((\d+)\)$/m);
      expect(declaredCount).toBeTruthy();

      const links = Array.from(
        document.content.matchAll(/\[[^\]]+\]\(\.\.\/findings\/([^\s)]+)\)/g),
        (match) => match[1],
      );
      const indexCount = indexEntries.find((entry) => entry.file === document.file)?.count;
      expect(Number(declaredCount?.[1])).toBe(links.length);
      expect(indexCount).toBe(links.length);
      categoryAssignments.push(...links);
    }

    assertExactlyOnce(categoryAssignments, files);
  });

  it("places every finding exactly once in an implementation wave or the historical exception section", () => {
    const files = findingFiles();
    const sequence = fs.readFileSync("ai_tasks/problem-register/IMPLEMENTATION_SEQUENCE.md", "utf8");
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

  it("uses only canonical primary statuses for all 97 Finding Ledger rows", () => {
    const progress = fs.readFileSync("ai_tasks/problem-register/REMEDIATION_PROGRESS.md", "utf8");
    const ledgerStart = progress.indexOf("## 4. Finding ledger");
    const ledgerEnd = progress.indexOf("## 5. Execution log", ledgerStart);

    expect(ledgerStart).toBeGreaterThanOrEqual(0);
    expect(ledgerEnd).toBeGreaterThan(ledgerStart);

    const ledgerRows = progress
      .slice(ledgerStart, ledgerEnd)
      .split(/\r?\n/)
      .filter((line) => /^\|\s*\[[A-Z0-9-]+\]\(\.\/findings\//.test(line));
    const allowedStatuses = [
      "Not started",
      "Revalidation in progress",
      "Confirmed",
      "Already fixed",
      "Superseded",
      "Needs decision",
      "Approved",
      "In progress",
      "Blocked",
      "Implemented — verification pending",
      "Verified complete",
      "Integrated — verification pending",
      "Integrated — verification failed",
      "Closed without merge",
      "Deferred / out of scope",
    ];

    expect(ledgerRows).toHaveLength(expectedFindingCount);
    const ids = ledgerRows.map((line) => line.match(/^\|\s*\[([A-Z0-9-]+)\]/)?.[1]);
    expect(new Set(ids).size).toBe(expectedFindingCount);

    for (const line of ledgerRows) {
      const status = line.match(/^\|\s*\[[A-Z0-9-]+\]\([^)]*\)\s*\|[^|]+\|\s*([^|]+)\s*\|/)?.[1]?.trim();
      expect(allowedStatuses).toContain(status);
    }
  });

  it("preserves the Blocked status and DO NOT RUN safety annotation for VER-005 and VER-006", () => {
    const progress = fs.readFileSync("ai_tasks/problem-register/REMEDIATION_PROGRESS.md", "utf8");
    const ledgerStart = progress.indexOf("## 4. Finding ledger");
    const ledgerEnd = progress.indexOf("## 5. Execution log", ledgerStart);

    expect(ledgerStart).toBeGreaterThanOrEqual(0);
    expect(ledgerEnd).toBeGreaterThan(ledgerStart);
    const ledger = progress.slice(ledgerStart, ledgerEnd);

    for (const finding of historicalFindings) {
      const rows = ledger
        .split(/\r?\n/)
        .filter((line) =>
          line.startsWith("| [" + finding.id + "](./findings/" + finding.filename + ")"),
        );
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatch(/\|\s*Blocked\s*\|/);
      expect(rows[0]).toContain("DO NOT RUN");
      expect(finding.filename).toBe(expectedHistoricalFindings[finding.id === "VER-005" ? 0 : 1]);
      expect(finding.content).toContain("HISTORICAL_ONLY / DO NOT RUN");
      expect(finding.content).toMatch(/Do not (?:execute|run)/i);
    }
  });
});
