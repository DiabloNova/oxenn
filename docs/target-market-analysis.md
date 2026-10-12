# Target Market, Ideal Customer Profile, and Go-to-Market Strategy

**Status:** Investor working section — evidence-led, not a validated forecast  
**Prepared:** 12 October 2026  
**Product evidence reviewed:** public repository `DiabloNova/oxenn`, default branch `main`; `README.md`, `docs/product/README.md`, `docs/architecture/README.md`, `docs/user-guides/README.md`, `docs/services/README.md`, `database/schema/index.ts`, `src/app/[locale]/page.tsx`, and `package.json`.  
**Integration note:** The existing `Investor_Memorandum_fa.pdf` was found in the project Library, not in the repository's documented `docs/` structure. This file is a replacement market section for integration; it does not silently overwrite the PDF. The memorandum's current evidence-led conclusion—that demand, revenue, pricing, and product-market fit remain unproven—is preserved.

## 1. Executive market thesis

Oxenn should not launch as a broad, all-purpose SEO suite or sell “GEO” as a trend. Its most defensible initial wedge is **Persian-language AI-search and SEO diagnostics for digital marketing agencies managing several client brands**, delivered first as a tightly scoped paid diagnostic and then as a repeatable monitoring subscription.

The buyer's job is concrete: identify where a client brand is absent, misrepresented, or under-cited in relevant search and AI-generated answers; compare it with named competitors; prioritize content and technical changes; and show the client what changed. Agencies are attractive because one sale can expose Oxenn to several brands, reporting recurs monthly, and the product can help package a higher-value client service. The counterweight is that agencies are price-sensitive, expect multi-workspace reporting, and can replace software with spreadsheets or existing tools unless Oxenn saves measurable time or helps retain/win client accounts.

**Recommendation:** run a founder-led, paid design-partner programme with 5–10 Iranian SEO/digital agencies that already sell recurring SEO/content services and can provide access to representative client sites. Do not assume Iran is automatically the best *scaled* market: use it as the first learning market only if legal operations, AI-provider access, local payment collection, and repeatable Persian-language measurement are confirmed. In parallel, interview Persian-speaking agencies and brands outside Iran. Enter selected MENA markets only after Arabic/English coverage, payment operations, and competitive quality are verified.

The investment case is therefore a **measurable workflow opportunity**, not a claim of proven demand or a large verified market. The public repository documents substantial analytical engines, but the reviewed evidence does not establish reliable end-to-end production quality, external model coverage, customer traction, willingness to pay, or revenue.

## 2. Product scope: what the evidence supports

The public repository README describes a bilingual Persian/English, multi-tenant AI visibility and AEO platform built with Next.js, TypeScript, PostgreSQL, Drizzle, and pgvector. The product documentation labels the following engines “Implemented”; this is evidence of documented implementation, not independent proof that every workflow works reliably in production.

| Capability | Repository evidence | Commercial interpretation |
|---|---|---|
| AI visibility audit and weighted scoring | `docs/product/README.md` | Potential core wedge, contingent on repeatable model/platform coverage and output quality |
| Competitor discovery, profiles, and change observations | Product documentation | Useful for agency client benchmarking; validate freshness and accuracy |
| AI citation and brand intelligence | Product documentation | Potentially valuable if mention/citation extraction is reliable and geographically/language relevant |
| Keyword intelligence, content gaps, content briefs | Product documentation | Supports actionable SEO/content workflows; content brief engine is documented as structured output, not article prose generation |
| Technical SEO analyzers and site architecture analysis | Product documentation | Can complement AI visibility with actionable technical diagnostics |
| Content Studio and AEO content analysis | Product documentation | Potential workflow value; do not claim measured ranking or AI-answer uplift |
| Prompt libraries and model comparison | Product documentation | Useful for controlled audits; ongoing monitoring cadence and coverage need validation |
| Diagnostic engine, job processing, RAG, cost governance | `docs/services/README.md` | Architectural foundation; not itself proof of commercial differentiation |
| Multi-tenant schema/RLS | `docs/architecture/README.md`, `database/schema/index.ts` | Relevant to agency workspaces and client separation; requires production security verification |
| Billing/payment flow | User guide mentions an invoice page | A page is not evidence of an integrated payment provider, completed transactions, or revenue |
| Production integrations and service availability | Not established by the reviewed files | Treat as unverified until end-to-end tests and provider credentials/configuration are demonstrated |

