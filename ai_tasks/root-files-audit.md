# Root-Level Files Audit — Phase 1

## Status

**PHASE 1 COMPLETE — awaiting user approval before inspecting the first repository folder.**

This document records the read-only audit of the repository's 19 root-level files. It does not claim that the repository-wide audit is complete.

## Repository and branch baseline

- Repository: `DiabloNova/oxenn`
- Audit branch resumed: `docs/product-roadmap-baseline-2026-11`
- Main baseline commit inspected: `7bd2b6ba04e18abbcaf772fac63f29c465a45a42`
- Existing audit branch before this continuation: `1c19bd8350341a6246806956028d64376af448a5`
- Branch tip after adding the requested `ai_tasks/` workspace scaffold: `7fe0d7baa45120fe355accc3322d753184bcb829`
- Root inventory: **19 files and 9 directories** (the count supplied in the task is confirmed).
- The root-file blob SHAs below match the files inspected on the resumed branch. The earlier branch's documentation changes did not modify these root files.

### Scope boundary

Included:
- All 19 root-level files, with complete file retrieval and content inspection.
- Full 9,561-line `pnpm-lock.yaml` retrieval and static consistency checks against `package.json`.
- Direct verification of whether the two helper scripts referenced by `update_recon.sh` exist at the repository root.

Not included yet:
- Any nested repository folder or its files.
- Runtime execution of scripts, build, tests, lint, typecheck, database commands, or security scanners.
- Full dependency advisory analysis.
- PR/Issue review.
- Database, deployment, or live-provider state.

No application source, schema, migration, deployment, or existing PR was changed.

## Root-file inventory

| # | File | Lines | Blob SHA |
|---:|---|---:|---|
| 1 | `.env.example` | 59 | `1a9a6ea9320a7c5c2a98446d368fa92c991ddf1c` |
| 2 | `.gitignore` | 61 | `697c449d91604504d2c2f5b36350a3138cc01995` |
| 3 | `AGENTS.md` | 1,255 | `6af8e43f2119a7118b14b6390fdd7d09d35ac1e2` |
| 4 | `BLUEPRINT.md` | 1,571 | `c26f81c3d77e6b6a92436d349aa5b823bed3abe6` |
| 5 | `README.md` | 75 | `f777a9700bd4419c87e7df47d8cdc3a9d36e1ee3` |
| 6 | `SKILL.md` | 399 | `a950040ac7740bd41f84a7888b8a7aa57ca581b9` |
| 7 | `SPEC.md` | 1,256 | `c0a3e964342f26b894c775c5085867b440ddc466` |
| 8 | `components.json` | 22 | `f5b65cba87aa11f40c35b63bfb226722d69c2680` |
| 9 | `drizzle.config.ts` | 11 | `f1ca488074aab9ec462339b26447fb35e1f435ac` |
| 10 | `eslint.config.mjs` | 19 | `05e726d1b4201bc8c7716d2b058279676582e8c0` |
| 11 | `next-env.d.ts` | 7 | `9edff1c7cacb3bfac9a1eadcf6f51eaa99565e38` |
| 12 | `next.config.ts` | 30 | `db9ccb5ba23030fac4cc5f27b775247c8c63cfbc` |
| 13 | `package.json` | 101 | `9bdcf90017def6a50c8a700fef0551333354d144` |
| 14 | `pnpm-lock.yaml` | 9,561 | `a71faee18691d7ceb8b4d4343b101b1d905d160c` |
| 15 | `postcss.config.mjs` | 8 | `61e36849cf7cfa9f1f71b4a3964a4953e3e243d3` |
| 16 | `tsconfig.json` | 35 | `7d553a8b57da393b72f12afdc229d4989dc68040` |
| 17 | `update_recon.sh` | 46 | `389f491b92abe0d36b2bfbbbc0dad07ed4908aa4` |
| 18 | `verify_aeo_content.py` | 73 | `6ababf53064cc6ba6eaeb8e069bd651da625e9e6` |
| 19 | `vitest.config.ts` | 50 | `32a349ae27ddc034ec91cb7db9641746123d3fb4` |

## Findings from the root-file phase

The IDs below are provisional root-audit IDs. They are not yet the final global `BL-###` identifiers. Final categorization and global priority order must wait until all repository areas have been inspected.

### RF-001 — Broken and non-fail-fast repository reconnaissance generator

