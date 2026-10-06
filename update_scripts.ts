import fs from 'fs';
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

pkg.scripts['test'] = "vitest run --project=unit --project=ui";
pkg.scripts['test:unit'] = "vitest run --project=unit";
pkg.scripts['test:db'] = "vitest run --project=db";
pkg.scripts['test:ui'] = "vitest run --project=ui";
pkg.scripts['test:all'] = "vitest run";

delete pkg.scripts['test:acquisition'];
delete pkg.scripts['test:isolation'];

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
