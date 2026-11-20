"use client";

import { useTheme } from "@/components/ThemeProvider";
import GradientBlinds from "@/components/oxenn-library/gradient-blinds/GradientBlinds";

export function HomepageGradientBlinds() {
  const { theme } = useTheme();

  return (
    <GradientBlinds
      gradientColors={["#8b8788", "#215ab6"]}
      angle={20}
      blindCount={16}
      blindMinWidth={60}
      spotlightRadius={0.5}
      shine={0.4}
      relief={0.5}
      glow={0.4}
      sway={0.35}
      hoverTilt={0.6}
      clickEffect="ripple"
      noise={0.28}
      spotlightSoftness={1}
      spotlightOpacity={1}
      shineDirection="left"
      lightColor="#ffffff"
      speed={1}
      perspective={0}
      gradientSpeed={0}
      distortAmount={0}
      mirrorGradient={false}
      mouseDampening={0.15}
      idle="drift"
      intro
      lightMode={theme === "light"}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
