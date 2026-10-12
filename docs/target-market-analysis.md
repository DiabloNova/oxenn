# Target Market, Ideal Customer Profile, and Go-to-Market Strategy

**Oxenn Investor Memorandum — replacement section**  
**Research cut-off:** 12 October 2026  
**Repository reviewed:** `DiabloNova/oxenn`, default branch `main`  
**Status:** Evidence-based working analysis; pricing, account counts, conversion, and revenue scenarios are not validated operating results.

## 1. Executive market thesis

**Recommendation:** Start with Persian-language SEO and digital-marketing agencies that manage multiple recurring client accounts. Sell a bounded, evidence-backed visibility diagnostic and reporting workflow—not a claim that Oxenn can guarantee AI recommendations or replace an established SEO suite.

The agency wedge is attractive because one buyer can introduce several brands, reporting is already recurring, and the output may reduce analyst time or support a differentiated retainer. This remains a hypothesis: no verified paying customer, retention, revenue, conversion, or willingness-to-pay dataset was found in the materials reviewed.

Oxenn's current repository contains meaningful product foundations: an AI visibility audit engine, competitor discovery, keyword and content-gap engines, technical SEO analyzers, citation and brand intelligence, content briefs, a content studio, and diagnostic logic. However, the live code also shows a critical boundary: `AIVisibilityProviderRegistry.getProvider()` returns a mock provider unless the caller explicitly requests Gemini and `GOOGLE_AI_API_KEY` is present. The inspected provider implementation establishes Gemini integration, not production-grade coverage across all major AI answer engines. Therefore, code presence is not equivalent to a production-ready, multi-engine commercial service.

The category is real but competitive. Gartner's 17 October 2025 research abstract identifies answer-engine visibility tools and flags accuracy and overreliance risks. Semrush lists AI Visibility at $99/month per domain when billed annually; OtterlyAI lists $29, $189, and $489 monthly tiers. These establish buyer-facing alternatives and price anchors, not Oxenn demand or differentiation. [E1–E3]

**Investment implication:** prioritize technical reliability, a Persian-language benchmark, and paid agency pilots before investing in broad geography or feature expansion. The first proof point should be repeat paid use and measurable workflow value—not a large headline TAM.

## 2. Product scope and evidence boundary

### Repository evidence

The current repository's `docs/product/README.md` labels multiple engines as implemented, including AI Visibility Audit, Competitor Discovery and Monitoring, Keyword Intelligence, Content Gap, Technical SEO, Content Studio, AI Prompt Intelligence, Competitive Radar, AI Citation Intelligence, AI Brand Intelligence, and AEO Content Intelligence. The inspected source files provide direct evidence for several of these components:

- `src/features/ai-intelligence/services/ai-visibility-audit-engine.ts`: persists audit and prompt records, executes a controlled prompt set, analyzes returned text, and records mention/citation evidence.
- `src/services/ai/ai-visibility-provider.ts`: contains both a Gemini provider and a mock provider; the registry defaults to mock unless Gemini is explicitly selected with an API key.
- `src/features/ai-intelligence/services/competitor-discovery-service.ts`: normalizes and validates competitor domains, records discovery evidence and confidence, and avoids duplicate records.
- `src/services/diagnostic-engine/index.ts`: produces deterministic findings with severity, confidence, evidence, and root-cause relationships.
- `docs/security/README.md` and `docs/api/README.md`: describe server-side identity, RBAC, RLS, and API boundaries. These are repository documentation claims, not an independent penetration-test result.

| Capability | Evidence status | Commercial treatment |
|---|---|---|
| SEO, keyword, content-gap and site-structure analysis engines | Implemented in code/docs; full end-to-end outcomes not independently benchmarked | Include only in workflows that pass acceptance tests |
| AI visibility audit and evidence extraction | Engine implemented; real provider selection and live answer-engine coverage require verification | Sell a bounded diagnostic only after real-provider tests |
| Gemini access | Provider class exists; registry requires explicit Gemini selection and a configured key | Treat as a single-provider integration, not multi-engine coverage |
| Mock AI provider | Explicitly present and defaulted by the provider registry | Mock outputs must never be represented as real market measurements |
| Competitor discovery, brand/citation intelligence and diagnostic findings | Engines/models exist; accuracy, completeness and operational repeatability not independently measured | Validate against manually labeled Persian and English test sets |
| Content Studio and AEO analysis | Product documentation marks these implemented; outcome lift not established | Sell recommendations, not guaranteed ranking or AI citations |
| Production readiness, payment collection, provider cost per result and customer economics | Not established by the inspected sources | Gate commercial scale on verification |

