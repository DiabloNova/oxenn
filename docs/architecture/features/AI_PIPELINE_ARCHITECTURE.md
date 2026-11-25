# AI Processing Pipeline Architecture

This document describes the processing boundaries for extraction, canonical resolution, and evidence promotion.

## 1. Pipeline stages

1. **Extraction:** configured model providers extract candidate entities and relationships from source text.
2. **Evidence persistence:** `kg_entities` and `kg_relationships` retain extracted observations and source-chunk provenance under the active tenant.
3. **Canonical resolution:** exact normalized-name plus exact-type matching is performed only within the same Organization. A unique match links an observation to `entities`; zero or multiple matches remain unresolved or ambiguous.
4. **Evidence review and promotion (future):** extracted relationships are not automatically promoted to `entity_relationships`. A separate verified workflow must authorize promotion after checking both canonical endpoints and provenance.
5. **External entity resolution (future):** Wikidata or other external identity resolution remains separate from Stage 1 local matching.

## 2. Canonical data contract

`entities` / `entity_relationships` are the authoritative domain model. `kg_entities` / `kg_relationships` are the extraction/evidence layer. Extraction never creates canonical records and never overwrites canonical properties. `kg_entities.canonical_entity_id` is protected by a composite tenant-aware foreign key and its status is one of `matched`, `unresolved`, or `ambiguous`.

## 3. Provider configuration and mock policy

Tests and non-production development may use deterministic mock clients. Production must use a configured provider: `GOOGLE_AI_API_KEY` is mandatory, and graph extraction fails closed if the Gemini model is unavailable. No deterministic mock extraction or synthetic graph fallback is permitted in production responses.
