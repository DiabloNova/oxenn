# Legacy TableDefinitions

## Purpose
This directory contains legacy modules that define database schemas using the older `TableDefinition` system. They have been moved here during Phase 3 of the Migration Consolidation (J-017) to physically quarantine them and prevent new dependencies from being introduced.

## Provenance
These modules were part of the pre-Drizzle `TableDefinition` system and use an object-based schema definition rather than standard Drizzle ORM definitions. All actively used database tables are now centrally defined in `database/schema/index.ts`.

## List of Moved Files
* `admin/`
* `aeo-content-intelligence.ts`
* `ai-visibility-audit.ts`
* `brand-intelligence.ts`
* `brand.ts`
* `citation-intelligence.ts`
* `competitive-seo-finding.ts`
* `diagnostic.ts`
* `keyword.ts`
* `page.ts`
* `topic.ts`
* `website.ts`

## Rules
* **DO NOT** import anything from this directory in any new code.
* Existing code should ideally be migrated away from these legacy files.
* Do not attempt to reconcile column definitions here with the canonical schemas.
