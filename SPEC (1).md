# SPEC.md

# Seorchable — System Specification

## 0. Document Purpose

This document defines the intended behavior and non-negotiable technical invariants of the Seorchable system.

It describes the **target state** of the system.

It does not describe the current condition of the repository.

It does not authorize changes by itself.

It does not replace:

- `AGENTS.md` — agent instructions and repository-wide behavioral rules.
- `BLUEPRINT.md` — controlled engineering workflow.
- `PLAN.md` — currently authorized work.
- `SKILL.md` — operational procedures.

When the current implementation differs from this specification, the difference must be treated as a discrepancy to investigate, not as evidence that the specification is automatically wrong.

---

# 1. Source-of-Truth Model

The repository must distinguish between four different kinds of truth.

### 1.1 Current State

What the repository and runtime currently contain.

Current state must be established by inspecting the actual repository and, where applicable, the actual database/runtime state.

### 1.2 Intended State

What this specification requires the system to provide.

### 1.3 Authorized Change

What the active `PLAN.md` permits the agent to change now.

### 1.4 Verified State

What has actually been demonstrated through inspection, tests, or other appropriate verification.

These concepts must never be silently conflated.

In particular:

> The presence of a requirement in this document does not prove that the repository currently implements it.

---

# 2. Product Definition

Seorchable is a multi-tenant SaaS platform for analyzing and improving the visibility, discoverability, representation, and competitive position of websites, brands, entities, content, and related digital properties across search engines and AI-powered answer systems.

The product combines conventional SEO intelligence with AI visibility, answer-engine optimization, entity intelligence, competitive intelligence, content intelligence, and related analysis workflows.

The system must allow users to transform collected and analyzed data into understandable intelligence and actionable workflows.

The platform must preserve the security and ownership boundaries of the organizations/workspaces that own that data.

---

# 3. Core Product Model

The system conceptually operates through the following lifecycle:

    USER
      ↓
    WORKSPACE
      ↓
    DIGITAL ASSETS
      ↓
    DATA COLLECTION
      ↓
    NORMALIZATION
      ↓
    ANALYSIS
      ↓
    INTELLIGENCE
      ↓
    REPORTING / RECOMMENDATIONS
      ↓
    USER ACTION

The implementation may use different internal services, queues, tables, or processing stages, but the following properties must remain true:

1. Data must have an identifiable owner.
2. Analysis must operate on the correct owner's data.
3. Results must remain associated with their originating context.
4. Protected data must not cross workspace boundaries.
5. AI-generated conclusions must not be represented as verified source data without appropriate evidence.

---

# 4. Multi-Tenant Architecture

Seorchable is a multi-tenant system.

The primary security boundary for tenant-owned resources is the organization/workspace to which the resource belongs.

A user's identity and a workspace's identity are separate concepts.

The relationship is represented through membership.

Conceptually:

    USER
      │
      └── MEMBERSHIP ──→ WORKSPACE / ORGANIZATION
                              │
                              ├── websites
                              ├── analyses
                              ├── documents
                              ├── projects
                              ├── credits
                              └── other tenant resources

A user must not gain access to a workspace merely because they know its identifier.

---

# 5. Tenant Isolation Invariant

Tenant isolation is a mandatory security invariant.

For every tenant-owned resource:

    authenticated identity
        +
    verified membership / authorization
        +
    correct tenant context
        +
    resource ownership
        =
    authorized access

The exact combination depends on the operation, but no protected operation may omit the authorization boundary required by its domain.

Changing a client-supplied:

- `workspaceId`;
- `organizationId`;
- `tenantId`;
- resource ID;

must never be sufficient to cross a tenant boundary.

---

# 6. Authentication and Authorization Boundary

Authentication answers:

> Who is this requester?

Authorization answers:

> What may this authenticated identity access or modify?

Tenant context answers:

> Within which authorized workspace is this operation occurring?

These are separate security decisions.

The application must not treat authentication as automatic authorization for every workspace.

