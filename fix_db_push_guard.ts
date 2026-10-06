import fs from 'fs';
const file = 'tests/db/scripts/database/db-push-guard.test.ts';
if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf-8');
    content = content.replace(/from "\.\.\/\.\.\/\.\.\/\.\.\/scripts\/database\/db-push-guard"/, 'from "../../../../scripts/database/db-push-guard"');
    fs.writeFileSync(file, content, 'utf-8');
}
