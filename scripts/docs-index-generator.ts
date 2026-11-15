import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, writeFileSync, type Dirent } from "node:fs";
import path from "node:path";
import { createContentSnippet } from "./docs-snippet";
import { LEGACY_ENGINEERING_PUBLIC_PATHS } from "./docs-publication-baseline";
import { parseDocumentationVisibility, type DocumentationVisibility } from "../src/lib/docs-visibility";

export type DocumentationCollection = "engineering" | "product-public";
export interface DocMeta {
  schemaVersion: 1; id: string; collection: DocumentationCollection; sourcePath: string; relativePath: string;
  slug: string; title: string; titleEn: string; titleFa: string; visibility: "public"; locale: string | null;
  domain: string | null; category: string; categoryFa?: string; snippet: string; contentHash: string;
}
export interface DocContent {
  id: string; collection: DocumentationCollection; sourcePath: string; relativePath: string; content: string; contentHash: string;
}
export interface GenerateDocsRegistryOptions {
  repositoryRoot?: string; docsDirectory?: string; publicDocsDirectory?: string;
  metadataOutputFile?: string; contentOutputFile?: string; outputFile?: string;
  legacyEngineeringPublicPaths?: ReadonlySet<string>;
}
export interface GeneratedDocsRegistry {
  engineering: DocMeta[]; productPublic: DocMeta[]; content: Record<string, DocContent>;
}

const CATEGORY_MAP: Record<string, string> = {
  product: "Product", "user-guides": "User Guides", services: "Services", api: "API",
  architecture: "Architecture", security: "Security", features: "Features", database: "Database",
};
const DOC_TITLE_OVERRIDES: Record<string, { titleEn?: string; titleFa?: string }> = {
  "site-map-information-architecture-audit": {
    titleEn: "Site Map and Product Information Architecture Audit — Oxenn / Seorchable",
  },
};
const REFERENCE_PREFIXES = [
  "## Table: ", "- **Ownership Scope:** ", "- **RLS Policies Declared:** ",
  "- **Tenant RLS Policy Coverage:** ", "- **Migration Coverage:** ",
  "- **Runtime Enforcement Verification:** ", "- **Status:** ", "## Summary",
  "- Total Tables: ", "- WIRED Tables: ", "- ORPHAN-TABLE",
];

