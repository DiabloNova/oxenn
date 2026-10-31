# Phase 02 — Creative Concept and Design Direction

**Concept name:** Signal Atlas — Oxenn's Living Digital Twin  
**Design thesis:** Turn fragmented search and AI visibility signals into a clear model of where a brand stands, what is missing, and what to do next.  
**Reference concept:** The generated Oxenn homepage image shared in the project conversation (1536 × 1024). It is an art-direction reference, not a production screenshot or proof of shipped functionality.

## 1. Brand principles

1. **Intelligence made visible:** the Digital Benchmark Twin is the primary visual metaphor; relationships between inputs, observations, gaps, and actions should be understandable at a glance.
2. **Editorial precision:** confident typography, readable data, asymmetric composition, and generous breathing room.
3. **Enterprise trust:** clear provenance, honest states, predictable interaction, and no fake live indicators.
4. **Warm energy, disciplined color:** a bright, clean light theme with one distinctive vermilion brand accent; other colors may encode distinct data categories but must not compete with the brand accent.
5. **One experience, two native languages:** Persian RTL and English LTR are separately composed, not mechanically mirrored.

## 2. Proposed visual system

These are starting tokens for design exploration; validate them against current brand assets and existing design tokens before implementation.

| Token | Light theme | Dark theme | Role |
|---|---|---|---|
| Canvas | `#F7F9FC` | `#0B1020` | Main page background |
| Raised surface | `#FFFFFF` | `#111A2E` | Panels and product previews |
| Primary text | `#111C35` | `#F3F6FC` | Headings and key values |
| Secondary text | `#586882` | `#A8B5CA` | Supporting copy and metadata |
| Structural border | `rgba(19, 37, 65, 0.12)` | `rgba(205, 219, 242, 0.14)` | Fine dividers and panel boundaries |
| Brand accent | `#FF4B2B` | `#FF6043` | Main CTA, active states, key moments |
| Signal colors | Restrained blue / teal / amber | Adjusted for contrast | Only for distinct data categories/statuses |

Use subtle atmospheric color behind the Digital Twin, not a full-page neon gradient. Glass effects are reserved for selected floating overlays where they create hierarchy; essential data sits on sufficiently opaque surfaces.

## 3. Typography

- **English display and interface:** prefer the existing licensed project face when suitable; otherwise test a distinctive sans family such as Geist or Satoshi.
- **Persian display and interface:** verify `src/config/fonts.ts`, local assets, weights, licensing, Persian glyph coverage, and line metrics. Vazirmatn is a candidate, not an assumed installed dependency.
- Never use an Arabic-only face as a substitute for Persian typography.
- Use tabular numerals for metric-heavy views where available; use a monospace family only for technical identifiers and code.
- Define explicit heading, body, label, and numeric scales. Persian line height and headline wrapping require their own review.

## 4. Navigation concept

- Compact Oxenn mark without redundant brand-name text where the logo already carries it.
- Minimal icon navigation for Home, About, Contact, and Docs, with visible tooltips plus accessible names and focus states.
- Search expands into a stable-width field without reflowing the entire header; keyboard shortcut is optional and must be documented if implemented.
- Theme and language controls stay separate from the core navigation.
- A secondary menu reveals the remaining destinations.
- Resolve the current interaction between the marketing header and global floating controls before shipping one final navigation system.

## 5. Homepage narrative and section plan

1. **Hero — “See how your brand is discovered. Everywhere.”** Split layout: concise value proposition and one primary action on the copy side; a credible Twin visualization on the other. A secondary action should point to a real in-page product explanation or an existing route.
2. **The visibility gap.** Contrast a traditional search result with a clearly labelled conceptual AI-answer view. Explain the limitation without fear-based claims.
3. **The Digital Twin.** Show how brand inputs, website/social presence, and verified observations relate. Label any sample dataset as illustrative.
4. **The workflow.** One connected sequence: represent the brand → evaluate visibility → compare gaps → prioritize actions.
5. **Product showcase.** Use an intelligible analytics layout, not arbitrary decorative cards. Separate real output from preview data.
6. **Integrated intelligence.** Explain how SEO, AEO, GEO, competitive context, and an action plan combine in a coherent process rather than a buzzword list.
7. **Conversion.** Use a CTA that maps to a currently available destination (verified registration, an available audit path, or a real demo/contact flow).
8. **Footer.** Include only routes, documentation, contact details, and policy links confirmed to exist.

## 6. Motion language

- Orchestrated entrance: headline and CTA first; product visualization reveals in a small, controlled sequence.
- During scrolling, reveal the relationship between signals, the Twin, and actions rather than applying unrelated animations to every card.
- Hover/focus states communicate affordance; active feedback is tactile but restrained.
- Use transform and opacity for most animations; do not animate layout dimensions as a default.
- Respect `prefers-reduced-motion`; the unanimated page must still communicate the entire story.
- Do not hijack scrolling, force long waits, rely on hover for essential information, or use perpetual decorative motion.

## 7. Responsive and bilingual rules

- Desktop: asymmetric split hero; larger product visualization; generous max-width containment.
- Tablet: reduce dashboard density and group related panels.
- Mobile: stack hero content before the visualization, simplify charts, use touch targets at least 44 px, and avoid horizontal overflow.
- English uses LTR-specific icon placement and copy rhythm; Persian uses RTL order, Persian-appropriate line height, and tested mixed Persian/Latin strings.
- Theme and language toggles preserve route and user preference coherently. Test a full refresh and direct entry to both `/fa` and `/en`.
- Data tables and charts need a readable narrow-screen representation rather than a scaled desktop screenshot.

## 8. Accessibility and product-truth rules

- Semantic heading hierarchy, visible focus, keyboard access, sufficient contrast, accessible icon names, and meaningful empty/error/loading states are part of the design.
- No essential information appears only on hover or inside an animation.
- Sample metrics, search results, citations, model names, and competitor names cannot be presented as live unless verified; use “Illustrative preview” labels where needed.
- No invented customers, certifications, market share, performance claims, integration availability, or legal/company details.

## 9. Phase 02 decision and exit criteria

**Recommended direction:** approve and refine the Signal Atlas concept before changing production components. It gives Oxenn a recognizable identity through the Twin visualization and orange-red action accent while leaving enough whitespace for enterprise credibility.

- [x] A first visual concept image generated and shared in the conversation.
- [x] Section narrative and proposed token direction documented.
- [x] Light/dark, Persian/English, responsive, motion, and accessibility rules included.
- [ ] Validate tokens/fonts against current local assets and licenses.
- [ ] Review the visual concept in desktop and mobile compositions.
- [ ] Confirm CTA destinations and mark all non-live data as illustrative.
- [ ] Approve a design artifact/prototype before production implementation.

**Boundary:** the generated image is a concept proposal. It does not claim that these components or interactions already exist in production.