Likewise, possessing a workspace identifier must not be treated as evidence of membership.

Client-side routing guards and UI visibility are not authorization mechanisms.

Protected operations must enforce authorization on a trusted server-side boundary.

---

# 7. Identity Model

The system must maintain distinct concepts for:

- User.
- Organization/workspace.
- Membership.
- Role.
- Session.
- Authentication token.
- Password-reset token.
- Email-verification token.
- Tenant-owned resource.

The database model must preserve these relationships explicitly.

A user may have relationships with multiple workspaces where the product model permits it.

A workspace must have an explicit membership relationship to each user who is authorized to operate within it.

---

# 8. Registration

Registration must create the initial account state consistently.

Where registration creates both a user and a workspace, the logically dependent database records must be created atomically.

The intended registration sequence is:

    validate input
        ↓
    normalize email
        ↓
    create unverified user
        ↓
    create workspace / organization
        ↓
    create owner membership
        ↓
    create verification-token state
        ↓
    commit transaction
        ↓
    send verification message

The exact implementation may vary, but the following invariants must hold:

- Invalid input is rejected.
- Email addresses are normalized consistently.
- A newly registered account begins unverified.
- The initial workspace uses the submitted workspace name when workspace creation is part of registration.
- The initial membership has the explicitly defined owner-level role.
- Registration does not create an authenticated session for an account that still requires email verification.
- Verification messaging must not be treated as successfully delivered merely because the database transaction succeeded.

---

# 9. Duplicate Registration Behavior

Registration must not unnecessarily disclose whether an email address already belongs to an account.

Where the public registration contract uses a uniform success response for an existing email, the response shape must remain indistinguishable from the normal registration response.

An existing-account path must not create duplicate:

- users;
- workspaces;
- memberships;
- verification tokens;
- other registration records.

The implementation must not introduce a practical timing or response-shape side channel whose purpose is to reveal account existence.

---

# 10. Password Authentication

Password authentication must use a secure password-hashing algorithm.

For password-based authentication, Argon2id is the intended password hashing mechanism.

The system must never store plaintext passwords.

Authentication failures must not expose unnecessary internal information.

Where the authentication contract requires a generic login error, the public response must not distinguish among:

- nonexistent account;
- incorrect password;
- inactive account;
- unverified account.

The internal implementation may distinguish these states when required for correct processing, logging, or control flow, but the public authentication boundary must preserve the required anti-enumeration behavior.

---

# 11. Email Verification

Email verification must use a cryptographically secure, high-entropy token.

The intended model is:

    raw token
        ↓
    sent to user
        ↓
    cryptographic hash stored in database
        ↓
    token presented
        ↓
    hash / lookup
        ↓
    validate purpose
        ↓
    validate expiration
        ↓
    atomically consume
        ↓
    mark account verified

The raw token must not be stored as a durable plaintext database credential.

Verification tokens must be:

- unpredictable;
- sufficiently high entropy;
- purpose-specific;
- time-limited;
- single-use.

An expired or already-used token must not successfully verify an account.

Issuing a replacement verification token must invalidate or supersede the previous usable token according to the token lifecycle contract.

---

# 12. Password Reset

Password reset must use a security model equivalent in strength to email verification.

Password-reset tokens must be:

- high entropy;
- unpredictable;
- purpose-specific;
- time-limited;
- single-use;
- stored in hashed form rather than as durable raw tokens.

A password-reset token must never be accepted as an email-verification token.

A successful password reset must invalidate previously issued authenticated sessions according to the session invalidation mechanism.

The public password-reset request must not unnecessarily reveal whether the submitted email belongs to an account.

---

# 13. Authentication Token Model

Where email verification and password reset share the same lifecycle, the system should represent them through one canonical authentication-token model with an explicit purpose.

The conceptual fields are:

    id
    user_id
    token_hash
    purpose
    expires_at
    used_at
    created_at

The required purposes are:

    email_verification
    password_reset

Purpose is a security boundary.

