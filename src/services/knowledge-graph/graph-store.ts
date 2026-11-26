/**
 * Optimus AI — GraphRAG Pipeline Graph Store Service
 * Implements transaction-safe, RLS-compliant entity and relationship population.
 */

import { PostgresClient } from "../../features/admin/infrastructure/persistence/postgres";
import { TenantContextManager } from "../../core/database/tenant-context";
import { ExtractedGraph, ExtractedEntity } from "../ai/graph-extraction";
import { acquireTenantGraphWriteLock } from "./graph-write-lock";

export class GraphStoreService {
  private pg: PostgresClient;

  constructor(pg?: PostgresClient) {
    this.pg = pg || PostgresClient.getInstance();
  }

  /**
   * Securely populates kg_entities and kg_relationships within the current tenant context.
   * Leverages RLS policies and handles merging & deduplication.
   */
  public async upsertEntitiesAndRelationships(
    extractedGraph: ExtractedGraph,
    sourceChunkId: string
  ): Promise<{ entityIds: Record<string, string>; relationshipIds: string[] }> {
    // 1. Resolve active tenant isolation boundary
    const tenantId = TenantContextManager.getRequiredTenantId();

    // Hold one tenant-scoped transaction lock across every graph mutation.
    // Ingestion may call this service repeatedly for different chunks within
    // the same transaction, so per-call edge sorting alone cannot guarantee a
    // transaction-wide lock order. Document replacement takes this same lock.
    await acquireTenantGraphWriteLock(this.pg, tenantId);

    const entityIds: Record<string, string> = {};
    const relationshipIds: string[] = [];

    // Ensure entities array is valid
    const entities = extractedGraph.entities || [];
    const relationships = extractedGraph.relationships || [];

    // Helper to normalize names
    const normalize = (name: string) => name.trim().toLowerCase();

    // Track whether a node came from an explicit extraction or only from a relationship.
    // A relationship-only name is a placeholder, not an assertion that its type is "concept".
    const entitiesToUpsertMap = new Map<
      string,
      { entity: ExtractedEntity; relationshipOnlyPlaceholder: boolean }
    >();
    for (const ent of entities) {
      if (!ent.name) continue;

      const normalizedName = normalize(ent.name);
      const existing = entitiesToUpsertMap.get(normalizedName);
      if (existing && existing.entity.type !== ent.type) {
        throw new Error(
          `Conflicting extracted KG entity types within tenant ${tenantId}: ${ent.name} (${existing.entity.type} vs ${ent.type}).`
        );
      }

      entitiesToUpsertMap.set(normalizedName, {
        entity: ent,
        relationshipOnlyPlaceholder: false,
      });
    }

    // Identify any entities mentioned in relationships that aren't explicitly listed.
    for (const rel of relationships) {
      const srcNorm = normalize(rel.sourceEntityName);
      const tgtNorm = normalize(rel.targetEntityName);

      if (!entitiesToUpsertMap.has(srcNorm)) {
        entitiesToUpsertMap.set(srcNorm, {
          entity: {
            name: rel.sourceEntityName,
            type: 'concept',
            properties: {},
          },
          relationshipOnlyPlaceholder: true,
        });
      }

      if (!entitiesToUpsertMap.has(tgtNorm)) {
        entitiesToUpsertMap.set(tgtNorm, {
          entity: {
            name: rel.targetEntityName,
            type: 'concept',
            properties: {},
          },
          relationshipOnlyPlaceholder: true,
        });
      }
    }

    // 2. Upsert Entities
    for (const [normName, upsert] of entitiesToUpsertMap.entries()) {
      const { entity: ent, relationshipOnlyPlaceholder } = upsert;

      // Explicit entities match by normalized name + exact type. Placeholders match by
      // normalized name only, always within the active tenant; their fallback type must
      // not split evidence already stored under a more specific type.
      const selectSql = relationshipOnlyPlaceholder
        ? `
          SELECT id, type, properties FROM kg_entities
          WHERE tenant_id = $2
            AND LOWER(BTRIM(name)) = LOWER(BTRIM($1))
          ORDER BY created_at ASC
          LIMIT 2;
        `
        : `
          SELECT id, type, properties FROM kg_entities
          WHERE tenant_id = $2
            AND LOWER(BTRIM(name)) = LOWER(BTRIM($1))
            AND type = $3
          ORDER BY created_at ASC
          LIMIT 2;
        `;
      const selectParams = relationshipOnlyPlaceholder
        ? [ent.name, tenantId]
        : [ent.name, tenantId, ent.type];
      const res = await this.pg.query(selectSql, selectParams);
      const existingCount = res.rowCount ?? res.rows.length;
      if (existingCount > 1) {
        const identityDescription = relationshipOnlyPlaceholder
          ? `${ent.name} (relationship-only placeholder)`
          : `${ent.name} (${ent.type})`;
        throw new Error(
          `Ambiguous extracted KG identity within tenant ${tenantId}: ${identityDescription}.`
        );
      }

      let entityId: string;
      let entityTypeForResolution = ent.type;
      const properties = ent.properties || {};

      if (existingCount === 1) {
        // Entity exists: preserve its persisted type and merge only explicit properties.
        const row = res.rows[0];
        entityId = row.id;
        entityTypeForResolution = row.type || ent.type;

        const existingProperties = typeof row.properties === 'string'
          ? JSON.parse(row.properties)
          : (row.properties || {});

        const mergedProperties = {
          ...existingProperties,
          ...properties,
        };

        const updateSql = `
          UPDATE kg_entities
          SET properties = $1, updated_at = NOW()
          WHERE id = $2 AND tenant_id = $3
          RETURNING id;
        `;
        await this.pg.query(updateSql, [JSON.stringify(mergedProperties), entityId, tenantId]);
      } else {
        // Entity does not exist: create a new observation using the explicit or fallback type.
        entityId = crypto.randomUUID();

        const insertSql = `
          INSERT INTO kg_entities (id, tenant_id, name, type, properties, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
          RETURNING id;
        `;
        const params = [
          entityId,
          tenantId,
          ent.name,
          ent.type,
          JSON.stringify(properties),
        ];
        await this.pg.query(insertSql, params);
      }

      // Resolve extracted observations to canonical domain Entities without creating or
      // mutating canonical records. Only one exact normalized-name + exact-type match qualifies.
      const canonicalResult = await this.pg.query(
        `SELECT id FROM entities
         WHERE organization_id = $1
           AND deleted_at IS NULL
           AND LOWER(BTRIM(name)) = LOWER(BTRIM($2))
           AND LOWER(BTRIM(entity_type)) = LOWER(BTRIM($3))
         ORDER BY created_at ASC
         LIMIT 2;`,
        [tenantId, ent.name, entityTypeForResolution]
      );
      const canonicalCount = canonicalResult.rowCount ?? canonicalResult.rows.length;
      const canonicalEntityId = canonicalCount === 1 ? canonicalResult.rows[0].id : null;
      const resolutionStatus = canonicalCount === 1 ? 'matched' : canonicalCount > 1 ? 'ambiguous' : 'unresolved';

      await this.pg.query(
        `UPDATE kg_entities AS kg
         SET canonical_entity_id = $1,
             resolution_status = $2,
             resolution_method = CASE WHEN $2 = 'matched' THEN 'exact_name_type' ELSE NULL END,
             resolved_at = CASE WHEN $2 = 'matched' THEN NOW() ELSE NULL END,
             source_chunk_ids = (
               SELECT COALESCE(jsonb_agg(DISTINCT source_id), '[]'::jsonb)
               FROM jsonb_array_elements_text(
                 (CASE WHEN jsonb_typeof(kg.source_chunk_ids) = 'array'
                   THEN kg.source_chunk_ids ELSE '[]'::jsonb END) || jsonb_build_array($3::text)
               ) AS source(source_id)
             ),
             updated_at = NOW()
         WHERE kg.id = $4 AND kg.tenant_id = $5;`,
        [canonicalEntityId, resolutionStatus, sourceChunkId, entityId, tenantId]
      );

      entityIds[normName] = entityId;
    }

    // 3. Upsert Relationships
    for (const rel of relationships) {
      const srcNorm = normalize(rel.sourceEntityName);
      const tgtNorm = normalize(rel.targetEntityName);

      const sourceId = entityIds[srcNorm];
      const targetId = entityIds[tgtNorm];

      if (!sourceId || !targetId) {
        console.warn(
          `[GraphStoreService] Skipping relationship: unable to resolve source/target IDs for ${rel.sourceEntityName} -> ${rel.targetEntityName}`
        );
        continue;
      }

      const relType = rel.relationshipType || 'associated_with';
      const incomingProperties: Record<string, unknown> = { ...(rel.properties || {}) };
      // Provenance and migration markers are server-owned; ignore any such values
      // supplied by extraction output.
      delete incomingProperties.source_chunk_id;
      delete incomingProperties.source_chunk_ids;
      delete incomingProperties.source_provenance_incomplete;

      // Check if relationship already exists within this tenant.
      const selectRelSql = `
        SELECT id, properties FROM kg_relationships
        WHERE tenant_id = $4 AND source_entity_id = $1 AND target_entity_id = $2
          AND LOWER(relationship_type) = LOWER($3)
        LIMIT 1;
      `;
      const resRel = await this.pg.query(selectRelSql, [sourceId, targetId, relType, tenantId]);

      let relationshipId: string;

      if (resRel.rowCount && resRel.rowCount > 0) {
        // Relationship exists: Merge properties and update
        const row = resRel.rows[0];
        relationshipId = row.id;

        const existingProperties = typeof row.properties === 'string'
          ? JSON.parse(row.properties)
          : (row.properties || {});

        const mergedProperties = { ...existingProperties, ...incomingProperties };
        // Let PostgreSQL append provenance from the row's current value under its
        // row lock; an application-side read/merge/write could lose concurrent sources.
        delete mergedProperties.source_chunk_id;
        delete mergedProperties.source_chunk_ids;

        const updateRelSql = `
          UPDATE kg_relationships AS relationship
          SET properties = (
            (relationship.properties - 'source_chunk_id' - 'source_chunk_ids')
            || $1::jsonb
            || jsonb_build_object(
              'source_chunk_ids',
              COALESCE((
                SELECT jsonb_agg(DISTINCT known_source.source_id)
                FROM jsonb_array_elements_text(
                  (CASE WHEN jsonb_typeof(relationship.properties -> 'source_chunk_ids') = 'array'
                    THEN relationship.properties -> 'source_chunk_ids' ELSE '[]'::jsonb END)
                  || (CASE WHEN jsonb_typeof(relationship.properties -> 'source_chunk_id') = 'string'
                    THEN jsonb_build_array(relationship.properties ->> 'source_chunk_id') ELSE '[]'::jsonb END)
                  || jsonb_build_array($2::text)
                ) AS known_source(source_id)
                WHERE known_source.source_id IS NOT NULL
              ), '[]'::jsonb)
            )
            || CASE WHEN jsonb_typeof(relationship.properties -> 'source_chunk_id') = 'string'
                THEN jsonb_build_object('source_provenance_incomplete', TRUE)
                ELSE '{}'::jsonb END
          ),
          updated_at = NOW()
          WHERE id = $3 AND tenant_id = $4
          RETURNING id;
        `;
        await this.pg.query(updateRelSql, [JSON.stringify(mergedProperties), sourceChunkId, relationshipId, tenantId]);
      } else {
        // Relationship does not exist: Create new UUID and insert
        relationshipId = crypto.randomUUID();

        const insertRelSql = `
          INSERT INTO kg_relationships (id, tenant_id, source_entity_id, target_entity_id, relationship_type, properties, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
          RETURNING id;
        `;
        const params = [
          relationshipId,
          tenantId,
          sourceId,
          targetId,
          relType,
          JSON.stringify({ ...incomingProperties, source_chunk_ids: [sourceChunkId] }),
        ];
        await this.pg.query(insertRelSql, params);
      }

      relationshipIds.push(relationshipId);
    }

    return { entityIds, relationshipIds };
  }
}
