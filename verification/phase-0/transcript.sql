-- RLS Matrix Verification Transcript
-- Generated at: 2026-09-26T16:18:58.008Z

-- Role: r_owner | Tenant: unset | Table: brands | Op: SELECT all
BEGIN;
SELECT COUNT(*)::int AS cnt FROM brands;
ROLLBACK;

-- Role: r_owner | Tenant: unset | Table: brands | Op: SELECT WHERE org=B
BEGIN;
SELECT COUNT(*)::int AS cnt FROM brands WHERE organization_id = '22222222-2222-2222-2222-222222222222';
ROLLBACK;

-- Role: r_owner | Tenant: unset | Table: brands | Op: INSERT org=B
BEGIN;
INSERT INTO brands (id, organization_id, name, canonical_domain, aliases, industry, target_markets, created_at, updated_at, created_by, updated_by, version) VALUES ('f0000000-0000-0000-0000-000000001001', '22222222-2222-2222-2222-222222222222', 'Brand B2', 'brandb2.com', '{}', 'tech', '{}', NOW(), NOW(), 'system', 'system', 1)
ROLLBACK;

-- Role: r_owner | Tenant: unset | Table: brands | Op: UPDATE B-row
BEGIN;
UPDATE brands SET name = 'Brand B Updated' WHERE organization_id = '22222222-2222-2222-2222-222222222222'
ROLLBACK;

-- Role: r_owner | Tenant: unset | Table: brands | Op: DELETE B-row
BEGIN;
DELETE FROM brands WHERE id = 'b2222222-2222-2222-2222-222222222222'
ROLLBACK;

-- Role: r_owner | Tenant: unset | Table: document_embeddings | Op: SELECT all
BEGIN;
SELECT COUNT(*)::int AS cnt FROM document_embeddings;
ROLLBACK;

-- Role: r_owner | Tenant: unset | Table: document_embeddings | Op: SELECT WHERE org=B
BEGIN;
SELECT COUNT(*)::int AS cnt FROM document_embeddings WHERE tenant_id = '22222222-2222-2222-2222-222222222222';
ROLLBACK;

-- Role: r_owner | Tenant: unset | Table: document_embeddings | Op: INSERT org=B
BEGIN;
INSERT INTO document_embeddings (id, tenant_id, content_chunk, metadata, embedding, created_at) VALUES ('f0000000-0000-0000-0000-000000001002', '22222222-2222-2222-2222-222222222222', 'Doc B2', '{}', array_fill(0.2::real, ARRAY[768])::vector, NOW())
ROLLBACK;

-- Role: r_owner | Tenant: unset | Table: document_embeddings | Op: UPDATE B-row
BEGIN;
UPDATE document_embeddings SET content_chunk = 'Doc B Updated' WHERE tenant_id = '22222222-2222-2222-2222-222222222222'
ROLLBACK;

-- Role: r_owner | Tenant: unset | Table: document_embeddings | Op: DELETE B-row
BEGIN;
DELETE FROM document_embeddings WHERE id = 'b2222222-2222-2222-2222-222222222222'
ROLLBACK;

-- Role: r_owner | Tenant: unset | Table: document_embeddings_forced | Op: SELECT all
BEGIN;
SELECT COUNT(*)::int AS cnt FROM document_embeddings_forced;
ROLLBACK;

-- Role: r_owner | Tenant: unset | Table: document_embeddings_forced | Op: SELECT WHERE org=B
BEGIN;
SELECT COUNT(*)::int AS cnt FROM document_embeddings_forced WHERE tenant_id = '22222222-2222-2222-2222-222222222222';
ROLLBACK;

-- Role: r_owner | Tenant: unset | Table: document_embeddings_forced | Op: INSERT org=B
BEGIN;
INSERT INTO document_embeddings_forced (id, tenant_id, content_chunk, metadata, embedding, created_at) VALUES ('f0000000-0000-0000-0000-000000001003', '22222222-2222-2222-2222-222222222222', 'Doc B2', '{}', array_fill(0.2::real, ARRAY[768])::vector, NOW())
ROLLBACK;

-- Role: r_owner | Tenant: unset | Table: document_embeddings_forced | Op: UPDATE B-row
BEGIN;
UPDATE document_embeddings_forced SET content_chunk = 'Doc B Updated' WHERE tenant_id = '22222222-2222-2222-2222-222222222222'
ROLLBACK;

