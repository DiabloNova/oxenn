#!/usr/bin/env node
/**
 * Oxenn dependency audit gate — remediation kit v1.1
 * Implements the Phase 1 acceptance policy defined in PHASE1-DECISIONS.md
 * (Rulings C and D). Replaces the raw "pnpm audit — zero high" gate.
 *
 * Policy:
 *   FAIL  — any CRITICAL or HIGH advisory that HAS a published fix.
 *   ALLOW — CRITICAL/HIGH advisories with NO published fix, only while listed
 *           in ALLOWLIST below with an unexpired review date (risk acceptance).
 *   WARN  — moderate / low advisories (printed, non-blocking).
 *
 * The script never hides advisory output: every advisory stays visible in
 * every run; the allowlist only controls the exit code. Do NOT use
 * pnpm.auditConfig.ignoreGhsas — that suppresses advisories silently.
 *
 * Usage:
 *   node scripts/audit-gate.mjs                     # runs `pnpm audit --json`
 *   pnpm audit --json | node scripts/audit-gate.mjs --stdin
 *
 * Exit codes: 0 = pass, 1 = policy violation, 2 = could not parse audit output.
 */

import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

/**
 * Risk-accepted advisories (no upstream fix available).
 * Each entry MUST have: package, reason, expiry (YYYY-MM-DD), exitCriteria.
 * `id` (GHSA) should be filled in from `pnpm audit --json` output; matching requires BOTH the exact package name and exact GHSA ID. Once braces ships a fixed release, that advisory leaves the
 * unpatched path and re-enters the normal FAIL path until the override/lockfile
 * is bumped, so the allowlist cannot mask a real fix.
 */
const ALLOWLIST = [
  {
    id: 'GHSA-vfj7-8cjw-p6xm', // CVE-2026-93687 (micromatch/braces#73)
    package: 'braces',
    reason:
      'CVE-2026-93687 (HIGH ~8.7) — no patched braces release exists (latest 3.0.3 is the affected version; upstream tracking micromatch/braces#73). Reached only through dev/build tooling (micromatch / chokidar@3 path), not through the Next.js runtime bundle. Formally risk-accepted per Phase 1 Decision Memo, Ruling C.',
    expiry: '2026-11-19', // 30-day review from memo date 2026-10-19
    exitCriteria:
      'Remove this entry and bump the resolution as soon as (a) a patched braces release is published, or (b) the consuming dev-only chain is upgraded off braces (e.g. chokidar@3 -> chokidar@4, which dropped its glob deps).',
  },
];

const SEV_RANK = { critical: 0, high: 1, moderate: 2, low: 3 };
const UNPATCHED = '<0.0.0';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

