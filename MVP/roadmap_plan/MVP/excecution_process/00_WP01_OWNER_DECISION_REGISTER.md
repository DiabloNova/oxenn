# MVP-00 WP-01 — Owner Decision Register

**Status:** IN PROGRESS — decision inventory and evidence reconciliation complete; owner approvals remain outstanding  
**Repository:** `DiabloNova/oxenn`  
**Execution branch:** `MVP_00`  
**Baseline main:** `326403812756b815f5d9a7dc77e29097ff7dd6b0`  
**Pre-WP-01 branch head:** `f93ab0ad50213778b73ab2c31a3dbd0599d667c2`  
**Prepared:** 2026-11-14  
**Parent stage:** MVP-00 — IN PROGRESS

> This register separates already-approved product constraints from unresolved choices. A recommendation is not an owner decision. No OPEN item below is treated as approved, and no commercial, legal, privacy, geography, provider, pricing, or quota default is silently selected.

## 1. Purpose and method

WP-01 reconciles open decisions across the owner-approved MVP Product Specification, MVP Map, MVP Baseline, MVP-00 governance contract, MVP Engineering Baseline, Product Strategy v2, Product-to-Engineering Blueprint v1 (DOC-67 v4), and current Stele decision records.

Each decision records: question, current status, evidence, viable options, trade-offs, recommendation where supportable, owner approval required, and downstream blocking stage(s). Existing product invariants are recorded once as confirmed constraints; duplicate questions are consolidated without erasing their original D-001–D-012 identifiers.

### Source snapshot

| Source | Exact revision / identity | Authority and use |
|---|---|---|
| MVP-00 governance contract | `main`, blob `d996e3122f14641b4b0dc7508840e71904ebb54e` | Required WP-01 procedure and exit gates |
| Owner-approved MVP Product Specification | `main`, blob `7ef6e9dd8d097b12f32f302e90a361a01bedac5d` | Canonical product scope and FR-01–FR-11 |
| MVP Map | `main`, blob `c74e6e9b8de59af99bb20204053c10b2c056a6c7` | Product/service boundaries and pilot scope |
| MVP Baseline | `main`, blob `ed122abfb7cd434b3834bc23eaed56337ab3d793` | Delivery order and shared acceptance constraints |
| MVP Engineering Baseline | `main`, blob `6c85358d5c750005f19bb7f65d5846e8f5a2ba2e` | Engineering gaps and verification boundaries; older code snapshot is not current proof |
| Product Strategy v2 | Stele `DOC-18` | Strategic Iran-first hypothesis and two assessment pillars |
| Product-to-Engineering Blueprint | Stele `DOC-67`, version 4 | Owner-review translation and explicitly open decisions |
| Product approval | Stele `KNOW-66` | Four target groups and existing-product lifecycle approved |
| Independent services | Stele `KNOW-25`, version 3 | Independent services in one shared Workspace; optional bundle |
| Authenticated access | Stele `KNOW-64`, version 2 | Registration and server-authenticated session for every service |
| Nine-domain dashboard direction | Stele `KNOW-22` | Current nine-domain product architecture; not a two-audit MVP |

The GitHub baseline and execution branch were rechecked immediately before this WP-01 write: `main` remained at `326403812756b815f5d9a7dc77e29097ff7dd6b0`; `MVP_00` remained at `f93ab0ad50213778b73ab2c31a3dbd0599d667c2`. The branch was four commits ahead and zero behind at the pre-write check. No intervening branch movement was observed.

## 2. Confirmed owner-approved constraints (not open decisions)

The following are binding constraints for all downstream work. They must not be reopened as if undecided:

