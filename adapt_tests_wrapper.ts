import fs from 'fs';
import path from 'path';

function getFiles(dir: string, fileList: string[] = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      getFiles(path.join(dir, file), fileList);
    } else if (file.endsWith('.test.ts') || file.endsWith('.test.tsx') || file.endsWith('suite.ts') || file.endsWith('run-all.ts')) {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

const allFiles = getFiles('tests');

for (const file of allFiles) {
  let content = fs.readFileSync(file, 'utf-8');
  let originalContent = content;

  // Delete run-all.ts
  if (file.endsWith('run-all.ts')) {
      fs.unlinkSync(file);
      console.log(`Deleted ${file}`);
      continue;
  }

  // Handle suite.ts specially
  if (file.endsWith('isolation.test.ts')) {
      // Find `async function runTest()` and remove the self-executing `runTest().catch(...)`
      content = content.replace(/runTest\(\)\.catch\([\s\S]*?\);/, '');
      if (!content.includes('import { it, describe } from "vitest"')) {
         content = `import { it, describe } from "vitest";\n` + content;
      }
      if (!content.includes('describe("Isolation Suite"')) {
         content += `\ndescribe("Isolation Suite", () => {\n  it("runs the suite", async () => {\n    await runTest();\n  }, 30000);\n});\n`;
      }
      fs.writeFileSync(file, content, 'utf-8');
      console.log(`Wrapped isolation.test.ts in ${file}`);
      continue;
  }

  const matches = [...content.matchAll(/export (?:async )?function (test[a-zA-Z0-9_]+)\s*\(/g)];
  if (matches.length > 0 && !content.includes('describe("Standalone Test Runner"')) {
      let append = `\nimport { describe, it } from "vitest";\ndescribe("Standalone Test Runner", () => {\n`;
      for (const m of matches) {
          const fnName = m[1];
          append += `  it("runs ${fnName}", async () => {\n    await ${fnName}();\n  });\n`;
      }
      append += `});\n`;

      // Remove any node execution logic
      content = content.replace(/if\s*\(require\.main\s*===\s*module\)\s*{[\s\S]*?}/, '');
      for (const m of matches) {
           const fnName = m[1];
           const re = new RegExp(`${fnName}\\(\\)\\.catch\\([^\\)]+\\);?`, 'g');
           content = content.replace(re, '');
      }

      content += append;
  }

  if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf-8');
      console.log(`Adapted wrappers for ${file}`);
  }
}
