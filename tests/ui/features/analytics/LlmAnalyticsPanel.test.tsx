import type { ReactNode, MouseEventHandler } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LlmAnalyticsPanel } from "@/components/features/analytics/LlmAnalyticsPanel";

vi.mock("@/components/Card", () => {
  const Wrapper = ({
    children,
    className,
    dir,
  }: {
    children?: ReactNode;
    className?: string;
    dir?: string;
  }) => <div className={className} dir={dir}>{children}</div>;

  return {
    Card: Wrapper,
    CardHeader: Wrapper,
    CardTitle: Wrapper,
    CardDescription: Wrapper,
    CardContent: Wrapper,
  };
});

vi.mock("@/components/Button", () => ({
  Button: ({
    children,
    type,
    disabled,
    className,
    onClick,
  }: {
    children?: ReactNode;
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
    className?: string;
    onClick?: MouseEventHandler<HTMLButtonElement>;
  }) => (
    <button type={type ?? "button"} disabled={disabled} className={className} onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/Badge", () => ({
  Badge: ({ children, className }: { children?: ReactNode; className?: string }) => (
    <span className={className}>{children}</span>
  ),
}));

vi.mock("@/components/ThemeProvider", () => ({
  useTheme: () => ({ language: "en" }),
}));

vi.mock("@/components/AuthProvider", () => ({
  useAuth: () => ({ session: { user: { workspaceId: "ws-test", id: "user-test" } } }),
}));

vi.mock("recharts", () => {
  const ChartPart = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  return {
    ResponsiveContainer: ChartPart,
    PieChart: ChartPart,
    Pie: ChartPart,
    Cell: () => null,
    Tooltip: () => null,
  };
});

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("LlmAnalyticsPanel security regression", () => {
  it("keeps hostile LLM markup inert and safely highlights case-insensitive, regex-special names", async () => {
    const competitor = ".*[";
    const payload = "<img src=x onerror=alert(1)>";

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        shareOfVoice: {
          yourBrand: 50,
          competitors: [{ name: competitor, percentage: 50 }],
        },
        sentimentScore: 80,
        queryResults: [
          {
            query: "How does Oxenn compare?",
            simulatedResponse: "OXENN is compared with " + competitor + ". " + payload,
            brandMentioned: true,
            sentiment: "positive",
            hallucinationRisk: "low",
          },
        ],
        actionableInsights: ["Strengthen authoritative content."],
      }),
    });

    const { container } = render(<LlmAnalyticsPanel />);

    fireEvent.change(screen.getByPlaceholderText("e.g., Optimus AI"), {
      target: { value: "Oxenn" },
    });

    const competitorInput = screen.getByPlaceholderText("Add competitor brand name...");
    fireEvent.change(competitorInput, { target: { value: competitor } });
    const competitorForm = competitorInput.closest("form");
    if (!competitorForm) throw new Error("Competitor input is not inside its expected form.");
    fireEvent.submit(competitorForm);

    fireEvent.click(screen.getByRole("button", { name: /Analyze Share of Voice/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const highlighted = await waitFor(() => {
      const result = Array.from(container.querySelectorAll(".leading-relaxed")).find((element) =>
        element.innerHTML.includes("&lt;img")
      );
      if (!result) throw new Error("Mocked analytics response has not rendered yet.");
      return result;
    });

    expect(container.querySelector("img")).toBeNull();
    expect(container.innerHTML).toContain("&lt;img");
    expect(highlighted.innerHTML).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(highlighted.textContent).toContain(payload);
    expect(
      Array.from(highlighted.querySelectorAll("span")).some((span) => span.textContent === "OXENN")
    ).toBe(true);
    expect(
      Array.from(highlighted.querySelectorAll("span")).some((span) => span.textContent === competitor)
    ).toBe(true);
  });

  it("preserves entity text and highlights names that resemble HTML entities or injected markup", async () => {
    const brand = "Oxenn";
    const competitors = ["Amp", "Bold", "lt", "quot", "Span"];
    const responseText =
      'Symbols: & <tag> "quote" \'apostrophe\'. Mentions: Oxenn, Amp, Bold, lt, quot, Span.';

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        shareOfVoice: {
          yourBrand: 50,
          competitors: competitors.map((name) => ({ name, percentage: 10 })),
        },
        sentimentScore: 80,
        queryResults: [
          {
            query: "Can entities and tag-like names be highlighted?",
            simulatedResponse: responseText,
            brandMentioned: true,
            sentiment: "positive",
            hallucinationRisk: "low",
          },
        ],
        actionableInsights: ["Preserve the original response text."],
      }),
    });

    const { container } = render(<LlmAnalyticsPanel />);

    fireEvent.change(screen.getByPlaceholderText("e.g., Optimus AI"), {
      target: { value: brand },
    });

    const competitorInput = screen.getByPlaceholderText("Add competitor brand name...");
    for (const competitor of competitors) {
      fireEvent.change(competitorInput, { target: { value: competitor } });
      const form = competitorInput.closest("form");
      if (!form) throw new Error("Competitor input is not inside its expected form.");
      fireEvent.submit(form);
    }

    fireEvent.click(screen.getByRole("button", { name: /Analyze Share of Voice/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const highlighted = await waitFor(() => {
      const result = Array.from(container.querySelectorAll(".leading-relaxed")).find(
        (element) => element.innerHTML.includes("&lt;tag&gt;")
      );
      if (!result) throw new Error("Mocked analytics response has not rendered yet.");
      return result;
    });

    // The displayed text must be identical to the untrusted source text: no split
    // entities, leaked class fragments, or accidentally rewritten characters.
    expect(highlighted.textContent).toBe(responseText);
    expect(highlighted.querySelector("tag")).toBeNull();

    const highlightedText = Array.from(highlighted.querySelectorAll("span")).map(
      (span) => span.textContent
    );
    for (const mention of [brand, ...competitors]) {
      expect(highlightedText).toContain(mention);
    }

    // Escaping is still applied to markup-like response text.
    expect(highlighted.innerHTML).toContain("&lt;tag&gt;");
    expect(container.querySelector("img, script, iframe")).toBeNull();
  });

});