1. **Current product scope:** the owner-approved MVP covers both Digital Product Assessment and Product Value & Competitiveness Assessment, with an optional limited Product Assessment & Improvement pilot. The old two-journey Technical SEO/AI Visibility scope is historical only (`KNOW-66` supersedes `KNOW-12`).
2. **Target audience:** physical-product sellers, digital-product sellers, service providers, and social-commerce sellers are all in the market from the beginning. A natural person can represent an Offer without a registered company.
3. **Offer model:** Offer nature is exactly `physical`, `digital`, or `service`. Sales channel is a separate dimension; social commerce is not a fourth Offer nature. An Offer may use multiple channels.
4. **Independent services:** SEO, AEO, and GEO can be independently selected, purchased/activated, and used. A standalone service does not require another SKU, a bundle, or a comprehensive PIP (`KNOW-25`).
5. **One shared Workspace:** customers operate in one Workspace and central dashboard; independent services coexist within it. Do not provision one Workspace or customer identity per service. Workspace membership/dashboard context is shared; per-service authorization, entitlement, quota, metering, and evidence provenance remain separately enforced (`KNOW-25`, v3; owner direction recorded in `00_PDDG.md`).
6. **Optional products:** Digital Visibility Suite is optional; Product Assessment & Improvement is optional; AI Infrastructure is a separate product line and not a core MVP dependency.
7. **Authenticated access:** every service, including free/trial access, requires a registered account and server-authenticated session. Registration does not grant all entitlements (`KNOW-64`).
8. **Evidence truth:** user-provided information, direct observation, third-party claim, estimate, hypothesis, and simulation remain distinguishable. Unknown, not-provided, not-verified, not-applicable, zero, negative, incomplete, and failed states are not conflated. UNKNOWN is not ZERO.
9. **External action boundary:** recommendations/plans/tasks may be prepared and tracked; consequential external actions require the applicable permission and explicit customer approval.
10. **MVP exclusions:** no new-product ideation/industrial R&D, full ERP/warehouse/logistics operations, broad expert marketplace, unsupported guaranteed ROI/sales forecasts, autonomous external execution, or deep integrations with every platform are required in the MVP.

These constraints are considered confirmed because they are stated in the owner-approved specification and/or explicit Stele owner decisions. This register does not infer any additional approval from strategy documents or implementation artifacts.

## 3. Decision register

Status vocabulary: `CONFIRMED CONSTRAINT` means the product rule is already approved; `OPEN — OWNER APPROVAL` means the choice remains unresolved; `OPEN — EVIDENCE / POLICY` means the owner must approve a policy after evidence is assembled. Recommendations below are proposals only.

| ID | Decision / question | Status | Blocking stage(s) |
|---|---|---|---|
| D-001 | First pilot customer cohort and eligibility/sample | OPEN — OWNER APPROVAL | MVP-00 exit; MVP-14 |
| D-002 | Initial geography, language/locale, currency, timezone and exclusions | OPEN — OWNER APPROVAL | MVP-00 exit; MVP-04/05/06/07/09/14 |
| D-003 | Distinct SEO/AEO/GEO objectives, metric ownership, units, overlap and exclusions | OPEN — OWNER APPROVAL | MVP-00 exit; MVP-05/06/07/08 |
| D-004 | Permitted source/provider/surface matrix, access mode, consent/legal basis, coverage, retention, freshness, rate/cost and failure policy | OPEN — OWNER / LEGAL / PRIVACY / PROVIDER | MVP-00 exit; MVP-04 onward |
| D-005 | Standalone SKU catalogue and commercial terms: free/trial/paid, price, billing period, quota, overage, renewal, cancellation/refund | OPEN — OWNER / COMMERCIAL | MVP-00 exit; MVP-02 |
| D-006 | Optional Digital Visibility Suite composition, allocation, price and activation/renewal terms | OPEN — OWNER / COMMERCIAL | MVP-00 exit; MVP-02/08 |
| D-007 | Optional PAI pilot depth by Offer nature: minimum PIP, assessment dimensions, evidence threshold, outputs and exclusions | OPEN — OWNER APPROVAL | MVP-00 exit; MVP-03/09/10 |
| D-008 | Evidence quality policy: minimum provenance, confidence, freshness, sample sufficiency, contradiction and missing-state handling | OPEN — OWNER / DOMAIN EXPERT / PRIVACY | MVP-00 exit; MVP-04 onward |
| D-009 | Shared Workspace collaboration: roles, member model, seller/provider ownership, approver authority and task ownership | PARTLY CONFIRMED; DETAILS OPEN | MVP-00 exit; MVP-01/03/12 |
| D-010 | Service-specific inputs, result contracts, metric thresholds and launch-readiness criteria | OPEN — OWNER / DOMAIN EXPERT | MVP-00 exit; MVP-05/06/07 |
| D-011 | Pilot success measures, baseline, measurement windows, sample targets and stop/go thresholds | OPEN — OWNER APPROVAL | MVP-00 exit; MVP-14 |
| D-012 | First-release planning/task workflow depth, assignment, reminders, scheduling, time/cost capture and approval transitions | PARTLY CONFIRMED; DETAILS OPEN | MVP-00 exit; MVP-12/13 |
| D-013 | Scoring, confidence and commercial-capacity methodology by Offer nature and assessment dimension | OPEN — OWNER / DOMAIN EXPERT | MVP-00 exit; MVP-09/10/11 |
| D-014 | Depth and sequence of website, analytics, social, marketplace and sales-system integrations | OPEN — OWNER / PRIVACY / PROVIDER | MVP-00 exit where launch-critical; MVP-04 onward |
| D-015 | Offer limits per Workspace, per-service quota ceilings, crawl/request budgets and cost controls | OPEN — OWNER / COMMERCIAL / SECURITY | MVP-00 exit; MVP-02/03/04 |
| D-016 | Data retention/deletion periods and consent/privacy wording by data class and source | OPEN — OWNER / LEGAL / PRIVACY | MVP-00 exit; MVP-01/04 |
| D-017 | Operational launch readiness per service/provider/surface (supported vs experimental vs unavailable) | OPEN — OWNER / DOMAIN EXPERT / PROVIDER | MVP-00 exit; MVP-05/06/07/14 |

