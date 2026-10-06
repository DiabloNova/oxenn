import fs from 'fs';
import path from 'path';

function getFiles(dir: string, fileList: string[] = []) {
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

  // Replace ../../../src with @/
  content = content.replace(/from\s+["'](?:\.\.\/)+src\/(.*?)["']/g, 'from "@/$1"');
  // Handle ../../../scripts (if any)
  content = content.replace(/from\s+["'](?:\.\.\/)+scripts\/(.*?)["']/g, 'from "../../../../scripts/$1"');
  // Dynamic imports
  content = content.replace(/import\((['"])(?:\.\.\/)+src\/(.*?)\1\)/g, 'import("@/$2")');

  if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf-8');
      console.log(`Fixed imports in ${file}`);
  }
}
