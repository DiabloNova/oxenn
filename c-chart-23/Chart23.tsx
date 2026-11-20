"use client";

import { useId, useSyncExternalStore } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import styles from "./Chart23.module.css";

export interface ChartDatum {
  skill: string;
  score: number;
}

export interface PatternProps {
  data?: ChartDatum[];
  title?: string;
  description?: string;
}

type TooltipContentProps = {
  active?: boolean;
  payload?: Array<{
    value?: number;
    payload?: ChartDatum;
  }>;
};

const DEFAULT_CHART_DATA: ChartDatum[] = [
  { skill: "Frontend", score: 92 },
  { skill: "Backend", score: 78 },
  { skill: "DevOps", score: 68 },
  { skill: "Design", score: 74 },
  { skill: "Testing", score: 85 },
  { skill: "Security", score: 62 },
];

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(onChange: () => void) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }

  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);

  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }

  mediaQuery.addListener(onChange);
  return () => mediaQuery.removeListener(onChange);
}

function getReducedMotionSnapshot() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia(REDUCED_MOTION_QUERY).matches
  );
}

function getServerReducedMotionSnapshot() {
  return true;
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getServerReducedMotionSnapshot,
  );
}

function ChartTooltipContent({ active, payload }: TooltipContentProps) {
  const point = payload?.[0];

  if (!active || !point?.payload) {
    return null;
  }

  return (
    <div className={styles.tooltip}>
      <span className={styles.tooltipLabel}>{point.payload.skill}</span>
      <strong>{point.value ?? point.payload.score}</strong>
      <span className={styles.tooltipSuffix}>Proficiency</span>
    </div>
  );
}

export function Pattern({
  data = DEFAULT_CHART_DATA,
  title = "Skill Assessment",
  description = "Team proficiency across key areas",
}: PatternProps) {
  const id = useId().replace(/:/g, "");
  const gradientId = `chart23-fill-${id}`;
  const glowId = `chart23-glow-${id}`;
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <article className={styles.card} aria-label={title}>
      <header className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.description}>{description}</p>
      </header>

      <div className={styles.chart}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart
            accessibilityLayer
            data={data}
            margin={{ top: 12, right: 24, bottom: 12, left: 24 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-accent)" stopOpacity={0.5} />
                <stop offset="100%" stopColor="var(--chart-accent)" stopOpacity={0.08} />
              </linearGradient>
              <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            <Tooltip content={<ChartTooltipContent />} cursor={false} />
            <PolarAngleAxis
              dataKey="skill"
              tick={{ fontSize: 12, fill: "var(--chart-muted)" }}
            />
            <PolarGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
            <Radar
              dataKey="score"
              fill={`url(#${gradientId})`}
              stroke="var(--chart-accent)"
              strokeWidth={2}
              filter={`url(#${glowId})`}
              dot={{
                r: 4,
                fill: "var(--chart-accent)",
                strokeWidth: 0,
              }}
              isAnimationActive={!prefersReducedMotion}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

export default Pattern;
