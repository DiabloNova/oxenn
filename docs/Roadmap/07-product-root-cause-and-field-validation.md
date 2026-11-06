# Stage 07 — Product Root-Cause Intelligence and Field Validation

## Metadata
- **Stage ID:** RM-07
- **Horizon:** Long-term expansion
- **Status:** proposed
- **Prerequisites:** RM-03 and RM-05; sufficient customer/review/returns/quality evidence and a validated pilot category

## Objective

Move from listing symptoms and sentiment to a disciplined process that identifies plausible root causes, gathers discriminating evidence and validates physical-product or operational hypotheses.

## Customer and business value

The customer can distinguish a surface-level complaint from its likely underlying cause and knows what test, data or expert review is required before spending money on a remedy.

## Scope

- Structured complaint and defect taxonomy per vertical.
- Evidence clustering and duplicate/bias handling.
- Root-cause hypothesis graph.
- Evidence gaps and confidence levels.
- Field research/lab test workflows as paid, consented service options.
- Human review and root-cause confirmation/rejection.

## Detailed execution

1. Choose a single product category and create a controlled failure/complaint taxonomy with domain experts.
2. Define signal types: customer review, complaint, return reason, warranty issue, support contact, quality test, supplier batch, packaging inspection and field observation.
3. Preserve original evidence and metadata; normalize only into separate derived records.
4. Cluster recurring complaints while detecting duplicates, coordinated/incentivized reviews, sample bias, language variation and product/variant misattribution.
5. Link each issue to potential contributing factors: material, design, manufacturing, storage, transport, packaging, instructions, service or expectation mismatch.
6. Use a hypothesis model that distinguishes observed symptom, candidate cause, supporting evidence, contradicting evidence and missing evidence.
7. Estimate confidence using calibrated evidence rules; AI-generated hypothesis text alone cannot raise a claim to confirmed cause.
8. Recommend the smallest next test that can distinguish competing hypotheses.
9. Build fieldwork requests for mystery shopping, package handling tests, customer panels, store audits, returns inspections or laboratory tests.
10. Capture expert/test method, sample, chain of custody where relevant, instrument/calibration details, date, result and limitations.
11. Require expert/customer review before designating a root cause as confirmed.
12. Convert validated causes into action candidates for RM-04 and record the outcome after intervention.

## Target files and modules

- Product evidence and issue models from RM-01/RM-03.
- Proposed module: `src/features/product-root-cause/**`.
- Proposed fieldwork workflow: `src/features/field-validation/**`.
- Existing review/diagnostic/recommendation services only after verifying their domain fit.
- Proposed UI: `src/app/[locale]/dashboard/products/[productId]/issues/**` and `fieldwork/**`.

## Safety and evidence rules

Do not certify physical quality based on photographs, AI vision or online reviews alone. Product safety, food/cosmetics/medical/industrial claims require qualified experts, suitable testing and applicable regulatory processes. Treat regulated categories as a later vertical-specific decision.

## Testing and acceptance

- Hypotheses remain distinct from validated causes.
- Evidence includes both confirming and contradicting observations.
- Sample bias and variant mismatches are surfaced.
- Lab/field outputs retain provenance and responsible expert.
- The system can reject a hypothesis and record why.
- Customer data and fieldwork records are tenant-scoped and permission-controlled.

## Parallelization

Taxonomy design, expert network research and evidence UX can proceed independently. The root-cause data model, confidence logic and vertical-specific rules must be co-designed and integrated by one owner. Lab/field partner onboarding is a separate commercial workstream.

## Success indicators

Percentage of hypotheses validated, time to identify a discriminating test, rate of false-positive causes, issue recurrence after intervention and verified reduction in returns/complaints where reliable customer data exists.

## Risks and open decisions

A single generic root-cause model will not fit apparel, food, cosmetics, electronics and industrial equipment equally. Introduce vertical playbooks only with expert-reviewed taxonomies and measured validation performance.