-- Role: r_owner | Tenant: unset | Table: document_embeddings_forced | Op: DELETE B-row
BEGIN;
DELETE FROM document_embeddings_forced WHERE id = 'b2222222-2222-2222-2222-222222222222'
ROLLBACK;

-- Role: r_owner | Tenant: unset | Table: crawl_jobs | Op: SELECT all
BEGIN;
SELECT COUNT(*)::int AS cnt FROM crawl_jobs;
ROLLBACK;

-- Role: r_owner | Tenant: unset | Table: crawl_jobs | Op: SELECT WHERE org=B
BEGIN;
SELECT COUNT(*)::int AS cnt FROM crawl_jobs WHERE tenant_id = '22222222-2222-2222-2222-222222222222';
ROLLBACK;

-- Role: r_owner | Tenant: unset | Table: crawl_jobs | Op: INSERT org=B
BEGIN;
INSERT INTO crawl_jobs (id, tenant_id, requested_url, normalized_url, policy, dedup_key, cache_key, priority, status, attempts, max_attempts, created_at, updated_at, version) VALUES ('f0000000-0000-0000-0000-000000001004', '22222222-2222-2222-2222-222222222222', 'https://b2.com', 'https://b2.com', '{}', 'dedup_b2_f0000000', 'ck_b2', 1, 'SUCCEEDED', 1, 3, NOW(), NOW(), 1)
ROLLBACK;

-- Role: r_owner | Tenant: unset | Table: crawl_jobs | Op: UPDATE B-row
BEGIN;
UPDATE crawl_jobs SET requested_url = 'https://b-updated.com' WHERE tenant_id = '22222222-2222-2222-2222-222222222222'
ROLLBACK;

-- Role: r_owner | Tenant: unset | Table: crawl_jobs | Op: DELETE B-row
BEGIN;
DELETE FROM crawl_jobs WHERE id = 'b2222222-3333-2222-2222-222222222222'
ROLLBACK;

-- Role: r_owner | Tenant: unset | Table: websites | Op: SELECT all
BEGIN;
SELECT COUNT(*)::int AS cnt FROM websites;
ROLLBACK;

-- Role: r_owner | Tenant: unset | Table: websites | Op: SELECT WHERE org=B
BEGIN;
SELECT COUNT(*)::int AS cnt FROM websites WHERE organization_id = '22222222-2222-2222-2222-222222222222';
ROLLBACK;

-- Role: r_owner | Tenant: unset | Table: websites | Op: INSERT org=B
BEGIN;
INSERT INTO websites (id, organization_id, domain, normalized_url, status, created_at, updated_at, created_by, updated_by, version) VALUES ('f0000000-0000-0000-0000-000000001005', '22222222-2222-2222-2222-222222222222', 'b2.com', 'https://b2.com', 'ACTIVE', NOW(), NOW(), 'system', 'system', 1)
ROLLBACK;

-- Role: r_owner | Tenant: unset | Table: websites | Op: UPDATE B-row
BEGIN;
UPDATE websites SET domain = 'b-updated.com' WHERE organization_id = '22222222-2222-2222-2222-222222222222'
ROLLBACK;

-- Role: r_owner | Tenant: unset | Table: websites | Op: DELETE B-row
BEGIN;
DELETE FROM websites WHERE id = 'b2222222-4444-2222-2222-222222222222'
ROLLBACK;

-- Role: r_owner | Tenant: unset | Table: users | Op: SELECT all
BEGIN;
SELECT COUNT(*)::int AS cnt FROM users;
ROLLBACK;

-- Role: r_owner | Tenant: unset | Table: users | Op: SELECT WHERE org=B
BEGIN;
SELECT COUNT(*)::int AS cnt FROM users WHERE id = 'user_b';
ROLLBACK;

-- Role: r_owner | Tenant: unset | Table: users | Op: INSERT org=B
BEGIN;
INSERT INTO users (id, name, email, created_at, updated_at) VALUES ('user_b2_f0000000', 'User B2', 'user_b2@org-b.com', NOW(), NOW())
ROLLBACK;

-- Role: r_owner | Tenant: unset | Table: users | Op: UPDATE B-row
BEGIN;
UPDATE users SET name = 'User B Updated' WHERE id = 'user_b'
ROLLBACK;