**Positioning guardrail:** describe Oxenn as a developing search-visibility intelligence platform with implemented analysis engines. Do not claim production-grade multi-model coverage, guaranteed AI citations, proven Persian superiority, automatic closed-loop optimization, or customer ROI until those claims are tested.

## 3. Customer problem and buying logic

The most testable recurring job is: **“Show how my clients appear in conventional search and AI-generated answers, compare that evidence with competitors, and tell me what to do next.”**

This problem has economic value only if Oxenn improves an existing workflow. Strong value cases are:
1. Less analyst time spent collecting and formatting monthly evidence.
2. A client-facing report that supports retention or a higher-value service package.
3. Repeatable identification of technical, content, citation, and competitor gaps.
4. A traceable baseline for discussing changes over time.

A raw “AI visibility score” is not sufficient. Model responses vary with prompt, locale, provider, time and retrieval context. Every report should preserve the exact prompt, provider/model, run date, answer evidence, cited URLs, competitor comparison, failure state and confidence/limitations. Recommendations should be connected to Search Console and analytics data where available.

Google's documentation says AI Overviews and AI Mode traffic is included in Search Console's overall Web performance reporting; Google's 3 June 2026 announcement described a dedicated generative-AI performance view and said it had rolled out worldwide by 31 August 2026. This improves native measurement for Google Search AI features but does not replace cross-engine brand-answer monitoring. It also means Oxenn should complement, not charge as though it replaces, first-party analytics. [E5–E6]

**Economic buyer:** owner/managing director or head of growth at an SEO/digital-marketing agency.  
**Champion/user:** SEO lead, strategist or account manager responsible for client reporting.  
**Budget:** SEO tooling, analytics/reporting software, or service-delivery budget.  
**Purchase triggers:** a client asks about AI search; a competing agency adds GEO reporting; monthly reports consume excessive analyst hours; organic leads weaken; or the agency needs a differentiated retainer deliverable.  
**Likely objections:** “our SEO suite is enough,” “clients do not ask for this,” “the model data is inconsistent,” “we can prompt the models manually,” or “the tool does not show business impact.”

## 4. Ranked customer segments

Scores are directional hypotheses, not survey findings. Sales friction: 1 = low, 5 = high. Product fit reflects current evidence and gaps, not the product roadmap.

| Rank | Segment | Pain / repeat use | WTP potential | Sales friction | Current fit | Decision |
|---:|---|---:|---:|---:|---:|---|
| 1 | Persian-language SEO/digital agencies with multiple recurring clients | 4/5 | 3/5 | 2/5 | 3/5 | Beachhead; validate multi-client workflow and time saved |
| 2 | E-commerce businesses dependent on organic acquisition | 4/5 | 4/5 | 3/5 | 2–3/5 | Second; requires reliable domain data and attribution |
| 3 | Persian content publishers and lead-generation businesses | 4/5 | 2–3/5 | 2/5 | 2–3/5 | Selective pilots where search is core to revenue |
| 4 | Mid-market in-house SEO/growth teams | 3–4/5 | 4/5 | 4/5 | 2–3/5 | Later, after integrations and reliability evidence |
| 5 | International SaaS/technology businesses | 3–4/5 | 4/5 | 4/5 | 2/5 | Potential expansion after English benchmark and support readiness |
| 6 | Enterprise brands | 3/5 | 5/5 | 5/5 | 1–2/5 | Postpone: security, SSO, audit, SLA, integrations, procurement |
| 7 | SMEs/local businesses without dedicated SEO staff | 2/5 | 1–2/5 | 2/5 | 2/5 | Do not target directly first; reach through agencies |
| 8 | Arabic-first/non-Persian MENA customers | 3/5 | 3–4/5 | 4/5 | 1–2/5 | Defer until Arabic-specific product and GTM testing |

