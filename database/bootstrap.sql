-- Run this as superuser on a new Postgres database to prepare it for Oxenn migrations
-- In restricted environments like RDS, you may need a specific database role to create extensions.

CREATE EXTENSION IF NOT EXISTS vector;
