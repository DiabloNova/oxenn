import React, { type ReactNode } from "react";
import type { Locale } from "@/config/i18n";

interface MarkdownContentProps {
  markdown: string;
  locale: Locale;
}

interface ListItem {
  ordered: boolean;
  text: string;
}

function resolveLink(href: string, locale: Locale): { href: string; external: boolean } | null {
  const normalizedHref = href.trim();

  if (normalizedHref.startsWith("#")) {
    return { href: normalizedHref, external: false };
  }
  if (normalizedHref.startsWith("https://") || normalizedHref.startsWith("http://")) {
    return { href: normalizedHref, external: true };
  }
  if (normalizedHref.startsWith("../") || normalizedHref.startsWith("./") || normalizedHref.startsWith("/")) {
    const localeSegment = normalizedHref.split("/").find((segment) => segment === "en" || segment === "fa");
    const targetLocale = (localeSegment as Locale | undefined) ?? (locale === "fa" ? "en" : "fa");
    return { href: "/" + targetLocale + "/public-docs", external: false };
  }
  return null;
}

function findLinkClosingParen(source: string, start: number): number {
  let nestedDepth = 0;
  for (let index = start; index < source.length; index += 1) {
    if (source[index] === "(") nestedDepth += 1;
    if (source[index] === ")") {
      if (nestedDepth === 0) return index;
      nestedDepth -= 1;
    }
  }
  return -1;
}

function renderInline(source: string, locale: Locale, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let plainStart = 0;
  let tokenIndex = 0;

  while (cursor < source.length) {
    let node: ReactNode | null = null;
    let consumed = 0;
    const key = keyPrefix + "-" + tokenIndex++;

    if (source.startsWith("[", cursor)) {
      const labelEnd = source.indexOf("](", cursor + 1);
      const urlEnd = labelEnd >= 0 ? findLinkClosingParen(source, labelEnd + 2) : -1;
      if (labelEnd >= 0 && urlEnd > labelEnd + 2) {
        const label = source.slice(cursor + 1, labelEnd);
        const link = resolveLink(source.slice(labelEnd + 2, urlEnd), locale);
        if (!link) {
          node = label;
        } else if (link.external) {
          node = <a key={key} href={link.href} target="_blank" rel="noopener noreferrer">{label}</a>;
        } else {
          node = <a key={key} href={link.href}>{label}</a>;
        }
        consumed = urlEnd + 1 - cursor;
      }
    }

    if (node === null && source.startsWith("**", cursor)) {
      const end = source.indexOf("**", cursor + 2);
      if (end > cursor + 2) {
        node = <strong key={key}>{source.slice(cursor + 2, end)}</strong>;
        consumed = end + 2 - cursor;
      }
    }

    if (node === null && source[cursor] === "*") {
      const end = source.indexOf("*", cursor + 1);
      if (end > cursor + 1) {
        node = <em key={key}>{source.slice(cursor + 1, end)}</em>;
        consumed = end + 1 - cursor;
      }
    }

    if (node !== null) {
      if (cursor > plainStart) nodes.push(source.slice(plainStart, cursor));
      nodes.push(node);
      cursor += consumed;
      plainStart = cursor;
    } else {
      cursor += 1;
    }
  }

  if (plainStart < source.length) nodes.push(source.slice(plainStart));
  return nodes;
}

function parseListItem(line: string): ListItem | null {
  const value = line.trim();
  if (value.startsWith("- ") || value.startsWith("* ") || value.startsWith("+ ")) {
    return { ordered: false, text: value.slice(2) };
  }

  const separator = value.indexOf(". ");
  if (separator > 0) {
    const number = value.slice(0, separator);
    if (number.length > 0 && Array.from(number).every((character) => character >= "0" && character <= "9")) {
      return { ordered: true, text: value.slice(separator + 2) };
    }
  }
  return null;
}

function headingLevel(line: string): number {
  let count = 0;
  while (line[count] === "#") count += 1;
  return count >= 1 && count <= 3 && line[count] === " " ? count : 0;
}

function isHorizontalRule(line: string): boolean {
  const value = line.trim();
  return value.length >= 3 && (Array.from(value).every((character) => character === "-") ||
    Array.from(value).every((character) => character === "*"));
}

function isBlockStart(line: string): boolean {
  return headingLevel(line) > 0 || isHorizontalRule(line) || parseListItem(line) !== null;
}

export default function MarkdownContent({ markdown, locale }: MarkdownContentProps) {
  const withoutFrontMatter = markdown.replace(/^\uFEFF?---[ \t]*\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/, "");
  const lines = withoutFrontMatter.replaceAll(String.fromCharCode(13), "").split(String.fromCharCode(10));
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) {
      index += 1;
      continue;
    }

    const level = headingLevel(line);
    if (level > 0) {
      const HeadingTag: "h1" | "h2" | "h3" = level === 1 ? "h1" : level === 2 ? "h2" : "h3";
      const title = line.slice(level + 1);
      const headingClass = level === 1
        ? "mb-6 mt-8 text-3xl font-black tracking-tight sm:text-4xl"
        : level === 2
          ? "mb-4 mt-10 border-b border-[var(--glass-border)] pb-2 text-2xl font-bold"
          : "mb-3 mt-7 text-xl font-bold";
      blocks.push(
        <HeadingTag key={"heading-" + index} className={headingClass}>
          {renderInline(title, locale, "heading-" + index)}
        </HeadingTag>,
      );
      index += 1;
      continue;
    }

    if (isHorizontalRule(line)) {
      blocks.push(<hr key={"rule-" + index} className="my-8 border-[var(--glass-border)]" />);
      index += 1;
      continue;
    }

    const firstListItem = parseListItem(line);
    if (firstListItem) {
      const ordered = firstListItem.ordered;
      const items: ReactNode[] = [];
      while (index < lines.length) {
        const item = parseListItem(lines[index]);
        if (!item || item.ordered !== ordered) break;
        items.push(
          <li key={"item-" + index}>
            {renderInline(item.text, locale, "item-" + index)}
          </li>,
        );
        index += 1;
      }
      const ListTag = ordered ? "ol" : "ul";
      blocks.push(
        <ListTag key={"list-" + index}
          className={"mb-5 list-inside space-y-2 " + (ordered ? "list-decimal" : "list-disc")}>
          {items}
        </ListTag>,
      );
      continue;
    }

    const paragraphLines = [line];
    index += 1;
    while (index < lines.length && lines[index].trim() && !isBlockStart(lines[index].trim())) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }
    blocks.push(
      <p key={"paragraph-" + index} className="mb-5 leading-8 text-[var(--text-secondary)]">
        {renderInline(paragraphLines.join(" "), locale, "paragraph-" + index)}
      </p>,
    );
  }

  return <div className="public-docs-content">{blocks}</div>;
}
