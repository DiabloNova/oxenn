# BLUEPRINT.md

# Seorchable — Controlled Engineering Blueprint

This document defines the mandatory governance and lifecycle for AI-assisted engineering work in the Seorchable repository, including work performed by autonomous coding agents such as Google Jules.

This document defines **how engineering work is controlled and performed**.

It does not replace the application's technical specification, it does not authorize arbitrary changes, and it does not grant an agent authority to redefine the project.

The repository, the active user request, `AGENTS.md`, `BLUEPRINT.md`, `SPEC.md`, `PLAN.md`, and applicable `SKILL.md` files have distinct purposes and must be interpreted accordingly.

The governing objective is:

> Make authorized changes correctly, preserve everything outside the authorized scope, verify material claims with appropriate evidence, expose uncertainty and failure, and never guess when the repository does not establish the next safe action.

---

# 1. Purpose

Seorchable is treated as a potentially inconsistent brownfield repository.

An agent must therefore operate as an investigator before operating as an implementer.

The mandatory engineering model is:

    UNDERSTAND REQUEST
          ↓
    INSPECT LIVE REPOSITORY
          ↓
    ESTABLISH BASELINE
          ↓
    ESTABLISH FACTS
          ↓
    IDENTIFY CONFLICTS / UNKNOWNS
          ↓
    DEFINE AUTHORIZED SCOPE
          ↓
    ALIGN CURRENT STATE WITH TARGET STATE
          ↓
    PLAN
          ↓
    HUMAN APPROVAL WHEN REQUIRED
          ↓
    IMPLEMENT
          ↓
    VERIFY
          ↓
    ADVERSARIAL / MUTATION VERIFICATION WHEN WARRANTED
          ↓
    REVIEW
          ↓
    REPORT
          ↓
    STOP

An agent MUST NOT skip an earlier control merely because the requested change appears simple.

The depth of investigation and verification may be proportional to the risk and blast radius of the change, but the governing controls themselves remain applicable.

---

# 2. Governing Principles

## 2.1 Reality Before Intention

Determine what the repository actually contains before deciding how it should be changed.

Do not infer current state from what the repository appears intended to contain.

## 2.2 Evidence Before Conclusion

Every material conclusion must be supported by evidence appropriate to that conclusion.

A plausible explanation is not evidence.

A previous agent's report is not independent evidence.

A passing test is not automatically proof that the test is capable of detecting the relevant defect.

## 2.3 Scope Before Implementation

The agent must establish exactly what it is authorized to change before modifying files.

A discovered problem does not become authorized merely because it is related.

## 2.4 Specification Before Design

Understand the intended behavior before choosing an implementation.

Do not redesign a subsystem merely because another design appears preferable.

## 2.5 Diagnosis Before Repair

Understand and, where practical, reproduce a claimed defect before repairing it.

Do not guess at the cause of a failure.

## 2.6 Verification Before Completion

A change is not complete merely because code was written or a command succeeded.

Material acceptance criteria must be verified with appropriate evidence.

## 2.7 Stop Before Guessing

When material uncertainty cannot be resolved safely from available evidence and authorization, stop.

Stopping because the evidence is insufficient is a valid engineering result.

## 2.8 Preserve Existing State

Pre-existing user work, repository history, migration history, and unrelated behavior are protected unless the authorized task explicitly changes them.

## 2.9 Minimality After Completeness

Prefer the smallest correct implementation, but never omit required behavior, compatibility changes, security controls, or verification merely to reduce the diff.

## 2.10 Honest Reporting

The final report must describe what was actually observed, executed, verified, skipped, broken, or left unresolved.

The agent must never report an expected result as an observed result.

---

# 3. Controlled Document Model

The repository uses separate documents as separate layers of control.

| Document | Primary responsibility |
|---|---|
| `AGENTS.md` | Mandatory agent constraints and repository-wide operating rules |
| `BLUEPRINT.md` | Engineering lifecycle, governance gates, and control protocol |
| `SPEC.md` | Intended technical behavior, requirements, and invariants |
| `PLAN.md` | Currently authorized implementation scope and planned work |
| `SKILL.md` | Detailed operational procedure for performing an applicable task |

Their responsibilities MUST NOT be merged.

## 3.1 Actual Repository State

The actual repository establishes **what currently exists**.

Source files, configuration, Git state, executable behavior, database state, tests, migration metadata, and other direct evidence are used to establish current state.

## 3.2 `AGENTS.md`

Defines mandatory agent behavior and restrictions.

