import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import MarkdownContent from "@/components/public-docs/MarkdownContent";

afterEach(() => cleanup());

describe("public documentation Markdown renderer", () => {
  it("renders headings, emphasis, paragraphs, and lists", () => {
    const newline = String.fromCharCode(10);
    const markdown = ["# Public docs", "", "A **clear** and *useful* overview.", "", "- First item", "- Second item"].join(newline);
    render(<MarkdownContent locale="en" markdown={markdown} />);
    expect(screen.getByRole("heading", { level: 1, name: "Public docs" })).toBeInTheDocument();
    expect(screen.getByText("clear").tagName).toBe("STRONG");
    expect(screen.getByText("useful").tagName).toBe("EM");
    expect(screen.getByRole("list").querySelectorAll("li")).toHaveLength(2);
  });

  it("maps relative language links to the corresponding public documentation route", () => {
    render(<MarkdownContent locale="fa" markdown="[English version](../en/README.md)" />);
    expect(screen.getByRole("link", { name: "English version" })).toHaveAttribute("href", "/en/public-docs");
  });

  it("allows HTTP(S) links with safe external-link attributes", () => {
    render(<MarkdownContent locale="en" markdown="[Official site](https://example.com/docs)" />);
    const link = screen.getByRole("link", { name: "Official site" });
    expect(link).toHaveAttribute("href", "https://example.com/docs");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders unsafe URL schemes as plain text rather than clickable links", () => {
    render(<MarkdownContent locale="en" markdown="[unsafe](javascript:alert(1))" />);
    expect(screen.queryByRole("link", { name: "unsafe" })).not.toBeInTheDocument();
    expect(screen.getByText("unsafe")).toBeInTheDocument();
  });

  it("maps only language README links and preserves their fragments", () => {
    const { container } = render(<MarkdownContent locale="fa" markdown="[English overview](../en/README.md#overview) [pricing](/pricing) [next](./getting-started.md)" />);
    expect(screen.getByRole("link", { name: "English overview" })).toHaveAttribute("href", "/en/public-docs#overview");
    expect(screen.queryByRole("link", { name: "pricing" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "next" })).not.toBeInTheDocument();
    expect(container.querySelector("p")).toHaveTextContent("English overview pricing next");
  });

  it("supports case-insensitive HTTP(S) schemes", () => {
    render(<MarkdownContent locale="en" markdown="[Uppercase](HTTPS://example.com/docs)" />);
    expect(screen.getByRole("link", { name: "Uppercase" })).toHaveAttribute("href", "HTTPS://example.com/docs");
  });

  it("does not let an unmatched opening bracket consume a later link", () => {
    render(<MarkdownContent locale="en" markdown="[plain text [actual](https://example.com)" />);
    expect(screen.getByRole("link", { name: "actual" })).toHaveAttribute("href", "https://example.com");
    expect(screen.getByText("[plain text")).toBeInTheDocument();
  });

  it("assigns stable heading IDs for fragment navigation", () => {
    render(<MarkdownContent locale="en" markdown={"## Getting Started\n\n## Getting Started"} />);
    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings[0]).toHaveAttribute("id", "getting-started");
    expect(headings[1]).toHaveAttribute("id", "getting-started-1");
  });
});