-- Role: r_owner | Tenant: unset | Table: users | Op: DELETE B-row
BEGIN;
DELETE FROM users WHERE id = 'user_b'
ROLLBACK;

-- Role: r_owner | Tenant: set to A | Table: brands | Op: SELECT all
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
SELECT COUNT(*)::int AS cnt FROM brands;
ROLLBACK;

-- Role: r_owner | Tenant: set to A | Table: brands | Op: SELECT WHERE org=B
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
SELECT COUNT(*)::int AS cnt FROM brands WHERE organization_id = '22222222-2222-2222-2222-222222222222';
ROLLBACK;

-- Role: r_owner | Tenant: set to A | Table: brands | Op: INSERT org=B
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
INSERT INTO brands (id, organization_id, name, canonical_domain, aliases, industry, target_markets, created_at, updated_at, created_by, updated_by, version) VALUES ('f0000000-0000-0000-0000-000000001007', '22222222-2222-2222-2222-222222222222', 'Brand B2', 'brandb2.com', '{}', 'tech', '{}', NOW(), NOW(), 'system', 'system', 1)
ROLLBACK;

-- Role: r_owner | Tenant: set to A | Table: brands | Op: UPDATE B-row
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
UPDATE brands SET name = 'Brand B Updated' WHERE organization_id = '22222222-2222-2222-2222-222222222222'
ROLLBACK;

-- Role: r_owner | Tenant: set to A | Table: brands | Op: DELETE B-row
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM brands WHERE id = 'b2222222-2222-2222-2222-222222222222'
ROLLBACK;

-- Role: r_owner | Tenant: set to A | Table: document_embeddings | Op: SELECT all
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
SELECT COUNT(*)::int AS cnt FROM document_embeddings;
ROLLBACK;

-- Role: r_owner | Tenant: set to A | Table: document_embeddings | Op: SELECT WHERE org=B
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
SELECT COUNT(*)::int AS cnt FROM document_embeddings WHERE tenant_id = '22222222-2222-2222-2222-222222222222';
ROLLBACK;

-- Role: r_owner | Tenant: set to A | Table: document_embeddings | Op: INSERT org=B
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
INSERT INTO document_embeddings (id, tenant_id, content_chunk, metadata, embedding, created_at) VALUES ('f0000000-0000-0000-0000-000000001008', '22222222-2222-2222-2222-222222222222', 'Doc B2', '{}', array_fill(0.2::real, ARRAY[768])::vector, NOW())
ROLLBACK;

-- Role: r_owner | Tenant: set to A | Table: document_embeddings | Op: UPDATE B-row
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
UPDATE document_embeddings SET content_chunk = 'Doc B Updated' WHERE tenant_id = '22222222-2222-2222-2222-222222222222'
ROLLBACK;

-- Role: r_owner | Tenant: set to A | Table: document_embeddings | Op: DELETE B-row
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM document_embeddings WHERE id = 'b2222222-2222-2222-2222-222222222222'
ROLLBACK;

-- Role: r_owner | Tenant: set to A | Table: document_embeddings_forced | Op: SELECT all
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
SELECT COUNT(*)::int AS cnt FROM document_embeddings_forced;
ROLLBACK;

-- Role: r_owner | Tenant: set to A | Table: document_embeddings_forced | Op: SELECT WHERE org=B
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
SELECT COUNT(*)::int AS cnt FROM document_embeddings_forced WHERE tenant_id = '22222222-2222-2222-2222-222222222222';
ROLLBACK;

-- Role: r_owner | Tenant: set to A | Table: document_embeddings_forced | Op: INSERT org=B
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
INSERT INTO document_embeddings_forced (id, tenant_id, content_chunk, metadata, embedding, created_at) VALUES ('f0000000-0000-0000-0000-000000001009', '22222222-2222-2222-2222-222222222222', 'Doc B2', '{}', array_fill(0.2::real, ARRAY[768])::vector, NOW())
ROLLBACK;

-- Role: r_owner | Tenant: set to A | Table: document_embeddings_forced | Op: UPDATE B-row
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
UPDATE document_embeddings_forced SET content_chunk = 'Doc B Updated' WHERE tenant_id = '22222222-2222-2222-2222-222222222222'
ROLLBACK;

