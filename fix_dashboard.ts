import * as fs from 'fs';
const unit = 'tests/unit/services/dashboard-services.test.ts';
let content = fs.readFileSync(unit, 'utf-8');
content = content.replace(/try \{\n  runTests\(\);\n\} catch \(error: unknown\) \{[\s\S]*\}\n/g, '');
fs.writeFileSync(unit, content);
