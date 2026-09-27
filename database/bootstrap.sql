-- Run this as superuser on a new Postgres database to prepare it for Oxenn migrations
-- In restricted environments like RDS, you may need a specific database role to create extensions.

CREATE EXTENSION IF NOT EXISTS vector;

-- J-020: Define standard application roles
-- Note: Replace password with actual secure values in the deployment environment.

-- app_owner: Used by Drizzle for migrations, owns tables, has DDL rights.
-- Should have BYPASSRLS in standard PG environments (implied if it owns tables unless FORCE is used).
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_owner') THEN
        CREATE ROLE app_owner NOLOGIN;
    END IF;
END
$$;

-- app_runtime: Narrowly-scoped role for app execution.
-- Must NOT own tables and must NOT have BYPASSRLS.
-- Subject to strict RLS enforcement (including FORCE).
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_runtime') THEN
        CREATE ROLE app_runtime NOLOGIN;
    END IF;
END
$$;

-- Grant basic usage to app_runtime on public schema
GRANT USAGE ON SCHEMA public TO app_runtime;

-- Allow app_runtime to perform DML on future tables created by app_owner
ALTER DEFAULT PRIVILEGES FOR ROLE app_owner IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_runtime;

-- Allow app_runtime to use sequences created by app_owner
ALTER DEFAULT PRIVILEGES FOR ROLE app_owner IN SCHEMA public
    GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO app_runtime;