An agent must obey it.

## 3.3 `BLUEPRINT.md`

Defines the engineering lifecycle, approval gates, evidence discipline, stop conditions, and completion controls.

## 3.4 `SPEC.md`

Defines intended system behavior and technical invariants.

It does not by itself authorize implementation of every requirement it describes.

## 3.5 `PLAN.md`

Defines the currently authorized work.

A plan is an authorization boundary, not a general invitation to improve the repository.

## 3.6 `SKILL.md`

Defines detailed procedures for performing specific classes of work.

A skill cannot authorize work that the active plan does not authorize.

---

# 4. Authority Rules

The documents have different types of authority and must not be treated as a simple stack of interchangeable instructions.

Use this model:

    ACTUAL REPOSITORY
        → establishes current state

    AGENTS.md
        → establishes mandatory agent constraints

    BLUEPRINT.md
        → establishes mandatory engineering workflow

    SPEC.md
        → establishes intended behavior and invariants

    PLAN.md
        → establishes current implementation authorization

    SKILL.md
        → establishes operational procedures within that authorization

A lower-level procedure MUST NOT be used to bypass a higher-level constraint.

An implementation plan MUST NOT override a mandatory repository safety rule.

A skill MUST NOT expand the authorized scope.

A specification MUST NOT be treated as implementation authorization unless the applicable plan or explicit user instruction authorizes that work.

If two authoritative sources materially conflict, the agent must enter a contradiction state and resolve the conflict through further evidence or human decision.

The agent must not silently choose whichever interpretation makes implementation easier.

---

# 5. Standard Task Lifecycle

Every task governed by this blueprint follows the lifecycle below.

## Phase 0 — Task Intake

Determine:

- What the user explicitly requested.
- What outcome is expected.
- What is explicitly not requested.
- Whether the task is implementation, investigation, audit, repair, refactoring, migration, planning, or another activity.
- Which repository areas may be affected.
- Whether the task affects security, authentication, authorization, database state, migrations, payments, infrastructure, or other high-risk systems.
- Whether the request contains ambiguity.
- Whether additional authorization or information is required.

The agent MUST NOT silently transform a narrow request into a broader objective.

## Phase 1 — Read-Only Repository Reconnaissance

No implementation changes are permitted.

Inspect the actual repository sufficiently to establish the state relevant to the task.

Depending on scope, inspect:

- branch;
- commit;
- working-tree status;
- existing modifications;
- repository instructions;
- relevant source files;
- configuration;
- `package.json`;
- package manager;
- lockfile;
- available scripts;
- relevant tests;
- relevant callers and consumers;
- database configuration;
- schema;
- migration files;
- migration journal;
- migration metadata and snapshots;
- relevant generated artifacts;
- relevant documentation.

Actual file contents must be inspected whenever conclusions depend on them.

A filename, index, snapshot, search result, or previous report is not a substitute for reading the relevant source.

## Phase 2 — Baseline and Evidence Establishment

Establish:

    CURRENT REPOSITORY STATE
    RELEVANT FILES
    RELEVANT CONFIGURATION
    RELEVANT DEPENDENCIES
    RELEVANT CONSUMERS
    RELEVANT TESTS
    RELEVANT DATABASE STATE
    PRE-EXISTING CHANGES
    PRE-EXISTING FAILURES
    KNOWN CONFLICTS
    KNOWN UNKNOWNS

If these cannot be established sufficiently for safe implementation, the phase is incomplete.

## Phase 3 — Scope and Alignment

Determine:

    CURRENT STATE
    TARGET STATE
    IN SCOPE
    OUT OF SCOPE
    DEPENDENCIES
    RISKS
    ACCEPTANCE CRITERIA
    VERIFICATION
    STOP CONDITIONS

The target state must come from the applicable specification or explicit authorization.

The agent must not invent material target behavior.

## Phase 4 — Planning

Create or follow an explicit implementation plan.

Each implementation phase should have:

    OBJECTIVE
    PRECONDITIONS
    ALLOWED FILES
    ALLOWED OPERATIONS
    FORBIDDEN OPERATIONS
    EXPECTED RESULT
    VERIFICATION
    STOP CONDITIONS

The plan must be specific enough that a reviewer can determine whether an individual change belongs to the authorized task.

## Phase 5 — Human Approval

Where human approval is required, implementation must not begin until the applicable plan and scope have been explicitly approved.

An already-approved plan authorizes implementation only within the approved scope.

Approval does not authorize unrelated changes discovered later.

