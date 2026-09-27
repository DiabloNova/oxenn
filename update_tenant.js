/* eslint-disable */
const fs = require('fs');
const file = 'src/core/database/tenant-context/index.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace('"kg_alignments"\n]);', '"kg_alignments",\n  "monitoring_configs",\n  "crawl_snapshots",\n  "monitoring_alerts"\n]);');
fs.writeFileSync(file, code);
