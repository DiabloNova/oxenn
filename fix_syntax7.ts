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

  // Expected `,` or `)` but found `}`
  // E.g. process.exit(1\n}
  content = content.replace(/process\.exit\(1\n\}/g, 'process.exit(1);\n}');

  // Unexpected token )
  // E.g. ) \n } \n import { describe
  content = content.replace(/\n\)\s*;\s*\n/g, '\n');
  content = content.replace(/\n\)\s*\n/g, '\n');

  if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf-8');
      console.log(`Fixed syntax in ${file}`);
  }
}
