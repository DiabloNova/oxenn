import * as fs from 'fs';
const unit = 'tests/unit/services/dashboard-services.test.ts';
let content = fs.readFileSync(unit, 'utf-8');
content = content.replace('function runTests() {', 'describe("dashboard-services", () => { it("runs all tests", () => {');
const lastBraceIndex = content.lastIndexOf('}');
if (lastBraceIndex !== -1) {
  content = content.substring(0, lastBraceIndex) + '  });\n});' + content.substring(lastBraceIndex + 1);
}
fs.writeFileSync(unit, content);