A token for one purpose must never be accepted for another purpose.

The database must enforce appropriate uniqueness and indexing for secure and efficient token lookup.

---

# 14. Token Consumption

Token consumption must be atomic.

The implementation must prevent two concurrent requests from successfully consuming the same single-use token.

The token state transition is conceptually:

    unused + valid
          ↓
       consumed

and not:

    unused + valid
          ↓
    request A reads unused
    request B reads unused
          ↓
    both succeed

Database constraints, transactional locking, or equivalent concurrency controls must enforce the single-use invariant.

---

# 15. Session Model

Authenticated sessions must be cryptographically protected and server-controlled.

A session must represent an authenticated identity rather than arbitrary client-provided authorization state.

The session lifecycle must support:

- creation;
- validation;
- expiration;
- logout;
- invalidation;
- security-sensitive revocation.

Where session versioning is part of the design, the authoritative user/session version must be checked so that previously issued sessions can be invalidated centrally.

Security-sensitive account changes such as password reset must invalidate sessions according to the defined session-version contract.

---

# 16. Session Secret

The cryptographic secret required for session security must be explicitly configured.

A missing required session secret is a configuration failure.

The application must fail closed rather than silently creating an ephemeral production secret.

A randomly generated fallback secret must not be used as a substitute for the required persistent configuration.

---

# 17. Authentication Cookies

Authentication cookies must contain only the information required by the session design.

The system must not rely on plaintext client-controlled cookies containing:

- user IDs;
- tenant IDs;
- workspace IDs;
- roles;
- authorization decisions;

as proof of authentication or authorization.

Cookies used for authentication must use appropriate security attributes, including where applicable:

- `HttpOnly`;
- `Secure`;
- `SameSite`;
- appropriate path;
- controlled expiration.

The exact values must follow the application's runtime and deployment requirements.

---

# 18. Logout

Logout must invalidate the authenticated session.

It must also clear the relevant authentication cookies.

Legacy authentication mechanisms must not remain silently usable after the authoritative authentication mechanism has been established.

A logout operation that only redirects the browser while leaving a valid session active does not satisfy the session contract.

---

# 19. Role-Based Access Control

The workspace authorization model includes:

    super_admin
    workspace_admin
    viewer

Roles represent authorization capabilities, not UI states.

The system must define permissions explicitly.

The following principle is mandatory:

> Hiding an interface element does not authorize or deny the underlying operation.

Every protected mutation and protected data-access operation must perform the required server-side authorization.

System-level administration must remain distinct from ordinary workspace membership where the domain model requires it.

---

# 20. Database Architecture

PostgreSQL is the primary relational database.

Drizzle ORM is the intended schema and migration tooling layer.

Canonical application schema definitions reside under:

    database/schema/

The database schema must have one coherent canonical representation.

Schema aggregation must not accidentally expose obsolete competing definitions.

---

# 21. Database Integrity

The database must preserve:

- primary-key integrity;
- foreign-key integrity;
- uniqueness constraints;
- appropriate nullability;
- correct data types;
- ownership relationships;
- tenant boundaries;
- transaction boundaries.

Security and ownership invariants must not depend exclusively on application-level conventions when the database can enforce the invariant safely.

Where appropriate, database constraints should provide the final integrity boundary.

---

# 22. Migration Integrity

Migration history is historical state.

Historical migrations must not be rewritten merely to make the current schema generator succeed.

The migration system must preserve a traceable sequence of intentional database transitions.

The relationship is:

    schema definition
        ↓
    migration generation
        ↓
    migration file
        ↓
    migration metadata / snapshot
        ↓
    migration journal
        ↓
    database state

A disagreement between these layers is a database-integrity issue and must be investigated.

Migration tooling must not be allowed to silently reinterpret an existing schema history.

Unexpected:

- table renames;
- column renames;
- dropped columns;
- dropped tables;
- changed foreign keys;
- changed indexes;
- changed constraints;