- **Priority:** P2 — tooling/reliability
- **Status:** Confirmed static defect
- **Evidence:**
  - `update_recon.sh:9` executes `bash get_routes.sh`.
  - `update_recon.sh:25` executes `bash get_signatures.sh`.
  - Both `get_routes.sh` and `get_signatures.sh` were checked at the repository root and are absent.
  - The script does not enable fail-fast behavior or check the helper commands' exit statuses.
  - `update_recon.sh:45` moves the generated temporary file over `verification/fe/FE-000-recon.md`.
- **Impact:** When invoked from the repository root, the missing helper calls fail, but execution continues. The script can then replace the existing reconnaissance report with incomplete content. It also relies on the caller's current working directory rather than resolving paths relative to the script.
- **Target files:** `update_recon.sh`; the generated destination `verification/fe/FE-000-recon.md`; intended helper locations must be identified during the later folder phase.
- **Recommended direction:** Establish the canonical source/location for route and signature generation, resolve paths relative to the script, fail immediately on required-step failure, and write to a temporary destination that is promoted only after all generation steps succeed. Do not invent replacement helper scripts before inspecting their intended functionality.
- **Parallelization:** Not safe to repair independently of the existing reconnaissance report and its source inputs. The helper ownership and report-generation contract must first be established.

### RF-002 — AEO visual verification script can disrupt local processes and report false success

- **Priority:** P2 — verification/tooling reliability
- **Status:** Confirmed static defects; runtime impact not executed
- **Evidence:**
  - `verify_aeo_content.py:14` kills every process returned by `lsof -t -i :3000`, without verifying that it belongs to this script.
  - `verify_aeo_content.py:18-25` starts `pnpm start` and waits a fixed five seconds rather than checking server readiness.
  - `verify_aeo_content.py:42-43` embeds the credentials `test@example.com` / `password`.
  - `verify_aeo_content.py:59` hardcodes `/home/jules/verification/aeo_content_intelligence.png`.
  - `verify_aeo_content.py:65-66` catches exceptions and only prints an error; it does not propagate failure or set a non-zero exit status.
  - `verify_aeo_content.py:69` force-kills the spawned process group.
  - The script logs a page title but does not assert successful authentication, the expected route, or expected dashboard content before reporting screenshot success.
- **Impact:** Running the script may terminate an unrelated developer process on port 3000. A failed login, unavailable server, missing selector, or failed navigation can be swallowed while the Python process exits successfully, creating misleading verification evidence. The absolute path also makes the script environment-specific.
- **Target files:** `verify_aeo_content.py`; later review must inspect the referenced login flow, test-account fixture/provisioning, and app startup contract before recommending a replacement.
- **Recommended direction:** Use an isolated server/port owned by the test process, readiness polling with a bounded timeout, managed process cleanup, environment-provided test credentials or a dedicated test fixture, assertions for the expected authenticated page, portable output paths, and non-zero failure exit behavior.
- **Parallelization:** The script's process lifecycle and its test-account/authentication assumptions should be handled together. UI assertions can be designed separately only after the actual login/dashboard contract is inspected.

### RF-003 — Vitest database project permits an empty test suite to pass

- **Priority:** P2 — test integrity
- **Status:** Confirmed configuration risk; actual test inventory is pending folder review
- **Evidence:**
  - `vitest.config.ts:11` sets root-level `passWithNoTests: true`.
  - `vitest.config.ts:28-33` defines the `db` project with `include: ["tests/db/**/*.test.ts"]` and `passWithNoTests: true`.
  - The inline comment explicitly labels this a temporary setting to be flipped when `tests/db` is seeded.
  - Unit and UI projects explicitly set `passWithNoTests: false`.
- **Impact:** Selecting the database project can return a successful result even if no database tests are discovered. This weakens the meaning of a green database-test command.
- **Target files:** `vitest.config.ts`; test inventory and CI command ownership will be checked during the later `tests/` and `.github/` phases.
- **Recommended direction:** Make the database project fail when it discovers no tests once its intended suite is present; ensure CI invokes the intended project and reports skipped/empty coverage explicitly.
- **Parallelization:** Configuration and CI wiring may be planned separately, but the final change depends on confirming the database test inventory and intended CI contract.

### RF-004 — Drizzle configuration silently supplies a fallback database URL

