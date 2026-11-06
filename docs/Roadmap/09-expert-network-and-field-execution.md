# Stage 09 — Expert Network and Managed Field Execution

## Metadata
- **Stage ID:** RM-09
- **Horizon:** Long-term expansion
- **Status:** proposed
- **Prerequisites:** RM-04, RM-07 and RM-08; validated demand for paid human/physical services

## Objective

Connect customer-approved improvement plans to qualified specialists, laboratories and field operators, and manage the service from scope through evidence and outcome.

## Customer and business value

Customers can obtain physical-world work that software cannot perform alone—product tests, package trials, retail audits, mystery shopping, consumer panels, specialist review and operational improvements—through one controlled workflow.

## Scope

- Expert and service-provider profiles and capability taxonomy.
- Qualification and evidence of credentials where relevant.
- Customer request/quotation/approval.
- Assignment, milestones, evidence submission and acceptance.
- Service cost, payment and dispute records where supported by a compliant payment model.

**Non-goals:** uncontrolled open marketplace, endorsement of unverified providers, or accepting regulated testing outside qualified providers' scope.

## Detailed execution

1. Identify service categories demanded by pilot customers and map the licensing/qualification requirements for each.
2. Define onboarding and vetting: identity/business checks appropriate to role, credentials, references, geographic coverage, insurance where relevant and conflict-of-interest disclosures.
3. Create a catalog of clearly bounded service packages with deliverables, exclusions, sample sizes, time, pricing basis and acceptance criteria.
4. Convert an approved improvement-plan action into a work request with scope, location, deadline, budget cap, data access and success criteria.
5. Match providers based on validated capability, region, availability, price and customer restrictions.
6. Present provider proposals to the customer and require explicit approval before assignment or payment.
7. Restrict the provider to the minimum tenant/product data needed for that task and revoke access on completion.
8. Track milestones, evidence, chain of custody where applicable, customer comments and change requests.
9. Record actual time, expenses, service fees and acceptance/dispute outcome.
10. Require qualified reviewers for regulated or technical reports; never let an AI system confer professional certification.
11. Feed validated field results to the root-cause and outcome ledger.
12. Evaluate providers based on verified work quality, timeliness, customer feedback and compliance—not merely ratings.

## Target files and modules

- Approval/action framework from RM-04.
- Field evidence contracts from RM-07.
- Cost records and scenario estimates from RM-08.
- Proposed module: `src/features/expert-network/**`.
- Proposed UI: `src/app/[locale]/dashboard/experts/**` and provider portal routes.
- Authorization, audit events, file storage and notification modules after baseline revalidation.

## Security, privacy and commercial requirements

Provider access must be scoped, time-bound and auditable. Sensitive product formulations, supplier data, customer records or financial data should not be shared unless essential and explicitly authorized. Define contracts, liability, confidentiality, cancellation, disputes and payment handling with qualified legal/commercial advice.

## Testing and acceptance

- Only qualified/approved providers can receive restricted work.
- Provider access cannot cross tenant boundaries or exceed the approved work scope.
- Customer approval precedes assignment, disclosure and payment.
- Evidence is traceable to provider, method, sample and date.
- Dispute, cancellation, provider failure and refund/compensation states are handled.
- Regulated service categories enforce credential/qualification checks.

## Parallelization

Provider discovery, qualification criteria and workflow UX can run in parallel. Provider portal, assignment workflow and access control require a shared service contract and one integration owner. Legal/commercial terms are a separate workstream but must be resolved before launch.

## Success indicators

Qualified provider coverage, quote acceptance, completion rate, service quality, delivery variance, dispute rate, field evidence usefulness and gross margin after service management.

## Risks and open decisions

Decide whether Oxenn acts as marketplace, managed service provider or referral/coordination platform. These models have materially different liability, payments and operational obligations.