must be explicitly understood before acceptance.

---

# 23. Database Migration Baseline

A migration baseline must be considered trustworthy only when:

1. The canonical schema has been inspected.
2. Existing migration history has been inspected.
3. The migration journal has been inspected.
4. Relevant snapshots/metadata have been inspected.
5. The migration configuration has been inspected.
6. Conflicting representations have been identified and resolved.
7. The resulting migration transition is understood.

A successful migration-generation command alone does not establish baseline correctness.

---

# 24. Tenant-Aware Database Access

Tenant-scoped database operations must execute within the correct authenticated and authorized tenant context.

Where PostgreSQL Row-Level Security is used, RLS is a security boundary.

Application code must not treat RLS as merely an optional defense for UI bugs.

Tenant context must be scoped safely to the relevant request/transaction/connection.

A reused database connection must never retain tenant context from a previous request.

A missing tenant context must fail safely for operations that require tenant context.

---

# 25. Row-Level Security

Where RLS is part of the database design:

- policies must reflect the intended ownership model;
- policies must not accidentally permit unrestricted access;
- system-level access must be explicit;
- tenant context must be established safely;
- policy behavior must be tested for both positive and negative cases.

RLS policies must be reviewed together with the application code that establishes database context.

Neither layer should be assumed correct in isolation.

---

# 26. Transactional Boundaries

Transactions must protect operations whose records form one logical invariant.

Examples include:

- account/workspace creation;
- membership creation;
- security-token creation;
- password-reset state changes;
- credit application;
- payment-event processing;
- other multi-record security or financial state transitions.

A transaction must cover the complete invariant it is intended to protect.

A sequence of independent operations is not equivalent to a transaction merely because the operations are executed sequentially.

---

# 27. Idempotency

Operations that can be retried must define their idempotency behavior.

This includes, where applicable:

- webhook processing;
- background jobs;
- payment events;
- token consumption;
- external provider callbacks;
- expensive analysis jobs.

For database-enforced uniqueness, application-level "check then insert" logic must not be treated as sufficient protection against races.

The database constraint must remain authoritative.

---

# 28. Credits and Payment State

Credits represent value-bearing application state and must be treated as integrity-sensitive.

Credit mutations must be:

- attributable;
- tenant-scoped;
- transactionally consistent;
- protected against duplicate application.

Payment events must be associated with the correct workspace through authoritative server-side state.

A client-provided workspace identifier must not be trusted as the ownership source for a payment event when ownership can be derived from the payment/provider state.

---

# 29. Payment Webhooks

Payment webhooks must verify authenticity before changing trusted application state.

Where HMAC verification is used:

- the raw request body must be used;
- required timestamp material must be authenticated;
- stale events must be rejected;
- malformed signatures must be rejected;
- timing-safe comparison must be used where appropriate.

A valid provider event may be retried.

The same provider event must therefore not apply its financial effect more than once.

A duplicate event should be handled idempotently rather than treated as a new payment.

---

# 30. External Services

External services include AI providers, email providers, crawling infrastructure, payment providers, and other third-party systems.

External integrations must remain behind explicit boundaries.

Credentials must remain server-side.

External-provider failures must not silently bypass:

- authorization;
- tenant isolation;
- credit controls;
- rate limits;
- transaction boundaries;
- security logging rules.

External services are not authoritative for Seorchable's internal ownership model unless explicitly defined as such.

---

# 31. Email Delivery

Email delivery is an external side effect.

Where a database transaction creates security state and an email must communicate that state:

    database transaction
        ↓
    COMMIT
        ↓
    send email

The application must not send an email that references security state that may subsequently roll back.

If email delivery is unavailable, the application must not expose raw security tokens through unsafe logs merely to make development easier.

---

# 32. Logging and Secret Handling

The following must never be written to ordinary application logs in raw form:

- passwords;
- session secrets;
- API credentials;
- raw verification tokens;
- raw password-reset tokens;
- sensitive authentication cookies.

