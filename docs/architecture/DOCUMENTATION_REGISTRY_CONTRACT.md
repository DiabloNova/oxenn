---
visibility: internal
---

# Oxenn Documentation Registry Contract

**Contract version:** 1.0  
**Status:** Normative architecture contract for the documentation-registry workstream  
**Prepared against:** `DiabloNova/oxenn` `main@b56517bc436a8cd03ef75bfac8adbf43c8567753`  
**Scope:** Document structure, identity, canonical paths, collections, publication policy, compatibility, and implementation acceptance gates  
**Implementation status:** Contract only. This document does not authorize runtime, UI, API, generator, dependency, deployment, or database changes.

---

## 1. Purpose and governing principles

This contract establishes one unambiguous model for identifying, classifying, indexing, and retrieving Markdown documentation in Oxenn.

The contract is intended to prevent:

- runtime directory traversal and dynamically constructed file access in request handlers;
- duplicate-slug collisions and accidental retrieval of the wrong document;
- accidental publication of internal or draft material;
- divergence between metadata indexes and full-content data;
- accidental mixing of public product documentation with engineering documentation;
- breaking existing API consumers or changing the set of documents exposed during migration.

The following principles are mandatory:

1. Markdown source files remain the authoring source of truth.
2. A document has one canonical source path and one canonical registry identity.
3. Slugs, titles, category names, and directory basenames are labels, not document identity.
4. Publication is explicit and fail-closed for new or unclassified documents.
5. Metadata and content registries are generated from the same source snapshot.
6. Request-time code resolves a registry identity; it never discovers files.
7. Internal content is excluded from public indexes, content payloads, search data, and client bundles.
8. Existing behavior is preserved through an explicit migration baseline, not by silently retaining ambiguous lookup behavior forever.
9. Public product documentation and engineering documentation remain separate publication collections and route experiences.
10. A generated artifact is never edited manually; the owning generator is its only writer.

## 2. Terminology

| Term | Meaning |
|---|---|
| Source document | An authored Markdown file in the repository |
| Collection | A publication and routing boundary, not a folder label chosen by a request |
| Canonical source path | Repository-root-relative POSIX path identifying the source file |
| Canonical document ID | Stable registry key derived from collection and canonical collection-relative path |
| Slug | Human-readable URL/display token; not guaranteed unique |
| Domain | Navigation grouping or legacy API selector; not identity |
| Metadata index | Client-safe list/search data without full document content |
| Content registry | Server-only mapping from canonical document ID to approved content and metadata |
| Publication baseline | Audited set of documents intentionally exposed before the new policy is enforced |
| Alias | A retained old ID or URL mapping to a document after a controlled path move or rename |

## 3. Collections and routing boundaries

The registry model defines two initial collections. Collection membership is derived from the repository source root and cannot be overridden by Markdown front matter or request parameters.

### 3.1 Engineering documentation

- Source root: `docs/`
- Excluded from the legacy engineering collection: `docs/public/`, `docs/project/`, and `docs/images/`.
- Existing engineering documentation experience: `/[locale]/docs`.
- Existing API compatibility surface: `/api/v1/docs`.
- The engineering collection may contain public and internal documents. A document's presence under `docs/` does not itself authorize public exposure.

The `docs/project/` exclusion is a publication boundary for the legacy public-facing engineering registry. It does not mean those files cease to exist or cannot be inventoried by an explicitly internal audit process.

### 3.2 Public product documentation

- Source root: `docs/public/`.
- Language-specific canonical sources currently include `docs/public/fa/README.md` and `docs/public/en/README.md`.
- Route: `/[locale]/public-docs`.
- This collection must not be inserted into the legacy engineering `DOCS_INDEX` or served through the legacy engineering docs API.
- The existing dedicated public-docs implementation uses fixed, allowlisted source paths at static generation time. Preserve that separation.

A shared build orchestration process may validate or generate both collections, but their registries, publication decisions, route contracts, and client-facing indexes remain logically separate. A shared generator does not imply a shared public document list.

