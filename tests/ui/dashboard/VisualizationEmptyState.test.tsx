import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { VisualizationContainer } from "@/components/visualization/VisualizationContainer";
import { VisualizationAdapters } from "@/components/visualization/contracts";
import { HeatmapPrimitive } from "@/components/visualization/AnalyticalVisualizations";
import { DonutChartPrimitive } from "@/components/visualization/Charts";
import { TimelinePrimitive, ScorecardPrimitive } from "@/components/visualization/ScorecardsAndTimelines";
import { VisibilityTrendChart } from "@/components/features/dashboard-home/VisibilityTrendChart";
import { DashboardKpiGrid } from "@/components/features/dashboard-home/DashboardKpiGrid";
import { CriticalIssuesPanel } from "@/components/features/dashboard-home/CriticalIssuesPanel";
import { RecommendedActionsPanel } from "@/components/features/dashboard-home/RecommendedActionsPanel";

Object.defineProperty(window, "matchMedia", {
  configurable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

vi.mock("@/components/ThemeProvider", () => ({ useTheme: () => ({ language: "en", direction: "ltr" }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("recharts", async () => {
  const ReactModule = await import("react");
  const part = (name: string) => {
    const MockPart = ({ children }: { children?: React.ReactNode }) => ReactModule.createElement("div", { "data-chart-part": name }, children);
    MockPart.displayName = `Mock${name}`;
    return MockPart;
  };
  return {
    ResponsiveContainer: part("responsive-container"),
    LineChart: part("line-chart"), Line: part("line"),
    BarChart: part("bar-chart"), Bar: part("bar"),
    AreaChart: part("area-chart"), Area: part("area"),
    ScatterChart: part("scatter-chart"), Scatter: part("scatter"),
    PieChart: part("pie-chart"), Pie: part("pie"), Cell: part("cell"),
    XAxis: part("x-axis"), YAxis: part("y-axis"), Tooltip: part("tooltip"), Legend: part("legend"), CartesianGrid: part("cartesian-grid"),
    RadarChart: part("radar-chart"), PolarGrid: part("polar-grid"), PolarAngleAxis: part("polar-angle-axis"), PolarRadiusAxis: part("polar-radius-axis"), Radar: part("radar"),
  };
});

describe("dashboard empty-data presentation contract", () => {
  afterEach(() => cleanup());

  it("keeps visualization children mounted and reports empty data outside the plot", () => {
    render(<VisualizationContainer id="empty-chart" titleEn="Visibility trend" titleFa="روند دیده‌شدن" empty emptyMessageEn="No observations yet."><div data-testid="chart-plot">Chart structure</div></VisualizationContainer>);
    expect(screen.getByText("Visibility trend")).toBeInTheDocument();
    expect(screen.getByTestId("chart-plot")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("No observations yet.");
  });

  it("keeps the dashboard visibility chart frame, axes, grid and legend with an empty dataset", async () => {
    const { container } = render(<VisibilityTrendChart data={[]} />);
    expect(await screen.findByText("Search & AI Visibility Trends")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("No historical audit metrics are available yet.");
    for (const partName of ["responsive-container", "area-chart", "cartesian-grid", "x-axis", "y-axis", "legend", "area"]) {
      expect(container.querySelector(`[data-chart-part="${partName}"]`)).toBeInTheDocument();
    }
  });

  it("does not fabricate zero-valued heatmap cells when observations are missing", () => {
    const { container } = render(<HeatmapPrimitive dataset={{ xLabelsEn: ["Monday"], xLabelsFa: ["دوشنبه"], yLabelsEn: ["Visibility"], yLabelsFa: ["قابلیت مشاهده"], cells: [], minVal: 0, maxVal: 100, colorGradients: [] }} />);
    expect(container.querySelectorAll("[data-empty-cell='true']")).toHaveLength(1);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("preserves the donut chart and its legend region when no categories are available", () => {
    const { container } = render(<DonutChartPrimitive dataset={{ xAxisKey: "label", series: [{ key: "value", nameEn: "Share", nameFa: "سهم" }], data: [] }} />);
    expect(container.querySelector('[data-chart-part="pie-chart"]')).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("No category data available yet.");
  });

  it("keeps an empty timeline structure and explains that no events are available", () => {
    render(<TimelinePrimitive dataset={{ events: [] }} />);
    expect(screen.getByRole("status")).toHaveTextContent("No timeline events available yet.");
  });

  it("renders an unavailable scorecard value as a dash while retaining its unit", () => {
    render(<ScorecardPrimitive metric={{ id: "missing-score", labelEn: "Visibility score", labelFa: "امتیاز دیده‌شدن", value: null, unitEn: "points", unitFa: "امتیاز", trend: "none", status: "neutral" }} />);
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getByText("points")).toBeInTheDocument();
  });

  it("renders missing dashboard KPI values as dashes and preserves percentage units", () => {
    render(<DashboardKpiGrid seoHealth="N/A" aiVisibility="N/A" brandAuthority="N/A" citationVisibility="N/A" technicalHealth="N/A" contentHealth="N/A" competitivePosition="N/A" />);
    expect(screen.getAllByText("—")).toHaveLength(7);
    expect(screen.getAllByText("%")).toHaveLength(4);
  });

  it("does not describe an empty issues or recommendations list as a healthy result", () => {
    render(<><CriticalIssuesPanel issues={[]} /><RecommendedActionsPanel actions={[]} /></>);
    expect(screen.getByText("No critical issue data available yet")).toBeInTheDocument();
    expect(screen.getByText("No recommended actions available yet")).toBeInTheDocument();
    expect(screen.queryByText("All Systems Fully Optimized")).not.toBeInTheDocument();
    expect(screen.queryByText("Highly Optimized Profile")).not.toBeInTheDocument();
  });

  it("preserves null audit scores instead of converting them to zero", () => {
    const dataset = VisualizationAdapters.adaptAuditTrend([{ created_at: "2026-11-20T12:00:00.000Z", visibility_score: null }]);
    expect(dataset.data).toHaveLength(1);
    expect(dataset.data[0].score).toBeNull();
  });
});
