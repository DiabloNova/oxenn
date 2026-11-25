import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(join(process.cwd(), 'database/drizzle/0019_kg_relationship_tenant_integrity.sql'), 'utf8');
const schema = readFileSync(join(process.cwd(), 'database/schema/index.ts'), 'utf8');

describe('KG relationship tenant integrity migration contract', () => {
  it('preflights both endpoints and aborts on missing or cross-tenant references', () => {
    expect(migration).toContain('source_entity.tenant_id <> relationship.tenant_id');
    expect(migration).toContain('target_entity.tenant_id <> relationship.tenant_id');
    expect(migration).toContain('0019 preflight failed');
    expect(migration).toContain('source_mismatch_count');
    expect(migration).toContain('target_mismatch_count');
    expect(migration).toContain('Sample relationship IDs');
    expect(migration).toContain('LEFT JOIN kg_entities');
  });

  it('replaces single-column endpoint FKs with tenant-composite FKs', () => {
    expect(migration).toContain('FOREIGN KEY ("source_entity_id", "tenant_id")');
    expect(migration).toContain('FOREIGN KEY ("target_entity_id", "tenant_id")');
    expect(migration).toContain('REFERENCES "public"."kg_entities" ("id", "tenant_id")');
    expect(schema).toContain('idx_kg_entities_id_tenant_id_fk');
    expect(schema).toContain('kg_relationships_source_entity_id_tenant_id_fkey');
    expect(schema).toContain('kg_relationships_target_entity_id_tenant_id_fkey');
  });

  it('does not silently rewrite or delete existing relationships', () => {
    expect(migration).not.toMatch(/DELETE\s+FROM\s+kg_relationships/i);
    expect(migration).not.toMatch(/UPDATE\s+kg_relationships/i);
  });
});