-- Role: r_owner | Tenant: set to A | Table: document_embeddings_forced | Op: DELETE B-row
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM document_embeddings_forced WHERE id = 'b2222222-2222-2222-2222-222222222222'
ROLLBACK;

-- Role: r_owner | Tenant: set to A | Table: crawl_jobs | Op: SELECT all
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
SELECT COUNT(*)::int AS cnt FROM crawl_jobs;
ROLLBACK;

-- Role: r_owner | Tenant: set to A | Table: crawl_jobs | Op: SELECT WHERE org=B
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
SELECT COUNT(*)::int AS cnt FROM crawl_jobs WHERE tenant_id = '22222222-2222-2222-2222-222222222222';
ROLLBACK;

-- Role: r_owner | Tenant: set to A | Table: crawl_jobs | Op: INSERT org=B
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
INSERT INTO crawl_jobs (id, tenant_id, requested_url, normalized_url, policy, dedup_key, cache_key, priority, status, attempts, max_attempts, created_at, updated_at, version) VALUES ('f0000000-0000-0000-0000-000000001010', '22222222-2222-2222-2222-222222222222', 'https://b2.com', 'https://b2.com', '{}', 'dedup_b2_f0000000', 'ck_b2', 1, 'SUCCEEDED', 1, 3, NOW(), NOW(), 1)
ROLLBACK;

-- Role: r_owner | Tenant: set to A | Table: crawl_jobs | Op: UPDATE B-row
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
UPDATE crawl_jobs SET requested_url = 'https://b-updated.com' WHERE tenant_id = '22222222-2222-2222-2222-222222222222'
ROLLBACK;

-- Role: r_owner | Tenant: set to A | Table: crawl_jobs | Op: DELETE B-row
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM crawl_jobs WHERE id = 'b2222222-3333-2222-2222-222222222222'
ROLLBACK;

-- Role: r_owner | Tenant: set to A | Table: websites | Op: SELECT all
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
SELECT COUNT(*)::int AS cnt FROM websites;
ROLLBACK;

-- Role: r_owner | Tenant: set to A | Table: websites | Op: SELECT WHERE org=B
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
SELECT COUNT(*)::int AS cnt FROM websites WHERE organization_id = '22222222-2222-2222-2222-222222222222';
ROLLBACK;

-- Role: r_owner | Tenant: set to A | Table: websites | Op: INSERT org=B
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
INSERT INTO websites (id, organization_id, domain, normalized_url, status, created_at, updated_at, created_by, updated_by, version) VALUES ('f0000000-0000-0000-0000-000000001011', '22222222-2222-2222-2222-222222222222', 'b2.com', 'https://b2.com', 'ACTIVE', NOW(), NOW(), 'system', 'system', 1)
ROLLBACK;

-- Role: r_owner | Tenant: set to A | Table: websites | Op: UPDATE B-row
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
UPDATE websites SET domain = 'b-updated.com' WHERE organization_id = '22222222-2222-2222-2222-222222222222'
ROLLBACK;

-- Role: r_owner | Tenant: set to A | Table: websites | Op: DELETE B-row
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM websites WHERE id = 'b2222222-4444-2222-2222-222222222222'
ROLLBACK;

-- Role: r_owner | Tenant: set to A | Table: users | Op: SELECT all
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
SELECT COUNT(*)::int AS cnt FROM users;
ROLLBACK;

-- Role: r_owner | Tenant: set to A | Table: users | Op: SELECT WHERE org=B
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
SELECT COUNT(*)::int AS cnt FROM users WHERE id = 'user_b';
ROLLBACK;

-- Role: r_owner | Tenant: set to A | Table: users | Op: INSERT org=B
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
INSERT INTO users (id, name, email, created_at, updated_at) VALUES ('user_b2_f0000000', 'User B2', 'user_b2@org-b.com', NOW(), NOW())
ROLLBACK;

-- Role: r_owner | Tenant: set to A | Table: users | Op: UPDATE B-row
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
UPDATE users SET name = 'User B Updated' WHERE id = 'user_b'
ROLLBACK;

-- Role: r_owner | Tenant: set to A | Table: users | Op: DELETE B-row
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM users WHERE id = 'user_b'
ROLLBACK;

