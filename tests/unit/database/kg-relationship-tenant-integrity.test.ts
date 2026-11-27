import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(join(process.cwd(), 'database/drizzle/0019_kg_relationship_tenant_integrity.sql'), 'utf8');
const schema = readFileSync(join(process.cwd(), 'database/schema/index.ts'), 'utf8');

describe('KG relationship tenant integrity migration contract', () => {
  it('does not perform an RLS-filtered global preflight', () => {
    expect(migration).not.toContain('DO $$');
    expect(migration).not.toContain('source_mismatch_count');
    expect(migration).not.toContain('target_mismatch_count');
    expect(migration).toContain('Global diagnostics are performed by the dedicated read-only KG auditor');
  });

  it('relies on PostgreSQL validation of tenant-composite endpoint FKs', () => {
    expect(migration).toContain('FOREIGN KEY ("source_entity_id", "tenant_id")');
    expect(migration).toContain('FOREIGN KEY ("target_entity_id", "tenant_id")');
    expect(migration).toContain('REFERENCES "public"."kg_entities" ("id", "tenant_id")');
    expect(migration).toContain('kg_relationships_source_entity_id_tenant_id_fkey');
    expect(migration).toContain('kg_relationships_target_entity_id_tenant_id_fkey');
    expect(schema).toContain('idx_kg_entities_id_tenant_id_fk');
    expect(schema).toContain('kg_relationships_source_entity_id_tenant_id_fkey');
    expect(schema).toContain('kg_relationships_target_entity_id_tenant_id_fkey');
  });

  it('does not silently rewrite or delete existing relationships', () => {
    expect(migration).not.toMatch(/DELETE\\s+FROM\\s+kg_relationships/i);
    expect(migration).not.toMatch(/UPDATE\\s+kg_relationships/i);
  });
});
