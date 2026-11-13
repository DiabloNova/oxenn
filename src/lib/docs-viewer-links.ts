export function resolveDocsViewerHref(href: string, locale: string, sourcePath: string | null): string {
  if (!sourcePath || /^(?:[a-z][a-z0-9+.-]*:|\/\/|\/|#)/i.test(href)) return href;

  const hashIndex = href.indexOf("#");
  const fragment = hashIndex >= 0 ? href.slice(hashIndex) : "";
  const withoutFragment = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
  const queryIndex = withoutFragment.indexOf("?");
  const relativePath = queryIndex >= 0 ? withoutFragment.slice(0, queryIndex) : withoutFragment;
  if (!relativePath.toLowerCase().endsWith(".md")) return href;

  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(relativePath);
  } catch {
    return href;
  }

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

  const fileName = segments.pop();
  if (!fileName || !fileName.toLowerCase().endsWith(".md")) return href;

  const parentDirectory = segments.length > 0 ? segments[segments.length - 1] : "root";
  const slug = fileName.toLowerCase() === "readme.md" ? (parentDirectory === "root" ? "README" : parentDirectory) : fileName.slice(0, -3);
  return `/${locale}/docs/${encodeURIComponent(slug)}${fragment}`;
}