### Initial ideal customer profile (ICP)

A Persian-language SEO or digital-marketing agency with approximately 5–30 staff, at least 10 recurring website clients, one or more dedicated SEO/account leads, monthly reporting obligations, and customers in competitive categories such as e-commerce, travel, education, finance, or professional services. The agency should nominate at least three client brands for a pilot and identify a budget owner.

These thresholds are screening assumptions, not market statistics. Qualify on recurring organic-search dependence, reporting pain, ability to pay, and access to lawful client data—not headcount alone.

## 5. Geographic prioritization

| Priority | Geography | Market attractiveness | Operational accessibility | Recommendation |
|---:|---|---|---|---|
| 1, conditional | Iran, Persian-language agency segment | Strong language/workflow fit is plausible; local willingness-to-pay and competitive coverage are unverified | High uncertainty around lawful provider access, payments, contracting, hosting and sanctions compliance | Discovery and tightly scoped paid pilots only after legal and operational checks |
| 2 | Persian-speaking customers outside Iran | Maintains language focus and may offer better purchasing power in some markets | Country-by-country payment, tax, support and acquisition checks required | Opportunistic agency-led sales where operations are viable |
| 3 | English-speaking agencies | Larger competitive set and clearer SaaS price anchors; easier benchmark comparisons | Requires English-quality evidence, eligible payment entity and global support | Run a small validation cohort after provider coverage is reliable |
| 4 | Arabic-first MENA | Potentially attractive regional digital marketing spend, but spend is not addressable software revenue | Arabic localization, local query coverage, payment and support add cost | Defer until Persian workflow repeats and Arabic testing is funded |

IAB MENA reported $8.185 billion in regional digital advertising spend for 2025, up 17.8% year on year. This is useful evidence of a large marketing ecosystem, **not** Oxenn's TAM: advertising spend is not software spend and does not establish how many buyers need AI visibility tools. [E7]

Iran should be treated as a plausible discovery market, not assumed to be the best revenue market. OFAC's published guidance illustrates that authorization and due diligence depend on the service and parties involved; it does not provide a blanket approval for Oxenn. Obtain qualified legal advice on sanctions, export controls, data handling, provider terms, contracts and payment eligibility. Do not use payment or provider-access workarounds. [E8]

## 6. TAM, SAM and SOM

### Method and limitations

No reliable, deduplicated public count of qualified Oxenn-buying agencies or brands across the proposed geographies was established. The account populations below are therefore **explicit bottom-up planning inputs**, not sourced population facts or a claim that the market has been measured. They must be replaced with a prospect universe built from agency directories, business registries, company websites and qualification interviews. The model excludes general AI, SEO and digital advertising spend to avoid overstating the addressable opportunity.

Annual software-equivalent ARPA is modeled at $600 / $1,200 / $2,400 ($50 / $100 / $200 per month). These are proposed test prices, not Oxenn's current prices or validated willingness to pay.

### TAM — relevant agency and search-dependent accounts

| Scenario | Assumed qualified accounts across plausible target geographies | Annual ARPA | Formula | TAM |
|---|---:|---:|---|---:|
| Conservative | 5,000 | $600 | 5,000 × $600 | $3.0m |
| Base | 10,000 | $1,200 | 10,000 × $1,200 | $12.0m |
| Upside | 20,000 | $2,400 | 20,000 × $2,400 | $48.0m |

These 5,000 / 10,000 / 20,000 account counts are assumptions, not market statistics. The TAM is a scenario envelope, not an investor-grade factual market count until independently enumerated.

### SAM — accounts serviceable with current language, product and operations

| Scenario | Assumed serviceable accounts | Annual ARPA | Formula | SAM |
|---|---:|---:|---|---:|
| Conservative | 500 | $600 | 500 × $600 | $0.30m |
| Base | 1,500 | $1,200 | 1,500 × $1,200 | $1.80m |
| Upside | 3,000 | $2,400 | 3,000 × $2,400 | $7.20m |

SAM must exclude countries where lawful collection, provider access, support, language quality or customer acquisition are not feasible. Until those gates are verified, the figures are hypothetical serviceability scenarios.

### SOM — achievable annual recurring revenue in 3–5 years

