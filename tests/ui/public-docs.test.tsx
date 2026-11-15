import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import MarkdownContent from "@/components/public-docs/MarkdownContent";

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


  it("hides publication front matter from the rendered public page", () => {
    const markdown = "---\\nvisibility: public\\n---\\n\\n# Public documentation";
    render(<MarkdownContent locale="en" markdown={markdown} />);
    expect(screen.getByRole("heading", { level: 1, name: "Public documentation" })).toBeInTheDocument();
    expect(screen.queryByText("visibility: public")).not.toBeInTheDocument();
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
});