Development fallbacks must remain redacted.

Logs should provide enough information to diagnose failures without becoming an alternate credential store.

---

# 33. Rate Limiting

Security-sensitive and resource-intensive operations must have appropriate abuse protection.

Relevant operations may include:

- login;
- registration;
- email verification;
- verification resend;
- password reset;
- password-reset resend;
- expensive AI requests;
- expensive crawling operations;
- sensitive APIs.

Rate limiting must not introduce an account-enumeration side channel through materially different public behavior.

Where an external rate-limit service is optional, the application must have an explicitly defined safe behavior when that service is unavailable.

---

# 34. Input Validation

All untrusted input must be validated at the server boundary.

Validation must cover, as applicable:

- required fields;
- data types;
- string lengths;
- ranges;
- identifiers;
- URLs;
- enum values;
- structured objects;
- security-sensitive parameters.

Validation does not establish authorization.

A syntactically valid identifier belonging to another tenant remains unauthorized.

---

# 35. API and Server Action Contract

Protected API routes and server actions should follow this conceptual order:

    RECEIVE INPUT
        ↓
    VALIDATE
        ↓
    AUTHENTICATE
        ↓
    AUTHORIZE
        ↓
    ESTABLISH TENANT CONTEXT
        ↓
    EXECUTE DOMAIN OPERATION
        ↓
    PERSIST / INTEGRATE
        ↓
    RETURN RESULT

The exact order may vary where technically necessary, but no step may be omitted when required by the operation.

Client input must not bypass the trusted security context.

---

# 36. SSRF and Server-Side Fetching

Any feature that fetches user-influenced URLs must treat the URL as untrusted input.

The application must validate outbound targets before making server-side requests.

SSRF protections must consider:

- private networks;
- loopback addresses;
- internal services;
- metadata endpoints;
- DNS resolution behavior;
- redirects;
- protocol restrictions;
- alternate IP representations.

The crawler/integration layer must not assume that a syntactically valid URL is a safe server-side destination.

---

# 37. Crawling

Website crawling is a product capability and a security-sensitive network operation.

Crawler jobs must:

- operate within the correct workspace context;
- validate outbound destinations;
- preserve ownership of collected data;
- distinguish crawl state from analysis state;
- handle failures explicitly;
- avoid cross-tenant persistence.

Crawler retries must not create uncontrolled duplicate records where idempotency is required.

---

# 38. AI Processing

AI processing must preserve the distinction between:

    source evidence
    deterministic computation
    retrieved information
    model-generated output
    persisted canonical data
    user-authored content

These categories must not be silently collapsed into one another.

AI-generated text or analysis is not automatically authoritative merely because it was generated successfully.

Where a workflow requires grounded output, insufficient evidence must remain representable.

The system must not fabricate citations, evidence, source facts, or verification status.

---

# 39. Deterministic Intelligence

Components designated as deterministic must remain deterministic with respect to their declared inputs.

Examples may include:

- normalization;
- scoring;
- structural analysis;
- chunking;
- URL processing;
- gap calculations;
- deterministic SEO analysis.

A deterministic component must not silently introduce an LLM or external network dependency when doing so would alter its contractual behavior.

If an algorithm depends on external or probabilistic behavior, it must not be described as deterministic.

---

# 40. AI Provider Isolation

AI provider configuration and credentials must remain server-side.

Provider selection must not allow an untrusted client to bypass:

- authorization;
- tenant boundaries;
- usage limits;
- credit controls;
- provider restrictions;
- logging/security policies.

Provider-specific behavior must remain behind an explicit integration boundary so that provider implementation details do not leak throughout the application.

---

# 41. Document Intelligence

Documents must remain associated with their owning workspace and appropriate processing context.

Where content hashing is used for identity, the hashing contract must be deterministic.

Where content chunking is defined as deterministic, the same normalized input and configuration must produce the same chunking result.

Vector storage must remain compatible with the embedding model contract, including dimensionality.

Document retrieval must enforce tenant isolation.

