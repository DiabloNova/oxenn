import { NextResponse } from "next/server";
import { DOCS_INDEX } from "@/lib/docsIndex";
import { getDocContent } from "@/lib/docsContent";

function findLegacyCandidates(slug: string, domain: string | null) {
  if (slug === "README") {
    if (domain === "root") return DOCS_INDEX.filter((item) => item.relativePath === "README.md");
    const readmes = DOCS_INDEX.filter((item) => item.relativePath.toLowerCase().endsWith("/readme.md"));
    return domain ? readmes.filter((item) => item.domain === domain) : readmes;
  }
  if (domain === slug) {
    const categoryReadme = DOCS_INDEX.filter((item) => item.relativePath === slug + "/README.md");
    if (categoryReadme.length) return categoryReadme;
  }
  const candidates = DOCS_INDEX.filter((item) => item.slug === slug);
  return domain ? candidates.filter((item) => item.domain === domain) : candidates;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const slug = searchParams.get("slug");
  const domain = searchParams.get("domain");
  if (!id && !slug) return NextResponse.json({ error: "Missing id or slug" }, { status: 400 });

  const candidates = id
    ? DOCS_INDEX.filter((item) => item.id === id)
    : findLegacyCandidates(slug!, domain);
  if (candidates.length === 0 || candidates[0]?.collection !== "engineering") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (candidates.length > 1) {
    return NextResponse.json({ error: "Ambiguous document selector; use the canonical id" }, { status: 409 });
  }

  const metadata = candidates[0];
  const document = getDocContent(metadata.id);
  if (!document || document.collection !== "engineering") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ content: document.content, path: document.relativePath });
}
