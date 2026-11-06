# Font Folder Audit

- Repository: `DiabloNova/oxenn`
- Product baseline: `main` at `7bd2b6ba04e18abbcaf772fac63f29c465a45a42` (2026-11-06)
- Documentation branch: `docs/product-roadmap-baseline-2026-11`
- Branch revision at start of this phase: `bf1aacdac9534dabc4fe31bc3694e3d6fc4ee2fc`
- Scope: tracked root `font/` directory; adjacent font files and configuration were read only where needed to determine whether the root assets are loaded by the application.
- Method: complete Git-tree inventory, blob-size/SHA comparison, inspection of the current font loader/layout/CSS, review of representative font metadata, and targeted source-reference searches. No source, font, stylesheet or runtime configuration was modified.

## 1. Inventory

The recursive Git tree was complete (`truncated: false`). The root `font/` folder contains **71 tree entries**: 5 directories including the root and **66 tracked files**.

| Group | Font files | Bytes | Format / styles |
|---|---:|---:|---|
| `font/Yekan/` | 56 | 2,209,356 | WOFF; 8 weight names × 7 width variants |
| `font/tajrid/` | 6 | 448,956 | WOFF; UltraLight, Light, Regular, Medium, SemiBold, Bold |
| `font/English/SEO/` | 1 | 71,156 | TTF; Box Face Regular |
| **Actual font assets** | **63** | **2,729,468** | **Approximately 2.60 MiB** |
| Placeholder files | 3 | 3 | Each is exactly one newline byte |
| **Total tracked files** | **66** | **2,729,471** | |

The Yekan group has seven named width variants for each of these eight weight labels:

- Weight labels: `Thin`, `Light`, `Regular`, `SemiBold`, `Bold`, `ExtraBold`, `Black`, `ExtraBlack`.
- Width variants: default, `Condensed`, `Expanded`, `ExtraCondensed`, `ExtraExpanded`, `SemiCondensed`, `SemiExpanded`.

All 63 actual font files have distinct Git blob SHAs; no byte-identical duplicates were found within this group. A comparison against the 10 tracked font assets under `public/fonts/` found no exact blob duplicates across the two locations.

The three one-byte files are:

- `font/1`
- `font/Yekan/1`
- `font/tajrid/1`

Each contains only a newline (base64 representation `Cg==`). They are not font files and have no evident runtime purpose.

## 2. Relationship to the current application font configuration

The current application font loader is `src/config/fonts.ts`. It imports `next/font/local` and loads these assets:

- Persian primary/body face: `public/fonts/YekanBakhFaNum-Light.woff2`, `YekanBakhFaNum-Regular.woff2`, and `YekanBakhFaNum-SemiBold.woff2`.
- Persian display/headings: `public/fonts/Peyda-Medium.ttf`, `Peyda-Bold.ttf`, `Peyda-ExtraBold.ttf`, and `Peyda-Black.ttf`.

The localized root layout imports only `persianPrimary` and `persianDisplay`, then applies those font variables to the document. `src/app/globals.css` assigns the primary variable to the body/UI font and the display variable to all headings and `.font-display` elements. The CSS comment explicitly says Peyda drives every display title across the product.

No asset under the root `font/` directory is named in the active central font loader. In particular:

- None of the 56 root Yekan WOFF files is loaded by `src/config/fonts.ts`; the application uses separate WOFF2 assets under `public/fonts/`.
- The six Tajrid files are not loaded by that configuration.
- `font/English/SEO/BoxFace.ttf` is not loaded by that configuration. The active display face is Peyda, including for English-locale headings; Inter is only a fallback in the current font declarations.

A targeted GitHub code search for the root font names returned no matches, but those search responses were marked `incomplete_results: true`. Therefore this report does **not** claim that no conceivable indirect or dynamic reference exists anywhere in the repository. The reliable conclusion is narrower: the current central application font loader and localized layout do not consume the root `font/` assets, and no direct code consumer was established in this phase.