### D-001 — First pilot cohort

- **Question:** Which segment(s) enter the first controlled pilot, and what eligibility, recruitment, sample-size and exclusion rules apply?
- **Options:** (A) one focused segment; (B) a small mixed cohort spanning two or more segments; (C) staged cohorts, beginning with one segment and expanding after a gate.
- **Trade-offs:** A focused cohort improves consistency and supportability but narrows generalizability. A mixed cohort tests breadth but increases onboarding and measurement variance. Staged cohorts balance learning and control but extend calendar time.
- **Recommendation:** choose a staged cohort with one initial segment and an explicit expansion gate; do not remove the other three segments from the target market. The exact initial segment cannot be selected from the current evidence alone.
- **Owner approval required:** initial segment, recruitment/eligibility, target sample and expansion/stop rule.
- **Affected artifacts:** pilot charter, MVP-14 validation plan, service-specific onboarding and success measures.

### D-002 — Launch operating geography

- **Question:** What country/region, locale(s), primary language(s), currency/display convention, timezone and geographic exclusions govern the first pilot?
- **Evidence:** DOC-18 identifies Iran as the initial strategic commercial focus. The owner-approved Product Specification explicitly says strategic priority is not a finalized operating configuration.
- **Options:** (A) Iran-only pilot; (B) Iran-first with a narrowly defined external cohort; (C) another explicitly selected geography.
- **Recommendation:** retain Iran as the leading candidate because it is the recorded strategy, but confirm operational/legal/provider feasibility before fixing it. Persian-first is a plausible proposal, not an approved language decision. Currency, display convention and timezone must be separately explicit.
- **Owner approval required:** country/region, supported locale/language, currency and display convention, timezone, excluded jurisdictions.
- **Affected artifacts:** pilot charter, locale handling, source/provider matrix, billing display and MVP-14.

### D-003 — SEO/AEO/GEO separation and measurement

- **Confirmed:** three independently selectable services; optional bundle; one shared Workspace. AEO and GEO are distinct commercial services even if methods/evidence overlap.
- **Open:** final metric names/formulas, unit of work, denominators, sampling design, provider/surface coverage, exclusions, attribution and duplicate-event rules.
- **Options:** (A) strict separate metric sets; (B) shared raw observations with separate derived metrics and ownership; (C) hybrid, with explicitly shared evidence and service-specific measurements.
- **Recommendation:** use a hybrid evidence model: shared raw observations only where purpose, permission, provenance and scope allow; separately owned service metrics and service runs; deduplicate by observation identity and measurement context. Do not double-count one observation as independent AEO and GEO evidence without an explicit rule.
- **Owner approval required:** definitions and metric owners, overlap policy, units, provider/surface exclusions and measurement protocol.
- **Affected artifacts:** WP-02 service matrix, MVP-05/06/07 contracts, reporting and acceptance tests.

### D-004 — Source/provider and permission matrix

