# Phase 1 dependency remediation — explicit exceptions and evidence

**Date:** 2026-10-19  
**Branch:** `fix/audit-phase1-lockgen`  
**Scope:** dependency manifest, lockfile, and a narrowly scoped third-party dependency patch only. No application implementation or database schema/migration changes are included.

## Dependency changes applied

- `next` and `eslint-config-next` moved to `16.4.2`.
- `dompurify` moved to `^3.4.17`; removed the deprecated `@types/dompurify` stub.
- `@types/node` moved to `^22`; `drizzle-kit` moved to `^0.31.11`.
- AI SDK packages aligned to `ai@^7.0.143` and `@ai-sdk/google@^4.0.99`, as specified in the audit's dependency matrix.
- Build and docs scripts use pnpm's locked execution path.
- pnpm's explicit build allowlist is `esbuild`, `sharp`, `protobufjs`, and `unrs-resolver`.
- Overrides resolve to one version each in CI: `undici@7.30.1`, `axios@1.20.0`, `js-yaml@4.3.2`, and `@grpc/grpc-js@1.14.6`.
- Additional narrowly scoped overrides resolve `brace-expansion` to patched versions `1.1.21`, `2.1.7`, and `5.0.12`, and `source-map-js@1.2.2`.

## ESLint 10 deferred due peer incompatibility

The first resolution attempt with `eslint@10.13.0` emitted peer-range warnings from `eslint-plugin-import@2.32.0`, `eslint-plugin-jsx-a11y@6.10.2`, and `eslint-plugin-react@7.37.5`; their published peer ranges did not include ESLint 10. The branch therefore retains `eslint@^9.39.5` until the Next.js lint-plugin ecosystem declares compatible support. This version emits a deprecation warning, so that portion of H5 is deferred, not claimed fixed.

## One reported high advisory remains: braces

- **Advisory:** [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), stack-exhaustion denial of service via deeply nested patterns.
- **Published dependency:** `braces@3.0.3`; the advisory endpoint lists no patched npm release yet.
- **Mitigation on this branch:** pnpm applies `patches/braces@3.0.3.patch`, which carries the depth-limit changes from [upstream PR #72](https://github.com/micromatch/braces/pull/72), pinned to source commit `28d440b5dd449dbf1fe6f3506cf94ecca4d02660`. The patch bounds nested brace/parenthesis patterns and protects recursive AST processing.
- **Verification:** the workflow smoke test proves a 101-level hostile pattern is rejected and ordinary `{a,b}` expansion still works.
- **Residual limitation:** `pnpm audit --json` still reports this one high advisory because its database classifies the installed package by its published version; a local patch does not change the version metadata. Do not report the raw audit as zero-high. The validation policy permits only this exact advisory when the local patch, smoke test, and this exception record are all present. Any additional high advisory fails the gate. Remove this exception when an official patched release is available and verified.

## Validation snapshot

Evidence run: [Phase 1 validation workflow run #7](https://github.com/DiabloNova/oxenn/actions/runs/39201729648). The successful install/patch step generated `patches/braces@3.0.3.patch` and committed the resolved lockfile. Results at this snapshot:

- `pnpm install`: succeeds; no peer-dependency issue markers.
- `pnpm audit --json`: 0 critical, 1 high (the exact patched `braces` advisory above), 1 moderate (the existing `esbuild` note).
- `pnpm typecheck`: passes.
- `pnpm test:ui`: 3 passing.
- `pnpm build`: passes; `/api/inngest/route` is present in the route manifest.
- `pnpm lint`: 0 errors, 220 warnings. The delta from the 218-warning baseline is exactly two `@next/next/no-location-assign-relative-destination` warnings newly emitted by Next 16.4.2 in existing source files: `src/app/[locale]/profile/page.tsx:28` and `src/components/marketing/HeroAccessCard.tsx:25`. These warnings are not disabled in this dependency-only phase; fix them in a separate code-quality phase.
- `pnpm test:unit`: 163 passed, 1 failed, 1 todo, 1 skipped file. The one failure is the existing timing assertion in `tests/unit/features/acquisition/http-provider.test.ts:70`, requiring server-arrival timestamps at least 90 ms apart. The full run alone does not establish whether this is nondeterministic or a regression; a targeted repeat is required before Phase 1 is declared ready.

No application-source changes, migrations, schema pushes, or shared-database actions are included.