---

# 42. Knowledge and Entity Data

Entities and relationships form part of the intelligence layer.

Entity relationships must preserve:

- identity;
- ownership;
- relationship semantics;
- referential integrity;
- source context where applicable.

Derived scores and classifications must be distinguishable from canonical source facts.

A calculated metric must not be represented as raw factual data merely because it is persisted in a database.

---

# 43. Content Intelligence

Content workflows must distinguish among:

- source material;
- analyzed content;
- deterministic findings;
- AI suggestions;
- user modifications;
- final persisted content.

An analysis engine must not silently become a content-generation engine unless the specification for that component explicitly permits generation.

AI suggestions must not overwrite user-authored or canonical content without an explicit operation.

---

# 44. Background Jobs

Background jobs must preserve the same security and ownership invariants as synchronous requests.

A job must establish or recover the correct tenant/workspace context from trusted persisted state.

Jobs that may be retried must define idempotent behavior where duplicate execution could produce incorrect results.

A background job must not assume that client-provided authorization state is trustworthy.

---

# 45. Caching

Caching must preserve tenant isolation.

A tenant-scoped cache key must contain sufficient identity to prevent cross-tenant collisions.

A cache hit must never become an authorization bypass.

Sensitive authentication state must not be cached in a way that bypasses the authoritative session mechanism.

When cached data becomes stale, the application must follow the defined freshness behavior rather than silently treating stale data as current authoritative state.

---

# 46. Localization

The application supports localized user experiences, including Persian and right-to-left interfaces.

Authentication and application routing must preserve valid locale context.

Server-side actions and generated links must not unnecessarily hardcode one locale when the active locale is already known.

Localization must not alter authorization behavior.

Locale handling must not become an input-validation or redirect-security bypass.

---

# 47. Error Semantics

Public errors must contain enough information for the client to respond appropriately without unnecessarily exposing internal state.

Errors must not expose:

- passwords;
- authentication secrets;
- raw security tokens;
- internal credentials;
- database connection information;
- unnecessary account-existence information;
- sensitive tenant data.

Internal errors may contain more diagnostic detail, but logging must still follow the secret-handling contract.

---

# 48. Testing Requirements

Tests must validate behavior and invariants, not merely implementation details.

Critical security-sensitive domains require both positive and negative tests.

At minimum, the relevant test strategy must cover, where implemented:

- registration;
- login;
- email verification;
- password reset;
- session invalidation;
- logout;
- RBAC;
- tenant isolation;
- token single-use behavior;
- token expiration;
- rate limiting;
- webhook authenticity;
- webhook idempotency;
- credit integrity;
- SSRF defenses;
- deterministic processing;
- database constraints;
- migration behavior.

A successful happy-path test is not sufficient evidence for a security boundary.

---

# 49. Security Invariants

The following invariants are mandatory:

1. Unauthenticated users cannot access protected account or workspace data.

2. Authentication does not automatically grant access to every workspace.

3. Client-provided tenant/workspace identifiers do not establish authorization.

4. Client-side authorization checks are never the sole authorization boundary.

5. Passwords are never stored in plaintext.

6. Raw authentication tokens are not stored as durable plaintext database credentials.

7. Verification and password-reset tokens are purpose-specific.

8. Expired or consumed security tokens cannot be successfully reused.

9. Concurrent requests cannot successfully consume the same single-use token more than once.

10. Missing required authentication secrets cause safe failure rather than insecure ephemeral fallback.

11. Logout invalidates the relevant authenticated session.

12. Password reset invalidates previously valid sessions according to the session model.

13. Tenant context cannot leak across requests or database connections.

14. Tenant-scoped cached data cannot cross tenant boundaries.

15. Protected server operations perform the required authorization checks.

16. Duplicate financial provider events cannot apply their financial effect more than once.

17. Webhook authenticity is established before trusted financial state is changed.

18. Security-sensitive credentials and raw tokens are not exposed through ordinary logs.

