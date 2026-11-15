import React, { type ReactNode } from "react";
import type { Locale } from "@/config/i18n";

interface MarkdownContentProps {
  markdown: string;
  locale: Locale;
}

function resolveLink(href: string, locale: Locale): { href: string; external: boolean } | null {
  const normalizedHref = href.trim();

  if (normalizedHref.startsWith("#")) {
    return { href: normalizedHref, external: false };
  }
  if (/^https?:\/\//i.test(normalizedHref)) {
    return { href: normalizedHref, external: true };
  }
  if (normalizedHref.startsWith("../") || normalizedHref.startsWith("./") || normalizedHref.startsWith("/")) {
    const localeMatch = normalizedHref.match(/(?:^|\/)(en|fa)(?:\/|$)/);
    const targetLocale = (localeMatch?.[1] as Locale | undefined) ?? (locale === "fa" ? "en" : "fa");
    return { href: "/" + targetLocale + "/public-docs", external: false };
  }
  return null;
}

function renderInline(source: string, locale: Locale, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const tokenPattern = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  let tokenIndex = 0;

  while ((match = tokenPattern.exec(source)) !== null) {
    if (match.index > cursor) nodes.push(source.slice(cursor, match.index));
    const key = keyPrefix + "-" + tokenIndex++;

    if (match[2] !== undefined && match[3] !== undefined) {
      const link = resolveLink(match[3], locale);
      if (!link) {
        nodes.push(match[2]);
      } else if (link.external) {
        nodes.push(
          <a key={key} href={link.href} target="_blank" rel="noopener noreferrer"
            className="font-medium text-sky-600 underline decoration-sky-600/40 underline-offset-4 hover:decoration-current dark:text-sky-400">
            {match[2]}
          </a>,
        );
      } else {
        nodes.push(
          <a key={key} href={link.href}
            className="font-medium text-sky-600 underline decoration-sky-600/40 underline-offset-4 hover:decoration-current dark:text-sky-400">
            {match[2]}
          </a>,
        );
      }
    } else if (match[4] !== undefined) {
      nodes.push(<strong key={key}>{match[4]}</strong>);
    } else if (match[5] !== undefined) {
      nodes.push(<em key={key}>{match[5]}</em>);
    }
    cursor = match.index + match[0].length;
  }

  if (cursor < source.length) nodes.push(source.slice(cursor));
  return nodes;
}

function isUnorderedListLine(line: string): boolean {
  return /^\s*[-*+]\s+/.test(line);
}

function isOrderedListLine(line: string): boolean {
  return /^\s*\d+\.\s+/.test(line);
}

function isBlockStart(line: string): boolean {
  return /^#{1,3}\s+/.test(line) || /^\s*---+\s*$/.test(line) ||
    isUnorderedListLine(line) || isOrderedListLine(line);
}

export default function MarkdownContent({ markdown, locale }: MarkdownContentProps) {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) {
      index += 1;
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const HeadingTag = heading[1].length === 1 ? "h1" : heading[1].length === 2 ? "h2" : "h3";
      const headingClass = HeadingTag === "h1"
        ? "mb-6 text-3xl font-black tracking-tight sm:text-4xl"
        : HeadingTag === "h2"
          ? "mb-4 mt-10 border-b border-[var(--glass-border)] pb-2 text-2xl font-bold"
          : "mb-3 mt-7 text-xl font-bold";
      blocks.push(
        <HeadingTag key={"heading-" + index} className={headingClass}>
          {renderInline(heading[2], locale, "heading-" + index)}
        </HeadingTag>,
      );
      index += 1;
      continue;
    }

    if (/^---+$/.test(line) || /^\*\*\*+$/.test(line)) {
      blocks.push(<hr key={"rule-" + index} className="my-8 border-[var(--glass-border)]" />);
      index += 1;
      continue;
    }

    if (isUnorderedListLine(line) || isOrderedListLine(line)) {
      const ordered = isOrderedListLine(line);
      const items: ReactNode[] = [];
      while (index < lines.length) {
        const itemLine = lines[index].trim();
        const itemMatch = ordered ? itemLine.match(/^\d+\.\s+(.+)$/) : itemLine.match(/^[-*+]\s+(.+)$/);
        if (!itemMatch) break;
        items.push(
          <li key={"item-" + index} className="ps-1">
            {renderInline(itemMatch[1], locale, "item-" + index)}
          </li>,
        );
        index += 1;
      }
      const ListTag = ordered ? "ol" : "ul";
      blocks.push(
        <ListTag key={"list-" + index}
          className={"mb-5 space-y-2 ps-6 leading-8 marker:text-[var(--text-secondary)] " + (ordered ? "list-decimal" : "list-disc")}>
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
