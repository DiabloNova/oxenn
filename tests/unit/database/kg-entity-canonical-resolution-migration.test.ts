import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(join(process.cwd(), 'database/drizzle/0018_kg_entity_canonical_resolution.sql'), 'utf8');

describe('KG canonical resolution migration contract', () => {
  it('adds canonical-resolution schema without running a global data backfill', () => {
    expect(migration).toContain('"canonical_entity_id" uuid');
    expect(migration).toContain('"resolution_status" text DEFAULT \'unresolved\' NOT NULL');
    expect(migration).toContain('"resolution_method" text');
    expect(migration).toContain('"resolved_at" timestamp with time zone');
    expect(migration).toContain('"source_chunk_ids" jsonb DEFAULT \'[]\'::jsonb NOT NULL');
    expect(migration).not.toContain('WITH exact_matches AS');
    expect(migration).not.toMatch(/^\s*UPDATE\s+/im);
    expect(migration).not.toMatch(/^\s*DELETE\s+FROM\b/im);
  });

  it('constrains canonical entity references to the same tenant', () => {
    expect(migration).toContain('FOREIGN KEY ("canonical_entity_id", "tenant_id")');
    expect(migration).toContain('REFERENCES "public"."entities" ("id", "organization_id")');
    expect(migration).toContain('kg_entities_resolution_consistency_check');
    expect(migration).toContain('kg_entities_matched_method_check');
  });

  it('leaves canonical matching to the separate RLS-safe tenant Backfill', () => {
    expect(migration).toContain('separate RLS-safe, tenant-scoped Backfill command');
    expect(migration).not.toMatch(/^\s*UPDATE\s+/im);
    expect(migration).not.toMatch(/^\s*DELETE\s+FROM\b/im);
  });
});