If the repository is materially different from the state on which the approved plan was based, the agent must stop and re-align.

## Phase 6 — Controlled Implementation

Implement one authorized phase at a time.

Before modification:

    WHY IS THIS FILE CHANGING?
    WHAT EXACT CHANGE IS REQUIRED?
    IS IT IN SCOPE?
    WHAT PRE-EXISTING CHANGES EXIST?
    HOW WILL IT BE VERIFIED?

During modification:

- preserve unrelated behavior;
- preserve pre-existing work;
- avoid speculative refactoring;
- do not expand scope;
- do not rewrite history;
- do not conceal failures.

After modification:

- inspect the resulting state;
- run required verification;
- record evidence.

## Phase 7 — Verification

Verify the actual acceptance criteria.

Verification depth must be proportional to risk and blast radius.

A small documentation change may need syntax/content validation.

A security-sensitive lifecycle change may require positive, negative, replay, expiry, and authorization testing.

A database migration may require schema, migration, metadata, execution, resulting-state, constraint, and compatibility verification.

## Phase 8 — Adversarial / Mutation Verification

Where a material requirement depends on a verification mechanism being capable of detecting a defect, challenge that mechanism where practical.

Deliberately introduce a minimal relevant defect.

The verification must fail for the intended reason.

Restore the correct implementation.

Re-run verification.

Do not use mutation testing as an excuse for arbitrary repository modification.

## Phase 9 — Final Review

Review:

- implementation;
- acceptance criteria;
- security implications;
- database implications;
- Git status;
- final diff;
- generated artifacts;
- migration state;
- scope compliance.

## Phase 10 — Report

Report observed facts, verification results, failures, skipped checks, limitations, and out-of-scope findings.

Do not overstate certainty.

## Phase 11 — Stop

After the authorized step is complete and reported, stop.

Do not automatically begin the next plan step.

---

# 6. Evidence Discipline

The agent must maintain an evidence chain for material findings.

For important findings, record:

    CLAIM
    SOURCE
    OBSERVATION
    INTERPRETATION
    STATUS

Distinguish:

    FACT
    OBSERVATION
    INFERENCE
    ASSUMPTION
    CONFLICT
    UNRESOLVED

An assumption must never silently become a fact.

## 6.1 Evidence States

Use:

### `HOLDS`

The requirement was verified with appropriate evidence.

### `BROKEN`

The requirement was tested or inspected and does not hold.

### `SKIPPED`

The requirement could not be verified.

Every `SKIPPED` result must explain:

- what was not verified;
- why it could not be verified;
- what evidence would be required to verify it.

Use:

    BLOCKED — INSUFFICIENT EVIDENCE

when missing evidence prevents safe continuation.

## 6.2 Observed vs Claimed

An observed result comes from direct inspection or execution.

A claimed result comes from another source and has not been independently established.

For example:

    Claimed:
    "Previous agent reports that the migration is correct."

does not become:

    Observed:
    "The migration is correct."

until appropriate verification is performed.

## 6.3 Evidence Becomes Stale

Evidence describing repository state becomes stale when the underlying state changes.

After mutation, conclusions based on the pre-mutation state must be revalidated when they materially affect the final result.

Do not assume that because a test, schema, or file was correct before a change, it remains correct afterward.

---

# 7. Repository Truth Protocol

When establishing a repository fact:

    LOCATE
       ↓
    INSPECT ACTUAL CONTENT
       ↓
    CROSS-CHECK RELATED SOURCES
       ↓
    TRACE IMPORTANT DEPENDENCIES
       ↓
    EXECUTE WHEN BEHAVIOR MATTERS
       ↓
    RECORD OBSERVATION
       ↓
    IDENTIFY REMAINING GAPS

The agent must not stop at locating a file when understanding its behavior requires reading it.

For important behavior, trace definitions to relevant callers and consumers.

---

# 8. Anti-Lazy Inspection Protocol

The following pattern is prohibited:

    SEARCH
      ↓
    FIND ONE FILE
      ↓
    INFER SYSTEM
      ↓
    IMPLEMENT

The required pattern is:

    SEARCH
      ↓
    LOCATE
      ↓
    READ ACTUAL FILE
      ↓
    INSPECT SURROUNDING IMPLEMENTATION
      ↓
    TRACE DEPENDENCIES
      ↓
    CROSS-CHECK RELATED SOURCES
      ↓
    ESTABLISH FACT
      ↓
    ACT

For high-risk areas, inspect both definitions and consumers.

