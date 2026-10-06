import fs from 'fs';
const files = [
  'tests/db/features/public-api/public-api.test.ts',
  'tests/db/core/tenant-context/system-mode-bypass.test.ts',
  'tests/db/core/tenant-context/privileged-paths.test.ts',
  'tests/unit/authorization-lifecycle.test.ts' // note it wasn't moved before but should be in db since it uses DB
];
for (const file of files) {
  if (fs.existsSync(file)) {
      let content = fs.readFileSync(file, 'utf-8');
      content = content.replace(/if\s*\(!process\.env\.DATABASE_URL\)\s*{\s*process\.env\.DATABASE_URL\s*=\s*[^;]+;\s*}/, '');
      content = content.replace(/if\s*\(!process\.env\.DATABASE_URL\)\s*{\s*describe\.skip\(/g, 'if (!process.env.DATABASE_URL) { throw new Error("DATABASE_URL required"); }\ndescribe(');
      fs.writeFileSync(file, content, 'utf-8');
  }
}
// move tests/unit/authorization-lifecycle.test.ts to tests/db
if (fs.existsSync('tests/unit/authorization-lifecycle.test.ts')) {
   fs.renameSync('tests/unit/authorization-lifecycle.test.ts', 'tests/db/authorization-lifecycle.test.ts');
   console.log('Moved authorization-lifecycle.test.ts to tests/db/');
}
// also user-id-format needs db
if (fs.existsSync('tests/unit/auth/user-id-format.test.ts')) {
   fs.mkdirSync('tests/db/auth', { recursive: true });
   fs.renameSync('tests/unit/auth/user-id-format.test.ts', 'tests/db/auth/user-id-format.test.ts');
   console.log('Moved user-id-format.test.ts to tests/db/auth/');
}
// also admin/security
if (fs.existsSync('tests/unit/features/admin/security.test.ts')) {
   fs.renameSync('tests/unit/features/admin/security.test.ts', 'tests/db/features/admin/security.test.ts');
}
// also ai-intelligence/application
if (fs.existsSync('tests/unit/features/ai-intelligence/application.test.ts')) {
   fs.renameSync('tests/unit/features/ai-intelligence/application.test.ts', 'tests/db/features/ai-intelligence/application.test.ts');
}
