# Public Folder Audit

- Repository: DiabloNova/oxenn
- Product baseline: main at 7bd2b6ba04e18abbcaf772fac63f29c465a45a42 (2026-11-06)
- Audit branch: docs/product-roadmap-baseline-2026-11
- Branch revision used for this inventory: 9814f5176c9bdb71d84bfd1ce91182c14ef829a2
- Scope: the complete tracked public/ subtree. Application source was read only to establish asset consumers and metadata wiring; no source file was changed.
- Method: complete recursive Git tree (not truncated), directory inventory, file-size/type analysis, SVG/source inspection, image dimension/metadata inspection, PDF parsing, and focused consumer tracing. GitHub code-search responses were incomplete and are not treated as proof of repository-wide absence of references.

## 1. Inventory

The recursive Git tree is complete (truncated=false). The public/ subtree contains **31 files** and **2 child directories** (fonts/ and logos/), in addition to the public/ root directory. There are 18 direct entries at the public/ root: 16 files and 2 directories.

| Asset group | Files | Approx. size | Notes |
|---|---:|---:|---|
| public/fonts/ | 10 | 1,337,132 bytes | 6 Peyda TTF + 4 Yekan Bakh WOFF2 |
| public/logos/ | 5 | 4,923 bytes | 5 AI-provider SVG marks |
| Root raster images | 7 | 1,154,296 bytes | PNG/JPG icons, brand image and placeholders |
| Root SVG assets | 8 | 11,079 bytes | icons, starter graphics and placeholders |
| PDF | 1 | 866 bytes | one-page sample report |
| **Total** | **31** | **2,508,296 bytes (2.392 MiB)** | |

File-type counts: 5 PNG, 13 SVG, 6 TTF, 4 WOFF2, 2 JPG, and 1 PDF. The largest file is public/logo-horse.png (1,147,252 bytes; 1208×1302 RGBA), accounting for approximately 45.8% of all public asset bytes. The 10 active public font assets account for approximately 53.3%.

### Complete file list

**Fonts (10)**
- public/fonts/Peyda-Black.ttf — 199,360 bytes
- public/fonts/Peyda-Bold.ttf — 201,588 bytes
- public/fonts/Peyda-ExtraBold.ttf — 200,700 bytes
- public/fonts/Peyda-Medium.ttf — 202,328 bytes
- public/fonts/Peyda-Regular.ttf — 202,264 bytes
- public/fonts/Peyda-Thin.ttf — 203,808 bytes
- public/fonts/YekanBakhFaNum-Light.woff2 — 31,552 bytes
- public/fonts/YekanBakhFaNum-Regular.woff2 — 31,940 bytes
- public/fonts/YekanBakhFaNum-RegularCondensed.woff2 — 31,908 bytes
- public/fonts/YekanBakhFaNum-SemiBold.woff2 — 31,684 bytes

**AI provider logos (5)**
- public/logos/anthropic.svg — 281 bytes
- public/logos/claude.svg — 1,921 bytes
- public/logos/google-gemini.svg — 401 bytes
- public/logos/openai.svg — 1,702 bytes
- public/logos/perplexity.svg — 618 bytes

**Root assets (16)**
- public/apple-icon.png — 2,626 bytes; 180×180 RGBA
- public/file.svg — 391 bytes
- public/globe.svg — 1,035 bytes
- public/icon-dark-32x32.png — 585 bytes; 32×32 RGBA
- public/icon-light-32x32.png — 566 bytes; 32×32 RGBA
- public/icon.svg — 1,304 bytes
- public/logo-horse.png — 1,147,252 bytes; 1208×1302 RGBA
- public/next.svg — 1,375 bytes
- public/optimus-ai-sample-report.pdf — 866 bytes; one page
- public/placeholder-logo.png — 568 bytes; 256×144 indexed PNG
- public/placeholder-logo.svg — 3,208 bytes
- public/placeholder-user.jpg — 1,635 bytes; 200×200 RGB
- public/placeholder.jpg — 1,064 bytes; 1×1 RGB JPEG
- public/placeholder.svg — 3,253 bytes
- public/vercel.svg — 128 bytes
- public/window.svg — 385 bytes

## 2. Confirmed asset consumers and current behavior

### 2.1 Public fonts

The 10 files in public/fonts/ are the current application font assets. src/config/fonts.ts loads the Yekan Bakh WOFF2 files for the Persian primary/body face and Peyda TTF files for display/headings; src/app/[locale]/layout.tsx applies those font variables to the document. The root font/ directory is a separate candidate archive and is not the active central loader source. See the font-folder audit for the owner-approved future source/move/use requirement and licensing gates.

### 2.2 AI-provider logos