**Not established by this review:** paying customers, active usage, customer retention, production deployment health, verified model-by-country coverage, audited AI visibility accuracy, measured SEO uplift, complete integrations, production cost per report, or a validated price. Digital-twin simulation, predictive outcomes, automatic execution of recommendations, and guaranteed improvements must not be presented as current product capabilities unless separate implementation evidence proves them.

The public landing page contains aspirational marketing claims (including “real-time” and named model coverage). Those statements are not accepted as proof of actual latency, data access, or coverage. The product needs a dated capability matrix and repeatable benchmark before sales material makes engine-specific claims.

## 3. Precisely defined target market and customer job

**Initial target market:** digital marketing and SEO agencies serving Persian-language businesses that depend on organic search and content to acquire customers, have at least several recurring client accounts, and need differentiated monthly reporting. Prioritize agencies with 5–30 active SEO/content clients, an owner or delivery lead who can approve a modest software/services purchase, and enough technical capability to supply domains and review findings. These size thresholds are ICP hypotheses for discovery, not market statistics.

The customer is not buying “AI.” It is buying one or more measurable outcomes:

1. Reduce analyst hours spent manually querying AI systems, collecting citations, comparing competitors, and building reports.
2. Find actionable content/technical gaps that can become paid client work.
3. Produce credible evidence for monthly client reviews and renewal conversations.
4. Detect changes in brand representation and citation sources before the next scheduled report.
5. Differentiate the agency's service without hiring a dedicated AI-search research team.

**Primary economic buyer:** agency founder, managing director, or head of SEO.  
**Daily users:** SEO strategist, content lead, technical SEO analyst, account manager.  
**Influencers:** client marketing manager and technical/content teams.  
**Budget:** SEO/marketing software, client delivery tooling, analytics/reporting, or experimentation budget. The existence and size of this budget must be confirmed in interviews.

**Purchase triggers:** a client asks “why does ChatGPT recommend competitors?”, an agency pitches a new AI-search service, a high-value client renews or challenges SEO results, an account loses organic traffic or citations, or manual reporting becomes too time-consuming. Generic interest in GEO without a client request, budget, or recurring workflow is not a sufficient trigger.

## 4. Ranked segment attractiveness

Scores are directional hypotheses (1 = weak, 5 = strong) to guide discovery; they are not survey results. “Required capability” describes the minimum credible product for the segment, not a claim that it is already production-ready.

| Rank | Segment | WTP / recurring potential | Access / sales friction | Why it may buy | Main barrier / product gap | Decision |
|---:|---|---:|---:|---|---|---|
| 1 | SEO and digital agencies with recurring retainers | 4 / 5 | 4 / 3 | Multi-client reporting, service differentiation, analyst time savings | Multi-workspace permissions, client-ready exports, stable repeat measurements, white-labeling may be required | **Beachhead** |
| 2 | E-commerce brands with meaningful organic revenue | 4 / 4 | 3 / 3 | Product/category content gaps, competitor comparison, acquisition economics | Requires credible attribution, analytics integration, larger-site crawling, and clear revenue impact | Second wave / pilot alongside agencies |
| 3 | In-house marketing teams at mid-market SaaS/technology firms | 4 / 4 | 2 / 2 | Competitive positioning, demand capture, cross-channel visibility reporting | More scrutiny of security, integrations, data coverage, procurement, and proof | After repeatable product proof |
| 4 | Content publishers and lead-generation businesses | 3 / 4 | 3 / 3 | Visibility and citation exposure directly affect discovery and referrals | Business models vary; need vertical-specific prompts and publisher/citation workflows | Test selectively |
| 5 | Larger enterprise brands | 5 / 5 | 1 / 1 | Governance, multiple brands/markets, executive reporting | Long procurement, security reviews, SLAs, SSO, APIs, support and coverage requirements | Postpone until enterprise readiness |
| 6 | SMEs and local businesses | 2 / 2 | 4 / 3 | Local discoverability and reputation | Low budgets, low analytic maturity, churn risk, need for simplified product and education | Do not target directly at launch |
| 7 | Individual freelancers / solo consultants | 2 / 3 | 5 / 4 | Low-friction experimentation | Lower ARPA, support burden, churn, and free-tool substitution | Self-serve tier only after onboarding is efficient |