| Scenario | Paying accounts | Share of modeled SAM accounts | Annual ARPA | SOM ARR |
|---|---:|---:|---:|---:|
| Conservative | 25 | 5.0% of 500 | $600 | $15,000 |
| Base | 100 | 6.7% of 1,500 | $1,200 | $120,000 |
| Upside | 250 | 8.3% of 3,000 | $2,400 | $600,000 |

These are execution scenarios, not forecasts. They exclude churn, discounting, services revenue, FX, taxes, payment fees and infrastructure costs. Do not present them as actual performance or as independently verified market size.

### Sensitivity: annual recurring revenue by reachable accounts and ARPA

| Serviceable paying accounts | $600/year | $1,200/year | $2,400/year |
|---:|---:|---:|---:|
| 500 | $0.30m | $0.60m | $1.20m |
| 1,500 | $0.90m | $1.80m | $3.60m |
| 3,000 | $1.80m | $3.60m | $7.20m |

**Interpretation:** validated account count and willingness to pay drive the model more than a broad industry-spend statistic. Before fundraising, build and deduplicate a target list; report accounts by country, language, segment, budget owner and qualification status.

## 7. Competition and substitutes

| Alternative | Verified market position / price anchor | What it means for Oxenn |
|---|---|---|
| Semrush AI Visibility | $99/month per domain billed annually; 25 tracked prompts, brand visibility, competitor research and AI-readiness audit | Compete on workflow fit and Persian evidence, not feature-count claims |
| OtterlyAI | $29 Lite (15 prompts), $189 Standard (100), $489 Premium (400); supports four engines in base tiers, with additional engines as add-ons | Sets a low entry price and makes prompt limits and engine coverage explicit |
| Google Search Console / Analytics | Native reporting for Google Search and AI-feature traffic; no extra cost for the native data | Complement first-party traffic/conversion evidence; do not repackage free metrics as proprietary |
| Other GEO trackers, including Profound, Peec AI and Scrunch | Direct and emerging category alternatives; exact pricing and feature terms vary and should be checked against current official pages before external use | Maintain a quarterly comparison matrix; do not claim uniqueness without a controlled benchmark |
| Traditional SEO suites | Strong keyword, technical audit, backlink and rank-tracking workflows | Avoid trying to replace mature SEO suites initially |
| Agencies/consultants | Human interpretation, client trust and implementation | Agencies are both the first buyer and a substitute; prove analyst time saved and client-ready output |
| Manual prompting and spreadsheets | Low software cost and flexible, but labor-intensive and hard to standardize | Demonstrate repeatability, source evidence, history and less manual work |

Sources: Semrush official AI Visibility pricing [E2], OtterlyAI official pricing [E3], Google documentation [E5–E6].

**Wedge to prove:** Persian prompt/query quality; traceable answer and citation evidence; multi-client reporting; actionable technical/content findings; and acceptable cost per monitored brand. These are hypotheses, not established competitive advantages. Test at least two commercial competitors and a manual baseline on the same prompts and domains.

## 8. Pricing and commercial viability

All prices below are **test proposals**, not current Oxenn prices.

| Offer | Proposed test price | Buyer | Scope |
|---|---:|---|---|
| Paid baseline diagnostic | $75–$150 one-time equivalent | Agency or brand needing an initial report | Limited prompt set, explicit methodology, evidence pack and prioritized actions |
| Agency Starter | $49–$79/month equivalent | Small agency with a few active client brands | Limited client workspaces and prompt/provider frequency |
| Agency Growth | $99–$199/month equivalent | Agency with recurring client reporting | More client brands, competitor comparisons, scheduled/exportable reports and usage limits |
| Assisted design-partner pilot | $300–$1,000 for 4–6 weeks | First 5–10 pilot agencies | Human-assisted setup, baseline, report review and outcome measurement; services revenue, not pure ARR |
| Enterprise | Custom, only after readiness gates | Larger in-house teams | Defer until security, SSO, auditability, integrations, SLA and support are demonstrated |

International competitors establish that buyers can be asked to pay for this category; they do not validate Oxenn's price. Start with a paid diagnostic and credit part of it toward a subscription. Test at least three price points in qualified conversations, then use paid conversion—not stated enthusiasm—to select packaging.