-- Role: r_nonowner | Tenant: unset | Table: brands | Op: SELECT all
BEGIN;
SELECT COUNT(*)::int AS cnt FROM brands;
ROLLBACK;

-- Role: r_nonowner | Tenant: unset | Table: brands | Op: SELECT WHERE org=B
BEGIN;
SELECT COUNT(*)::int AS cnt FROM brands WHERE organization_id = '22222222-2222-2222-2222-222222222222';
ROLLBACK;

-- Role: r_nonowner | Tenant: unset | Table: brands | Op: INSERT org=B
BEGIN;
INSERT INTO brands (id, organization_id, name, canonical_domain, aliases, industry, target_markets, created_at, updated_at, created_by, updated_by, version) VALUES ('f0000000-0000-0000-0000-000000001013', '22222222-2222-2222-2222-222222222222', 'Brand B2', 'brandb2.com', '{}', 'tech', '{}', NOW(), NOW(), 'system', 'system', 1)
ROLLBACK;

-- Role: r_nonowner | Tenant: unset | Table: brands | Op: UPDATE B-row
BEGIN;
UPDATE brands SET name = 'Brand B Updated' WHERE organization_id = '22222222-2222-2222-2222-222222222222'
ROLLBACK;

-- Role: r_nonowner | Tenant: unset | Table: brands | Op: DELETE B-row
BEGIN;
DELETE FROM brands WHERE id = 'b2222222-2222-2222-2222-222222222222'
ROLLBACK;

-- Role: r_nonowner | Tenant: unset | Table: document_embeddings | Op: SELECT all
BEGIN;
SELECT COUNT(*)::int AS cnt FROM document_embeddings;
ROLLBACK;

-- Role: r_nonowner | Tenant: unset | Table: document_embeddings | Op: SELECT WHERE org=B
BEGIN;
SELECT COUNT(*)::int AS cnt FROM document_embeddings WHERE tenant_id = '22222222-2222-2222-2222-222222222222';
ROLLBACK;

-- Role: r_nonowner | Tenant: unset | Table: document_embeddings | Op: INSERT org=B
BEGIN;
INSERT INTO document_embeddings (id, tenant_id, content_chunk, metadata, embedding, created_at) VALUES ('f0000000-0000-0000-0000-000000001014', '22222222-2222-2222-2222-222222222222', 'Doc B2', '{}', array_fill(0.2::real, ARRAY[768])::vector, NOW())
ROLLBACK;

-- Role: r_nonowner | Tenant: unset | Table: document_embeddings | Op: UPDATE B-row
BEGIN;
UPDATE document_embeddings SET content_chunk = 'Doc B Updated' WHERE tenant_id = '22222222-2222-2222-2222-222222222222'
ROLLBACK;

-- Role: r_nonowner | Tenant: unset | Table: document_embeddings | Op: DELETE B-row
BEGIN;
DELETE FROM document_embeddings WHERE id = 'b2222222-2222-2222-2222-222222222222'
ROLLBACK;

-- Role: r_nonowner | Tenant: unset | Table: document_embeddings_forced | Op: SELECT all
BEGIN;
SELECT COUNT(*)::int AS cnt FROM document_embeddings_forced;
ROLLBACK;

-- Role: r_nonowner | Tenant: unset | Table: document_embeddings_forced | Op: SELECT WHERE org=B
BEGIN;
SELECT COUNT(*)::int AS cnt FROM document_embeddings_forced WHERE tenant_id = '22222222-2222-2222-2222-222222222222';
ROLLBACK;

-- Role: r_nonowner | Tenant: unset | Table: document_embeddings_forced | Op: INSERT org=B
BEGIN;
INSERT INTO document_embeddings_forced (id, tenant_id, content_chunk, metadata, embedding, created_at) VALUES ('f0000000-0000-0000-0000-000000001015', '22222222-2222-2222-2222-222222222222', 'Doc B2', '{}', array_fill(0.2::real, ARRAY[768])::vector, NOW())
ROLLBACK;

-- Role: r_nonowner | Tenant: unset | Table: document_embeddings_forced | Op: UPDATE B-row
BEGIN;
UPDATE document_embeddings_forced SET content_chunk = 'Doc B Updated' WHERE tenant_id = '22222222-2222-2222-2222-222222222222'
ROLLBACK;