- **Question:** Which sources/providers may be used for each service and PAI dimension, under what access/consent/legal basis and limits?
- **Options:** (A) customer-provided/manual evidence only initially; (B) bounded public observation plus customer-authorized first-party integrations; (C) selected provider APIs/scrapers where terms, credentials and permission are verified; (D) staged combination by source class.
- **Recommendation:** staged combination. Start only with sources whose authorization, purpose, scope and acquisition controls are verified. Keep each unapproved source unavailable; do not treat public accessibility as blanket permission. Record source, owner/permission, geography/locale, method, coverage, freshness, retention, cost/rate, failure mode and evidence fields.
- **Owner approval required:** per-source allowlist and legal/consent position, permitted use, retention, rate/cost ceilings and provider selection. No provider connection or credential setup is authorized in WP-01.
- **Affected artifacts:** WP-05 source/evidence policy, MVP-04 acquisition contract and service launch gates.

### D-005 — Standalone commercial catalogue

- **Confirmed:** standalone SEO/AEO/GEO; optional PAI; optional bundle; no charge for unselected services; each service has server-enforced entitlement/quota; price/terms disclosed before confirmation.
- **Open:** SKU identifiers/versioning, free/trial policy, price, billing period, quota unit/quantity, overage, renewal, cancellation/refund, activation/expiry and tax/legal display.
- **Options:** free limited tier plus paid tiers; time-limited trial; usage-based purchase; subscription; or a deliberately mixed model per SKU.
- **Recommendation:** first define a service-by-service value/usage model and transparent entitlement contract; avoid committing to recurring billing or overage until pilot consumption/cost evidence exists. No prices, plans or payment provider are selected here.
- **Owner approval required:** SKU catalogue, free/trial/paid status, prices, billing semantics, quota and customer-facing legal terms.
- **Affected artifacts:** WP-03 catalogue/entitlement policy, MVP-02, checkout and billing acceptance.

### D-006 — Optional Digital Visibility Suite

- **Confirmed:** bundle is optional and never gates standalone access.
- **Open:** included service versions, discounts/price, whether quotas are pooled or partitioned, upgrade/downgrade, activation timing, renewals and cancellation behavior.
- **Options:** (A) simple convenience bundle with independent underlying entitlements; (B) bundle with explicitly allocated per-service quotas; (C) no launch bundle until independent services are validated.
- **Recommendation:** do not launch the bundle until each standalone service and its entitlement/usage accounting is independently coherent. If offered, keep underlying service entitlements auditable and define quota allocation per service; never silently pool quota across services.
- **Owner approval required:** whether bundle launches in first pilot, composition, price/terms and quota allocation.
- **Affected artifacts:** WP-03, MVP-02 and MVP-08.

### D-007 — Product Assessment & Improvement pilot depth

- **Confirmed:** PAI is optional; it is not a prerequisite for standalone SEO/AEO/GEO.
- **Open:** which Offer natures are included in the first pilot, minimum PIP fields, assessment dimensions, benchmark eligibility, evidence thresholds, report outputs and exclusions.
- **Options:** (A) all three Offer natures with shallow common assessment; (B) one/two Offer natures with deeper evidence; (C) phased coverage with a common core and nature-specific modules.
- **Recommendation:** a phased common-core model with explicit nature-specific extensions is architecturally coherent, but the first pilot's nature coverage must be selected using recruitment and source feasibility evidence. Do not score unsupported dimensions or require a complete PIP for standalone services.
- **Owner approval required:** Offer-nature coverage, minimum fields, dimensions, output and exclusions.
- **Affected artifacts:** WP-06 PAI pilot contract, MVP-03/09/10/11.

### D-008 — Evidence and confidence policy

- **Confirmed:** evidence classes and truth-state distinctions in the Product Specification; UNKNOWN is not ZERO; synthetic/AI output is not verified evidence.
- **Open:** minimum required provenance per source class, confidence semantics/formula, freshness windows, minimum sample sizes, source hierarchy, conflict resolution and when a metric is suppressed versus labeled incomplete.
- **Options:** (A) qualitative confidence bands with documented rules; (B) quantitative confidence only for metrics with defensible statistical inputs; (C) hybrid by evidence class/metric.
- **Recommendation:** hybrid. Avoid a universal confidence score. Define source-specific freshness and sample sufficiency; use quantitative confidence only where method and assumptions are defensible. Preserve conflicting evidence and expose uncertainty rather than silently selecting a winner.
- **Owner approval required:** confidence vocabulary/formula by metric, freshness thresholds, sample sufficiency and contradiction policy.
- **Affected artifacts:** WP-05 evidence policy, MVP-04 and every assessment/report contract.

