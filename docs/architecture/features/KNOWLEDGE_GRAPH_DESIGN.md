# Semantic Knowledge Graph Architecture Design

This document defines the authoritative domain graph and the extracted evidence graph. They are related through an explicit, tenant-scoped resolution contract; they are not interchangeable stores.

## 1. Source of truth and graph boundaries

- **Canonical domain graph — `entities` and `entity_relationships`:** the authoritative identity and relationship model owned by an Organization. Domain services and user-facing graph queries read this model.
- **Extraction/evidence graph — `kg_entities` and `kg_relationships`:** observations extracted from documents and chunks. These rows preserve extracted names, types, properties, and provenance. They do not become canonical identities merely because an LLM extracted them.
- **Mapping — `kg_entities.canonical_entity_id`:** nullable reference to the canonical `entities.id`, protected by the composite `(canonical_entity_id, tenant_id) -> (entities.id, organization_id)` foreign key. `resolution_status` is `matched`, `unresolved`, or `ambiguous`. A referenced canonical Entity cannot be physically deleted while evidence points to it; soft deletion preserves the evidence trail.

## 2. Canonical resolution contract

Stage 1 uses only conservative local matching:

1. Match trimmed, case-insensitive name and entity type (exact after normalization).
2. Restrict candidates to the same Organization and active canonical Entities (`deleted_at IS NULL`).
3. Link only when exactly one candidate exists. Zero candidates remain `unresolved`; multiple candidates remain `ambiguous`.
4. Record `resolution_method = exact_name_type`, `resolved_at`, and deduplicated `source_chunk_ids` for a match/evidence trail.
5. Never create a canonical Entity automatically, fuzzy-match, use an LLM-generated ID as identity, or overwrite canonical properties from extraction output.

Future external resolution (including Wikidata) is a separate, explicit workflow and must not bypass this contract.

## 3. Relationship promotion

`kg_relationships` remain extracted evidence edges. They are not copied automatically into `entity_relationships`. A future promotion workflow must validate both canonical endpoint mappings, evidence, confidence, and authorization before creating a canonical domain relationship.

## 4. Tenant integrity

Every KG relationship carries `tenant_id`; both endpoints are enforced by composite foreign keys:

- `(source_entity_id, tenant_id) -> kg_entities(id, tenant_id)`
- `(target_entity_id, tenant_id) -> kg_entities(id, tenant_id)`

The migration preflights existing rows and fails without rewriting data if either endpoint is missing or belongs to another tenant. RLS remains an additional access boundary, not a substitute for relational integrity.

## 5. Production provider behavior

Mock LLM and deterministic extraction fixtures are restricted to tests and non-production development. Production requires `GOOGLE_AI_API_KEY` and a usable Gemini model; missing provider configuration fails closed. Knowledge Graph query responses return an empty graph when no canonical Entity exists and never synthesize demo nodes.