function fetchAuditJson(args = []) {
  if (process.argv.includes('--stdin')) return readStdin();
  try {
    return execFileSync('pnpm', ['audit', ...args, '--json'], {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (err) {
    // `pnpm audit` exits non-zero when advisories exist; stdout still holds the JSON.
    if (typeof err.stdout === 'string' && err.stdout.trim().startsWith('{')) {
      return err.stdout;
    }
    console.error('audit-gate: could not run `pnpm audit --json`.');
    console.error(String((err && err.stderr) || err.message || err));
    return null;
  }
}

function parseAdvisories(raw) {
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }

  // npm-bulk style (used by pnpm): { advisories: { "<ghsa>": {...} } }
  if (data && data.advisories && typeof data.advisories === 'object' && !Array.isArray(data.advisories)) {
    return Object.entries(data.advisories).map(([key, a]) => ({
      id: (a && a.github_advisory_id) || (a && a.id) || key,
      name: (a && a.module_name) || 'unknown',
      severity: String((a && a.severity) || 'unknown').toLowerCase(),
      patched: typeof (a && a.patched_versions) === 'string' ? a.patched_versions.trim() : '',
      paths: Array.isArray(a?.findings) ? a.findings.flatMap((f) => (Array.isArray(f.paths) ? f.paths : []).map((p) => ({ path: String(p), dev: f.dev === true }))) : [],
    }));
  }

  // npm v7+ style: { vulnerabilities: { "<name>": { severity, via, fixAvailable } } }
  if (data && data.vulnerabilities && typeof data.vulnerabilities === 'object') {
    const out = [];
    for (const [name, v] of Object.entries(data.vulnerabilities)) {
      const via = Array.isArray(v && v.via) ? v.via : [];
      const sources = via.filter((x) => x && typeof x === 'object');
      if (sources.length === 0) continue; // transitive marker entry only
      for (const src of sources) {
        out.push({
          id: src.id || 'unknown',
          name,
          severity: String(src.severity || v.severity || 'unknown').toLowerCase(),
          patched: v.fixAvailable === false ? UNPATCHED : '',
          fixKnown: v.fixAvailable === true || (v.fixAvailable !== null && typeof v.fixAvailable === 'object'),
          // false or missing is not proof that upstream has no fixed release.
          patchStatusUnknown: v.fixAvailable === false || v.fixAvailable == null,
          // npm v7 `via` strings are dependency/advisory markers, not verified paths.
          // Do not invent a production path from them; use the production tree fallback.
          paths: [],
        });
      }
    }
    return out;
  }

  return null;
}

function isUnpatched(a) {
  if (typeof a.fixKnown === 'boolean') return !a.fixKnown;
  return a.patched === UNPATCHED || a.patched === '';
}

function decide(a, today = todayIso()) {
  const rank = SEV_RANK[a.severity];
  if (rank === undefined) return { action: 'FAIL', note: 'unknown severity — cannot safely classify advisory' };
  if (rank >= SEV_RANK.moderate) return { action: 'WARN', note: `${a.severity} — recorded, non-blocking` };

  // critical / high
  if (a.patchStatusUnknown) return { action: 'FAIL', note: 'fixAvailable=false does not prove no upstream patch exists; verify advisory version data' };
  if (!isUnpatched(a)) return { action: 'FAIL', note: 'fix available — apply via override or upgrade' };

  const entry = ALLOWLIST.find((e) => e.package === a.name && e.id === a.id);
  if (!entry) return { action: 'FAIL', note: 'no published fix and not risk-accepted' };
  if (!Array.isArray(a.paths) || a.paths.length === 0 || a.paths.some((p) => !p || p.dev !== true)) {
    return { action: 'FAIL', note: 'risk acceptance is restricted to verified dev-only paths; dependency path is missing or includes production' };
  }
  if (entry.expiry < today) {
    return { action: 'FAIL', note: `risk acceptance expired ${entry.expiry} — review required (Ruling C/D)` };
  }
  return { action: 'ALLOW', note: `risk-accepted until ${entry.expiry}` };
}

function collectDependencyPaths(tree) {
  if (!Array.isArray(tree) || tree.length === 0 || !tree[0] || typeof tree[0] !== 'object') {
    throw new Error('pnpm production dependency tree has an unexpected JSON shape');
  }
  const paths = new Map();
  const visit = (node, parentPath, ancestors) => {
    if (!node || typeof node !== 'object') return;
    for (const field of ['dependencies', 'optionalDependencies']) {
      const dependencies = node[field];
      if (!dependencies || typeof dependencies !== 'object' || Array.isArray(dependencies)) continue;
      for (const [name, child] of Object.entries(dependencies)) {
        const path = [...parentPath, name];
        if (!paths.has(name)) paths.set(name, []);
        paths.get(name).push(path.join(' > '));
        if (!ancestors.has(child)) {
          const nextAncestors = new Set(ancestors);
          nextAncestors.add(child);
          visit(child, path, nextAncestors);
        }
      }
    }
  };
  for (const root of tree) {
    const rootName = typeof root.name === 'string' ? root.name : 'root';
    visit(root, [rootName], new Set([root]));
  }
  return paths;
}

function pad(s, n) {
  s = String(s);
  return s.length >= n ? s : s + ' '.repeat(n - s.length);
}

// A missing-path fallback is permitted only when that is the sole reason
// decide() failed, the advisory is still unpatched, the acceptance is current,
// and the production dependency tree confirms no production exposure.
function decideMissingPathFallback(a, productionDependencyPaths, today = todayIso()) {
  const decision = decide(a, today);
  const entry = ALLOWLIST.find((e) => e.package === a.name && e.id === a.id);
  const missingPathOnly = decision.action === 'FAIL'
    && decision.note === 'risk acceptance is restricted to verified dev-only paths; dependency path is missing or includes production'
    && entry
    && isUnpatched(a)
    && !a.patchStatusUnknown
    && entry.expiry >= today
    && Array.isArray(a.paths)
    && a.paths.length === 0
    && productionDependencyPaths instanceof Map
    && !productionDependencyPaths.has(a.name);
  if (!missingPathOnly) return decision;
  return { action: 'ALLOW', note: `risk-accepted until ${entry.expiry}; package absent from the verified production dependency tree` };
}

export { parseAdvisories, decide, isUnpatched, decideMissingPathFallback, collectDependencyPaths };

export async function main() {
  const raw = await fetchAuditJson();
  if (raw == null) process.exit(2);

  const advisories = parseAdvisories(raw);
  if (advisories === null) {
    console.error('audit-gate: unrecognized `pnpm audit --json` shape (expected `advisories` or `vulnerabilities`).');
    process.exit(2);
  }

  // Audit JSON can omit paths or report dev-only optional-peer noise as production.
  // Verify the actual production graph directly, retaining optionalDependencies;
  // `--no-optional` is deliberately NOT used because it would hide real runtime edges.
  let productionDependencyPaths;
  try {
    const productionTreeRaw = execFileSync('pnpm', ['list', '--prod', '--depth', 'Infinity', '--json'], {
      encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
    });
    productionDependencyPaths = collectDependencyPaths(JSON.parse(productionTreeRaw));
  } catch (err) {
    console.error('audit-gate: could not verify the production dependency tree; refusing to apply the missing-path exception.');
    console.error(String((err && err.stderr) || err.message || err));
    process.exit(2);
  }
  for (const a of advisories) {
    if (a.name === 'braces') {
      console.error(`audit-gate: braces audit path evidence: ${JSON.stringify(a.paths)}`);
      console.error(`audit-gate: braces production dependency paths: ${JSON.stringify(productionDependencyPaths.get(a.name) || [])}`);
    }
  }
  const rows = advisories.map((a) => ({
    a,
    d: decideMissingPathFallback(a, productionDependencyPaths),
  }));
  const rankOf = (r) => (SEV_RANK[r.a.severity] !== undefined ? SEV_RANK[r.a.severity] : 9);
  rows.sort((x, y) => rankOf(x) - rankOf(y) || x.a.name.localeCompare(y.a.name));

  console.log('');
  console.log('Oxenn audit gate v1.1 — FAIL: critical/high with a fix; ALLOW: documented unpatched only; WARN: moderate/low.');
  console.log('');
  console.log(`${pad('SEV', 9)}${pad('PACKAGE', 20)}${pad('ADVISORY', 26)}${pad('FIX', 5)}${pad('DECISION', 9)}NOTE`);
  console.log('-'.repeat(112));
  for (const { a, d } of rows) {
    console.log(
      `${pad(a.severity.toUpperCase(), 9)}${pad(a.name, 20)}${pad(a.id, 26)}${pad(isUnpatched(a) ? 'no' : 'yes', 5)}${pad(d.action, 9)}${d.note}`
    );
  }
  console.log('-'.repeat(112));

  const fails = rows.filter((r) => r.d.action === 'FAIL');
  const allows = rows.filter((r) => r.d.action === 'ALLOW');
  const warns = rows.filter((r) => r.d.action === 'WARN');
  console.log(
    `total: ${rows.length} | fail: ${fails.length} | risk-accepted: ${allows.length} | warn (non-blocking): ${warns.length}`
  );

  for (const entry of ALLOWLIST) {
    const daysLeft = Math.round((new Date(entry.expiry) - new Date(todayIso())) / 86400000);
    console.log(`allowlist: ${entry.package} — review ${entry.expiry} (${daysLeft} day(s) left)`);
  }

  if (fails.length > 0) {
    console.log('');
    console.log('VERDICT: FAIL — resolve the FAIL rows (apply fixes or add a documented, expiring risk acceptance).');
    process.exit(1);
  }
  console.log('');
  console.log('VERDICT: PASS');
  process.exit(0);
}

function isDirectRun() {
  try {
    return process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false;
  } catch {
    return false;
  }
}

if (isDirectRun()) {
  main().catch((err) => {
    console.error(err);
    process.exit(2);
  });
}
