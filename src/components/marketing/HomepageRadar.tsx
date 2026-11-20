"use client";

import { useTheme } from "@/components/ThemeProvider";
import Radar from "@/components/oxenn-library/radar/Radar";

export function HomepageRadar() {
  const { theme } = useTheme();
  const lightMode = theme === "light";

  return (
    <Radar
      color={lightMode ? "#215ab6" : "#9bcaff"}
      backgroundColor="transparent"
      mode="sweep"
      speed={0.55}
      trail={0.3}
      scale={0.88}
      ringCount={5}
      spokeCount={16}
      ticks
      targets={0}
      clutter={0}
      glow={0.7}
      brightness={0.9}
      gridOpacity={0.55}
      lineWidth={1}
      mouseInteraction
      intro
      grain={0.015}
      fade={0.08}
      opacity={0.92}
      lightMode={lightMode}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
