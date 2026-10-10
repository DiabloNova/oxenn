import * as fs from 'fs';
import * as path from 'path';

function migrate(legacy, dest) {
  let content = fs.readFileSync(legacy, 'utf-8');
  content = content.replace(/import \* as assert from "assert";/g, 'import { describe, it, expect, vi } from "vitest";\nimport * as assert from "assert";');
  const match = content.match(/export async function [A-Za-z0-9_]+\(\)\s*\{/);
  if (match) {
    content = content.replace(match[0], `describe("${path.basename(legacy, '.test.ts')}", () => {\n  it("runs all tests", async () => {`);
    const lastBraceIndex = content.lastIndexOf('}');
    if (lastBraceIndex !== -1) {
      content = content.substring(0, lastBraceIndex) + '  });\n});' + content.substring(lastBraceIndex + 1);
    }
  }
  content = content.replace(/\/\/ Execute directly[\s\S]*$/g, '');
  content = content.replace(/if\s*\(require\.main === module\)[\s\S]*$/g, '');
  content = content.replace(/\.\.\/\.\.\/\.\.\/src/g, '@');
  content = content.replace(/assert\.strictEqual\(([^,]+),\s*(.+?)\);/g, 'expect($1).toBe($2);');
  content = content.replace(/assert\.throws\(([\s\S]+?)\);/g, 'expect($1).toThrow();');
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, content);
  fs.unlinkSync(legacy);
}

migrate('tests/services/monitoring/repository.test.ts', 'tests/unit/services/monitoring/repository.test.ts');
migrate('tests/services/monitoring/tenant-isolation.test.ts', 'tests/unit/services/monitoring/tenant-isolation.test.ts');
fs.unlinkSync('tests/services/monitoring/run-all.ts');
