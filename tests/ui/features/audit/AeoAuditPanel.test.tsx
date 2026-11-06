import type { ReactNode, MouseEventHandler } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AeoAuditPanel } from "@/components/features/audit/AeoAuditPanel";

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
  useTheme: () => ({ language: "en", direction: "ltr" }),
}));

vi.mock("recharts", () => {
  const ChartPart = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  return {
    ResponsiveContainer: ChartPart,
    RadarChart: ChartPart,
    PolarGrid: ChartPart,
    PolarAngleAxis: ChartPart,
    PolarRadiusAxis: ChartPart,
    Radar: ChartPart,
    Tooltip: ChartPart,
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

describe("AeoAuditPanel authentication handling", () => {
  it("renders a session-expired message when the audit API returns 401", async () => {
    fetchMock.mockResolvedValue({ status: 401, ok: false });

    render(<AeoAuditPanel />);

    const brandInput = await screen.findByPlaceholderText(
      "Enter brand or entity name (e.g., Optimus)..."
    );
    fireEvent.change(brandInput, { target: { value: "Oxenn" } });
    fireEvent.click(screen.getByRole("button", { name: /Run Semantic Audit/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/audit/aeo-insight",
      expect.objectContaining({ method: "POST" })
    );
    expect(
      await screen.findByText("Your session has expired. Please sign in again.")
    ).toBeTruthy();
    expect(screen.queryByText("Failed to retrieve semantic audit payload.")).toBeNull();
  });
});