- **Priority:** P2 — database tooling safety
- **Status:** Potential risk; guard behavior not yet verified
- **Evidence:** `drizzle.config.ts:8` uses `process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/postgres"`.
- **Impact:** If `DATABASE_URL` is absent, Drizzle tooling receives an implicit local superuser target rather than failing due to missing configuration. The practical exposure depends on which Drizzle commands use this config and whether the guarded `db:push` path blocks the fallback.
- **Target files:** `drizzle.config.ts`; later inspection must include `scripts/database/db-push-guard.ts`, environment validation, and the actual Drizzle command usage.
- **Recommended direction:** Prefer explicit target configuration and fail-closed behavior for operations that can mutate a database. Do not change this until the guard and migration/tooling contracts are verified.
- **Parallelization:** Unsafe to resolve before the database tooling and guard paths are inspected together.

### RF-005 — Example environment file contains privileged local defaults and a weak placeholder session secret

- **Priority:** P2 — configuration/security hygiene
- **Status:** Potential deployment/configuration hazard; not evidence of an exposed production secret
- **Evidence:**
  - `.env.example:2-3` uses local `postgres:postgres` connection strings for application and migration URLs.
  - `.env.example:9` uses the same local superuser-style credentials for `AUTHENTICATOR_DATABASE_URL`.
  - `.env.example:5-7` explicitly says this is a local-development example and production must use a dedicated least-privilege login role.
  - `.env.example:21` contains the predictable placeholder `change-this-to-a-secure-32-character-secret-in-production`.
- **Impact:** Copying these example values into a non-development environment without replacing them would violate least-privilege and secret-strength expectations. The comments warn against this, so no production exposure is established from this file alone.
- **Target files:** `.env.example`; later review must inspect `scripts/env-check.ts`, runtime secret validation, deployment configuration and environment handling.
- **Recommended direction:** Ensure non-development modes reject placeholder secrets and privileged local defaults; keep examples clearly local-only and document the required production role/secret setup.
- **Parallelization:** Conditional; validation code and deployment environment contracts must be reviewed together.

### RF-006 — Security-header comment describes a CSP report-only phase that is not configured here

- **Priority:** P2 — security hardening
- **Status:** Confirmed absence in this file; broader policy status pending security phase
- **Evidence:**
  - `next.config.ts:5-6` says CSP is not enforced and should first be run in report-only mode.
  - The configured `securityHeaders` array contains X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS and DNS-prefetch control (`next.config.ts:8-13`), but no `Content-Security-Policy` or `Content-Security-Policy-Report-Only` header.
  - HSTS is configured with `includeSubDomains; preload` at `next.config.ts:13`; suitability for every served domain/subdomain has not been verified.
- **Impact:** The documented next security step is not implemented in this config. The absence is a hardening gap, not by itself proof of an exploitable vulnerability. HSTS preload scope also needs deployment-domain verification.
- **Target files:** `next.config.ts`; later review must inspect deployment domains, scripts, CSP requirements and the referenced audit report.
- **Recommended direction:** Verify the intended CSP report-only rollout and reporting endpoint, then introduce a policy compatible with the actual application. Validate HSTS against the real domain/subdomain topology before changing it.
- **Parallelization:** CSP policy design can be prepared independently, but rollout must be coordinated with the frontend/runtime and deployment configuration.

### RF-007 — Root product specification does not explicitly define the Digital Twin product domain

- **Priority:** P2 — product/specification alignment
- **Status:** Confirmed documentation coverage gap against the previously stated product scope; target architecture decision pending
- **Evidence:**
  - `SPEC.md:56-99` defines the product and core lifecycle around SEO/AI visibility, digital assets, collection, analysis, intelligence and user action.
  - The complete `SPEC.md` contains no explicit Digital Twin domain or its lifecycle.
  - `README.md:3-7` positions the product mainly as AI visibility/AEO with SEO-oriented users and reporting; it does not describe Digital Twin planning/execution or user–AI execution dialogue.
- **Impact:** The primary specification does not yet make the Digital Twin concept, real-data-vs-target comparison, gap measurement, target-state planning, plan execution, and user–AI discussion a first-class set of requirements. This can cause future architecture and roadmap work to be planned against an incomplete product contract.
- **Target files:** `SPEC.md`, `README.md`; architecture and product documentation paths must be confirmed during the later documentation/architecture phases.
- **Recommended direction:** Do not patch the specification during this root-file phase. Capture the product requirements in the architecture work area, reconcile them with the current product scope, then update the authoritative product specification only after an explicit architecture decision.
- **Parallelization:** Not safe to finalize in parallel with architecture definition. Product-domain boundaries and data/evidence contracts must be agreed first.