## 4. Canonical path contract

Every source document has a canonical source path with these rules:

1. The path is relative to the repository root.
2. It uses POSIX `/` separators on every platform.
3. It is case-sensitive and preserves the exact repository path casing.
4. It has no leading slash, empty segment, `.` segment, or `..` segment.
5. It is normalized to Unicode NFC before comparison and ID derivation.
6. It must resolve to one tracked Markdown source file under the collection's fixed root.
7. It must not be a symlink that resolves outside the permitted collection root.
8. A request parameter is never concatenated with this path or passed to filesystem APIs.

Examples:

| Source path | Collection-relative path |
|---|---|
| `docs/README.md` | `README.md` |
| `docs/architecture/README.md` | `architecture/README.md` |
| `docs/architecture/database/README.md` | `architecture/database/README.md` |
| `docs/public/fa/README.md` | `fa/README.md` in `product-public` |

The canonical source path is stored in repository-root-relative form in generated metadata. For backward compatibility, the legacy API response field `path` continues to be relative to `docs/` and uses POSIX separators.

A document's `domain` must not be inferred from the basename of an arbitrary parent directory when doing canonical lookup. If a domain is needed for navigation, it must be a stable metadata/grouping value or be derived from a documented top-level collection rule. It is never a unique key.

## 5. Canonical document identity

### 5.1 ID format

The initial deterministic ID format is:

```text
<collection>:<collection-relative-canonical-path>
```

Examples:

```text
engineering:README.md
engineering:architecture/README.md
engineering:architecture/database/README.md
product-public:fa/README.md
product-public:en/README.md
```

IDs are opaque identifiers to consumers even though their representation is readable. Consumers must compare the exact ID and must not parse it to construct a filesystem path.

### 5.2 Stability and rename rules

The ID remains unchanged when the document's title, summary, category, locale label, or slug changes, provided its canonical path and collection do not change.

A move between directories or collections is an identity migration. It must:

- create the new canonical ID;
- retain the old ID as an explicit alias to the new ID for a defined compatibility period;
- preserve old public URLs through a deliberate redirect or compatibility resolver where applicable;
- never silently assign an old ID to a different document.

IDs and aliases are case-sensitive. IDs are never reused. A path move must not be performed as an incidental cleanup.

This path-derived scheme avoids introducing random IDs or a second manually maintained ID database for the existing corpus. If a future requirement demands identity that survives arbitrary source-path moves without aliases, that is a new contract version and requires a separately reviewed migration; it must not be improvised during implementation.

### 5.3 Uniqueness

- Duplicate canonical IDs are a hard generation error.
- Duplicate canonical source paths are impossible by construction and must be rejected if encountered through conflicting inputs.
- Duplicate slugs, titles, category names, or directory basenames are allowed.
- Slugs and titles must never be used as React keys, registry primary keys, or exact API identity.
- UI lists use canonical IDs as stable keys.

## 6. Document metadata contract

The generated registry uses a versioned schema. The following is the logical contract; it is not yet a TypeScript implementation.

### 6.1 Required registry fields

| Field | Type | Rule |
|---|---|---|
| `schemaVersion` | integer | Registry schema version; starts at `1` |
| `id` | string | Canonical ID from section 5 |
| `collection` | enum | `engineering` or `product-public`; derived from source root |
| `sourcePath` | string | Canonical repository-root-relative path |
| `relativePath` | string | Collection-relative path; for legacy engineering API, remains docs-root-relative |
| `slug` | string | Human-readable token; collisions are permitted |
| `title` | string | Display title |
| `visibility` | enum | `public`, `internal`, or `draft` |
| `locale` | string or null | Supported document locale when applicable |
| `domain` | string or null | Navigation grouping only; never identity |

### 6.2 Optional metadata

- `summary` / `snippet`: short, sanitized description for list/search surfaces.
- `category`: navigation grouping, not an identity field.
- `aliases`: explicitly retained old IDs or route tokens.
- `contentHash`: deterministic digest used to detect source/index drift.