### Primary ICP qualification checklist

A prospect qualifies for the initial programme when at least five of these are true:

- Has 5+ recurring SEO/content clients or equivalent recurring managed spend.
- Sells ongoing organic search, content strategy, or digital PR—not only one-off website builds.
- Can name at least one client where AI-search visibility or citation evidence is commercially relevant.
- Produces client performance reports monthly or quarterly.
- Has a senior SEO/marketing decision-maker who can sponsor a paid pilot.
- Can provide authorized access to client domains and approve the test prompt set.
- Will review findings and execute at least one recommended change during the pilot.
- Can pay through an operationally available, compliant payment route.

Disqualify prospects who only want a free audit, cannot authorize data access, expect guaranteed AI recommendations/rankings, or have no owner for implementing recommendations.

## 5. Geographic prioritization

Geographic attractiveness and practical accessibility are different decisions. Product language alone does not establish market access.

| Priority | Geography | Strategic rationale | Constraints to resolve | Entry decision |
|---:|---|---|---|---|
| 1 — conditional learning market | Iran, Persian-language agencies and brands | Native-language discovery, direct founder access may reduce research and acquisition cost, local SEO workflows can be tested directly | Sanctions and cross-border restrictions; legal/payment operations; access and terms of external AI providers; hosting/data handling; price sensitivity and currency volatility; actual availability of target AI systems | Run a small paid pilot only after operational/legal checks. Do not assume the full global stack is accessible from Iran |
| 2 — parallel discovery | Persian-speaking buyers outside Iran (including diaspora businesses and agencies) | Persian language remains relevant while payment and provider access may be easier for some buyers | Small, fragmented segment; localization and support; payment eligibility and sanctions screening; no verified buyer count | Interview in parallel; prioritize only qualified buyers with an executable payment path |
| 3 — selective expansion | UAE, Saudi Arabia, and other MENA markets | IAB MENA reported $8.185bn in regional digital advertising spend in 2025, up 17.8% year on year; this supports regional digital-marketing activity, not Oxenn's addressable software revenue [S1] | Large incumbents, Arabic quality, country-level engine coverage, local sales, privacy/data rules, tax/payment and reseller needs | Enter only after Arabic/English measurement quality and local payment route are demonstrated |
| 4 — later scale market | English-speaking international markets | Larger established software budgets and visible paid demand for AI visibility products | Highest competitive intensity, brand credibility and acquisition costs; crowded SEO suites and specialist GEO vendors; weak differentiation without benchmark proof | Do not lead with a generic SEO suite. Enter with a proven agency workflow or a validated language/region advantage |

Google reported in May 2025 that AI Overviews were available in more than 200 countries/territories and 40+ languages [S2]. That is evidence of broad product distribution, **not** proof that every AI engine, feature, language, or country has identical coverage; it also does not establish Persian availability for every Google AI search experience. Test each engine, language, location, and query set directly.