### RF-008 — Agent operating contract contains a duplicate section number

- **Priority:** P3 — documentation/governance consistency
- **Status:** Confirmed formatting/structure defect
- **Evidence:**
  - `AGENTS.md:511` is titled `## 15. Generated Artifacts`.
  - `AGENTS.md:1252` is also titled `## 15. Authorization and super_admin Policies`, after sections 44 and 45.
  - `AGENTS.md:534` formats `## 16.Mandatory Task Report Rule` without a space after the section number.
- **Impact:** Section references can be ambiguous and the appended authorization policy is difficult to locate by its heading number. This does not by itself prove a runtime security defect.
- **Target files:** `AGENTS.md`.
- **Recommended direction:** Normalize section numbering and heading formatting only after confirming the intended ordering of the appended authorization policy. Do not renumber governance text opportunistically during this audit.
- **Parallelization:** Safe as an isolated documentation edit after the intended section order is approved.

### RF-009 — Email-provider environment switch is documented as selecting a sender that currently throws

- **Priority:** P2 — integration readiness
- **Status:** Source comment claim; implementation behavior pending verification
- **Evidence:** `.env.example:23-26` says any non-empty `EMAIL_PROVIDER` enables `ProductionEmailSender`, which currently throws on send, and disables the invite-token fallback.
- **Impact:** If the variable is configured before a working sender is available, email-dependent workflows may fail while the fallback path is disabled. This could affect verification/invitation flows.
- **Target files:** `.env.example`; later inspection must trace `src/services/email`, provider selection, callers and tests.
- **Recommended direction:** Verify the implementation and intended configuration contract. A provider must not be advertised as enabled until its send path is operational and failure handling is explicit.
- **Parallelization:** Not safe until the email service and its consumers are traced.

## Cross-checks that did not produce a confirmed root-file finding

1. `package.json` declares `pnpm@10.30.3` and Node `>=22`; `README.md` describes pnpm and Node `>=22`.
2. `package.json` build, lint, typecheck, test, acquisition and database scripts were inspected as declarations. Their runtime success has **not** been tested in this phase.
3. `pnpm-lock.yaml` uses lockfile format `9.0`, contains 9,561 lines / 328,286 bytes, and was scanned in full. Its root importer contains 22 production dependencies and 20 development dependencies. All dependency names and specifiers in those two importer groups match the corresponding `package.json` declarations; no missing, extra or specifier-mismatched direct dependency was found by this static comparison.
4. The lockfile's top-level override declarations were inspected and align with the manifest's declared pnpm overrides. A full package advisory audit and a frozen install were not run.
5. `components.json` aliases, `tsconfig.json` path mapping, and actual source-directory existence have not been cross-checked yet; that belongs to the folder/source phase.
6. The remaining root files were inspected. No additional confirmed root-only defect was established from their contents alone.

## Required follow-up checks deferred to later phases

- Verify whether `tests/db/` is empty and whether CI executes the database Vitest project.
- Inspect `scripts/database/db-push-guard.ts` and `scripts/env-check.ts` before deciding whether the Drizzle fallback is reachable for a mutating command.
- Verify the actual email provider implementation and its consumers.
- Inspect the referenced CSP/audit documentation and deployment domain configuration.
- Cross-check component aliases and generated Next route types against the source tree.
- Reconcile the Digital Twin product requirements with the authoritative specification and the new architecture.
- Re-run all prior branch findings against the live code after the user approves the folder-by-folder review.

## Changes made in this phase

- Added `ai_tasks/README.md`.
- Created the requested `ai_tasks/roadmap/`, `ai_tasks/baseline issues/`, and `ai_tasks/new_architecture/` directories using tracked placeholders.
- Added this root-file audit report.
- No application code, database schema, migration, runtime configuration, dependency, deployment, existing issue, or existing PR was changed.

## Approval gate

**The root-file phase is complete. The next phase is not started.**

Awaiting user approval to begin reviewing the first repository folder. The first folder to inspect will be `.github/` (the first directory in the root inventory), unless the user directs a different folder order.