The generator may derive title, slug, summary, and category from established repository conventions when metadata is absent, but those derivations must be deterministic and must not affect identity or publication.

### 6.3 Content field separation

Full Markdown content belongs only in the server-side content registry. It must not be included in the client-safe metadata index.

Both generated outputs must be produced from the same validated source snapshot and carry the same schema version. A metadata entry must never point to missing or mismatched content.

The final packaging shape (one server-only generated module versus multiple statically imported content modules) is intentionally deferred until the total approved corpus size and Next.js build-tracing behavior are measured. Whichever shape is selected must use statically analyzable imports/paths and must not reintroduce request-time directory discovery.

## 7. Publication and visibility policy

### 7.1 Allowed values

The only initial visibility values are:

- `public`: approved for unauthenticated public publication within its collection's route and API contract.
- `internal`: retained for internal engineering use; excluded from all public indexes, APIs, search payloads, sitemaps, metadata, and client bundles.
- `draft`: not published or served by any production documentation route or API.

Collection and visibility are separate concepts. A document under `docs/public/` is in the product-public collection, but it still must pass the collection's publication allowlist. A document under `docs/` is not automatically public.

### 7.2 Default and fail-closed behavior

For all newly authored or newly discovered documents, missing, malformed, unsupported, or ambiguous visibility metadata resolves to `internal` and the document is not included in a public registry.

Only the exact value `public` grants public inclusion. Unknown values must fail the generator or be excluded with an actionable build error; they must never be interpreted as public.

Collection membership is determined from the fixed source root, not from front matter. Front matter cannot promote a document from an excluded directory into a public collection.

### 7.3 Existing-document migration safety

The current helper `isPublicDocumentation` returns true when no opening front matter block or explicit `visibility: internal` declaration is found. This is a legacy public-by-default rule and is not the target policy.

Do not simply invert this helper in one change. That would silently remove existing documents from the API and could break consumers. Do not retain the legacy rule as the permanent policy either.

Before enforcement, Stage 2 must:

1. Capture the exact set of documents currently returned by the legacy API on the chosen implementation base.
2. Reconcile that set against the final merge candidate for PR #145 and any other concurrent docs changes.
3. Review each candidate's intended audience and collection.
4. Produce an explicit, owner-reviewable migration allowlist/classification.
5. Compare old and new exposure sets. Any addition or removal must be individually explained and approved; the migration must not expand exposure by default.
6. Only then switch the generator and runtime to the explicit fail-closed policy.

Existing files without visibility metadata remain in a migration state until classified. They must not be silently assumed public merely because the legacy helper did so, and they must not be silently dropped without the baseline comparison and owner-visible disposition.

### 7.4 Defense in depth

The build-time generator is the primary publication gate. The API must additionally resolve only IDs present in the approved public content registry. An internal or draft document must remain unavailable even if a caller guesses its path, slug, ID, or alias.

Not-found responses for internal, draft, and nonexistent documents must not disclose whether a private source file exists.

## 8. Registry generation and runtime access contract

1. The generator is the only writer of generated documentation artifacts.
2. Generation runs before Next.js build using the existing build lifecycle unless repository evidence justifies a narrowly scoped change.
3. The generator validates source roots, canonical paths, IDs, metadata, visibility, aliases, and local links before emitting output.
4. Output ordering is deterministic; identical source inputs produce byte-for-byte stable generated output.
5. Duplicate IDs, path escapes, invalid metadata, invalid aliases, and missing content are hard errors. No silent partial registry is permitted.
6. Internal and draft content is not serialized into any public artifact.
7. The metadata index contains only fields needed by the client.
8. The content registry is server-only and is not imported by client components.
9. Runtime route handlers perform exact registry lookup by ID. They do not call `readdir`, `existsSync`, `readFile`, or equivalent filesystem discovery for documentation.
10. Runtime code never joins a request-supplied slug, domain, ID, or path to `process.cwd()` or a filesystem root.
11. Build-time filesystem reads are allowed inside the generator. The prohibition concerns request-time discovery and unbounded tracing, not legitimate build-time source scanning.
12. The generator must verify that resolved source files remain inside their fixed collection root and reject escaping symlinks.
13. If the approved corpus is too large for a single generated server module, split content into per-document modules with explicit static imports. Do not choose a packaging strategy before measuring the approved corpus.
14. Generated artifacts must be checked for accidental client imports and unexpected bundle/tracing growth.