Examples:

    DATABASE SCHEMA
      → MIGRATIONS
      → METADATA / JOURNAL
      → APPLICATION CONSUMERS
      → DATABASE TESTS

    AUTHENTICATION FUNCTION
      → SESSION HANDLING
      → CALLERS
      → FAILURE PATHS
      → RELEVANT TESTS

    API ROUTE
      → VALIDATION
      → AUTHORIZATION
      → PERSISTENCE
      → ERROR PATHS
      → TESTS

    PAYMENT WEBHOOK
      → RAW REQUEST
      → SIGNATURE VERIFICATION
      → IDEMPOTENCY
      → TRANSACTION
      → CREDIT EFFECT
      → TESTS

---

# 9. Contradiction Protocol

When contradictory evidence is discovered, enter:

    CONFLICT DETECTED

    SOURCE A:
    <artifact>

    SOURCE B:
    <artifact>

    EXACT DIFFERENCE:
    <observed difference>

    POSSIBLE IMPACT:
    <impact>

    RESOLUTION:
    <resolved / unresolved>

    AUTHORIZATION:
    <authorized / not authorized>

The agent must attempt read-only resolution where appropriate.

If repository evidence resolves the contradiction, record the resolution.

If it cannot be resolved safely, STOP.

The agent MUST NOT:

- choose the easier interpretation;
- choose the interpretation that makes a command succeed;
- alter evidence merely to remove the contradiction;
- silently rewrite the plan.

---

# 10. Failure Protocol

When a command or operation fails:

    FAILURE
      ↓
    CAPTURE ACTUAL OUTPUT
      ↓
    DIAGNOSE
      ↓
    IDENTIFY FAILURE SCOPE
      ↓
    DETERMINE SAFE RECOVERY
      ↓
    CHECK AUTHORIZATION
      ↓
    RECOVER OR STOP
      ↓
    VERIFY AGAIN

Do not immediately begin speculative recovery.

A later successful command does not erase an earlier failure.

The final report must preserve material failures that affected the task.

---

# 11. Safe Recovery

Recovery is permitted only when:

- the cause is understood sufficiently;
- the recovery is within scope;
- the operation is safe;
- user work will not be discarded;
- historical state will not be rewritten;
- the target behavior remains unchanged;
- the recovery itself can be verified.

If recovery requires:

- destructive Git operations;
- migration-history rewriting;
- broad architectural changes;
- unrelated cleanup;
- scope expansion;
- ambiguous database repair;

STOP unless explicitly authorized.

---

# 12. Git and Repository State Protection

The repository's history and unrelated working-tree changes are protected.

Do not use destructive Git operations to manufacture a convenient baseline.

Do not use:

    git reset
    git reset --hard
    git checkout
    git restore
    git clean
    git rebase
    git revert

for the purpose of discarding, hiding, or rewriting repository state, unless an explicitly authorized higher-level procedure requires a particular operation.

Do not:

- discard another agent's work;
- overwrite pre-existing changes;
- delete untracked files merely to obtain a clean tree;
- rewrite history to hide implementation state;
- amend history merely to conceal mistakes.

An unexpected Git state is a stop condition.

---

# 13. Scope Control

The active plan defines implementation authorization.

The agent must distinguish:

    REQUESTED
    AUTHORIZED
    NECESSARY COUPLED CHANGE
    DISCOVERED
    OUT OF SCOPE

A discovered issue is not automatically authorized.

If a discovered issue is outside scope:

    RECORD FINDING
    DO NOT MODIFY IT

If it blocks safe completion:

    STOP
    REPORT BLOCKER

## 13.1 Scope Expansion

Scope may change only through explicit re-planning and authorization where required.

Do not silently:

- add features;
- refactor;
- upgrade dependencies;
- redesign architecture;
- change unrelated database structures;
- rewrite migration history;
- alter unrelated documentation;
- fix unrelated bugs.

---

# 14. Ambiguity Protocol

When a material requirement is ambiguous:

1. inspect the specification;
2. inspect the active plan;
3. inspect current implementation;
4. inspect relevant consumers;
5. inspect relevant tests;
6. determine whether repository evidence resolves the ambiguity.

If ambiguity remains:

    BLOCKED — AMBIGUOUS REQUIREMENT

Report:

    AMBIGUITY:
    <exact issue>

    EVIDENCE:
    <relevant evidence>

    POSSIBLE INTERPRETATIONS:
    <only if useful>

    REQUIRED DECISION:
    <what must be decided>