**Geographic sequence:** (1) operational/legal feasibility review; (2) Iranian agency design partners if feasible; (3) Persian-speaking non-Iranian agencies as a parallel payment/access hedge; (4) English-language MENA customers after the first repeatable workflow; (5) broader English markets after differentiated results and unit economics. Do not sell an “Iran coverage” claim unless tested with a dated coverage matrix.

## 6. TAM, SAM, and SOM: transparent scenario model

### Interpretation and limitations

There is no verified count in the reviewed evidence of businesses willing to pay specifically for combined AI-visibility and SEO diagnostics in Oxenn's target regions. Nor is there a validated Oxenn price. Therefore, the estimates below are **planning scenarios, not sourced market facts, forecasts, or claims of current demand**. They are deliberately built from assumed paying organizations and annual contract value (ACV), rather than applying a percentage to the global SEO or digital advertising market.

The model should be replaced with a deduplicated account list, country-by-country inclusion rules, and observed willingness-to-pay after customer discovery. Counts refer to *potential paying organizations*, not all registered businesses, websites, internet users, or advertising spend.

### Definitions

- **TAM:** global agencies and in-house brands with recurring organic-search/content activity that could plausibly buy AI visibility measurement plus actionable SEO/content diagnostics.
- **SAM:** the subset Oxenn can serve with the actual supported languages, proven engine/country coverage, available integrations, payment collection, and support capacity during the initial expansion phase.
- **SOM:** paying organizations that a small founder-led team could realistically acquire and retain within 3–5 years. This is capacity- and execution-constrained, not a percentage of industry spend.

### Scenario table (annual recurring revenue)

All customer counts and ACVs in this table are analyst assumptions. USD equivalents are used for comparison; they are not proposed Iranian invoice currency or a promise that international payment is available.

| Metric | Conservative | Base | Upside |
|---|---:|---:|---:|
| TAM eligible organizations (assumption) | 25,000 | 50,000 | 100,000 |
| TAM blended annual ACV (assumption) | $1,200 | $2,400 | $3,600 |
| **TAM = organizations × ACV** | **$30m** | **$120m** | **$360m** |
| SAM organizations serviceable with language/coverage/payment constraints (assumption) | 2,000 | 5,000 | 12,000 |
| SAM blended annual ACV (assumption) | $1,200 | $2,400 | $3,000 |
| **SAM = organizations × ACV** | **$2.4m** | **$12m** | **$36m** |
| SOM paying organizations by year 3–5 (capacity assumption) | 40 | 150 | 400 |
| SOM blended annual ACV (assumption) | $1,200 | $2,400 | $3,000 |
| **SOM = paying organizations × ACV** | **$48k ARR** | **$360k ARR** | **$1.2m ARR** |
| SOM as share of SAM organizations | 2.0% | 3.0% | 3.3% |

**How to read this:** the base case is a hypothesis that Oxenn could build toward a $12m annual serviceable pool and $360k ARR from 150 retained organizations; neither figure is verified. The upside case requires broader language/region coverage, channel distribution, reliable retention, and sufficient delivery capacity. The conservative case may be the more appropriate planning anchor until pilots demonstrate conversion and retention. Do not present these figures as third-party market research.

### Sensitivity: base-case SAM

| Assumed serviceable organizations | $1,200 ACV | $2,400 ACV | $3,600 ACV |
|---:|---:|---:|---:|
| 2,000 | $2.4m | $4.8m | $7.2m |
| 5,000 | $6.0m | $12.0m | $18.0m |
| 10,000 | $12.0m | $24.0m | $36.0m |

A 50% reduction in eligible customer count halves SAM; a 50% increase in ACV increases revenue linearly only if conversion and retention remain unchanged. Higher pricing may lower conversion, especially in Iran. These interactions must be measured rather than assumed away.

### Evidence needed to upgrade confidence