## 9. API and compatibility contract

### 9.1 Canonical lookup

The preferred lookup selector is `id`. The API resolves that exact ID against the approved public registry and returns the existing response shape:

```json
{
  "content": "# Document content",
  "path": "architecture/database/README.md"
}
```

The `path` value remains relative to `docs/` for the legacy engineering API. The API does not return an absolute filesystem path.

### 9.2 Legacy selectors

The API must retain the existing `slug` and `domain` selector during migration:

- ordinary slug lookup remains supported when it resolves to exactly one public document;
- `slug=README&domain=root` continues to identify `docs/README.md`;
- nested README lookup by domain remains supported when the legacy domain identifies exactly one document;
- an ambiguous slug/domain combination must not return the first item found by traversal. Return a documented conflict response and require canonical `id`;
- a missing selector remains a client error, an unknown or non-public ID remains 404, and internal existence is not disclosed.

The precise conflict response code and response body must be fixed in API implementation tests before consumers are migrated. Do not change current successful response fields or the meaning of the existing `path` field without an explicit API versioning decision.

### 9.3 Relative Markdown links

Relative Markdown links are resolved from the source document's canonical collection-relative path, not from a slug or directory basename.

- Local links resolve to one canonical target ID.
- Duplicate target slugs do not create ambiguity when the source-relative path identifies one file.
- External absolute URLs and same-document fragment links retain their current behavior.
- Links must not cross collection boundaries implicitly.
- A link to an internal, draft, excluded, or nonexistent target must not expose that target. The generator should report the unresolved link with source context and apply the documented fail/warn policy; it must not guess another same-slug document.

## 10. Legacy generated data and migration constraints

- `src/lib/docsIndex.ts` is currently a generated metadata index. Its generator must be extended rather than creating a parallel, competing metadata generator.
- `src/lib/docsData.ts` contains a separate content dataset. Do not delete, rewrite, or repurpose it until a complete consumer inventory and parity analysis establish that the replacement covers every caller.
- Existing `docs-viewer-links.ts` behavior and all consumers of the docs API must be inventoried before migration.
- The current API's BFS order and the generator's sorted traversal are not identity rules. Runtime lookup must become deterministic by canonical ID.
- Existing route URLs and API response fields must be preserved where unambiguous; ambiguous legacy URLs need explicit aliases or a documented conflict/redirect path.
- The `docs/public` subtree remains excluded from the legacy engineering index and API.

## 11. Required validation and acceptance gates for implementation

Implementation cannot be considered complete until all applicable gates pass:

### Generator and schema

- Valid documents produce deterministic metadata and content entries from one source snapshot.
- Every ID is unique; duplicate slugs are accepted and remain separately addressable.
- Canonical paths are normalized, collection-bounded, and independent of runtime request values.
- Invalid metadata, path traversal, escaping symlinks, duplicate IDs, invalid aliases, and missing source content fail closed.
- Public, internal, and draft fixtures produce exactly the intended registry outputs.
- Generated files have no drift after regeneration.

### Publication safety

- The pre-migration API exposure set is captured and compared with the new allowlist.
- No unapproved document becomes public.
- No existing document is silently removed from the public set.
- Internal and draft content is absent from client bundles, metadata indexes, search results, sitemaps, and API responses.
- Guessing an internal path, slug, ID, or alias returns the same not-found behavior as a nonexistent document.

### API and UI

