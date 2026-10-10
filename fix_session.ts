import * as fs from 'fs';
const unit = 'tests/unit/services/auth/session.test.ts';
let content = fs.readFileSync(unit, 'utf-8');
content = content.replace(/}\n\n  }\);\n}\);\n/g, '  });\n});\n');
fs.writeFileSync(unit, content);