The root folder is outside `public/`. It is not automatically exposed as a static public asset by the normal Next.js `public/` directory convention; an application import or other explicit serving path would be needed. No such path was identified in the active font loader.

## 3. Font metadata and licensing observations

### Box Face

The TTF metadata was readable and identifies:

- Family/style: **Box Face Regular**
- Designer: **Michael Tension**
- Foundry: **Tension Type**
- Copyright: **2026 Tension Type**
- Description: intended for very large display use; the embedded description explicitly says it is display-only.

The font's embedded license metadata (OpenType name ID 13) says personal use is free, commercial work requires a donation to the creator, embedding in web pages is allowed, and distributed copies must be accompanied by the license text. The repository's `font/` directory contains no separate license file or accompanying licence text document. The font's OS/2 `fsType` value is `0x0004` (Preview & Print embedding flag), which should be reconciled with the embedded web-page permission before relying on the font for a commercial web deployment.

This is not a conclusion that the font is being used unlawfully: the current application font loader does not load this root asset. It is a release/provenance check required before enabling or distributing it as part of the commercial product.

### Yekan Bakh and Tajrid

No separate license, attribution, source, purchase, or redistribution record is present in the root `font/` directory. The WOFF files' compressed metadata tables were not independently decoded for this audit. Consequently, the repository evidence does not establish the licensing/redistribution terms for the 56 Yekan files or the six Tajrid files.

Do not assume that a font file being committed to the repository establishes a commercial web-use license. Preserve proof of the applicable license or purchase and confirm rights for web embedding, modification/subsetting, repository distribution, and production use before selecting these assets for the product.

## 4. Provenance and history

The Git history identifies earlier additions:

- `font/Yekan/YekanBakhFaNum-Regular.woff` and `font/tajrid/Tajrid-Regular.woff` were introduced in commit `5b0c9c2ecdadefb2be75b578bab75bf1410dd374` (2026-07-30).
- `font/English/SEO/BoxFace.ttf` was uploaded in commit `454d66b98a770c7ddb71dae277279f71dc63018f` (2026-08-02) and appeared in later work described by commit `ee7defeb6b4c566c07601048446cf215ca93e489` (2026-08-03), whose message refers to integrating a custom English font for the SEO navbar.

That history explains why BoxFace was added, but does not prove it is still used. The current font loader is the relevant implementation evidence and does not reference it.

## 5. Findings

### FNT-001 — Root font catalogue is not connected to the current central font loader

**Priority: P3 — repository hygiene / asset-governance drift.**  
**Confidence: High for the central loader; no claim of exhaustive proof against every dynamic reference.**

The root folder stores 63 font files (about 2.60 MiB), but the application's central font loader imports fonts from `public/fonts/` instead. The root Yekan set is a separate WOFF collection; the application uses a separate WOFF2 set. Tajrid is not configured. BoxFace is also not configured.

This leaves two parallel font collections without an explicit ownership or usage contract. It creates uncertainty about which assets are approved, maintained, licensed, or safe to remove. The root directory is not the standard Next.js public asset directory, so its presence alone does not make these fonts available to the browser.

**Recommended disposition:** decide whether `font/` is an intentional source archive, a candidate font library, or obsolete assets. If it is retained, add an inventory/manifest describing family, intended use, exact consumer, source, license evidence and whether the font is shipped. If it is not needed, remove it only in a separately authorized cleanup after verifying the entire repository's references and retaining any required license/provenance material. No deletion is authorized by this audit.

### FNT-002 — Licensing and provenance records are incomplete for the stored font families

**Priority: P2 — conditional commercial-distribution risk.**  
**Confidence: High that the directory lacks standalone license documents; rights for Yekan/Tajrid are not established here.**

The directory has no README, license file, purchase record, source URL, or asset manifest. Box Face contains embedded licensing terms that distinguish personal from commercial use, require a donation for commercial work and say distributed copies must be accompanied by the license text. The repository does not include a separate license document with the font. Its `fsType` flag also warrants confirmation against the embedded web-embedding permission. No license evidence was found in this folder for Yekan Bakh or Tajrid.