### D-009 — Workspace roles and collaboration

- **Confirmed:** one shared customer Workspace/dashboard, individual seller support, shared membership context and service-level access controls.
- **Open:** minimum roles, invitation/member limits, ownership transfer, Offer ownership, who may activate services, approve plans, assign tasks and view sensitive commercial evidence.
- **Options:** (A) single owner only for pilot; (B) owner + collaborator; (C) owner + administrator/editor/viewer/approver matrix.
- **Recommendation:** start with the smallest safe model that supports the actual pilot. A single owner plus explicitly scoped collaborator/approver may be sufficient; avoid speculative enterprise roles. The final role set must map to concrete permission checks and audit events.
- **Owner approval required:** pilot member model, role capabilities, ownership transfer and approval authority.
- **Affected artifacts:** MVP-01 identity/workspace/security, MVP-03 Offer ownership, MVP-12 task/plan approval.

### D-010 — Service-specific acceptance and launch readiness

- **Confirmed:** standalone services require service-specific inputs and their own entitlement/quota; no comprehensive PIP prerequisite; MOCK/LIVE/HYBRID/PARTIAL/FAILED must be truthful.
- **Open:** exact input contracts, output fields, supported surfaces, measurement units, coverage thresholds, acceptable partial states and per-service release threshold.
- **Recommendation:** define acceptance separately for SEO, AEO and GEO; a service must not be called launch-ready solely because a UI, provider package or mock path exists. Require evidence-backed successful and failure/partial journeys for every claimed supported surface.
- **Owner approval required:** supported service scope, required inputs, output/metric contract and minimum launch evidence.
- **Affected artifacts:** WP-02, MVP-05/06/07/14.

### D-011 — Pilot success and stop/go

- **Question:** What measurable result makes the pilot useful and safe enough to expand?
- **Evidence:** Product Specification defines measures to track but says numeric targets must be set only after initial pilot and measured baseline exist.
- **Options:** (A) pre-set numeric targets now; (B) baseline-first pilot with thresholds approved after an initial observation period; (C) staged guardrails with minimum safety/quality gates now and outcome targets after baseline.
- **Recommendation:** choose C. Fix non-negotiable safety/quality gates before pilot; collect baseline and initial distributions; then approve numerical outcome thresholds with explicit sample and measurement windows. Do not invent arbitrary conversion or uplift targets.
- **Owner approval required:** pilot KPIs, baseline method, measurement windows, sample expectations and stop/go authority.
- **Affected artifacts:** WP-04 pilot charter, MVP-14 and service operations.

### D-012 — Execution workflow depth

- **Confirmed:** customer-reviewable and customer-approved Growth Plan; tasks have ownership, dates, status, dependencies, history and result measures; no autonomous consequential external action.
- **Open:** first-release assignment, reminders, calendar/scheduling, effort/cost capture, task transitions, blockers, collaboration and integrations.
- **Options:** (A) manual task board and status/outcome capture; (B) manual workflow plus reminders; (C) integrations and automated scheduling.
- **Recommendation:** begin with auditable manual workflow and optional reminders only if consent/notification policy is defined. Defer external execution and deep integrations. Keep plan approval separate from approval for any consequential external action.
- **Owner approval required:** task lifecycle depth, reminder channels/cadence, assignment and approval roles.
- **Affected artifacts:** WP-06, MVP-12/13 and privacy/security acceptance.

### D-013 — Scoring and commercial-capacity methodology

- **Question:** How are scores, confidence, demand/commercial capacity and comparisons calculated across physical, digital and service Offers?
- **Options:** (A) one universal score; (B) separate dimension scores with a contextual summary; (C) no aggregate score until benchmark coverage is sufficient.
- **Recommendation:** avoid one universal score across unlike Offer natures. Use dimension-level measures with explicit applicability and evidence; permit an aggregate only where weighting, normalization, benchmark cohort and missing-data handling are justified and versioned. A score must never hide UNKNOWN or NOT_APPLICABLE.
- **Owner approval required:** score dimensions, weighting/normalization, comparison cohort, versioning and confidence disclosure.
- **Affected artifacts:** WP-06, MVP-09/10/11 and acceptance tests.