export function createReferenceMatrixSnippet(content: string): string {
  return content.split("\n").filter((line) =>
    line === "# Database Reference Matrix" || REFERENCE_PREFIXES.some((prefix) => line.startsWith(prefix)),
  ).join(" ");
}
function posix(value: string): string { return value.split(path.sep).join("/"); }
function within(parent: string, candidate: string): boolean {
  const relative = path.relative(parent, candidate);
  return relative === "" || (!relative.startsWith(".." + path.sep) && relative !== ".." && !path.isAbsolute(relative));
}
function stripFrontMatter(content: string): string {
  const normalized = content.replace(/^\uFEFF/, "");
  const opening = /^---[ \t]*(?:\r?\n|$)/.exec(normalized);
  if (!opening) return normalized;
  const rest = normalized.slice(opening[0].length);
  const closing = /^---[ \t]*\r?$/m.exec(rest);
  if (!closing) return normalized;
  return rest.slice(closing.index + closing[0].length).replace(/^\r?\n/, "");
}
function canonical(value: string, label: string): string {
  const normalized = value.normalize("NFC");
  if (!normalized || normalized.startsWith("/") || normalized.split("/").some((part) => !part || part === "." || part === "..")) {
    throw new Error("Invalid canonical " + label + ": " + value);
  }
  return normalized;
}
interface SourceDocument {
  collection: DocumentationCollection; sourcePath: string; relativePath: string; content: string;
}
function walk(
  collection: DocumentationCollection, root: string, repositoryRoot: string, legacyPaths: ReadonlySet<string>,
): SourceDocument[] {
  if (!existsSync(root)) throw new Error("Documentation collection root does not exist: " + root);
  if (lstatSync(root).isSymbolicLink()) throw new Error("Documentation collection root must not be a symlink: " + root);
  const realRepo = realpathSync(repositoryRoot);
  const realRoot = realpathSync(root);
  if (!within(realRepo, realRoot)) throw new Error("Documentation collection root escapes repository: " + root);
  const found: SourceDocument[] = [];
  const canonicalPaths = new Set<string>();
  const visit = (directory: string): void => {
    const entries: Dirent[] = readdirSync(directory, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name, "en"));
    for (const entry of entries) {
      const absolute = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) throw new Error("Symlink in documentation source root: " + absolute);
      if (entry.isDirectory()) {
        if (collection === "engineering" && directory === root && ["project", "images", "public"].includes(entry.name)) continue;
        visit(absolute);
        continue;
      }
      if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".md")) continue;
      const realFile = realpathSync(absolute);
      if (!within(realRoot, realFile)) throw new Error("Documentation source escapes collection root: " + absolute);
      const sourcePath = canonical(posix(path.relative(repositoryRoot, absolute)), "source path");
      const relativePath = canonical(posix(path.relative(root, absolute)), "collection path");
      if (canonicalPaths.has(sourcePath)) throw new Error("Duplicate canonical source path: " + sourcePath);
      canonicalPaths.add(sourcePath);
      found.push({ collection, sourcePath, relativePath, content: readFileSync(absolute, "utf8") });
    }
  };
  visit(root);
  if (collection === "engineering") {
    const discovered = new Set(found.map((item) => item.relativePath));
    const missing = [...legacyPaths].filter((item) => !discovered.has(item));
    if (missing.length) throw new Error("Legacy publication baseline drift: " + missing.join(", "));
  }
  return found.sort((a, b) => a.sourcePath.localeCompare(b.sourcePath, "en"));
}
function metadataFor(source: SourceDocument, legacyPaths: ReadonlySet<string>): DocMeta | null {
  const explicit: DocumentationVisibility | undefined = parseDocumentationVisibility(source.content);
  const legacyPublic = source.collection === "engineering" && legacyPaths.has(source.relativePath);
  const visibility = explicit ?? (legacyPublic ? "public" : "internal");
  if (visibility !== "public") return null;
  const parts = source.relativePath.split("/");
  const fileName = parts[parts.length - 1] ?? "document.md";
  const base = fileName.replace(/\.md$/i, "");
  const category = source.collection === "engineering" ? (parts.length > 1 ? parts[0] ?? "product" : "product") : "public";
  const slug = base.toLowerCase() === "readme"
    ? (source.collection === "engineering" ? category : parts[0] ?? "readme") : base;
  const visibleContent = stripFrontMatter(source.content);
  const heading = visibleContent.split(/\r?\n/).find((line) => /^#\s+/.test(line));
  const title = heading ? heading.replace(/^#\s+/, "").trim() : slug.replace(/-/g, " ");
  const override = DOC_TITLE_OVERRIDES[slug];
  const locale = source.collection === "product-public" && ["fa", "en"].includes(parts[0] ?? "") ? parts[0]! : null;
  const domain = source.collection === "engineering" ? (parts.length > 1 ? parts[parts.length - 2] ?? "root" : "root") : null;
  const id = source.collection + ":" + source.relativePath;
  const contentHash = createHash("sha256").update(source.content, "utf8").digest("hex");
  const snippet = slug === "reference-matrix" ? createReferenceMatrixSnippet(visibleContent) : createContentSnippet(visibleContent);
  return {
    schemaVersion: 1, id, collection: source.collection, sourcePath: source.sourcePath, relativePath: source.relativePath,
    slug, title, titleEn: override?.titleEn ?? title, titleFa: override?.titleFa ?? title, visibility: "public",
    locale, domain, category, categoryFa: CATEGORY_MAP[category] ?? category, snippet, contentHash,
  };
}

export function buildDocumentationRegistry(options: GenerateDocsRegistryOptions = {}): GeneratedDocsRegistry {
  const docsRoot = path.resolve(options.docsDirectory ?? path.join(process.cwd(), "docs"));
  const repoRoot = path.resolve(options.repositoryRoot ?? path.dirname(docsRoot));
  const publicRoot = path.resolve(options.publicDocsDirectory ?? path.join(docsRoot, "public"));
  const legacyPaths = options.legacyEngineeringPublicPaths ?? LEGACY_ENGINEERING_PUBLIC_PATHS;
  const sources = [
    ...walk("engineering", docsRoot, repoRoot, legacyPaths),
    ...walk("product-public", publicRoot, repoRoot, new Set<string>()),
  ];
  const sourceById = new Map<string, SourceDocument>();
  const all = sources.flatMap((source) => {
    const meta = metadataFor(source, legacyPaths);
    if (!meta) return [];
    if (sourceById.has(meta.id)) throw new Error("Duplicate documentation ID: " + meta.id);
    sourceById.set(meta.id, source);
    return [meta];
  });
  const engineering = all.filter((item) => item.collection === "engineering").sort((a, b) => a.id.localeCompare(b.id, "en"));
  const productPublic = all.filter((item) => item.collection === "product-public").sort((a, b) => a.id.localeCompare(b.id, "en"));
  const content: Record<string, DocContent> = {};
  for (const meta of [...engineering, ...productPublic]) {
    const source = sourceById.get(meta.id);
    if (!source) throw new Error("Missing source content for documentation ID: " + meta.id);
    content[meta.id] = {
      id: meta.id, collection: meta.collection, sourcePath: meta.sourcePath,
      relativePath: meta.relativePath, content: source.content, contentHash: meta.contentHash,
    };
  }
  if (Object.keys(content).length !== all.length) throw new Error("Documentation metadata/content registry mismatch");
  return { engineering, productPublic, content };
}

export function generateDocsRegistry(options: GenerateDocsRegistryOptions = {}): GeneratedDocsRegistry {
  const docsRoot = path.resolve(options.docsDirectory ?? path.join(process.cwd(), "docs"));
  const metadataFile = path.resolve(options.metadataOutputFile ?? options.outputFile ?? path.join(process.cwd(), "src/lib/docsIndex.ts"));
  const contentFile = path.resolve(options.contentOutputFile ?? path.join(path.dirname(metadataFile), "docsContent.ts"));
  const registry = buildDocumentationRegistry({ ...options, docsDirectory: docsRoot });
  const metadataLines = [
    "// Auto-generated by scripts/docs-index-generator.ts. Do not edit manually.",
    'export type DocumentationCollection = "engineering" | "product-public";',
    "export interface DocMeta {",
    "  schemaVersion: 1; id: string; collection: DocumentationCollection; sourcePath: string; relativePath: string;",
    '  slug: string; title: string; titleEn: string; titleFa: string; visibility: "public"; locale: string | null;',
    "  domain: string | null; category: string; categoryFa?: string; snippet: string; contentHash: string;",
    "}",
    "export const DOCS_INDEX: DocMeta[] = " + JSON.stringify(registry.engineering, null, 2) + ";",
    "export const PUBLIC_DOCS_INDEX: DocMeta[] = " + JSON.stringify(registry.productPublic, null, 2) + ";",
  ];
  const contentLines = [
    "// Auto-generated by scripts/docs-index-generator.ts. Do not edit manually.",
    'import "server-only";',
    'import type { DocumentationCollection } from "./docsIndex";',
    "export interface DocContent { id: string; collection: DocumentationCollection; sourcePath: string; relativePath: string; content: string; contentHash: string; }",
    "export const DOCS_CONTENT: Readonly<Record<string, DocContent>> = " + JSON.stringify(registry.content, null, 2) + ";",
    "export function getDocContent(id: string): DocContent | undefined { return DOCS_CONTENT[id]; }",
  ];
  mkdirSync(path.dirname(metadataFile), { recursive: true });
  mkdirSync(path.dirname(contentFile), { recursive: true });
  writeFileSync(metadataFile, metadataLines.join("\n") + "\n", "utf8");
  writeFileSync(contentFile, contentLines.join("\n") + "\n", "utf8");
  return registry;
}

export function generateDocsIndex(options: GenerateDocsRegistryOptions = {}): GeneratedDocsRegistry {
  return generateDocsRegistry(options);
}