Do not silently choose an interpretation.

---

# 15. Defect Reproduction Protocol

When repairing a claimed defect, establish the failure before repair where practical.

Use:

    INSPECT
      ↓
    REPRODUCE
      ↓
    OBSERVE FAILURE
      ↓
    IMPLEMENT
      ↓
    REPRODUCE
      ↓
    OBSERVE CORRECTION
      ↓
    REGRESSION TEST

If reproduction is impossible:

    REPRODUCTION: SKIPPED

and state why.

Do not claim reproduction from static inspection alone.

Reproduction may be unnecessary when the task independently requires behavior that is not dependent on reproducing an existing defect.

---

# 16. Verification Design

Verification must be designed around acceptance criteria, not around whatever checks happen to be convenient.

For each material requirement, determine:

    REQUIREMENT
    FAILURE MODE
    VERIFICATION METHOD
    EXPECTED RESULT
    ACTUAL RESULT

Examples:

    SOURCE STRUCTURE
    → source inspection

    BUILD / TYPE SAFETY
    → actual build / typecheck

    API BEHAVIOR
    → executable route / integration test

    AUTHORIZATION
    → positive and negative authorization tests

    DATABASE CONSTRAINT
    → database-level constraint test

    MIGRATION
    → generation / inspection / application / resulting-state verification

    IDEMPOTENCY
    → repeated-event execution and database-effect verification

A command that merely exits successfully is not necessarily sufficient evidence.

---

# 17. Tests Must Be Effective

A passing test is meaningful only if the test can detect the defect or behavior it claims to verify.

For important tests, use mutation or another adversarial verification technique where practical:

    CORRECT IMPLEMENTATION
          ↓
        TEST
          ↓
        PASS
          ↓
    INTRODUCE MINIMAL DEFECT
          ↓
        TEST
          ↓
       MUST FAIL
          ↓
    RESTORE IMPLEMENTATION
          ↓
        TEST
          ↓
        PASS

If the test passes against both the correct and deliberately broken implementation, the test has not established meaningful detection capability.

Do not leave deliberate mutations in the repository.

Do not weaken a test to make mutation verification succeed.

---

# 18. No Verification Theater

The agent must not create the appearance of verification without actual evidence.

Prohibited practices include:

- reporting a command as executed when it was not;
- reporting expected output as observed output;
- suppressing a failing command;
- swallowing an exception;
- deleting a failing test;
- weakening an assertion to obtain green status;
- changing expected behavior solely to match incorrect implementation;
- replacing the behavior under test with an irrelevant mock;
- hiding migration warnings;
- treating a skipped test as a passing test;
- treating lack of access as proof of correctness.

Failures must remain visible.

---

# 19. Security Review

Security-sensitive changes require verification of the complete relevant flow.

Applicable areas include:

    Authentication
    Authorization
    Sessions
    Cookies
    Password handling
    Tokens
    Cryptography
    Rate limiting
    Tenant isolation
    RBAC
    Secrets
    Webhooks
    Payment verification
    Idempotency
    Database access control
    Information disclosure

Inspect:

- producers;
- consumers;
- success paths;
- failure paths;
- malformed inputs;
- invalid inputs;
- expiry;
- invalidation;
- replay;
- race conditions where relevant;
- privilege boundaries;
- tenant boundaries;
- logging;
- persistence.

The presence of a security mechanism is not proof that the mechanism works.

Verify the mechanism against the failure mode it is intended to prevent.

---

# 20. Database Investigation Protocol

Database work requires cross-layer inspection.

Treat these as distinct but connected layers:

    CURRENT SCHEMA
    MIGRATION HISTORY
    MIGRATION JOURNAL
    SNAPSHOTS / METADATA
    DATABASE CONFIGURATION
    ACTUAL DATABASE STATE
    APPLICATION CONSUMERS
    DATABASE TESTS

Do not assume that these layers are synchronized.

For migration-related work:

1. inspect the current schema;
2. inspect relevant historical migrations;
3. inspect the migration journal;
4. inspect relevant snapshots and metadata;
5. inspect migration configuration;
6. compare the representations;
7. identify conflicts;
8. establish the intended transition;
9. only then perform migration generation or modification.

If actual database access is unavailable, that limitation must be explicit.

For example:

    DATABASE STATE: SKIPPED
    Reason: no accessible database connection.

This does not mean:

    DATABASE STATE: HOLDS

Lack of evidence is not evidence of correctness.

---

