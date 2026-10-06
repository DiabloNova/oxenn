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
  if (file.startsWith('tests/unit/') || file.startsWith('tests/db/') || file.startsWith('tests/ui/') || file.startsWith('tests/setup/')) continue;

  const content = fs.readFileSync(file, 'utf-8');
  let isDb = content.includes('DATABASE_URL') || content.includes('mock-pool-client') || content.includes('postgres-integration') || content.includes('drizzle') || content.includes('database');
  let isReact = content.includes('from "react"') || content.includes('from "@testing-library/react"');

  if (file.includes('admin/run-all.ts') || file.includes('ai-intelligence/run-all.ts')) isDb = true;

  let destDir = '';
  if (isDb) {
     destDir = 'tests/db/' + path.dirname(file).substring('tests/'.length);
  } else if (isReact || file.endsWith('.tsx')) {
     destDir = 'tests/ui/' + path.dirname(file).substring('tests/'.length);
  } else {
     destDir = 'tests/unit/' + path.dirname(file).substring('tests/'.length);
  }

  fs.mkdirSync(destDir, { recursive: true });
  let destPath = path.join(destDir, path.basename(file));

  // Special case for isolation suite
  if (file === 'tests/isolation/suite.ts') {
     destPath = path.join(destDir, 'isolation.test.ts');
  }

  fs.renameSync(file, destPath);
  console.log(`Moved ${file} to ${destPath}`);
}
