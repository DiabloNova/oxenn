# BL-006 — Documentation API performs dynamic filesystem traversal that makes Turbopack trace the repository

## Metadata
- **Global order:** 6
- **Part:** 03 — Tooling, Tests and Build Diagnostics
- **Priority:** P2 — Build/deployment packaging issue
- **Status:** validated
- **Confidence:** high
- **Audited baseline:** `main` at `7bd2b6ba04e18abbcaf772fac63f29c465a45a42`

## Exact problem

The docs API resolves documentation slugs at runtime by starting from `process.cwd()/docs`, traversing directories with synchronous `readdirSync`, checking paths with `existsSync`, and reading the selected file with `readFileSync`. The build logs report two Turbopack warnings that dynamic filesystem access causes tracing of the whole project, at the checks/read operations around lines 47 and 52 of the route.

The endpoint may therefore pull an unnecessarily broad filesystem trace into the build output and increase packaging/build complexity. This finding concerns the verified tracing warning; it does not assert an exploitable path traversal, which must be assessed separately if evidence supports it.

## Evidence

- `src/app/api/v1/docs/route.ts:15-40` constructs the docs directory and performs a breadth-first runtime directory traversal.
- `src/app/api/v1/docs/route.ts:46-52` performs dynamic existence checks and the public-documentation check after reading the file.
- CI run `42181198077`, Build and Test job `127770987998`, reports two Turbopack warnings: “Dynamic filesystem access causes tracing of the whole project.”

## Root cause

The endpoint discovers files dynamically from the deployed filesystem instead of using a bounded, build-time-known documentation manifest or a statically analyzable set of public documentation resources.

## Target files

- `src/app/api/v1/docs/route.ts` — replace runtime BFS/file discovery with a bounded resolver.
- The docs generation script and generated documentation index, if a manifest is selected (confirm exact existing generator contract before changing).
- `src/lib/docs-visibility.ts` — preserve public/private visibility filtering.
- API route tests and build verification.

## Recommended remediation

1. Inspect the existing docs generation pipeline and public-document visibility policy.
2. Generate a deterministic manifest of allowed public documentation files at build time, including normalized slug/domain and repository-relative content references.
3. Make the route resolve only through that manifest; reject unknown slugs and never concatenate an untrusted path into a filesystem path.
4. Preserve exclusion rules for private project/task artifacts and verify the new `Roadmap` and `Baseline plan` docs receive the intended visibility classification.
5. If static content import is feasible, prefer a generated typed map. If filesystem reads remain necessary, constrain them to known manifest paths and confirm tracing includes only the intended files.
6. Add tests for valid slug, unknown slug, hidden document, duplicate slug/domain collision, path-like slug, and the new docs folders.
7. Rebuild and verify both warning removal and correct public/private behavior.

## Dependencies and impacts

- Independent of data-persistence corrections, except documentation visibility must remain correct.
- The new documentation directories must be included or excluded intentionally; do not automatically expose all planning/audit artifacts.
- Changes to the generator and API route must share one manifest contract.

## Parallelization assessment

**Conditionally safe.**
- Manifest design and visibility test cases can be developed in parallel.
- The generator and route should be integrated together under one owner because the output contract is shared.
- Do not run two concurrent changes against the docs generator or the same route file.

## Acceptance criteria

- The docs API performs no unbounded directory traversal at request time.
- The build no longer reports dynamic filesystem tracing warnings for this route.
- Only explicitly public documents can be served.
- Unknown, private and path-like slugs return not found.
- The new Roadmap and Baseline Plan documentation visibility is explicitly tested.

## Rollback and recovery

Keep the previous resolver available in the feature branch until the generated manifest passes route tests and build verification. Roll back only the resolver/generator change if visibility tests regress.

## Verification record

- CI build warnings at baseline commit: **verified**.
- Source path and behavior: **verified by inspection**.
- Local build in this audit environment: **not run**.
- Implementation and post-fix verification: pending.