1. Build a deduplicated list of agencies and target brands by country, service line, client count, and language; document the source and date for every count.
2. Conduct 20–30 structured interviews, including at least 10 agency owners, and record current tool spend, manual hours, report cadence, buyer, and switching trigger.
3. Run paid pilots, not just free demos; test at least three price points and collect actual invoices or signed commitments.
4. Track pilot-to-paid conversion, activation, weekly/monthly repeat usage, logo retention, expansion, and reasons for churn.
5. Measure per-customer model/API, crawling, hosting, support, and analyst costs to establish contribution margin.
6. Confirm legal eligibility, payment routes, provider terms, data residency/handling, and service availability for each target geography.

## 7. Competitive landscape and positioning

The category is already competitive. Oxenn should not claim to be the first, unique, or globally unmatched AI visibility platform.

| Alternative | Public evidence reviewed | Competitive implication |
|---|---|---|
| Semrush AI Visibility | Official pricing page lists AI Visibility Base at $99/month per domain, with 25 custom prompts and competitor/prompt research; SEO + AI Search bundles are listed from $165.17/month on annual billing [S3, S4] | Strong established suite and distribution. Oxenn must win on a specific underserved workflow, local fit, or service economics—not feature count alone |
| Ahrefs / Brand Radar | Official pricing page lists core paid plans from $129/month and Brand Radar AI from $199/month; custom prompt packages are also listed [S5] | Established SEO data, brand trust, and broad workflows create a high bar for generic SEO replacement |
| Specialist AI visibility tools (e.g., OtterlyAI, Rankscale, Profound) | These should be evaluated against dated official feature, pricing, model, country, and language pages before making an investor comparison | Direct alternatives can move quickly; no claim of missing Persian/Iran coverage should be made without a current, reproducible test |
| Agencies and consultants | Manual prompts, spreadsheets, screenshots, crawl tools, slide decks, and custom scripts | Often the closest substitute. Oxenn must save time, increase report quality, or help sell/retain client services |
| Existing SEO suites and analytics | Search Console, analytics products, crawlers, keyword tools, and rank trackers | May already satisfy much of the buyer's need; avoid forcing a replacement if an add-on workflow is more realistic |
| In-house dashboards or scripts | Built by technical teams for a specific brand or client portfolio | Can be cheaper at scale but require maintenance and ongoing measurement design |

**Recommended position:** “A Persian-first workflow for agencies to audit, compare, and improve client visibility across traditional search and AI answers—with evidence-linked actions and repeatable reporting.” Use only after Persian measurements and the action/report workflow are validated. Do not promise to improve AI recommendations or organic rankings; promise transparent measurement and prioritized recommendations, then measure outcomes.

**Proof of differentiation required:** run the same fixed prompt set, competitor set, locations, and repeated trials across Oxenn and selected alternatives. Score mention detection, citation capture, sentiment/context classification, repeatability, time to report, actionable finding rate, Persian-language quality, and total cost. Publish method and limitations. A localized UI alone is not a durable moat.

## 8. Initial packaging and pricing hypothesis

Competitor public prices show that established products charge from roughly $99/month for specialist AI visibility to $165+/month for bundled SEO + AI Search, with larger plans costing more [S3–S5]. These prices are reference points, not proof that Oxenn can charge the same price or serve the same markets.

Start with a **service-assisted pilot** to discover which outputs customers value. Proposed prices below are hypotheses, not validated prices. Use local-currency invoicing only where lawful and operationally available; avoid promising USD payment from a jurisdiction/payment route that has not been approved.

| Offer | Proposed test price | Limits / buyer | Purpose |
|---|---:|---|---|
| Paid diagnostic | $150–$400 one-off equivalent | One brand/domain, agreed prompt set, competitor baseline, prioritized action memo | Test willingness to pay and deliver a decision-quality outcome before subscription |
| Solo / single brand | $39–$59/month equivalent | One domain, limited prompts and monthly reporting | Entry tier only after self-serve onboarding and support cost are known |
| Growth | $99–$149/month equivalent | One brand, several competitors, recurring monitoring and diagnostics | In-house teams and consultants with recurring usage |
| Agency | $199–$399/month equivalent | Multiple client workspaces, repeatable reports, usage limits and role separation | Primary subscription hypothesis; price by portfolio/usage rather than unlimited access |
| Enterprise | Custom | Multiple brands/markets, governance, support, API or SSO only when implemented | Postpone active selling until enterprise controls and SLAs exist |

