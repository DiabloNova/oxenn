import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseAdvisories,
  decide,
  isUnpatched,
  decideMissingPathFallback,
  collectDependencyPaths,
} from './audit-gate.mjs';

const DATE = '2026-10-19';
const VALID_ID = 'GHSA-vfj7-8cjw-p6xm';
const accepted = (overrides = {}) => ({
  id: VALID_ID,
  name: 'braces',
  severity: 'high',
  patched: '<0.0.0',
  patchStatus: 'unpatched',
  patchStatusUnknown: false,
  paths: [{ path: 'eslint>micromatch>braces', dev: true }],
  ...overrides,
});

test('unknown or malformed severity fails closed', () => {
  for (const severity of ['unknown', '', 'critical-ish', 17, null]) {
    assert.equal(decide(accepted({ severity })).action, 'FAIL', String(severity));
  }
});

test('info severity is a non-blocking warning', () => {
  assert.equal(decide(accepted({ severity: 'info' })).action, 'WARN');
});

test('npm-bulk parser preserves GHSA, patch status, and verified dev-only paths', () => {
  const parsed = parseAdvisories(JSON.stringify({ advisories: {
    [VALID_ID]: {
      github_advisory_id: VALID_ID,
      module_name: 'braces',
      severity: 'high',
      patched_versions: '<0.0.0',
      findings: [{ dev: true, paths: ['eslint>micromatch>braces'] }],
    },
  } }));
  assert.equal(parsed[0].id, VALID_ID);
  assert.equal(parsed[0].patchStatus, 'unpatched');
  assert.equal(parsed[0].patchStatusUnknown, false);
  assert.deepEqual(parsed[0].paths, [{ path: 'eslint>micromatch>braces', dev: true }]);
  assert.equal(decide(parsed[0], DATE).action, 'ALLOW');
});

test('npm-bulk missing, empty, and malformed patched_versions are unknown and fail closed', () => {
  for (const patched_versions of [undefined, '', null, 12, {}, []]) {
    const advisory = { module_name: 'braces', severity: 'high' };
    if (patched_versions !== undefined) advisory.patched_versions = patched_versions;
    const parsed = parseAdvisories(JSON.stringify({ advisories: { [VALID_ID]: advisory } }));
    assert.equal(parsed[0].patchStatus, 'unknown');
    assert.equal(parsed[0].patchStatusUnknown, true);
    assert.equal(isUnpatched(parsed[0]), false);
    assert.equal(decide(parsed[0], DATE).action, 'FAIL', JSON.stringify(patched_versions));
    assert.equal(decideMissingPathFallback(parsed[0], new Map(), DATE).action, 'FAIL');
  }
});

test('only the recognized npm-bulk <0.0.0 marker proves unpatched status', () => {
  assert.equal(isUnpatched({ patched: '<0.0.0', patchStatus: 'unpatched' }), true);
  for (const patched of ['', '<= 3.0.3', '>= 0', 'unknown', null, 5]) {
    assert.equal(isUnpatched({ patched }), false, String(patched));
  }
});

test('allowlist requires exact package and exact GHSA ID', () => {
  assert.equal(decide(accepted(), DATE).action, 'ALLOW');
  assert.equal(decide(accepted({ name: 'braces-compat' }), DATE).action, 'FAIL');
  assert.equal(decide(accepted({ id: 'GHSA-similar-but-wrong' }), DATE).action, 'FAIL');
  assert.equal(decide(accepted({ name: 'micromatch' }), DATE).action, 'FAIL');
});

test('allowlist rejects missing paths and any production path', () => {
  assert.equal(decide(accepted({ paths: [] }), DATE).action, 'FAIL');
  assert.equal(decide(accepted({ paths: [{ path: 'app>braces', dev: false }] }), DATE).action, 'FAIL');
  assert.equal(decide(accepted({
    paths: [
      { path: 'eslint>braces', dev: true },
      { path: 'app>braces', dev: false },
    ],
  }), DATE).action, 'FAIL');
  assert.equal(decide(accepted(), DATE).action, 'ALLOW');
});

test('a published patched version blocks risk acceptance', () => {
  const parsed = parseAdvisories(JSON.stringify({ advisories: {
    [VALID_ID]: {
      github_advisory_id: VALID_ID,
      module_name: 'braces',
      severity: 'high',
      patched_versions: '<= 3.0.3',
      findings: [{ dev: true, paths: ['eslint>braces'] }],
    },
  } }));
  assert.equal(parsed[0].patchStatus, 'patched');
  assert.equal(isUnpatched(parsed[0]), false);
  assert.equal(decide(parsed[0], DATE).action, 'FAIL');
});

