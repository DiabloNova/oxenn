import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAdvisories, decide, isUnpatched, decideMissingPathFallback } from './audit-gate.mjs';

test('unknown severity fails closed', () => {
  assert.equal(decide({ severity: 'unknown', name: 'x', id: 'GHSA-x', patched: '' }).action, 'FAIL');
});

test('npm-bulk parser preserves GHSA and only verified dev-only paths', () => {
  const parsed = parseAdvisories(JSON.stringify({ advisories: {
    'GHSA-vfj7-8cjw-p6xm': {
      github_advisory_id: 'GHSA-vfj7-8cjw-p6xm',
      module_name: 'braces',
      severity: 'high',
      patched_versions: '',
      findings: [{ dev: true, paths: ['eslint>micromatch>braces'] }]
    }
  }}));
  assert.equal(parsed[0].id, 'GHSA-vfj7-8cjw-p6xm');
  assert.deepEqual(parsed[0].paths, [{ path: 'eslint>micromatch>braces', dev: true }]);
  assert.equal(decide(parsed[0], '2026-10-19').action, 'ALLOW');
});

test('allowlist cannot accept missing or production dependency paths', () => {
  const base = { id: 'GHSA-vfj7-8cjw-p6xm', name: 'braces', severity: 'high', patched: '' };
  assert.equal(decide({ ...base, paths: [] }).action, 'FAIL');
  assert.equal(decide({ ...base, paths: [{ path: 'app>braces', dev: false }] }).action, 'FAIL');
  assert.equal(decide({ ...base, paths: [{ path: 'eslint>braces', dev: true }] }, '2026-10-19').action, 'ALLOW');
});

test('a published patched version blocks risk acceptance', () => {
  assert.equal(isUnpatched({ patched: '<= 3.0.3' }), false);
  assert.equal(decide({ id: 'GHSA-vfj7-8cjw-p6xm', name: 'braces', severity: 'high', patched: '<= 3.0.3', paths: [{ path: 'eslint>braces', dev: true }] }, '2026-10-19').action, 'FAIL');
});

test('npm v7 parser fails closed when fixAvailable=false cannot prove no upstream patch exists', () => {
  const parsed = parseAdvisories(JSON.stringify({ vulnerabilities: {
    braces: { severity: 'high', fixAvailable: false, via: [{ id: 'GHSA-vfj7-8cjw-p6xm', severity: 'high', range: '<=3.0.3' }] }
  }}));
  assert.equal(parsed[0].fixKnown, false);
  assert.equal(decide(parsed[0], '2026-10-19').action, 'FAIL');
});


test('missing-path fallback requires current unpatched acceptance and no production exposure', () => {
  const base = { id: 'GHSA-vfj7-8cjw-p6xm', name: 'braces', severity: 'high', patched: '', paths: [] };
  assert.equal(decideMissingPathFallback(base, [], '2026-10-19').action, 'ALLOW');
  assert.equal(decideMissingPathFallback(base, [], '2026-11-20').action, 'FAIL');
  assert.equal(decideMissingPathFallback({ ...base, patched: '<= 3.0.3' }, [], '2026-10-19').action, 'FAIL');
  assert.equal(decideMissingPathFallback({ ...base, patchStatusUnknown: true }, [], '2026-10-19').action, 'FAIL');
  assert.equal(decideMissingPathFallback(base, [{ ...base, severity: 'high' }], '2026-10-19').action, 'FAIL');
});

test('valid dev-only acceptance uses an explicit test date for deterministic expiry behavior', () => {
  const advisory = { id: 'GHSA-vfj7-8cjw-p6xm', name: 'braces', severity: 'high', patched: '', paths: [{ path: 'eslint>braces', dev: true }] };
  assert.equal(decide(advisory, '2026-10-19').action, 'ALLOW');
  assert.equal(decide(advisory, '2026-11-20').action, 'FAIL');
});