Do not build pricing around features that are not available. Agency packaging requires tenant-safe client separation, simple onboarding, reliable export/report delivery, and clear usage accounting. Usage-based overages should be introduced only when the relationship between tracked prompts, provider calls, latency, and cost is measured and predictable.

### Unit economics: what can and cannot be concluded

There is no verified CAC, gross margin, churn, support cost, or customer lifetime value in the reviewed evidence. Avoid presenting LTV/CAC as fact. For planning, define:

- **Gross margin** = (subscription revenue − variable AI/API, crawl, infrastructure, and directly attributable support costs) / subscription revenue.
- **CAC payback months** = fully loaded acquisition cost / monthly gross profit per new customer.
- **LTV (simple approximation)** = monthly gross profit per customer / monthly logo churn, only after churn is observed and cohort quality is adequate.

A useful first gate is positive contribution margin per paid pilot, repeat use in at least two consecutive reporting cycles, and a credible route to recovering acquisition cost within 12 months. These are proposed operating gates, not achieved results. Record founder sales time and manual analyst time even if they are not initially paid as cash; otherwise a service-heavy model can look artificially profitable.

## 9. Go-to-market and expansion roadmap

### Phase 0 — feasibility and measurement integrity (weeks 1–3)

- Confirm legal entity/ownership, permitted operating jurisdictions, payment collection, provider terms, hosting and data handling.
- Test each target AI engine by language and geography; document failure modes and repeatability.
- Validate production authentication, tenant separation, job execution, external integrations, and deployment readiness before handling client data.
- Define one fixed diagnostic workflow, report template, and transparent methodology.
- Set up cost logging per prompt, crawl, report, and customer.

**Gate:** no customer data processing or engine-coverage promise until access, security, and methodology are demonstrable.

### Phase 1 — paid agency design partners (weeks 4–10)

- Recruit 5–10 agencies through founder-led outreach, professional networks, referrals, and SEO communities.
- Conduct 20–30 structured interviews; do not substitute survey interest for purchase evidence.
- Offer a time-boxed paid diagnostic with a written scope, agreed prompt set, baseline, prioritized actions, and review meeting.
- Ask the agency to implement one or more changes and repeat the measurement.
- Compare manual hours and output quality against the agency's current workflow.

**Gate:** at least 3 paid pilots from unrelated organizations, at least 2 repeat engagements or signed subscription commitments, documented positive contribution margin, and no unresolved critical data/security issue. These are proposed evidence gates.

### Phase 2 — repeatable agency subscription (months 3–6)

- Convert the highest-value workflow into agency workspaces, recurring monitoring, client-ready reports, competitor tracking, and clear action prioritization.
- Add only the integrations demanded repeatedly by qualified buyers.
- Publish a dated Persian-language benchmark and limitations.
- Test tiering and monthly/annual payment only where the payment route is executable.

**Gate:** repeat use across multiple billing/reporting cycles, measured retention, stable per-customer costs, and evidence that agencies can sell or retain a service because of Oxenn.

### Phase 3 — adjacent expansion (months 6–18)

- Expand to e-commerce and mid-market in-house teams with recurring organic revenue and measurable conversion outcomes.
- Test Persian-speaking customers outside Iran in parallel if payment and service access are easier.
- Enter UAE/Saudi/other MENA markets only with validated English/Arabic engine coverage, localization, legal review, and a local acquisition channel.
- Add enterprise requirements only when multiple qualified prospects demonstrate willingness to pay for them.

### Acquisition channels ranked