### Unit economics and guardrails

Do not publish LTV, CAC, gross margin or payback estimates without actual acquisition and delivery data. During pilots, measure: cost per successful provider response; retries and failure rate; analyst minutes per report; onboarding time; cloud and crawling costs; gross contribution per account; month-two repeat usage; and renewal intent. Price usage caps around measured variable costs. Avoid “unlimited prompts” until cost and provider reliability are known.

For Iran, quote local-currency pricing only after verifying lawful collection, taxes, accounting, FX and affordability. USD-equivalent prices are analytical comparisons, not a recommendation to circumvent restrictions.

## 9. Go-to-market plan

### Beachhead proposition

**“Give your agency a repeatable, evidence-backed report of how clients appear in Persian search and AI answers—what competitors are cited for, what is missing, and which improvements to prioritize.”**

Do not promise that Oxenn can make an AI engine recommend a brand or prove revenue causality from mention counts alone.

### First 90 days

1. **Technical gate (weeks 1–3):** verify real-provider behavior, remove any production path that could mistake mock output for live data, measure provider cost/failure, and test tenant isolation, identity boundaries and data handling. Confirm a lawful payment and service path for the first geography.
2. **Discovery (weeks 2–4):** interview 15–25 agency owners and SEO leads. Record current tool spend, monthly report hours, client questions, workflows, purchase triggers and price objections. Build a deduplicated qualified prospect list.
3. **Paid pilots (weeks 4–8):** recruit 5–10 design partners. Set baseline brands, prompt/query sets, competitors, evidence standards and success criteria before running the pilot.
4. **Decision (weeks 8–12):** compare paid conversion, repeat usage, analyst time saved, report usefulness, provider cost and renewal intent. Continue only if multiple customers pay and the same workflow improvement repeats across accounts.

### Acquisition channels

- Founder-led outbound to qualified Persian-language agencies with a tailored sample report.
- Partnerships with SEO consultants, web-development firms and marketing communities.
- Educational webinars and Persian case studies showing methodology, not unsupported claims.
- Product-led diagnostic funnel only after the real-provider and data-quality gates pass.
- Later: agency referrals and white-label reporting after workspace permissions, client separation and report branding are reliable.

### Expansion sequence

1. Persian-language agencies in the first legally and operationally accessible market.
2. Persian e-commerce and content businesses, primarily via agency channels.
3. Persian-speaking customers outside Iran where collection and support are feasible.
4. English-speaking agencies after benchmark parity and global provider coverage.
5. Arabic-first MENA after language-specific testing and localization.
6. Enterprise only after governance, integrations, security and reliability gates.

### Deliberately postpone

- Broad SME self-serve acquisition: low willingness to pay and higher support burden.
- Enterprise sales: procurement and trust requirements exceed current evidence.
- Arabic-first localization: expands product surface before the initial workflow is proven.
- “All-in-one SEO platform” positioning: entrenched competitors and too broad a value proposition.
- Automated optimization or guaranteed AI citation claims: outcomes are not established.

## 10. Risks, assumptions and validation priorities

| Assumption / risk | Evidence to collect | Invalidation signal |
|---|---|---|
| Agencies have recurring pain worth paying for | Paid diagnostics, workflow observation and month-two use | Interest does not convert to paid use |
| Persian coverage is underserved | Blind benchmark against 2–3 alternatives and manual baseline | No measurable quality, coverage or workflow advantage |
| Reports save time or support billable work | Before/after analyst minutes and agency packaging tests | Reporting requires as much manual effort as current process |
| AI visibility is a recurring use case | Repeat runs, retained brands/prompts and renewal | Customers stop after one baseline report |
| Provider access and cost are viable | Real-provider success rate, cost per answer and lawful access | Unreliable access or variable costs destroy margin |
| Iran is operationally accessible | Legal review and tested payment/provider/hosting path | No compliant, reliable service and collection path |
| Product is safe enough to sell | Independent security review, tenant-isolation tests, critical CI and migration checks | Identity/isolation or data-handling risks remain unresolved |
| The modeled market supports the business | Deduplicated account list and observed conversion | Qualified reachable accounts are far below model inputs |

## 11. Investor conclusion and decision gates