-- Role: r_nonowner | Tenant: unset | Table: document_embeddings_forced | Op: DELETE B-row
BEGIN;
DELETE FROM document_embeddings_forced WHERE id = 'b2222222-2222-2222-2222-222222222222'
ROLLBACK;

-- Role: r_nonowner | Tenant: unset | Table: crawl_jobs | Op: SELECT all
BEGIN;
SELECT COUNT(*)::int AS cnt FROM crawl_jobs;
ROLLBACK;

-- Role: r_nonowner | Tenant: unset | Table: crawl_jobs | Op: SELECT WHERE org=B
BEGIN;
SELECT COUNT(*)::int AS cnt FROM crawl_jobs WHERE tenant_id = '22222222-2222-2222-2222-222222222222';
ROLLBACK;

-- Role: r_nonowner | Tenant: unset | Table: crawl_jobs | Op: INSERT org=B
BEGIN;
INSERT INTO crawl_jobs (id, tenant_id, requested_url, normalized_url, policy, dedup_key, cache_key, priority, status, attempts, max_attempts, created_at, updated_at, version) VALUES ('f0000000-0000-0000-0000-000000001016', '22222222-2222-2222-2222-222222222222', 'https://b2.com', 'https://b2.com', '{}', 'dedup_b2_f0000000', 'ck_b2', 1, 'SUCCEEDED', 1, 3, NOW(), NOW(), 1)
ROLLBACK;

-- Role: r_nonowner | Tenant: unset | Table: crawl_jobs | Op: UPDATE B-row
BEGIN;
UPDATE crawl_jobs SET requested_url = 'https://b-updated.com' WHERE tenant_id = '22222222-2222-2222-2222-222222222222'
ROLLBACK;

-- Role: r_nonowner | Tenant: unset | Table: crawl_jobs | Op: DELETE B-row
BEGIN;
DELETE FROM crawl_jobs WHERE id = 'b2222222-3333-2222-2222-222222222222'
ROLLBACK;

-- Role: r_nonowner | Tenant: unset | Table: websites | Op: SELECT all
BEGIN;
SELECT COUNT(*)::int AS cnt FROM websites;
ROLLBACK;

-- Role: r_nonowner | Tenant: unset | Table: websites | Op: SELECT WHERE org=B
BEGIN;
SELECT COUNT(*)::int AS cnt FROM websites WHERE organization_id = '22222222-2222-2222-2222-222222222222';
ROLLBACK;

-- Role: r_nonowner | Tenant: unset | Table: websites | Op: INSERT org=B
BEGIN;
INSERT INTO websites (id, organization_id, domain, normalized_url, status, created_at, updated_at, created_by, updated_by, version) VALUES ('f0000000-0000-0000-0000-000000001017', '22222222-2222-2222-2222-222222222222', 'b2.com', 'https://b2.com', 'ACTIVE', NOW(), NOW(), 'system', 'system', 1)
ROLLBACK;

-- Role: r_nonowner | Tenant: unset | Table: websites | Op: UPDATE B-row
BEGIN;
UPDATE websites SET domain = 'b-updated.com' WHERE organization_id = '22222222-2222-2222-2222-222222222222'
ROLLBACK;

-- Role: r_nonowner | Tenant: unset | Table: websites | Op: DELETE B-row
BEGIN;
DELETE FROM websites WHERE id = 'b2222222-4444-2222-2222-222222222222'
ROLLBACK;

-- Role: r_nonowner | Tenant: unset | Table: users | Op: SELECT all
BEGIN;
SELECT COUNT(*)::int AS cnt FROM users;
ROLLBACK;

-- Role: r_nonowner | Tenant: unset | Table: users | Op: SELECT WHERE org=B
BEGIN;
SELECT COUNT(*)::int AS cnt FROM users WHERE id = 'user_b';
ROLLBACK;

-- Role: r_nonowner | Tenant: unset | Table: users | Op: INSERT org=B
BEGIN;
INSERT INTO users (id, name, email, created_at, updated_at) VALUES ('user_b2_f0000000', 'User B2', 'user_b2@org-b.com', NOW(), NOW())
ROLLBACK;

-- Role: r_nonowner | Tenant: unset | Table: users | Op: UPDATE B-row
BEGIN;
UPDATE users SET name = 'User B Updated' WHERE id = 'user_b'
ROLLBACK;