1. **Founder-led agency outreach and referrals:** fastest path to qualitative learning and paid pilots.
2. **Agency partnerships and service providers:** attractive if partners can bring several client brands; do not imply existing partnerships.
3. **Persian-language educational content and benchmark reports:** useful for trust and inbound demand; measure qualified demo-to-paid conversion.
4. **Communities and specialist events:** test through small, attributable experiments.
5. **Product-led free audit:** only when the audit is reliable, abuse-resistant, low-cost, and has a clear conversion path.
6. **Paid ads and broad international outbound:** postpone until ICP conversion and unit economics are established.

## 10. Risks, invalidating assumptions, and validation priorities

| Risk / assumption | Why it matters | Validation / mitigation |
|---|---|---|
| Agencies will pay for AI visibility reporting | Interest may not map to recurring budget | Paid pilots, price tests, signed commitments, and actual renewal behavior |
| Persian AI-search data is accessible and stable | Incomplete access makes the core promise unreliable | Dated engine × language × country test matrix; repeat checks and document unavailable engines |
| Oxenn recommendations change outcomes | A diagnostic can be interesting without economic value | Baseline, intervention, repeat measurement, and cautious attribution; never guarantee outcomes |
| Agency workflows need multi-client support | Without this, one sale may not scale to multiple brands | Validate permissions, client separation, exports, branding, and report cadence in pilots |
| International expansion is operationally possible | Sanctions, payment, provider terms, and data rules can block sales | Legal counsel and payment-provider confirmation before each market launch |
| Product documentation reflects reliable runtime behavior | “Implemented” labels do not establish production quality | End-to-end acceptance tests, production-like data, observability, and security review |
| Competition erodes differentiation | Major suites already bundle SEO and AI visibility | Repeatable comparative benchmark and a narrow workflow advantage |
| Price can cover variable costs | Model calls, crawling, support, and manual analysis can erode margin | Measure cost per prompt/report/customer; set limits and overage policy |
| TAM assumptions are too optimistic | No verified eligible-buyer count is available | Build a sourced account universe and update the scenario model after discovery |
| Founder-led acquisition does not scale | Early wins may rely on personal relationships | Track fully loaded CAC and test repeatable partner/content channels |

### First 90-day validation scorecard

- 20–30 qualified buyer interviews completed and coded.
- 5–10 design partners recruited; at least 3 paid pilots.
- At least 2 repeat engagements or subscription commitments.
- A documented engine/language/location coverage matrix with repeated measurements.
- A comparison against at least two alternatives or manual workflows.
- Time-to-report and analyst-hours saved measured for each pilot.
- Variable cost per report/customer and pilot contribution margin recorded.
- A verified payment and legal-operating path for each market tested.
- No unresolved critical authentication, tenant isolation, or customer-data handling issue.
- Price sensitivity and reasons for non-purchase recorded, not inferred.

## 11. Investor conclusion

Oxenn's best initial commercial hypothesis is a Persian-first agency workflow that joins AI visibility measurement with SEO/content diagnostics and client-ready reporting. Agencies offer multi-brand distribution and recurring use, while a paid diagnostic reduces the risk of building a broad platform before willingness to pay is known. The likely wedge is not “more dashboards”; it is a repeatable process that saves analyst time and turns evidence into prioritized client work.

Iran is a plausible **learning beachhead**, not yet a proven best market for scalable revenue. It should be pursued only after legal, payment, provider-access, and coverage checks. Persian-speaking customers outside Iran provide a useful parallel test; broader MENA and English-speaking expansion should follow demonstrated product quality and unit economics.

The market model supports planning only. The base scenario of $12m SAM and $360k SOM ARR is derived from explicit assumptions, not verified buyer counts or customer demand. Investment decisions should therefore fund evidence collection and product hardening in stages, with the next capital gate tied to paid conversion, repeat usage, cost-to-serve, security, and a reproducible benchmark—not to the apparent size of the overall SEO or AI market.

## 12. Evidence register

Access date for all web sources: **12 October 2026**. Live pricing and availability can change; verify again before external distribution.

