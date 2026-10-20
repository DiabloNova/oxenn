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
    fireEvent.click(screen.getByRole("button", { name: "Confirm name as entered" }));

    const competitorInput = screen.getByPlaceholderText("Add competitor brand name...");
    fireEvent.change(competitorInput, { target: { value: competitor } });
    const competitorForm = competitorInput.closest("form");
    if (!competitorForm) throw new Error("Competitor input is not inside its expected form.");
    fireEvent.submit(competitorForm);

    fireEvent.click(screen.getByRole("button", { name: /Analyze Share of Voice/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(requestBody).toMatchObject({
      brandName: "Oxenn",
      brandNameWarningObserved: true,
      brandNameWarningDecision: "confirmed",
    });

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
  it("retains warning history after the user corrects the brand name", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        shareOfVoice: { yourBrand: 100, competitors: [] },
        sentimentScore: 75,
        queryResults: [],
        actionableInsights: [],
      }),
    });

    render(<LlmAnalyticsPanel />);
    const brandInput = screen.getByPlaceholderText("e.g., Optimus AI");
    fireEvent.change(brandInput, { target: { value: "Oxenn" } });
    fireEvent.change(brandInput, { target: { value: "اوکسن" } });

    fireEvent.click(screen.getByRole("button", { name: /Analyze Share of Voice/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(requestBody).toMatchObject({
      brandName: "اوکسن",
      brandNameWarningObserved: true,
      brandNameWarningDecision: "corrected",
    });
  });

  it("blocks analysis until a flagged brand name is confirmed or corrected", () => {
    render(<LlmAnalyticsPanel />);
    fireEvent.change(screen.getByPlaceholderText("e.g., Optimus AI"), {
      target: { value: "Oxenn" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Analyze Share of Voice/i }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(
      screen.getByText("Please correct the name or confirm the non-Persian character warning.")
    ).toBeTruthy();
  });

});