-- Role: r_nonowner | Tenant: unset | Table: users | Op: DELETE B-row
BEGIN;
DELETE FROM users WHERE id = 'user_b'
ROLLBACK;

-- Role: r_nonowner | Tenant: set to A | Table: brands | Op: SELECT all
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
SELECT COUNT(*)::int AS cnt FROM brands;
ROLLBACK;

-- Role: r_nonowner | Tenant: set to A | Table: brands | Op: SELECT WHERE org=B
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
SELECT COUNT(*)::int AS cnt FROM brands WHERE organization_id = '22222222-2222-2222-2222-222222222222';
ROLLBACK;

-- Role: r_nonowner | Tenant: set to A | Table: brands | Op: INSERT org=B
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
INSERT INTO brands (id, organization_id, name, canonical_domain, aliases, industry, target_markets, created_at, updated_at, created_by, updated_by, version) VALUES ('f0000000-0000-0000-0000-000000001019', '22222222-2222-2222-2222-222222222222', 'Brand B2', 'brandb2.com', '{}', 'tech', '{}', NOW(), NOW(), 'system', 'system', 1)
ROLLBACK;

-- Role: r_nonowner | Tenant: set to A | Table: brands | Op: UPDATE B-row
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
UPDATE brands SET name = 'Brand B Updated' WHERE organization_id = '22222222-2222-2222-2222-222222222222'
ROLLBACK;

-- Role: r_nonowner | Tenant: set to A | Table: brands | Op: DELETE B-row
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM brands WHERE id = 'b2222222-2222-2222-2222-222222222222'
ROLLBACK;

-- Role: r_nonowner | Tenant: set to A | Table: document_embeddings | Op: SELECT all
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
SELECT COUNT(*)::int AS cnt FROM document_embeddings;
ROLLBACK;

-- Role: r_nonowner | Tenant: set to A | Table: document_embeddings | Op: SELECT WHERE org=B
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
SELECT COUNT(*)::int AS cnt FROM document_embeddings WHERE tenant_id = '22222222-2222-2222-2222-222222222222';
ROLLBACK;

-- Role: r_nonowner | Tenant: set to A | Table: document_embeddings | Op: INSERT org=B
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
INSERT INTO document_embeddings (id, tenant_id, content_chunk, metadata, embedding, created_at) VALUES ('f0000000-0000-0000-0000-000000001020', '22222222-2222-2222-2222-222222222222', 'Doc B2', '{}', array_fill(0.2::real, ARRAY[768])::vector, NOW())
ROLLBACK;

-- Role: r_nonowner | Tenant: set to A | Table: document_embeddings | Op: UPDATE B-row
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
UPDATE document_embeddings SET content_chunk = 'Doc B Updated' WHERE tenant_id = '22222222-2222-2222-2222-222222222222'
ROLLBACK;

-- Role: r_nonowner | Tenant: set to A | Table: document_embeddings | Op: DELETE B-row
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM document_embeddings WHERE id = 'b2222222-2222-2222-2222-222222222222'
ROLLBACK;

-- Role: r_nonowner | Tenant: set to A | Table: document_embeddings_forced | Op: SELECT all
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
SELECT COUNT(*)::int AS cnt FROM document_embeddings_forced;
ROLLBACK;

-- Role: r_nonowner | Tenant: set to A | Table: document_embeddings_forced | Op: SELECT WHERE org=B
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
SELECT COUNT(*)::int AS cnt FROM document_embeddings_forced WHERE tenant_id = '22222222-2222-2222-2222-222222222222';
ROLLBACK;

-- Role: r_nonowner | Tenant: set to A | Table: document_embeddings_forced | Op: INSERT org=B
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
INSERT INTO document_embeddings_forced (id, tenant_id, content_chunk, metadata, embedding, created_at) VALUES ('f0000000-0000-0000-0000-000000001021', '22222222-2222-2222-2222-222222222222', 'Doc B2', '{}', array_fill(0.2::real, ARRAY[768])::vector, NOW())
ROLLBACK;

-- Role: r_nonowner | Tenant: set to A | Table: document_embeddings_forced | Op: UPDATE B-row
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
UPDATE document_embeddings_forced SET content_chunk = 'Doc B Updated' WHERE tenant_id = '22222222-2222-2222-2222-222222222222'
ROLLBACK;

