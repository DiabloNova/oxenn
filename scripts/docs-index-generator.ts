import fs from "fs";
import path from "path";
import { createContentSnippet } from "./docs-snippet";
import { isPublicDocumentation } from "../src/lib/docs-visibility";

export interface DocMeta {
  slug: string;
  title: string;
  category: string;
  path: string;
  contentSnippet: string;
}

export interface GenerateDocsIndexOptions {
  docsDirectory?: string;
  outputFile?: string;
}

const CATEGORY_MAP: Record<string, string> = {
  "product": "Product",
  "user-guides": "User Guides",
  "services": "Services",
  "api": "API",
  "architecture": "Architecture",
  "security": "Security",
  "project": "Project",
  "features": "Features",
  "database": "Database"
};

// Explicit locale labels for documents whose source heading is not bilingual.
const DOC_TITLE_OVERRIDES: Record<string, { titleEn?: string; titleFa?: string }> = {
  "site-map-information-architecture-audit": {
    titleEn: "Site Map and Product Information Architecture Audit — Oxenn / Seorchable"
  }
};

function getAllDocs(docsRoot: string, currentDirectory = docsRoot): DocMeta[] {
  let docs: DocMeta[] = [];

  if (!fs.existsSync(currentDirectory)) {
    return docs;
  }

  const entries = fs.readdirSync(currentDirectory, { withFileTypes: true });

  for (const entry of entries) {
    const res = path.resolve(currentDirectory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "project" && entry.name !== "images") {
        docs = docs.concat(getAllDocs(docsRoot, res));
      }
    } else if (entry.name.endsWith(".md")) {
      const relativeDirectory = path.relative(docsRoot, currentDirectory);
      const categoryParts = relativeDirectory.split(path.sep);
      const category = categoryParts[0] || "product";

      let slug = entry.name.replace(/\.md$/, "");

      // Handle README.md inside domain roots
      if (slug === "README") {
        slug = category;
      }

      let title = slug.replace(/-/g, " ");
      title = title.charAt(0).toUpperCase() + title.slice(1);
      let contentSnippet = "";

      try {
        const content = fs.readFileSync(res, "utf-8");
        if (!isPublicDocumentation(content)) {
          continue;
        }

        const firstLine = content.split("\n").find(line => line.startsWith("# "));
        if (firstLine) {
          title = firstLine.replace("# ", "").trim();
        }

        if (slug === "reference-matrix") {
          // Keep search metadata compact without discarding useful table names and security metadata.
          contentSnippet = content
            .split("\n")
            .filter(line =>
              line === "# Database Reference Matrix" ||
              line.startsWith("## Table: ") ||
              line.startsWith("- **Scope:** ") ||
              line.startsWith("- **RLS Policies Defined:** ") ||
              line.startsWith("- **Status:** ") ||
              line.startsWith("## Summary") ||
              line.startsWith("- Total Tables: ") ||
              line.startsWith("- WIRED Tables: ") ||
              line.startsWith("- ORPHAN-TABLE")
            )
            .join(" ");
        } else {
          contentSnippet = createContentSnippet(content);
        }
      } catch (_e) {}

      docs.push({
        slug,
        title,
        category,
        path: path.relative(path.dirname(docsRoot), res),
        contentSnippet
      });
    }
  }

  return docs;
}

export function generateDocsIndex(options: GenerateDocsIndexOptions = {}): void {
  const docsDirectory = options.docsDirectory ?? path.join(process.cwd(), "docs");
  const outputFile = options.outputFile ?? path.join(process.cwd(), "src/lib/docsIndex.ts");
  const docs = getAllDocs(docsDirectory);

  let indexOutput = `// Auto-generated metadata index for navigation and search
export interface DocMeta {
  slug: string;
  titleEn: string;
  titleFa: string;
  category: string;
  categoryFa?: string;
  snippet: string;
}

export const DOCS_INDEX: DocMeta[] = [\n`;

  for (const doc of docs) {
    const titleOverride = DOC_TITLE_OVERRIDES[doc.slug];
    const titleEn = (titleOverride?.titleEn ?? doc.title).replace(/\\\\/g, "\\\\\\").replace(/"/g, '\\\"');
    const titleFa = (titleOverride?.titleFa ?? doc.title).replace(/\\\\/g, "\\\\\\").replace(/"/g, '\\\"');
    const snippet = doc.contentSnippet.replace(/\\\\/g, "\\\\\\").replace(/\x60/g, "\\`").replace(/\$/g, "\\$");
    indexOutput += `  {
    slug: "${doc.slug}",
    titleEn: "${titleEn}",
    titleFa: "${titleFa}",
    category: "${doc.category}",
    categoryFa: "${CATEGORY_MAP[doc.category] || doc.category}",
    snippet: \`${snippet}\`
  },\n`;
  }
  indexOutput += "];\n";
  fs.writeFileSync(outputFile, indexOutput);

  console.log("Generated docs index metadata with content snippets.");
}
