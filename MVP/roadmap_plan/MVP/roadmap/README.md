# MVP Stage Roadmap

**Parent baseline:** [MVP_baseline.md](../MVP_baseline.md)  
**Scope map:** [MVP_map.md](../../../architecture_map/MVP_map.md)  
**Portfolio map:** [project_map.md](../../../architecture_map/project_map.md)

Each numbered file is a self-contained execution brief for one stage of the owner-approved OXENN MVP. Every brief repeats the core product model, Offer/SKU distinction, independent-service rule, authenticated access requirement, evidence-truth rules, external-action boundary, execution procedure, verification expectations and exit criteria.

## Ordered stages

| Stage | File | Outcome |
|---|---|---|
| MVP-00 | [Product decisions and delivery governance](./00-product-decisions-and-delivery-governance.md) | Approve unresolved product, commercial, source, pilot and acceptance decisions; establish current repository baseline |
| MVP-01 | [Identity, workspace and security foundation](./01-identity-workspace-and-security-foundation.md) | Server-authenticated identity, workspace ownership, tenant isolation and security boundary |
| MVP-02 | [Service catalog, entitlements and usage](./02-service-catalog-entitlements-and-usage.md) | Independent SKU selection, entitlement, quota, usage and optional bundle contracts |
| MVP-03 | [Seller, Offer and Product Intelligence Profile](./03-seller-offer-and-product-intelligence-profile.md) | Person/provider, Offer types, channel separation and versioned PIP |
| MVP-04 | [Evidence acquisition and traceability](./04-evidence-acquisition-and-traceability.md) | Permission-aware acquisition, provenance, data quality and evidence links |
| MVP-05 | [Independent SEO service](./05-independent-seo-service.md) | Standalone SEO workflow with bounded crawl and evidence-backed findings |
| MVP-06 | [Independent AEO service](./06-independent-aeo-service.md) | Standalone answer-readiness and observable answer-surface assessment |
| MVP-07 | [Independent GEO service](./07-independent-geo-service.md) | Standalone generative-engine visibility and representation assessment |
| MVP-08 | [Optional Digital Visibility Suite](./08-optional-digital-visibility-suite.md) | Optional SEO+AEO+GEO package and unified reporting without forced bundle access |
| MVP-09 | [Geo-market intelligence and contextual benchmarks](./09-geo-market-intelligence-and-contextual-benchmarks.md) | Contextual market, geography, competitor and benchmark basis |
| MVP-10 | [Product value and competitiveness assessment](./10-product-value-and-competitiveness-assessment.md) | Foundational customer, value, price, competitor and operational assessment |
| MVP-11 | [Gap analysis, recommendations and transparent scenarios](./11-gap-analysis-recommendations-and-transparent-scenarios.md) | Evidence-linked gaps, prioritized recommendations and bounded estimates |
| MVP-12 | [Growth plan, approval and task workflow](./12-growth-plan-approval-and-task-workflow.md) | Customer-approved plan and trackable task lifecycle |
| MVP-13 | [Outcome measurement and continuous improvement](./13-outcome-measurement-and-continuous-improvement.md) | Comparable outcome capture and limited reassessment |
| MVP-14 | [Integrated pilot validation and release readiness](./14-integrated-pilot-validation-and-release-readiness.md) | End-to-end, security, operational and pilot go/no-go evidence |

## Use by an AI execution agent

- Read the relevant stage file as the complete stage brief; do not require the agent to infer scope from other stages.
- Revalidate the repository, branch, commit, current implementation and open changes before modifying anything.
- A stage file is a specification, not automatic permission to implement, migrate, deploy or contact customers.
- Preserve independent SEO/AEO/GEO access. Do not require a comprehensive PIP or the optional bundle for a standalone service.
- Stop and request owner decisions for unresolved commercial, legal, privacy, geography, source, cost or architecture choices.
- Finish with the handoff package and direct evidence required by the stage file.

A stage is not complete because a document was written, an endpoint exists, a build passes or a mock response is returned. Use the exit criteria and the shared Definition of Done in [MVP_baseline.md](../MVP_baseline.md).