**Recommended disposition:** preserve and verify the original license/purchase evidence for each family before enabling these assets in production or distributing them through the repository. For Box Face, confirm the required commercial-use condition and embedding flag with the rights holder, and retain the accompanying license text if the asset remains distributed.

### FNT-003 — Three one-byte placeholder files are tracked as if they were directory content

**Priority: P3 — repository hygiene.**  
**Confidence: High.**

The files `font/1`, `font/Yekan/1` and `font/tajrid/1` are each a single newline byte. They contain no font, manifest or useful documentation.

**Recommended disposition:** determine whether they were accidental upload artifacts or deliberate directory placeholders. Remove them in a separately authorized cleanup if no repository tooling or workflow depends on their presence.

### FNT-004 — Documentation says BoxFace is the English title face, but the current font configuration uses Peyda for headings

**Priority: P2 — design-system documentation correctness.**  
**Confidence: High.**  
**Related documentation finding: DOC-005 (product/design documentation claims require implementation-level verification).**

The redesign audit documents say local BoxFace is configured for English titles. The current implementation does not load BoxFace: `src/config/fonts.ts` defines only Yekan Bakh and Peyda, and `globals.css` assigns the Peyda display variable to all headings. The historical commit that introduced BoxFace for an SEO navbar does not establish that it remains active.

**Recommended disposition:** correct the design documentation to match the approved current typography system, or deliberately approve and implement a distinct English display family in a later typography task. Do not describe BoxFace as active until its import, locale-specific assignment and rendered behavior are verified.

## 6. User-directed font sourcing and implementation requirement

The project owner has specified the following direction for the future font integration. This is a recorded requirement, **not an implementation completed by this audit**:

1. **Font source:** obtain/upload the font files for the site from the separate repository named exactly \`oxenn_doxuments\`. Do not treat the existing root \`font/\` copies as the approved upload source until that repository's contents and applicable licenses are verified.
2. **Standard location:** first move/place the selected font directory in the project's standard, application-served font location. For the current Next.js project, \`public/fonts/\` is the existing static-asset convention and is already used by \`src/config/fonts.ts\`. Confirm the intended directory structure and selected font families before moving files.
3. **Site usage:** after the font folder has been moved to its standard location, use that folder's font files for the website by updating the central font configuration and relevant typography assignments as a separately approved implementation task.
4. **Validation gate:** before switching the site to the new assets, verify the source repository identity and exact files, commercial/web-embedding permissions, required attribution/license text, supported weights/styles, Persian/Latin glyph coverage, and successful rendering for both locales. Do not copy every available variant blindly.

No font was downloaded from \`oxenn_doxuments\`, copied, moved, or activated during this audit. No font loader or CSS was changed.

## 7. Audit limits

- The full tracked `font/` tree was inventoried; all 66 files and their Git blobs were counted.
- Git SHA comparison found no byte-identical duplicates among the 63 root font assets or between those assets and the 10 files under `public/fonts/`.
- The Box Face TTF's embedded name/license metadata was inspected. Representative Yekan and Tajrid WOFF file headers and table directories were inspected; all font files were not exhaustively rendered or glyph-tested.
- The WOFF compressed licensing/name tables for Yekan and Tajrid were not decoded. No separate license documents are present in this folder.
- The source-reference search index reported incomplete results. The central font loader, localized layout and global CSS were inspected directly; this report does not assert a complete repository-wide absence of dynamic references.
- No local build, browser rendering test, visual font comparison, or production deployment was performed.
- No font asset, font loader, CSS, product document or deployment setting was changed.

**Conclusion:** the root `font/` folder is a sizable, weakly documented font collection that is not consumed by the current central application font configuration. The primary issues are the unclear relationship between the root catalogue and the active `public/fonts/` assets, incomplete license/provenance records, and documentation that incorrectly describes BoxFace as the current English display font. This folder audit is complete. The next root-level folder has not been inspected; the audit pauses here for explicit approval.