# 21. Migration Integrity

A migration is part of a state transition, not merely a SQL file.

Verify the relevant chain:

    SOURCE SCHEMA
        ↓
    MIGRATION GENERATION
        ↓
    MIGRATION FILE
        ↓
    MIGRATION JOURNAL
        ↓
    SNAPSHOTS / METADATA
        ↓
    ACTUAL DATABASE
        ↓
    APPLICATION COMPATIBILITY

A migration is not adequately verified merely because it applies successfully once.

Where applicable, verify:

- generated content;
- migration ordering;
- journal consistency;
- snapshot/metadata consistency;
- tables;
- columns;
- indexes;
- constraints;
- foreign keys;
- enums;
- custom SQL;
- RLS/policies;
- resulting schema;
- data behavior;
- locking implications;
- interruption behavior;
- old/new application compatibility;
- rollback behavior where required.

An empty database does not prove safety against an existing database.

Where existing data matters, use representative or production-scale verification as required by the applicable task and environment.

---

# 22. Migration Conflict Stop Rule

If migration tooling presents an unexpected:

- table rename;
- column rename;
- column mapping;
- foreign-key change;
- index change;
- constraint change;
- snapshot conflict;
- journal conflict;
- schema drift;

STOP the migration operation until the meaning of the proposed change is established.

The agent MUST NOT accept, reject, or resolve the proposed change merely because doing so makes the migration command complete successfully.

The command succeeding is not evidence that the proposed transition is correct.

---

# 23. Migration History Protection

Migration history is repository state.

Do not:

- delete historical migrations to make generation succeed;
- renumber migrations;
- rewrite journal history;
- modify snapshots blindly;
- create speculative migrations;
- manually alter generated metadata without understanding its canonical relationship to schema and migration history.

If migration history is inconsistent:

    MIGRATION STATE: BROKEN

If repair is outside the current authorization:

    BLOCKED — MIGRATION STATE REQUIRES AUTHORIZED REPAIR

Do not hide migration inconsistency by modifying unrelated artifacts.

---

# 24. Generated Artifacts

Generated artifacts are outputs of a process.

Before trusting one:

1. identify its source;
2. inspect the source;
3. identify the canonical generation command;
4. execute the canonical command where appropriate;
5. inspect the generated diff;
6. verify that output corresponds to intended source state.

Do not treat generated output as a substitute for inspecting authoritative source.

Do not manually modify generated output merely to obtain a desired result unless the repository explicitly treats that artifact as manually maintained.

---

# 25. Documentation Verification

Documentation is code-adjacent when it makes technical claims.

Checkable claims should be validated against the implementation where practical.

Examples:

    "This command generates migrations."
    → execute the command where appropriate.

    "This endpoint requires authentication."
    → inspect and test the endpoint.

    "This constraint prevents duplicates."
    → verify the database constraint.

Do not claim an audit or implementation is correct merely because documentation describes it correctly.

---

# 26. Dependency Changes

Do not add, remove, replace, upgrade, or downgrade dependencies unless explicitly authorized or strictly necessary for the authorized implementation.

When a dependency change is required:

- establish why;
- inspect compatibility;
- use the repository's canonical package manager;
- update the lockfile appropriately;
- inspect dependency changes;
- run relevant verification.

Do not perform opportunistic dependency upgrades.

---

# 27. Re-Planning Protocol

Re-planning is required when new evidence materially changes:

- current-state assumptions;
- target behavior;
- scope;
- architecture;
- migration strategy;
- dependencies;
- risk;
- acceptance criteria;
- required verification.

Record:

    ORIGINAL PLAN
    NEW EVIDENCE
    REASON FOR CHANGE
    PROPOSED PLAN
    NEW RISKS
    NEW VERIFICATION

Implementation must pause when the changed plan requires renewed authorization.

A discovery that changes only an internal implementation detail without changing scope, target behavior, architecture, risk, or acceptance criteria does not automatically require a new plan.

The agent must still document material deviations.

---

# 28. Phase Discipline

Each implementation phase must have:

    OBJECTIVE
    PRECONDITIONS
    ALLOWED FILES
    ALLOWED OPERATIONS
    FORBIDDEN OPERATIONS
    EXPECTED RESULT
    VERIFICATION
    STOP CONDITIONS

Before the phase:

    VERIFY PRECONDITIONS

During the phase:

    MODIFY ONLY AUTHORIZED STATE

After the phase:

    INSPECT RESULT
    RUN VERIFICATION
    RECORD EVIDENCE

