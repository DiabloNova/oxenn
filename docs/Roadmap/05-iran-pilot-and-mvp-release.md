# Stage 05 — Iran Design Partners, Paid Pilot and MVP Release

## Metadata
- **Stage ID:** RM-05
- **Horizon:** Short-term MVP launch
- **Status:** proposed
- **Prerequisites:** RM-00 through RM-04 verified in staging

## Objective

Validate that the integrated assessment-to-improvement workflow solves a valuable problem for Iranian product owners and that the delivery model is commercially sustainable before widening the audience or feature set.

## Customer and business value

Initial customers receive a complete, limited-scope assessment, actionable recommendations and guided implementation. Oxenn learns which evidence, services and outcomes customers are genuinely willing to pay for.

## Scope

- One pilot vertical selected through customer/data validation.
- 3–5 design-partner customers as an initial target, not a guaranteed forecast.
- One to three products/SKUs per pilot customer, subject to data availability.
- Digital assessment plus bounded product/competitiveness assessment.
- Manual expert or customer-led execution for selected approved tasks.
- Before/after measurement and willingness-to-pay validation.

**Non-goals:** national market coverage, all industries, public-sector procurement, or a promise of fully automated product engineering.

## Detailed execution

1. Validate the chosen vertical through structured interviews with product brands/manufacturers, social sellers and suitable agencies/distributors.
2. Confirm that each pilot participant has a real product, a clear target market, authorized data sources and a customer sponsor willing to share evidence.
3. Agree written pilot scope, deliverables, success measures, fees/credits, data usage, confidentiality and consent.
4. Capture baseline data before recommendations: site visibility, AI response panel, listings, price/availability, review sample, customer-provided sales/returns where available.
5. Run both assessment pillars and review material findings with the customer to correct product facts and false positives.
6. Produce a prioritized, costed plan and record which actions the customer approves.
7. Execute a small subset of digital improvements and product/operational investigations; track external expert costs separately.
8. Measure post-action outcomes using comparable windows/sources. Use control comparisons where feasible and label attribution limitations.
9. Conduct customer interviews and pricing tests after delivery; distinguish willingness-to-use from willingness-to-pay.
10. Review cost-to-serve: data acquisition, AI/provider usage, analyst effort, expert/field costs, support and infrastructure.
11. Decide launch readiness by segment and package. Offer a low-cost self-service path to individual/social sellers only if onboarding and cost economics support it.
12. Publish only verified capabilities and clear coverage/limitations. Keep future modules marked unavailable/coming later.

## Target files and systems

- Product onboarding, digital assessment, competitiveness and improvement plan modules from RM-01–RM-04.
- `docs/Roadmap/**` and product/help documentation.
- Billing/usage only if a tested, approved payment and accounting path exists.
- Analytics/observability and support/runbook modules.
- Staging deployment configuration and automated release checks.

Exact code paths and deployment settings must be re-confirmed after baseline remediation and before release.

## Operational and privacy controls

Use a written data-processing and confidentiality approach suitable for Iranian customers. Apply least-privilege access, tenant isolation, retention/deletion, encrypted secret management, usage budgets and incident handling. Do not claim regulatory compliance without qualified legal review.

## Testing and acceptance

- All pilot journeys run end-to-end in staging using customer-authorized sources.
- No synthetic result is presented as a live measurement.
- Customer approval and execution records are complete.
- Failure and partial coverage are communicated honestly.
- Cost per assessment and cost-to-serve are measured.
- At least one pilot produces a documented, customer-confirmed improvement result; no broad causal claim is made from one pilot.

## Parallelization

Customer discovery, vertical data-source study and launch support preparation can run in parallel. Pilot delivery should be coordinated by one product owner because the same customer evidence feeds both assessment pillars and the plan. Do not run changes across pilot customers without explicit permission.

## Success indicators

Paid pilot conversion, assessment completion, proposal acceptance, intervention completion, customer renewal/continued monitoring intent, customer-confirmed outcome and gross contribution after human/data costs.

## Risks and open decisions

Fashion/social commerce may be a candidate due to social-commerce activity, but the final vertical must be selected from interviews, available evidence and paid commitments rather than market-size statistics alone.