src/components/marketing/BrandLogo.tsx constructs the public URL as /logos/{slug}.svg and uses it as a CSS mask with an accessible aria-label. src/components/marketing/PlatformsSection.tsx defines five slugs—openai, google-gemini, claude, perplexity and anthropic—and all five matching SVG files exist in public/logos/. This is a valid asset-to-component path match.

However, the current localized homepage src/app/[locale]/page.tsx imports and renders LandingHeader and LandingFooter but does not import or render PlatformsSection. The inspected marketing page therefore does not show this dedicated platform-logo strip. The source-search index returned incomplete_results=true, so this report does not claim that PlatformsSection has no consumer anywhere else in the repository.

The platforms array also lists both “Anthropic Claude” and “Anthropic” as separate entries. This may be intentional (product versus provider), but should be confirmed so the trust strip does not present the same vendor as two independent AI engines without an explicit taxonomy.

### 2.3 Brand mark

The landing header and footer use the inline SVG component src/components/marketing/SeorchableLogo.tsx. The inspected header/footer do not use public/logo-horse.png. The large PNG may be an alternate/legacy brand asset, but the incomplete code-search results prevent a repository-wide unused-asset conclusion.

### 2.4 Icons and metadata

src/app/favicon.ico exists in the Next.js app directory and is a valid ICO containing 16×16, 32×32, 48×48 and 256×256 representations. This is the clearly established favicon asset.

public/apple-icon.png is a 180×180 RGBA image, and public/icon-dark-32x32.png / public/icon-light-32x32.png are 32×32 transparent PNG variants (the first has a black central mark; the second has a white central mark). The inspected metadata object in src/app/[locale]/layout.tsx does not declare an icons field, and no app/apple-icon.png or app/icon.svg file exists in the recursive tree. Therefore these public files are not connected through the Next.js app-directory metadata convention in the inspected configuration; they remain directly addressable public assets unless separately linked elsewhere.

public/icon.svg contains color-scheme CSS that sets a black background with a white foreground for prefers-color-scheme: light, and a white background with a black foreground for prefers-color-scheme: dark. If this file is intended to provide conventional theme-appropriate contrast, those assignments appear reversed. The SVG is not the app-directory favicon; src/app/favicon.ico is present.

### 2.5 Sample PDF and report UI

public/optimus-ai-sample-report.pdf is only 866 bytes and contains one page with two short text statements identifying it as an “Optimus AI Brand Analysis Sample Report”. It is not a substantive multi-page brand analysis report. The PDF parser recovered the page but emitted an “incorrect startxref pointer(1)” warning (and an object-stream parsing notice), so the file should be regenerated and validated with standard PDF readers before distribution.

The inspected report page, src/app/[locale]/dashboard/reports/page.tsx, does not reference this PDF. Its handleExportPDF function only starts a 1.5-second timeout and then sets a success message; it does not create, fetch, or download a PDF. The visible “Generate & Download PDF Now” action is therefore not a real download in this implementation. This is a cross-folder application finding surfaced while tracing the public sample asset; it is not fixed here.

## 3. Findings

### PUB-001 — Platform logo strip is not mounted on the localized homepage

**Priority: P3 — product presentation / integration drift.**
**Confidence: High for the inspected homepage.**

The provider logo assets and BrandLogo consumer are internally consistent, and PlatformsSection maps each of the five available SVG files. But src/app/[locale]/page.tsx does not import or render PlatformsSection. Its inspected imports include LandingHeader and LandingFooter, and its rendered tree contains those components without the platform strip. The dedicated platform trust strip is consequently absent from the current homepage. A complete repository-wide usage search was unavailable because GitHub code search returned incomplete results.

**Recommended disposition:** decide whether the platform strip belongs in the homepage information architecture. If yes, mount it at the intended position and verify both Persian RTL and English LTR presentation; if no, document the component/assets as intentionally retained rather than assuming they are active.

### PUB-002 — Sample PDF is a minimal placeholder and the report export action does not download it

**Priority: P2 — user-facing feature correctness.**
**Confidence: High for the inspected asset and report page.**

The public PDF is a single-page, 866-byte text stub and its parser reports an incorrect startxref pointer. The report page's handler uses a timeout and success-state update only; it never downloads this PDF or generates a report. The UI labels the action as generating and downloading a PDF, which does not match the implementation inspected.

**Recommended disposition:** treat the current PDF as a sample placeholder, regenerate it with a valid PDF toolchain if it is intended for distribution, and implement/verify a real report-generation and download flow in a separately authorized application task. Do not present the current button as completed export functionality.

### PUB-003 — Public icon variants are not coherently wired into app metadata, and icon.svg has inverted color-scheme assignments

**Priority: P3 — metadata / branding consistency.**
**Confidence: High for the inspected metadata file and asset contents.**