| ID | Source | Date / type | Claim supported | Confidence / limitation |
|---|---|---|---|---|
| R1 | [Oxenn README](https://github.com/DiabloNova/oxenn/blob/main/README.md) | Live repository, accessed 12 Oct 2026 | Bilingual platform description, stack, migration doctrine, documented deployment caveat | High for repository text; not proof of production operation |
| R2 | [Product documentation](https://github.com/DiabloNova/oxenn/blob/main/docs/product/README.md) | Live repository, accessed 12 Oct 2026 | Product modules and their documented implementation status | High for what docs state; medium/low for end-to-end runtime reliability |
| R3 | [Architecture documentation](https://github.com/DiabloNova/oxenn/blob/main/docs/architecture/README.md) and [canonical schema](https://github.com/DiabloNova/oxenn/blob/main/database/schema/index.ts) | Live repository, accessed 12 Oct 2026 | PostgreSQL/Drizzle architecture, schema and RLS policy patterns | High for code/documentation existence; does not replace production security testing |
| R4 | [User guides](https://github.com/DiabloNova/oxenn/blob/main/docs/user-guides/README.md) and [service documentation](https://github.com/DiabloNova/oxenn/blob/main/docs/services/README.md) | Live repository, accessed 12 Oct 2026 | Documented dashboard/workflows, diagnostics, jobs, cost governance | High for documented scope; not evidence of paid use or production SLA |
| S1 | [IAB MENA — 2025 MENA Digital Adspend](https://iabmena.com/2026-2025-mena-digital-adspend/) | Published 8 Jun 2026 | MENA digital advertising spend reached $8.185bn in 2025, +17.8% YoY | High for reported advertising-spend figure; not Oxenn TAM and full report is member-only |
| S2 | [Google — AI Overviews expand to 200+ countries and 40+ languages](https://blog.google/products-and-platforms/products/search/ai-overview-expansion-may-2025-update/) | Published 20 May 2025 | Broad AI Overviews availability | High for Google's announcement; does not prove Persian support or identical access across engines/markets |
| S3 | [Semrush AI Visibility pricing](https://www.semrush.com/pricing/ai/) | Official live pricing page, accessed 12 Oct 2026 | AI Visibility Base listed at $99/month per domain; 25 prompts and competitor/prompt research | High for displayed offer at access time; plan details may change |
| S4 | [Semrush SEO + AI Search pricing](https://www.semrush.com/pricing/seo-ai-search/) | Official live pricing page, accessed 12 Oct 2026 | Bundled plans and prompt/site limits; Starter listed at $165.17/month on annual billing | High for displayed offer at access time; regional taxes/discounts may vary |
| S5 | [Ahrefs pricing](https://ahrefs.com/pricing/) | Official live pricing page, accessed 12 Oct 2026 | Core paid plans from $129/month and Brand Radar AI from $199/month; prompt packages available | High for displayed offer at access time; not a like-for-like feature comparison |
| A1 | TAM/SAM/SOM scenario model in this section | Analyst assumptions, 12 Oct 2026 | Scenario-based annual revenue ranges | Low until customer universe, ACV, and conversion are validated |
| A2 | ICP, segment ranking, pricing, acquisition and validation gates | Analyst hypotheses, 12 Oct 2026 | Proposed go-to-market choices | Low/medium as strategic hypotheses; require paid-pilot evidence |
| A3 | Existing `Investor_Memorandum_fa.pdf` in the project Library | Working draft dated 11 Oct 2026 | Existing memorandum already treats product-market fit, revenue, pricing, and market counts as unproven | High for the reviewed PDF text; repository copy was not found in the documented `docs/` structure |

**Use in the memorandum:** replace the existing broad/qualitative market discussion with Sections 1–12 above; align the executive summary and financial model to the conservative/base/upside assumptions only after founder review. Preserve the explicit statement that no revenue, customer traction, or validated pricing has been established by the evidence reviewed.