19. Database constraints protect critical uniqueness and referential-integrity invariants.

20. Migration history is not silently rewritten to conceal or bypass an inconsistent baseline.

21. AI-generated output is not silently treated as verified source evidence.

22. Deterministic components do not silently acquire nondeterministic external dependencies that violate their contract.

---

# 50. Compatibility and Evolution

The system must be capable of evolving without silently weakening its invariants.

Changes to:

- authentication;
- sessions;
- users;
- memberships;
- workspaces;
- tenant context;
- RLS;
- database migrations;
- credits;
- payments;
- external integrations;

must be treated as potentially cross-cutting changes.

A local implementation change must not be assumed to have only local consequences.

Backward compatibility requirements must be established explicitly for each migration or API change.

Deprecated behavior must not remain as an accidental second security mechanism.

---

# 51. Specification Conformance

Conformance to this specification must be established through evidence.

For any requirement under investigation, the valid states are:

    COMPLIANT
    NON-COMPLIANT
    PARTIALLY VERIFIED
    NOT VERIFIED
    NOT APPLICABLE

The agent must not use "compliant" merely because:

- the code compiles;
- a test passes;
- a migration command succeeds;
- a file contains an expected name;
- a previous agent claimed completion.

Conformance requires inspection and verification appropriate to the requirement.

---

# 52. Specification Changes

This document is itself part of the system's engineering contract.

A change to this specification must:

1. Clearly identify the requirement being changed.
2. Explain why the change is necessary.
3. Identify affected invariants.
4. Identify affected implementation areas where known.
5. Identify required migration or compatibility consequences.
6. Avoid changing the specification merely to make an existing implementation appear compliant.

A discovered implementation defect must not be "fixed" by weakening the specification unless the intended product behavior has actually changed.

---

# 53. Relationship to Current Repository

The repository may currently contain:

- incomplete implementations;
- legacy implementations;
- inconsistent schema representations;
- obsolete compatibility code;
- missing tests;
- partially migrated functionality;
- technical debt;
- behavior that violates this specification.

Those conditions are repository findings.

They are not automatically part of the target architecture.

The agent must therefore maintain the distinction:

    CURRENT REPOSITORY
            ≠
    TARGET SPECIFICATION

The purpose of engineering work is to move the authorized portion of the current repository toward the target state while preserving all unrelated existing invariants.

---

# 54. Definition of System Correctness

The system is considered correct for a given capability only when the relevant implementation:

1. Satisfies the applicable requirements in this specification.
2. Integrates with the existing architecture.
3. Preserves authentication and authorization boundaries.
4. Preserves tenant isolation.
5. Preserves database integrity.
6. Handles relevant failure and concurrency cases.
7. Preserves required compatibility.
8. Has appropriate verification evidence.
9. Has been changed within the authorized scope.

The following are not, by themselves, definitions of correctness:

    "It compiles."

    "The test passed."

    "The migration generated."

    "The UI works."

    "The agent said it was complete."

Each establishes only the property it actually verifies.

---

# 55. Final System Contract

Seorchable must remain a secure, multi-tenant intelligence platform.

Its fundamental security and data model is:

    USER
      ↓
    AUTHENTICATED IDENTITY
      ↓
    AUTHORIZED MEMBERSHIP
      ↓
    TRUSTED WORKSPACE CONTEXT
      ↓
    DOMAIN OPERATION
      ↓
    ISOLATED DATA
      ↓
    ANALYSIS / INTELLIGENCE
      ↓
    VERIFIED OR CLEARLY QUALIFIED RESULT
      ↓
    USER ACTION

At every transition:

- identity must remain trustworthy;
- authorization must remain enforceable;
- tenant ownership must remain intact;
- database state must remain consistent;
- external side effects must be controlled;
- generated intelligence must remain distinguishable from source evidence.

The system must prefer explicit, verifiable state over implicit assumptions.

The implementation must never redefine the intended system merely because the current repository happens to be inconsistent with it.