Do not combine unrelated implementation and cleanup into a phase.

---

# 29. Stop Conditions

The agent must stop when any of the following materially affects safe continuation:

- unexpected Git state;
- unexpected deletion;
- unexpected migration change;
- unexpected schema drift;
- conflicting authoritative instructions;
- unresolved material ambiguity;
- unresolved security ambiguity;
- unresolved database ambiguity;
- required file is missing;
- required dependency is unavailable;
- verification fails unexpectedly;
- required verification cannot be meaningfully performed;
- continuing would require destructive operations;
- continuing would expand scope;
- continuing would require guessing.

Use:

    STATUS: BLOCKED

    PHASE:
    <phase>

    EXPECTED:
    <expected state>

    OBSERVED:
    <actual state>

    EVIDENCE:
    <evidence>

    IMPACT:
    <why continuation is unsafe>

    REQUIRED DECISION:
    <required decision>

    NO FURTHER MODIFICATION PERFORMED.

---

# 30. Audit Protocol

An audit is different from an implementation task.

Before an audit, define the audit surface.

Possible surfaces include:

    Architecture
    Application Code
    Database
    Authentication
    Authorization
    Security
    APIs
    Background Jobs
    Integrations
    Tests
    Configuration
    Dependencies
    Build System
    Deployment
    Documentation
    Observability

An audit must not be called complete if material portions of the declared surface were not inspected.

A complete audit report must identify:

    SCOPE INSPECTED
    FILES / SYSTEMS INSPECTED
    VERIFIED FINDINGS
    POTENTIAL FINDINGS
    CONTRADICTIONS
    UNRESOLVED AREAS
    TEST / VERIFICATION STATUS
    AREAS NOT INSPECTED

"360° audit" means comprehensive inspection of the declared surface, not inspection of a representative sample.

---

# 31. Final Diff Review

The final diff is mandatory evidence.

Inspect:

    git status
    git diff
    git diff --stat

Then inspect every changed file directly where relevant.

Classify changes as:

    AUTHORIZED
    NECESSARY COUPLED CHANGE
    UNEXPECTED

Investigate every unexpected change.

Check for:

- accidental deletions;
- temporary files;
- debug artifacts;
- generated junk;
- unrelated modifications;
- unexpected dependency changes;
- schema drift;
- migration drift;
- documentation drift.

A green test suite does not eliminate the requirement to inspect the diff.

---

# 32. Final Scope Review

Before completion, answer:

    Did every changed file belong to the task?
    Did every change serve the authorized objective?
    Was unrelated behavior changed?
    Were dependencies changed?
    Were migrations changed unexpectedly?
    Were generated artifacts changed unexpectedly?
    Was pre-existing user work preserved?
    Was historical state preserved?
    Was any destructive operation used?
    Was any plan meaning silently changed?

If an unauthorized change exists, the task is not complete until it is safely resolved or explicitly accepted by the appropriate authority.

---

# 33. Completion Standard

Use only the status justified by evidence.

### `COMPLETE`

Use only when:

- authorized work is implemented;
- material acceptance criteria hold;
- required verification was performed;
- final diff was reviewed;
- final repository state was reviewed;
- no material unresolved blocker remains.

### `IMPLEMENTED — PARTIALLY VERIFIED`

Use when implementation is present but material verification remains incomplete.

### `BLOCKED`

Use when safe completion or verification requires an unresolved decision, missing evidence, or authorization.

### `FAILED`

Use when the authorized implementation was attempted but the required result was not achieved.

Do not use:

    "looks good"
    "should work"
    "probably correct"
    "likely safe"
    "fully verified"

as substitutes for evidence.

---

# 34. Final Report

Every substantial implementation or investigation must end with a factual report.