- Canonical ID lookup returns the exact source document.
- Legacy slug and README/domain lookup tests remain valid for unambiguous documents.
- Ambiguous slug lookup never returns a first-match document.
- Relative links resolve correctly for nested README files and duplicate slugs.
- React list keys use canonical IDs.
- Existing locale, RTL/LTR, and route behavior remains intact.

### Build and deployment packaging

- No request-time filesystem traversal remains in the docs API.
- Next.js build output does not show the existing Dynamic Filesystem Access warning for the docs API.
- Generated content is server-only; client bundle inspection confirms no internal or full-content registry leakage.
- Build output size and file tracing are measured against the pre-change baseline.
- Typecheck, focused tests, relevant full tests, lint, and production build pass.

## 12. Non-goals and explicit exclusions

This contract does not authorize:

- implementing the registry, changing the API, UI, generator, or visibility helper;
- modifying the public-docs route or PR #145;
- modifying the marketing homepage or PR #146;
- taking over or force-claiming TASK-6, which is already claimed by Codex;
- changing other branches, merging, opening a PR, or deploying;
- deleting `docsData.ts` or other generated artifacts before consumer inventory;
- adding a Markdown/YAML dependency;
- changing authentication, authorization, or database behavior;
- broad documentation cleanup or renaming.

## 13. Implementation sequence after this contract

The next implementation phase must start with a fresh read-only reconciliation of `main`, PR #145, the active branch/claim for TASK-6, and all docs-related consumers. The implementation branch must be isolated and its base selected from the then-current, verified merge candidate.

Recommended sequence:

1. Inventory every source document, current API-visible document, route consumer, index consumer, and content-data consumer.
2. Produce and review the explicit legacy publication migration map.
3. Implement the versioned registry schema and generator outputs with parity tests.
4. Migrate API lookup to exact ID while preserving unambiguous legacy selectors.
5. Migrate UI and relative-link resolution to canonical IDs.
6. Verify privacy boundaries, generated artifact drift, Next.js tracing, bundle size, and the full required test/build gates.
7. Remove legacy data only after consumer parity and regression evidence prove it is safe.

No implementation phase is authorized by this contract alone; it requires the user's separate approval.

---

## 14. Repository evidence and unresolved items

### Verified on the contract baseline

- `src/app/api/v1/docs/route.ts` uses runtime `fs.existsSync`, `fs.readdirSync`, and `fs.readFileSync` with breadth-first directory traversal.
- `src/lib/docs-visibility.ts` treats documents as public unless it finds an explicit internal visibility declaration.
- `tests/unit/api/v1/docs.test.ts` covers internal front matter, public documents, nested README/domain behavior, and relative Markdown link rewriting.
- `scripts/docs-index-generator.ts` is part of the existing build-time generation path.
- `src/lib/docsIndex.ts` is a generated metadata index; `src/lib/docsData.ts` is a separate content dataset.
- PR #145 is open and includes public product docs, a public-docs route, and a change to exclude `docs/public` from the legacy generator. Its changes are not part of the recorded `main` baseline.
- TASK-6 is still in progress and claimed by Codex. This contract does not supersede or take over that claim.
- Next.js documentation explains that dynamically analyzed filesystem access can cause broad project tracing; explicit includes/excludes are available for exceptional tracing cases. The preferred contract is to avoid request-time dynamic discovery rather than paper over it with broad tracing includes.

### Unresolved until implementation discovery

- The complete consumer set for `docsData.ts` has not yet been proven exhaustive.
- The complete consumer set for all docs API selectors and `docs-viewer-links.ts` must be established before changing their contracts.
- The exact approved public set for legacy engineering docs requires an explicit migration inventory and owner review.
- The total size of the approved Markdown corpus must be measured before selecting one generated module or statically imported shards.
- The final HTTP status/body for ambiguous legacy lookup must be fixed with consumer compatibility evidence.
- PR #145 may change before merge; its final merged state must be re-inspected rather than assumed from this snapshot.

These items are deliberate gates, not permission to guess. When evidence is incomplete, implementation must stop at the affected boundary and report the missing evidence.