The app-directory favicon.ico is present and contains four standard resolutions. In contrast, public/apple-icon.png, public/icon-dark-32x32.png and public/icon-light-32x32.png are stored under public/, while the inspected localized metadata object has no icons declaration and the app tree has no apple-icon.png or icon.svg convention file. In addition, public/icon.svg assigns a dark square to light preference and a light square to dark preference.

**Recommended disposition:** choose one canonical favicon/Apple-touch-icon set, wire it using the Next.js metadata convention or explicit metadata links, and correct the SVG color-scheme mapping if that SVG is retained. Remove duplicate variants only after checking all explicit URL references.

### PUB-004 — Large logo-horse.png is not the brand mark used by the inspected landing header/footer

**Priority: P3 — asset governance / conditional performance.**
**Confidence: High that the inspected header/footer use another component; repository-wide non-use is unproven.**

public/logo-horse.png is 1,147,252 bytes at 1208×1302 RGBA, making it the largest public asset and about 45.8% of the subtree's total bytes. The inspected landing header and footer use an inline SeorchableLogo SVG instead. No direct use of logo-horse.png was established in the inspected components; code search was incomplete.

**Recommended disposition:** identify the intended owner and UI use of this image. If it is needed, optimize it for the actual display dimensions and consider a vector or modern compressed format where appropriate. If it is legacy, remove it only in a later approved cleanup after a complete reference check.

### PUB-005 — Generic placeholder and starter-template assets remain in the public tree

**Priority: P3 — repository hygiene.**
**Confidence: High that the files exist; usage status is not fully established.**

The folder contains placeholder-logo.png, placeholder-logo.svg, placeholder-user.jpg, placeholder.jpg (only 1×1 pixel), placeholder.svg, and generic file.svg, globe.svg, next.svg, vercel.svg and window.svg. Several resemble starter-template or generic placeholder assets rather than the product's branded media. The source-search index was incomplete, so this audit does not label all of them definitively unused.

**Recommended disposition:** inventory actual consumers and classify each file as active placeholder, required fallback, starter residue or obsolete asset. Remove only confirmed-unused items in a separately approved cleanup. Replace placeholder content before any user-facing production path relies on it.

### PUB-006 — Platform logo taxonomy duplicates the Anthropic vendor/product relationship

**Priority: P3 — content clarity.**
**Confidence: High for the current array contents; product intent requires confirmation.**

PlatformsSection lists both “Anthropic Claude” (slug claude) and “Anthropic” (slug anthropic) as separate entries. This mixes a model/product label and its vendor label in a single list of monitored AI engines.

**Recommended disposition:** confirm whether both should appear as separate monitored destinations. If the list is meant to represent engines/models, use a consistent model-level taxonomy; if it represents providers, avoid presenting a provider and its flagship model as separate peers without explanation.

## 4. Cross-folder relationships

- FNT-001/FNT-002: root font archive, active public font assets and missing licensing/provenance evidence are documented in ai_tasks/font-folder-audit.md. The owner's source-repository and relocation instruction is recorded there as a future implementation requirement.
- DOC-005: the report-page PDF-export mismatch reinforces the broader need to verify “Implemented” product claims against actual route/service behavior.
- The five provider logos are stored in public/logos/ and resolved by BrandLogo through the /logos/ public URL convention; their dedicated strip is not currently mounted on the inspected homepage.

## 5. Audit limits

- The complete public/ recursive tree was reviewed; it was not truncated. All 31 files, two child directories, sizes and file types were inventoried.
- All five provider SVGs and the root SVG icon assets were inspected as text. The logo and icon PNG/JPG dimensions and metadata were inspected. No visual browser rendering or responsive screenshot test was performed.
- The sample PDF was parsed; it yielded one page and text but generated a startxref warning. No full PDF rendering/print validation was run.
- The active favicon ICO was confirmed to contain 16, 32, 48 and 256 pixel images.
- Source references were traced directly through BrandLogo, PlatformsSection, the localized homepage, the landing header/footer, the locale layout, font loader and report page. GitHub code search marked its results incomplete; absence of other dynamic references is not asserted.
- No source, asset, image, font, PDF, CSS, metadata, build configuration or deployment setting was modified. No cleanup, optimization, migration or runtime test was performed.

**Conclusion:** public/ is a mixed asset directory containing active font and provider-logo resources alongside several unconnected icon variants, a very large possible legacy logo, generic placeholders/scaffold graphics, and a sample PDF that does not correspond to the current report-export UI. The most actionable findings are the disconnected platform-logo strip, the fake PDF export flow and the inconsistent icon metadata. This phase records findings only; it does not authorize application changes or asset cleanup.