-- Role: r_nonowner | Tenant: set to A | Table: document_embeddings_forced | Op: DELETE B-row
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM document_embeddings_forced WHERE id = 'b2222222-2222-2222-2222-222222222222'
ROLLBACK;

-- Role: r_nonowner | Tenant: set to A | Table: crawl_jobs | Op: SELECT all
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
SELECT COUNT(*)::int AS cnt FROM crawl_jobs;
ROLLBACK;

-- Role: r_nonowner | Tenant: set to A | Table: crawl_jobs | Op: SELECT WHERE org=B
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
SELECT COUNT(*)::int AS cnt FROM crawl_jobs WHERE tenant_id = '22222222-2222-2222-2222-222222222222';
ROLLBACK;

-- Role: r_nonowner | Tenant: set to A | Table: crawl_jobs | Op: INSERT org=B
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
INSERT INTO crawl_jobs (id, tenant_id, requested_url, normalized_url, policy, dedup_key, cache_key, priority, status, attempts, max_attempts, created_at, updated_at, version) VALUES ('f0000000-0000-0000-0000-000000001022', '22222222-2222-2222-2222-222222222222', 'https://b2.com', 'https://b2.com', '{}', 'dedup_b2_f0000000', 'ck_b2', 1, 'SUCCEEDED', 1, 3, NOW(), NOW(), 1)
ROLLBACK;

-- Role: r_nonowner | Tenant: set to A | Table: crawl_jobs | Op: UPDATE B-row
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
UPDATE crawl_jobs SET requested_url = 'https://b-updated.com' WHERE tenant_id = '22222222-2222-2222-2222-222222222222'
ROLLBACK;

-- Role: r_nonowner | Tenant: set to A | Table: crawl_jobs | Op: DELETE B-row
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM crawl_jobs WHERE id = 'b2222222-3333-2222-2222-222222222222'
ROLLBACK;

-- Role: r_nonowner | Tenant: set to A | Table: websites | Op: SELECT all
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
SELECT COUNT(*)::int AS cnt FROM websites;
ROLLBACK;

-- Role: r_nonowner | Tenant: set to A | Table: websites | Op: SELECT WHERE org=B
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
SELECT COUNT(*)::int AS cnt FROM websites WHERE organization_id = '22222222-2222-2222-2222-222222222222';
ROLLBACK;

-- Role: r_nonowner | Tenant: set to A | Table: websites | Op: INSERT org=B
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
INSERT INTO websites (id, organization_id, domain, normalized_url, status, created_at, updated_at, created_by, updated_by, version) VALUES ('f0000000-0000-0000-0000-000000001023', '22222222-2222-2222-2222-222222222222', 'b2.com', 'https://b2.com', 'ACTIVE', NOW(), NOW(), 'system', 'system', 1)
ROLLBACK;

-- Role: r_nonowner | Tenant: set to A | Table: websites | Op: UPDATE B-row
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
UPDATE websites SET domain = 'b-updated.com' WHERE organization_id = '22222222-2222-2222-2222-222222222222'
ROLLBACK;

-- Role: r_nonowner | Tenant: set to A | Table: websites | Op: DELETE B-row
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM websites WHERE id = 'b2222222-4444-2222-2222-222222222222'
ROLLBACK;

-- Role: r_nonowner | Tenant: set to A | Table: users | Op: SELECT all
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
SELECT COUNT(*)::int AS cnt FROM users;
ROLLBACK;

-- Role: r_nonowner | Tenant: set to A | Table: users | Op: SELECT WHERE org=B
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
SELECT COUNT(*)::int AS cnt FROM users WHERE id = 'user_b';
ROLLBACK;

-- Role: r_nonowner | Tenant: set to A | Table: users | Op: INSERT org=B
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
INSERT INTO users (id, name, email, created_at, updated_at) VALUES ('user_b2_f0000000', 'User B2', 'user_b2@org-b.com', NOW(), NOW())
ROLLBACK;

-- Role: r_nonowner | Tenant: set to A | Table: users | Op: UPDATE B-row
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
UPDATE users SET name = 'User B Updated' WHERE id = 'user_b'
ROLLBACK;

-- Role: r_nonowner | Tenant: set to A | Table: users | Op: DELETE B-row
BEGIN;
SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM users WHERE id = 'user_b'
ROLLBACK;