test('npm v7 fixAvailable=false is unknown, not proof that upstream has no fix', () => {
  const parsed = parseAdvisories(JSON.stringify({ vulnerabilities: {
    braces: {
      severity: 'high',
      fixAvailable: false,
      via: [{ id: VALID_ID, severity: 'high', range: '<=3.0.3' }],
    },
  } }));
  assert.equal(parsed[0].patchStatus, 'unknown');
  assert.equal(parsed[0].patchStatusUnknown, true);
  assert.deepEqual(parsed[0].paths, [], 'via metadata is not verified dependency-path evidence');
  assert.equal(decide(parsed[0], DATE).action, 'FAIL');
  assert.equal(decideMissingPathFallback(parsed[0], new Map(), DATE).action, 'FAIL');
});

test('npm v7 true and object-valued fixAvailable indicate a fix and fail', () => {
  for (const fixAvailable of [true, { name: 'braces', version: '4.0.0', isSemVerMajor: true }]) {
    const parsed = parseAdvisories(JSON.stringify({ vulnerabilities: {
      braces: {
        severity: 'high',
        fixAvailable,
        via: [{ id: VALID_ID, severity: 'high', range: '<=3.0.3' }],
      },
    } }));
    assert.equal(parsed[0].patchStatus, 'patched');
    assert.equal(parsed[0].patchStatusUnknown, false);
    assert.equal(isUnpatched(parsed[0]), false);
    assert.equal(decide(parsed[0], DATE).action, 'FAIL');
    assert.equal(decideMissingPathFallback(parsed[0], new Map(), DATE).action, 'FAIL');
  }
});

test('npm v7 missing or malformed fixAvailable is unknown and fails closed', () => {
  for (const extra of [{}, { fixAvailable: null }, { fixAvailable: 'false' }, { fixAvailable: 0 }]) {
    const parsed = parseAdvisories(JSON.stringify({ vulnerabilities: {
      braces: {
        severity: 'high',
        ...extra,
        via: [{ id: VALID_ID, severity: 'high' }],
      },
    } }));
    assert.equal(parsed[0].patchStatus, 'unknown');
    assert.equal(parsed[0].patchStatusUnknown, true);
    assert.equal(decide(parsed[0], DATE).action, 'FAIL');
  }
});

test('missing-path fallback only applies to the exact accepted unpatched advisory', () => {
  const base = accepted({ paths: [] });
  assert.equal(decideMissingPathFallback(base, new Map(), DATE).action, 'ALLOW');
  assert.equal(decideMissingPathFallback(base, new Map([['braces', ['oxenn > braces']]]), DATE).action, 'FAIL');
  assert.equal(decideMissingPathFallback(base, new Map([['braces', ['oxenn > next > braces']]]), DATE).action, 'FAIL');
  assert.equal(decideMissingPathFallback(base, new Map(), '2026-11-20').action, 'FAIL');
  assert.equal(decideMissingPathFallback(accepted({ patched: '<= 3.0.3', patchStatus: 'patched', paths: [] }), new Map(), DATE).action, 'FAIL');
  assert.equal(decideMissingPathFallback(accepted({ patchStatus: 'unknown', patchStatusUnknown: true, paths: [] }), new Map(), DATE).action, 'FAIL');
  assert.equal(decideMissingPathFallback(accepted({ name: 'other-package', paths: [] }), new Map(), DATE).action, 'FAIL');
  assert.equal(decideMissingPathFallback(accepted({ id: 'GHSA-wrong', paths: [] }), new Map(), DATE).action, 'FAIL');
});

test('risk acceptance expiry is deterministic', () => {
  assert.equal(decide(accepted(), '2026-10-19').action, 'ALLOW');
  assert.equal(decide(accepted(), '2026-11-19').action, 'ALLOW');
  assert.equal(decide(accepted(), '2026-11-20').action, 'FAIL');
});

test('production dependency collection includes runtime and optional dependencies, resolves aliases, and rejects malformed trees', () => {
  const names = collectDependencyPaths([{
    name: 'oxenn',
    dependencies: {
      next: { dependencies: { 'runtime-transitive': {} } },
      'braces-compat': { name: 'braces-compat', from: 'npm:braces@3.0.3' },
    },
    optionalDependencies: { 'platform-runtime': {} },
    devDependencies: { eslint: { dependencies: { braces: {} } } },
  }]);
  assert.equal(names.has('next'), true);
  assert.equal(names.has('runtime-transitive'), true);
  assert.equal(names.has('platform-runtime'), true);
  assert.equal(names.has('braces-compat'), true);
  assert.equal(names.has('braces'), true, 'aliased install must be indexed by real package name');
  assert.equal(names.get('braces')[0], 'oxenn > braces-compat(braces)');
  assert.equal(names.has('eslint'), false);
  assert.throws(() => collectDependencyPaths([]), /unexpected JSON shape/);
});
