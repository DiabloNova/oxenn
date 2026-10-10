import * as fs from 'fs';
import * as path from 'path';

const unitClassifiedDirs = [
  'ai',
  'audit-engine',
  'auth',
  'cost-control',
  'dashboard-services',
  'dashboard-shell',
  'monitoring',
  'observability',
  'workspace'
];

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []) {
  const files = fs.readdirSync(dirPath);
  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });
  return arrayOfFiles;
}

const allServicesFiles = getAllFiles('tests/services');
let migratedCount = 0;

allServicesFiles.forEach(legacy => {
  if (!legacy.endsWith('.test.ts')) return;
  const content = fs.readFileSync(legacy, 'utf-8');

  // Rule: Do not migrate if it imports pg, Pool, DATABASE_URL, or TenantContextManager
  // Wait, I should just use the standard regex filter
  if (content.includes('import { Pool') || content.includes('import { PoolClient') || content.includes('DATABASE_URL') || content.includes('pg') || content.includes('PostgresClient') || content.includes('TenantContextManager') || legacy.includes('cache.test.ts') || legacy.includes('jobs.test.ts') || legacy.includes('site-architecture.test.ts') || legacy.includes('technical-seo-analyzer.test.ts')) {
    return;
  }

  // Already migrated in current patch
  if (legacy.includes('seo-extractor.test.ts') || legacy.includes('graph-extraction.test.ts')) return;

  // Let's migrate this file!
  const dest = legacy.replace('tests/services/', 'tests/unit/services/');
  let newContent = content;

  // Convert node:assert
  newContent = newContent.replace(/import \* as assert from ["'](?:node:)?assert["'];?/g, 'import { describe, it, expect, vi } from "vitest";');

  // replace runTests wrapper with describe/it
  const runRegex = /export async function (run[A-Za-z0-9_]+|test[A-Za-z0-9_]+|verify[A-Za-z0-9_]+)\(\)\s*\{/;
  const match = newContent.match(runRegex);
  if (match) {
    newContent = newContent.replace(match[0], `describe("${path.basename(legacy, '.test.ts')}", () => {\n  it("runs all tests", async () => {`);

    // replace bottom execution
    newContent = newContent.replace(/\/\*(.*?)\*\//g, '');
    newContent = newContent.replace(/\/\/ Support (?:for )?(?:executing )?(?:direct )?(?:execution|execution).*?$/g, '');
    newContent = newContent.replace(/if\s*\(require\.main === module\)[\s\S]*$/g, '');

    // Now we must close the describe and it blocks properly!
    // Often it ends with a console.log or similar, inside a try/catch or just plain function.
    // Let's just find the last closing brace and replace it with `  });\n});`
    const lastBraceIndex = newContent.lastIndexOf('}');
    if (lastBraceIndex !== -1) {
      newContent = newContent.substring(0, lastBraceIndex) + '  });\n});' + newContent.substring(lastBraceIndex + 1);
    }
  }

  // Convert assertions
  newContent = newContent.replace(/assert\.strictEqual\(([^,]+),\s*(.+?)\);/g, 'expect($1).toBe($2);');
  newContent = newContent.replace(/assert\.deepStrictEqual\(([^,]+),\s*(.+?)\);/g, 'expect($1).toEqual($2);');
  newContent = newContent.replace(/assert\.notStrictEqual\(([^,]+),\s*(.+?)\);/g, 'expect($1).not.toBe($2);');
  newContent = newContent.replace(/assert\.ok\(([^,]+)\);/g, 'expect($1).toBeTruthy();');
  newContent = newContent.replace(/assert\.throws\(([\s\S]+?)\);/g, 'expect($1).toThrow();');

  // Fix imports
  newContent = newContent.replace(/\.\.\/\.\.\/\.\.\/src/g, '@');
  newContent = newContent.replace(/\.\.\/\.\.\/src/g, '@');

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, newContent);
  fs.unlinkSync(legacy);
  console.log(`Migrated ${legacy} -> ${dest}`);
  migratedCount++;
});

console.log(`Migrated ${migratedCount} files.`);