The defensible investment case today is a **staged validation opportunity**: a real software foundation is present, but market access, multi-engine measurement quality, differentiation, unit economics and willingness to pay require proof.

Recommended gates:
- **Product gate:** live-provider outputs are distinguishable from mocks; supported engines and locales are documented; reliability and cost are measured.
- **Security/operations gate:** identity, tenant isolation, deployment, data rights, provider access and payment operations pass review.
- **Demand gate:** 15–25 qualified interviews and 5–10 paid pilots with documented buyer, use case and price.
- **Economic gate:** measured contribution margin and analyst time saved; evidence of repeat usage and renewal.
- **Scale gate:** repeatable acquisition channel, defensible benchmark result, and retention evidence.

The current market-size and price tables are scenario models. They should be replaced by a verified prospect universe and observed pilot economics before being treated as financial projections.

## 12. Evidence register

Access date for web sources: **12 October 2026**. Confidence applies to the cited claim, not to Oxenn's ability to capture the market.

| ID | Source / publication date | Claim supported | Confidence | URL |
|---|---|---|---|---|
| E1 | Gartner, “Innovation Insight: Assess AEO and GEO With Answer Engine Visibility Tools,” 17 Oct 2025 | Category exists; measurement accuracy and overreliance are identified risks | High for published abstract; not a market-size source | https://www.gartner.com/en/documents/7085698 |
| E2 | Semrush official AI Visibility pricing, accessed 12 Oct 2026 | $99/month per domain billed annually; 25 prompts and visibility/competitor/audit features | High for vendor-listed terms at access date | https://www.semrush.com/pricing/ai/ |
| E3 | OtterlyAI official pricing, accessed 12 Oct 2026 | $29 / $189 / $489 monthly tiers and prompt/engine limits | High for vendor-listed terms at access date | https://otterly.ai/pricing/ |
| E4 | Oxenn repository `main`, files reviewed 12 Oct 2026 | Product module documentation and implementation boundaries | High for the inspected files; not a complete independent QA audit | https://github.com/DiabloNova/oxenn |
| E5 | Google Search Central, AI Features and Your Website, accessed 12 Oct 2026 | AI Overviews and AI Mode traffic are included in Search Console's Web performance reporting | High | https://developers.google.com/search/docs/appearance/ai-features |
| E6 | Google Search Central Blog, “Introducing Search Generative AI performance reports in Search Console,” 3 Jun 2026; rollout note dated 31 Aug 2026 | Dedicated generative-AI performance view and rollout status | High for Google's published announcement | https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports |
| E7 | IAB MENA, “2025 MENA Digital Adspend,” 8 Jun 2026 | MENA digital advertising spend reached $8.185bn in 2025, +17.8% YoY; contextual only, not Oxenn TAM | High for IAB MENA's published figures; no direct inference to software demand | https://iabmena.com/2026-2025-mena-digital-adspend/ |
| E8 | U.S. Treasury OFAC, Iran Sanctions FAQ 1088, accessed 12 Oct 2026 | Cloud/software services relating to Iran require fact-specific authorization and due diligence analysis | High for the published FAQ; legal advice still required | https://ofac.treasury.gov/faqs/1088 |
| M1 | Bottom-up account-count scenarios in this section | TAM/SAM/SOM account populations and ARPA | Low until verified against a deduplicated account list and paid pilots | Modeled assumptions; no external count claimed |
| M2 | Proposed Oxenn pricing | Suggested diagnostic and subscription test prices | Low until tested through paid conversion and renewals | Proposed, not current pricing |
| M3 | Agency-first ICP and geographic sequence | Strategic recommendation based on repository scope, competitor anchors and operational constraints | Medium-low until interviews and pilot evidence | Inference to validate |

## Integration note for the existing Investor Memorandum

The existing memorandum is available as a PDF in the working document library, but it is not present as an editable source file in the repository's documented structure. This replacement section is therefore saved as a separate Markdown source. Before producing the final investor PDF, integrate it into the memorandum's market section and reconcile the executive summary, revenue model, forecast, geography assumptions and roadmap to the same proposed pricing and validation gates. Do not treat the modeled TAM/SAM/SOM or test prices as historical results.
