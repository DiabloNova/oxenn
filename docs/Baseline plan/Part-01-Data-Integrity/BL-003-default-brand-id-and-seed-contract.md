# BL-003 — Default brand onboarding creates a non-UUID demo identity that cannot pass audit validation

## Metadata
- **Global order:** 4
- **Part:** 01 — Data Integrity and Customer Evidence
- **Priority:** P1 — Core AI Visibility onboarding blocker
- **Status:** validated
- **Confidence:** high
- **Audited baseline:** `main` at `7bd2b6ba04e18abbcaf772fac63f29c465a45a42`
- **Depends on:** BL-004
- **Related:** BL-002

## Exact problem

When a tenant has no brands, `getBrandsAction` silently creates and returns a sample “Rasha Gostar” brand. Its identifier is generated as `brand-${Math.random()...}`, not as a UUID. However, `createAndRunAuditAction` validates the supplied brand ID with `z.string().uuid()`.

The default brand returned by onboarding therefore cannot be submitted to the audit action's own input contract. In addition, the generated brand has fabricated customer-facing name, website and industry data, and it is attributed to the system rather than to an explicit customer-created profile.

The issue is compounded by BL-004: the current `BrandRepository` stores this record only in the process-local memory store.

## Evidence

- `src/app/actions/ai-visibility-audit.ts:12` requires `brandId` to be a UUID.
- `src/app/actions/ai-visibility-audit.ts:152-168` generates a prefixed random string and fills sample brand data.
- `src/app/actions/ai-visibility-audit.ts:55` later passes that ID to the UUID-validated action path.
- `src/features/ai-intelligence/repositories/index.ts:538-563` implements brand persistence using only `db.brands` memory maps.

## Root cause

A demo-seeding shortcut is being used as customer onboarding. The generated identifier and sample payload do not follow the domain contract required by the audit service.

## Target files

- `src/app/actions/ai-visibility-audit.ts` — remove silent sample-brand creation from the customer path and implement explicit onboarding behavior.
- `src/features/ai-intelligence/repositories/index.ts` — replace memory-only BrandRepository behavior under BL-004.
- Brand domain/schema contracts under `src/features/ai-intelligence/domain/**` and `database/schema/**` — verify the canonical ID and required fields.
- Brand onboarding UI and audit entry points under `src/app/[locale]/dashboard/**`.
- Tests for empty workspace, brand create/read/update and audit execution.

## Recommended remediation

1. When no brand exists, return an explicit onboarding/empty state instead of inventing a customer brand.
2. Implement a real tenant-owned brand creation flow with validated fields, server-derived tenant/user identity and durable PostgreSQL persistence.
3. Generate IDs using the canonical schema contract (UUID if the database/domain requires UUID); do not prefix or hand-roll identifiers.
4. Require the audit input to refer to a persisted brand owned by the active tenant.
5. Keep fixtures in test/demo setup only, with deterministic clearly test-scoped IDs as appropriate.
6. Add an end-to-end test: empty workspace → create brand → reload in a new runtime → run audit with the returned ID.

Do not solve this merely by weakening the UUID validator. The correct fix is to align the creation path and canonical persistence contract.

## Dependencies and impacts

- **Hard dependency:** BL-004.
- **Related:** BL-002 provider configuration must be explicit before a valid brand can produce a live audit.
- This change affects empty-state onboarding and brand data migration only if existing persisted records exist; inspect actual data and schema before deciding any migration.

## Parallelization assessment

**Conditionally parallelizable.**
- Product/UX design for the brand form can proceed independently from repository remediation.
- Backend onboarding should follow the canonical brand schema and persistence adapter decision from BL-004.
- The action and UI should not define different ID rules. One owner should coordinate the API/domain contract and integration.

## Acceptance criteria

- An empty workspace receives an explicit empty/onboarding state, not a fictional brand.
- A created brand uses the canonical ID type and is durably stored.
- A brand ID returned by onboarding passes the audit action's validator.
- A tenant cannot enumerate, read, modify or audit another tenant's brand.
- A reload/new process does not lose the brand.
- Tests cover invalid IDs, missing brand, persistence, empty state and cross-tenant access.

## Rollback and recovery

Preserve existing sample fixtures only in isolated demo/test setup. Before any migration or seed cleanup, inventory and classify existing records; do not delete user data as part of this code correction.

## Verification record

- Source inspection at baseline commit: **verified**.
- Local runtime test: **not run**.
- Implementation and post-fix verification: pending.
