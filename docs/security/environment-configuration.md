# Secure Environment Configuration

## Environment classification

Set `APP_ENVIRONMENT` explicitly to one of `development`, `test`, `staging`, or `production`. If `NODE_ENV=production`, the validator treats the process as production regardless of a conflicting `APP_ENVIRONMENT` value; a deployment cannot downgrade production checks by setting `APP_ENVIRONMENT=development`.

The checked-in `.env.example` is a local-development convenience only. Its loopback PostgreSQL credentials and session placeholder must never be copied to a hosted environment.

## Provision secrets through the deployment secret manager

For Vercel deployments, configure values in the project's Environment Variables settings (scoped to the intended Development, Preview, or Production environment), or use the equivalent secret manager for the hosting platform. Do not commit real values, paste them into deployment documentation, or populate hosted environments by copying `.env.example`.

Generate a unique `SESSION_SECRET` with a cryptographically secure random generator and store it as a secret. Staging and production require at least 32 characters and reject known placeholders, repeated-character values, and common weak values.

## Database role separation

Provision three distinct PostgreSQL login roles for hosted environments:

- `DATABASE_URL`: application runtime role; least privilege for application queries and tenant-scoped access.
- `AUTHENTICATOR_DATABASE_URL`: separate authenticator/system-context role; only the cross-tenant lookup and session operations required by the documented privileged paths.
- `MIGRATION_DATABASE_URL`: migration role; schema-change privileges required for the migration set, but not PostgreSQL superuser privileges.

The runtime and authenticator pools verify the connected PostgreSQL role's `rolsuper` flag before leasing a client. The migration runner performs the same check before applying migrations. The environment validator also rejects known superuser role names, loopback database hosts, missing role URLs, and duplicate role identities in non-development environments.

A database administrator may need to provision trusted extensions such as pgvector as a separate one-time infrastructure bootstrap operation. Do not grant PostgreSQL superuser access to the application's runtime or authenticator login to work around extension provisioning.

## Preflight checks

- `instrumentation.ts` validates the Node.js runtime environment before the Next.js server accepts requests, including hosted Next.js runtimes that do not execute the package `start` script.
- `pnpm run env:check start` validates runtime configuration directly.
- `pnpm run env:check migrate` validates migration configuration before `pnpm db:migrate`.
- `pnpm start` runs the runtime preflight automatically and exits non-zero when configuration is unsafe.
- The environment validator permits the documented local loopback/superuser examples only when `APP_ENVIRONMENT=development`.

Never rotate a production secret or claim that a production secret was exposed based only on the example file. Rotation requires separate evidence that a real value was deployed or compromised.
