# Oxenn

**Oxenn** (اوژن) is a bilingual (fa/en) AI visibility and AEO (Artificial Intelligence Engine Optimization) platform. This project is designed to monitor, analyze, and improve brand visibility in the era of modern AI-driven search engines and Large Language Models.

## 1. Product Overview

The core audience includes SEO specialists, marketing managers, and technical teams who need deep insights into how their brand and content are perceived and processed by AI platforms. Oxenn provides a robust multi-tenant architecture, AI analysis features, web crawling, and comprehensive reporting.

## 2. Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, Tailwind CSS
- **Language:** TypeScript (Strict Mode)
- **Package Manager:** pnpm
- **Runtime Requirement:** Node ≥ 22
- **Database Engine:** Drizzle ORM + PostgreSQL + pgvector

## 3. Setup & Installation

To set up the development environment, follow these steps:

1. Enable Corepack and install dependencies:
   ```bash
   corepack enable pnpm
   pnpm install
   ```

2. Configure environment variables:
   Copy the example environment file and fill in your credentials.
   ```bash
   cp .env.example .env
   ```

3. Validate the environment configuration:
   ```bash
   pnpm env:check dev
   ```

## 4. Scripts Overview

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Starts the Next.js development server. |
| `pnpm build` | Generates documentation data and compiles the Next.js production build. |
| `pnpm lint` | Runs ESLint to check for code quality and formatting issues. |
| `pnpm typecheck` | Executes TypeScript compiler in strict mode (`tsc --noEmit`). |
| `pnpm test:acquisition` | Runs the test suite for the data acquisition modules. |
| `pnpm db:generate` | Generates Drizzle database migrations based on schema changes. |
| `pnpm db:migrate` | Runs environment checks (`env:check migrate`) and executes database migrations via `src/core/database/migrator.ts`. |
| `pnpm db:push` | Pushes schema changes directly to the database (guarded by `scripts/database/db-push-guard.ts` for safety). |

## 5. Migration Doctrine

For comprehensive guidelines and instructions regarding database migrations, please refer to our dedicated **[AGENTS.md](./AGENTS.md)**.

## 6. Project Structure Overview

- `src/app/`: Next.js App Router endpoints and pages (Bilingual support via `[locale]`).
- `src/components/`: Reusable React UI components and layouts.
- `src/lib/`: Core utilities, engine logic (e.g., `audit-engine`), and external service integrations.
- `src/services/`: Business logic layer handling intelligence, web crawling, analytics, caching, and AI integrations.
- `database/`: Database configuration, schemas, and Drizzle migrations.
- `tests/`: Automated test suites covering core logic and features.
- `docs/`: Extensive project documentation and historical artifacts.

## 7. Documentation Portal

Access all internal architecture specs, task executions, and historical reports in the **[Docs Portal](./docs/)**.

---
**Deployment Status:** Configuration via Vercel — see docs. (Note: Ensure manual deployment protocol and validation until CI pipeline passes in external environments).