Use:

    IMPLEMENTATION REPORT

    STATUS:
    <COMPLETE / IMPLEMENTED — PARTIALLY VERIFIED / BLOCKED / FAILED>

    AUTHORIZED OBJECTIVE:
    <exact objective>

    BASELINE:
    - Branch:
    - Commit:
    - Initial working-tree state:

    CURRENT STATE:
    <relevant verified state>

    CHANGES:
    - <path>: <specific change>

    FILES CREATED:
    - <path>

    FILES MODIFIED:
    - <path>

    FILES DELETED:
    - <path>

    REPRODUCTION:
    - Required:
    - Performed:
    - Result:

    VERIFICATION:
    - <requirement>: HOLDS — <evidence>
    - <requirement>: BROKEN — <evidence>
    - <requirement>: SKIPPED — <reason>

    ADVERSARIAL / MUTATION VERIFICATION:
    - Performed:
    - Defect detected:
    - Repository restored:

    DATABASE / MIGRATION:
    - Schema:
    - Migration:
    - Journal / metadata:
    - Resulting database:
    - Remaining limitations:

    SECURITY:
    - Relevant checks:
    - Result:
    - Remaining limitations:

    FINAL GIT STATE:
    - Status:
    - Diff reviewed:
    - Unexpected changes:

    OUT-OF-SCOPE FINDINGS:
    - <finding>

    UNRESOLVED ITEMS:
    - <item>

    LIMITATIONS:
    - <limitation>

    NEXT ACTION:
    - None — awaiting further authorization.
    OR
    - Blocked — requires <specific decision>.

The final report must not conceal failures, skipped checks, or unresolved items.

---

# 35. Agent Self-Check

Before reporting completion, verify:

    [ ] I inspected the actual relevant source files.
    [ ] I established the repository baseline.
    [ ] I identified pre-existing changes.
    [ ] I preserved pre-existing user work.
    [ ] I identified the exact authorized scope.
    [ ] I did not silently expand scope.
    [ ] I inspected relevant consumers and dependencies.
    [ ] I investigated material contradictions.
    [ ] I did not treat snapshots or generated artifacts as substitutes for source inspection.
    [ ] I did not treat another agent's report as independent evidence.
    [ ] I reproduced the defect where reproduction was required and practical.
    [ ] I defined verification appropriate to the risk.
    [ ] I performed required verification.
    [ ] I challenged important verification mechanisms where warranted.
    [ ] I restored any deliberate test mutation.
    [ ] I reviewed security implications where applicable.
    [ ] I reviewed database and migration implications where applicable.
    [ ] I reviewed the final diff.
    [ ] I reviewed final Git status.
    [ ] I reported failures.
    [ ] I reported skipped verification.
    [ ] I reported unresolved items.
    [ ] Every completion claim is supported by evidence.
    [ ] I have not started or implied authorization for the next task.

If any required item is not satisfied, do not report the task as fully complete.

---

# 36. Non-Negotiable Rules

The following rules apply throughout the repository:

1. Actual repository state outranks agent reports.
2. Evidence outranks assumptions.
3. The active plan defines implementation authorization.
4. The specification defines intended behavior, not automatic authorization.
5. Ambiguity must be resolved with evidence or human decision.
6. Unexpected repository state is a stop condition.
7. Out-of-scope defects remain findings unless separately authorized.
8. Pre-existing user work must be preserved.
9. Repository history must be protected.
10. Migration history must be protected.
11. Generated artifacts are not automatically authoritative.
12. A successful command is not automatically proof of correctness.
13. A green test is not proof that the test is effective.
14. Important verification should be challenged against deliberate failure where practical.
15. Failures must never be hidden.
16. Missing evidence must never be represented as positive evidence.
17. Material post-change conclusions must be revalidated against the changed state.
18. Database changes require cross-layer verification.
19. Security changes require failure-mode-oriented verification.
20. The final diff must be reviewed.
21. The final repository state must be reviewed.
22. The agent must not silently mutate the approved plan.
23. The agent must not use destructive operations to manufacture success.
24. Completion means verified authorized work, not merely changed files.
25. After the authorized step is complete, the agent must stop.

---

# 37. Final Engineering Principle

The purpose of this blueprint is not to make the agent perform unnecessary work.

The purpose is to prevent unsupported decisions in a repository whose current state may be inconsistent.

The required standard is:

    INSPECT WHAT EXISTS
          ↓
    ESTABLISH WHAT IS TRUE
          ↓
    IDENTIFY WHAT IS UNKNOWN
          ↓
    DETERMINE WHAT IS AUTHORIZED
          ↓
    DEFINE WHAT MUST CHANGE
          ↓
    DEFINE HOW IT WILL BE VERIFIED
          ↓
    CHANGE ONLY WHAT IS AUTHORIZED
          ↓
    VERIFY THE ACTUAL RESULT
          ↓
    EXPOSE WHAT COULD NOT BE VERIFIED
          ↓
    REVIEW THE FINAL STATE
          ↓
    STOP

Never optimize for making the repository appear complete.

Optimize for making the authorized change correct, preserving everything outside its scope, and leaving behind evidence strong enough for another engineer to independently understand what is actually true.

When the next safe action is not established:

    STOP.
