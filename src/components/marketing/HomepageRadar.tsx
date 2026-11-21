"use client";

import { useTheme } from "@/components/ThemeProvider";
import Radar from "@/components/oxenn-library/radar/Radar";

/** The original React Bits radar rendered as a page-background effect. */
export function HomepageRadar() {
  const { theme } = useTheme();
  const lightMode = theme === "light";

  return (
    <Radar
      color="#608268"
      backgroundColor="transparent"
      mode="sweep"
      speed={0.55}
      trail={1}
      scale={1.4}
      ringCount={9}
      spokeCount={12}
      targets={16}
      clutter={0.6}
      mouseInteraction
      ticks
      glow={0.8}
      tilt={64}
      centerX={0.5}
      centerY={0.92}
      brightness={1.25}
      gridOpacity={0.45}
      lineWidth={1}
      grain={0.03}
      fade={0.1}
      opacity={0.86}
      intro
      lightMode={lightMode}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
