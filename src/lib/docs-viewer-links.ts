import { DOCS_INDEX } from "@/lib/docsIndex";

export function encodeDocRouteToken(id: string): string {
  const codePoints = Array.from(id, (character) => character.codePointAt(0)!.toString(16));
  return "id-" + codePoints.join("_");
}

export function decodeDocRouteToken(routeToken: string): string | null {
  if (!routeToken.startsWith("id-")) return null;
  const encoded = routeToken.slice(3);
  if (!/^[0-9a-f]+(?:_[0-9a-f]+)*$/i.test(encoded)) return null;
  try {
    return encoded.split("_").map((value) => String.fromCodePoint(Number.parseInt(value, 16))).join("");
  } catch {
    return null;
  }
}

export function resolveDocsViewerHref(href: string, locale: string, sourcePath: string | null): string {
  if (!sourcePath || /^(?:[a-z][a-z0-9+.-]*:|\/\/|\/|#)/i.test(href)) return href;
  const hashIndex = href.indexOf("#");
  const fragment = hashIndex >= 0 ? href.slice(hashIndex) : "";
  const withoutFragment = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
  const queryIndex = withoutFragment.indexOf("?");
  const relativePath = queryIndex >= 0 ? withoutFragment.slice(0, queryIndex) : withoutFragment;
  const query = queryIndex >= 0 ? withoutFragment.slice(queryIndex) : "";
  if (!relativePath.toLowerCase().endsWith(".md")) return href;

  let decodedPath: string;
  try { decodedPath = decodeURIComponent(relativePath); } catch { return href; }
  const segments = sourcePath.split("/").filter(Boolean).slice(0, -1);
  for (const segment of decodedPath.split("/")) {
    if (!segment || segment === ".") continue;
    if (segment === "..") {
      if (segments.length === 0) return href;
      segments.pop();
    } else {
      segments.push(segment);
    }
  }

  const targetPath = segments.join("/").normalize("NFC");
  const target = DOCS_INDEX.find((item) => item.relativePath === targetPath);
  if (!target) return href;
  return "/" + locale + "/docs/" + encodeDocRouteToken(target.id) + query + fragment;
}

export function rewriteRelativeMarkdownLinks(text: string, locale: string, sourcePath: string | null): string {
  return text.replace(/\[(.*?)\]\((.*?)\)/g, (_match, label: string, href: string) =>
    "[" + label + "](" + resolveDocsViewerHref(href, locale, sourcePath) + ")",
  );
}
