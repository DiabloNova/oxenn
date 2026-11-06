# BL-002 — AI Visibility silently substitutes a mock provider for live execution

## Metadata
- **Global order:** 3
- **Part:** 01 — Data Integrity and Customer Evidence
- **Priority:** P1 — MVP blocking
- **Status:** validated
- **Confidence:** high
- **Audited baseline:** `main` at `7bd2b6ba04e18abbcaf772fac63f29c465a45a42`
- **Depends on:** BL-004
- **Blocks:** trustworthy AI Visibility reporting

## Exact problem

The customer action calls `AIVisibilityAuditEngine.executeAudit` without supplying a provider type. The engine accepts an optional provider type, and the registry returns a `MockAIVisibilityProvider` whenever the type is omitted, unrecognized or Gemini is not selected with a configured API key.

As a result, the normal action path can produce a completed audit from canned responses. Those responses contain fixed claims about “Rasha Gostar” and `secure-site.com`, yet the engine can persist and score them as if they were an observation from an AI provider. An unavailable or misconfigured live integration can therefore be masked by synthetic output.

## Evidence

- `src/app/actions/ai-visibility-audit.ts:55` calls `executeAudit(tenantId, brandId, userId)` with no provider argument.
- `src/features/ai-intelligence/services/ai-visibility-audit-engine.ts:29-34` declares `providerType` optional.
- `src/features/ai-intelligence/services/ai-visibility-audit-engine.ts:134` resolves the provider with that optional value.
- `src/services/ai/ai-visibility-provider.ts:156-161` returns Gemini only for explicit `gemini` plus a configured key; otherwise it returns `MockAIVisibilityProvider`.
- `src/services/ai/ai-visibility-provider.ts:43-77` contains fixed brand/domain mock responses.
- CI verifies code correctness but does not prove the customer action selects a genuine external AI answer/search surface.

## Root cause

Provider selection is implicit and has a permissive mock fallback. The action does not require an explicit, persisted provider/surface configuration or validate its availability and budget before creating a customer audit.

## Target files

- `src/app/actions/ai-visibility-audit.ts` — require and validate an allowed customer provider/surface configuration.
- `src/features/ai-intelligence/services/ai-visibility-audit-engine.ts` — require a resolved provider contract rather than an optional default.
- `src/services/ai/ai-visibility-provider.ts` — fail closed for live mode; expose mock only through explicit test/demo selection.
- Provider configuration/domain contracts and persistence modules under `src/features/ai-intelligence/**`.
- Relevant dashboard audit forms, status/report components and tests.

## Recommended remediation

1. Separate `demo`, `test` and `live` execution modes explicitly. A live audit must name the exact external product/surface and provider adapter being called.
2. Require a persisted, tenant-owned provider configuration and validate the credential, quota, locale, allowed surfaces and estimated cost before job creation.
3. Change live provider resolution to throw a typed configuration/unavailable error when the selected provider is absent or invalid. It must never fall back to mock.
4. Preserve mock providers for deterministic unit/integration tests and clearly labelled demo workspaces only.
5. Persist provider, exact surface/model/version where available, prompt version, locale, timestamp, latency, status, response evidence and usage/cost metadata.
6. Distinguish an observation made by a raw model API from an observation made by a branded public search/answer product. Do not label the former as proof of the latter.
7. Add tests for omitted provider, missing credential, provider outage, quota exhaustion, partial failure, explicit mock mode and live success.

This is the smallest solution that makes the evidence contract honest while preserving the existing provider abstraction.

## Dependencies and impacts

- **Hard dependency:** BL-004 for reliable persistence and audit-history reads/writes.
- Related: BL-003 for a valid customer-owned brand onboarding path.
- Provider configuration and cost limits must be decided before exposing live audit execution.
- No external provider should be called without user authorization and workspace budget controls.

## Parallelization assessment

**Conditionally parallelizable.**
- Registry fail-closed behavior and provider adapter contract tests can be implemented in a bounded branch after the mode contract is agreed.
- UI provider selection and credential-health display can be prepared separately, but must use the same domain contract.
- The engine, action and provider registry are tightly coupled; those files require one integration owner and sequential integration.
- Avoid parallel edits to the same service or provider file.

## Acceptance criteria

- A live customer action cannot resolve to `MockAIVisibilityProvider`.
- Missing/invalid provider configuration produces an explicit failed or blocked state without a fabricated score.
- Every scored observation is traceable to a recorded provider response and exact surface/mode.
- Demo/test runs are visibly labelled and cannot be mixed into live customer reports.
- Provider partial failures and costs are represented honestly.
- Cross-tenant provider configuration access is denied by tests.

## Rollback and recovery

Disable live execution for an unconfigured provider rather than enabling a mock fallback. Demo mode may remain available only where the UI and persistence clearly distinguish it from customer/live results.

## Verification record

- Source inspection at baseline commit: **verified**.
- Current CI build/unit/UI/isolation jobs pass.
- Local test execution in this audit environment: **not run**.
- Implementation and post-fix verification: pending.