### D-014 — Integration depth and sequence

- **Question:** Which website, analytics, social, marketplace and sales integrations are required in the first pilot?
- **Options:** (A) manual/customer-uploaded evidence; (B) limited first-party integrations; (C) selected third-party APIs; (D) staged combination by pilot need.
- **Recommendation:** manual and consent-based evidence capture is explicitly acceptable for social-commerce support in the MVP. Add integrations only where they are necessary to validate a chosen pilot journey and permission/cost is clear. Do not promise universal social/marketplace coverage.
- **Owner approval required:** launch-critical integrations, platforms, permissions and exclusions.
- **Affected artifacts:** WP-04/05, MVP-04 through MVP-10.

### D-015 — Offer limits, quotas and resource budgets

- **Question:** What are the limits on Offers per Workspace and service runs/units, crawl depth, concurrency, requests, storage and cost?
- **Options:** (A) fixed conservative pilot caps; (B) usage-based caps by SKU; (C) adaptive caps with explicit hard safety ceilings.
- **Recommendation:** use conservative, explicit pilot caps and hard resource ceilings first; derive commercial quotas from measured cost and value. Keep the technical safety budget separate from customer-facing entitlement quota. Do not select numbers without crawl/provider/cost evidence.
- **Owner approval required:** Offer limits, SKU quota units/quantities, hard acquisition budgets and escalation/overage policy.
- **Affected artifacts:** WP-03/05, MVP-02/03/04 and cost governance.

### D-016 — Privacy, consent and retention

- **Question:** What consent language, data minimization, retention, deletion and access rules apply to customer business data, pricing, social data, credentials and collected source evidence?
- **Options:** per-source/per-data-class retention schedule; customer-configurable retention where practical; minimal default retention with explicit exceptions.
- **Recommendation:** adopt data-class and source-specific retention, least collection, purpose limitation and revocation/deletion paths. Do not retain credentials or third-party data beyond documented necessity. Exact legal wording and jurisdictional requirements require qualified review.
- **Owner approval required:** retention periods, deletion policy, consent language, data processing roles and legal review.
- **Affected artifacts:** MVP-01/04, source matrix, privacy notices and release gate.

### D-017 — Per-service operational launch readiness

- **Question:** Which exact service/provider/locale combinations may be represented as supported at pilot launch?
- **Options:** (A) only fully evidenced live paths; (B) limited beta with explicit experimental/partial labels; (C) wait until all planned services are fully covered.
- **Recommendation:** service-by-service launch gates. AEO/GEO surfaces must be named and observed; provider availability and permissions must be verified. Unsupported combinations remain explicitly unavailable. Never substitute mock output for live evidence.
- **Owner approval required:** supported service/surface/locale matrix and acceptable beta/partial labeling.
- **Affected artifacts:** WP-02/05, MVP-05/06/07/14.

## 4. Cross-decision dependencies and sequencing

1. **D-002 + D-001** establish the operating cohort and market. They shape provider availability, language sampling, source permissions and success measurement.
2. **D-003 + D-004 + D-008 + D-010 + D-017** establish what each digital service measures and what evidence is legally/operationally supportable. WP-02 and WP-05 depend on these.
3. **D-005 + D-006 + D-015** establish independent SKU access, optional bundle behavior, usage accounting and resource constraints. WP-03 must not design persistence until the accounting subject (Workspace, Offer or mixed) is separately resolved in WP-02/WP-03; one Workspace per service is prohibited.
4. **D-007 + D-013** define PAI scope and scoring validity. Benchmark eligibility must precede aggregate-score promises.
5. **D-009 + D-012 + D-016** define collaboration, approvals, task ownership and privacy. These are prerequisites for MVP-01 and MVP-12 workflow contracts.
6. **D-011** depends on D-001, D-002 and service/PAI scope; numerical outcome targets should follow a measured baseline.
7. **D-014 + D-004 + D-016** constrain integration choices; no integration is assumed merely because a platform is popular or technically accessible.

## 5. Explicitly deferred choices (not to be guessed in WP-01)

