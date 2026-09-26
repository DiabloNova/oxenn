# Task J-007: Provenance & Deploy-Linkage Memo

## Executive Risk Summary
The repository currently lacks in-repo CI/CD workflows (`.github/workflows` and `.circleci` are absent) while containing explicit documentation and artifact indicators (`components.json`, root v0 layout, and `README.md` deployment claims) of automatic Vercel/v0 deployment on merges to `main`. Because Phase 0 verification (J-001) established that the current `main` branch fails type checking (`tsc --noEmit`), linting (`eslint`), and Next.js build compilation (`pnpm build`), any active external auto-deploy integration creates an immediate risk of broken production/staging build deployments upon merge. No secret credentials are tracked in Git. The human repository owner must verify external GitHub/Vercel/v0 settings and freeze automatic deployments to `main` until Phase 1 CI quality gates are implemented.

---

## 1. Repository-Side Deployment & Linkage Evidence

### 1.1 In-Repo Deployment Configuration Inventory
- **`.github/workflows`**: ABSENT. (No GitHub Actions workflow files exist in the repository).
- **`vercel.json`**: ABSENT.
- **`Dockerfile`**: ABSENT.
- **`netlify.toml`**: ABSENT.
- **`fly.toml` / `render.yaml`**: ABSENT.
- **`.circleci`**: ABSENT. (Note: `README.md` claims CircleCI testing via `.circleci/config.yml`, but this directory and file do not exist in the live repository).

### 1.2 `.gitignore` Build & Environment Patterns
```gitignore
# v0 sandbox internal files
__v0_runtime_loader.js
__v0_devtools.tsx
__v0_jsx-dev-runtime.ts
.snowflake/
.v0-trash/
.vercel/

# Environment variables
.env*.local
.env
.env.*
!.env.example

# Next.js / Build
.next/
out/
dist/
build/
```

### 1.3 v0 & Infrastructure Linkage Artifacts
- **`components.json`**: Present at root. Defines shadcn/ui configuration with style `"base-nova"` and path aliases (`@/components`, `@/lib/utils`, `@/components/ui`, etc.), characteristic of v0 / shadcn setup.
- **`README.md` Claims**:
  - Section 9: Identifies Vercel as deployment infrastructure ("Vercel: زیرساخت استقرار و اجرای پروژه").
  - Section 13: Claims automatic deployment on push: "استقرار خودکار پس از Push در شاخه اصلی (Main) توسط Vercel و بررسی‌های کیفی با استفاده از CircleCI (`.circleci/config.yml`) انجام می‌پذیرد."
  - Common v0 Boilerplate Claim: "Every merge to main will automatically deploy."
- **Root Artifacts (`components/`, `lib/`)**:
  - Root `components/` contains UI and navigation components (`live-analytics/`, `navigation/`, `ui/`).
  - Root `lib/` contains `utils.ts` (`cn` helper using `clsx` and `tailwind-merge`).
  - Both exist alongside `src/components/` and `src/lib/`.

---

## 2. Git History & PR Merge Pattern Summary

### 2.1 Commit Log (`git log --graph --oneline -30`)
```text
* ce2ae1b Merge pull request #3 from DiabloNova/verification-j002-replay-3736450166208689123
* dfe4a51 feat(verification): clean-replay experiment drizzle chain vs empty postgres (J-002)
* 75a248f docs: add System-B database inventory report for task J-003
* 112dca5 feat(verification): add phase-0 environment identity and static health transcripts
```

### 2.2 PR Merge Pattern Analysis
- Merges to `main` use standard GitHub pull request merge commits (e.g., PR #3).
- Branch naming follows the structured `verification/j00x-*` pattern.
- No automated pre-merge checks or status gates are enforced by in-repo tooling prior to PR merges.

---

## 3. Secret-Bearing File Pattern Inventory

### 3.1 Tracked Environment Files (`git ls-files | grep -i env`)
- `.env.example`
- `next-env.d.ts`
- `src/config/env.ts`
- `verification/phase-0/env.txt`

### 3.2 Secret Verification Confirmation
- **`git ls-files | grep -E -i "(\.env|\.pem|\.key|\.secret|credentials|token)"`**: Only `.env.example` is tracked.
- **`.env.example` Content Inspection**: Contains 8 environment variable keys (`DATABASE_URL`, `MIGRATION_DATABASE_URL`, `STAGING_MIGRATION_DATABASE_URL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `FIRECRAWL_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `DATA_SOURCE`) with completely empty values.
- **Verification Status**: CONFIRMED — No real credentials, secret values, or private keys are tracked in Git.

---

## 4. Owner Action Checklist & Verification Protocol

Because external SaaS dashboards cannot be accessed from within the repository agent environment, the human repository owner MUST execute the following checks in external settings:

- [ ] **1. GitHub Integration Verification**
  - **Location:** GitHub Repository Settings → Integrations → GitHub Apps / Deployments.
  - **Action:** Check whether Vercel or v0 GitHub App is connected with active deployment triggers on push/merge to `main`.
  - **Status:** `UNKNOWN/OWNER` (External setting).

- [ ] **2. Vercel / v0 Project Dashboard Verification**
  - **Location:** Vercel or v0 Project Dashboard for `DiabloNova/oxenn`.
  - **Action:** Inspect Project Settings → Git Integration to see if "Automatic Deployment on Push to Main" is turned ON.
  - **Status:** `UNKNOWN/OWNER` (External setting).

- [ ] **3. Auto-Deploy Freeze / Mitigation Action**
  - **IF Auto-Deploy is ACTIVE:**
    - Immediately **PAUSE or DISABLE** automatic deployments for merges to `main`.
    - **Reason:** Current `main` fails static health checks (`tsc --noEmit` exit 2, `pnpm lint` exit 1 with 534 errors, `pnpm build` exit 1). Uncontrolled merges will trigger failing production/staging builds on Vercel.
    - **Duration:** Freeze merges / auto-deploys until Phase 1 CI quality gates (`tsc`, `eslint`, `build`) are established and passing.
  - **IF Auto-Deploy is NOT Active:**
    - Maintain manual deployment protocol until Phase 1 CI gates are live.

---

## 5. Deployment Risk Statement

**Overall Deployment Risk Level:** HIGH (If external Auto-Deploy is active) / CONTROLLED (If external Auto-Deploy is inactive/manual).

**Key Risk Factors:**
1. **Broken Static Baseline:** Machine verification (J-001) established that `main` currently fails TypeScript compilation (`tsc --noEmit`), ESLint linting (`pnpm lint`), and Next.js build compilation (`pnpm build`).
2. **Missing In-Repo Protection Gates:** No GitHub Actions workflows exist to block merging broken PRs into `main`. The CircleCI integration claimed in `README.md` is absent in the repository.
3. **External Auto-Deploy Risk:** If Vercel or v0 auto-deployment is connected on GitHub, every PR merge to `main` will automatically trigger a build deployment that is guaranteed to fail or produce broken runtime artifacts.
4. **Secret Exposure Risk:** LOW — Secret verification confirmed that no environment secrets or private credentials are tracked in Git.