- Exact payment provider and payment integration architecture: defer to a separately approved engineering/commercial design after SKU and billing semantics; MVP-00 explicitly forbids selecting or connecting a provider.
- Exact database schema, migration, entitlement subject and usage-ledger implementation: derive only after product accounting policy is approved in WP-02/WP-03 and after repository revalidation.
- Provider credentials, external account connections, crawler activation, social account connections and production configuration: not authorized in MVP-00.
- Numeric prices, quotas, crawl limits, sample sizes, confidence thresholds and conversion/uplift targets: no arbitrary values are inserted; evidence and owner approval required.

## 6. Owner approval queue — decisions needed to close WP-01

Please review and explicitly approve or revise the following. Silence, a recommendation, or the creation of this register is not approval.

| Priority | Decision(s) | Owner input needed |
|---|---|---|
| P1 | D-001 | First pilot segment and staged expansion approach |
| P1 | D-002 | Launch country/region, language(s), currency/display convention, timezone |
| P1 | D-003 | Approve recommended hybrid AEO/GEO/SEO measurement ownership, or provide alternate boundary |
| P1 | D-004, D-008, D-016 | Source/permission and evidence policy direction; retention/legal review owner |
| P1 | D-005, D-006, D-015 | Initial commercial model direction, bundle launch decision and quota/resource policy principles (exact prices/limits can remain gated to evidence) |
| P1 | D-007, D-013 | PAI pilot Offer-nature coverage and scoring approach |
| P1 | D-009, D-012 | Minimum Workspace roles/collaboration and execution workflow depth |
| P1 | D-010, D-017 | Service launch criteria and which provider/surface combinations may be called supported |
| P1 | D-011 | Pilot KPI and stop/go framework |
| P2 | D-014 | Which integrations are essential for the first pilot versus manual evidence capture |

WP-01 cannot be marked complete until each decision blocking the next authorized stage has an explicit owner disposition. Non-blocking unknowns must still have an accountable owner and a resolution deadline. Legal/privacy/provider matters require the appropriate specialist approval; the product owner cannot be assumed to grant third-party permissions that are not theirs to grant.

## 7. WP-01 verification and disposition

- [x] Read the full MVP-00 governance contract and WP-01 procedure.
- [x] Read the owner-approved Product Specification, including its explicit open-decision section and FR-01–FR-11.
- [x] Read the MVP Map and MVP Baseline, including their open decisions and stage dependencies.
- [x] Reconcile Product Strategy v2, DOC-67 v4 and Stele owner decisions KNOW-66, KNOW-25 v3, KNOW-64 v2 and KNOW-22.
- [x] Preserve all previously approved product invariants; distinguish them from unresolved choices.
- [x] Consolidate duplicate D-001–D-012 items and extend the register to cover scoring, integration depth, Offer/resource limits, privacy/retention and per-service launch readiness.
- [x] Revalidate `main` and `MVP_00` immediately before the documentation write.
- [ ] Obtain explicit owner dispositions for all blocking decisions.
- [ ] Update the authoritative register with approved values, approver and date; create a superseding entry rather than rewriting history if a decision changes.
- [ ] Recheck downstream contracts and hand off to WP-02 only after owner authorization.

**WP-01 disposition:** `PARTIAL — evidence inventory and decision recommendations prepared; owner approvals pending`. No implementation authorization is created by this document.

## 8. Source links

- [MVP-00 governance contract](../roadmap/00-product-decisions-and-delivery-governance.md)
- [Owner-approved MVP Product Specification](../../../../docs/product/OXENN_MVP_PRODUCT_SPECIFICATION.md)
- [MVP Map](../../../architecture_map/MVP_map.md)
- [MVP Baseline](../MVP_baseline.md)
- [MVP Engineering Baseline](../../../../docs/project/MVP_ENGINEERING_BASELINE.md)
- [MVP Roadmap README](../roadmap/README.md)
- [Product Strategy v2 — DOC-18](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/DOC-18)
- [Owner-approved Product Specification — KNOW-66](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/KNOW-66)
- [Independent service and shared Workspace decision — KNOW-25](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/KNOW-25)
- [Authenticated service access — KNOW-64](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/KNOW-64)
- [Nine-domain dashboard direction — KNOW-22](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/KNOW-22)
- [Product-to-Engineering Blueprint — DOC-67](https://app.stele-ai.dev/p/oxenn-59hxc/nodes/DOC-67)
