"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useTheme } from "@/components/ThemeProvider";
import MetallicPaint from "@/components/oxenn-library/metallic-paint/MetallicPaint";

type BrandMarkProps = { size?: number; priority?: boolean; className?: string };
type WordmarkProps = { width?: number; height?: number; className?: string };

function useWebGL2Availability() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    const probe = document.createElement("canvas");
    const context = probe.getContext("webgl2");
    const supported = Boolean(context);
    // This one-time effect records a browser capability check, not derived application state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAvailable(supported);
    context?.getExtension("WEBGL_lose_context")?.loseContext();
  }, []);

  return available;
}

export function MetallicBrandMark({ size = 38, priority = false, className = "" }: BrandMarkProps) {
  const webglAvailable = useWebGL2Availability();
  const { theme } = useTheme();

  return (
    <span
      className={`metallic-brand-mark ${className}`.trim()}
      style={{ width: size, height: size }}
      role="img"
      aria-label="OXENN"
    >
      {webglAvailable ? (
        <MetallicPaint
          imageSrc="/metallic-paint-logo.svg"
          speed={0.8}
          density={2}
          dispersion={0.3}
          lightMode={theme === "light"}
          style={{ width: "100%", height: "100%" }}
        />
      ) : (
        <Image
          src="/metallic-paint-logo.svg"
          alt=""
          width={size}
          height={size}
          priority={priority}
          className="metallic-brand-static"
          style={{ filter: theme === "dark" ? "invert(1)" : "none" }}
        />
      )}
    </span>
  );
}

export function MetallicBrandWordmark({ width = 96, height = 28, className = "" }: WordmarkProps) {
  const webglAvailable = useWebGL2Availability();
  const { theme } = useTheme();

  return (
    <span
      className={`metallic-brand-wordmark ${className}`.trim()}
      style={{ width, height }}
      role="img"
      aria-label="OXENN"
    >
      {webglAvailable ? (
        <MetallicPaint
          text="OXENN"
          fontFamily="Arial, Helvetica, sans-serif"
          fontWeight={850}
          speed={0.8}
          density={2}
          dispersion={0.3}
          lightMode={theme === "light"}
          style={{ width: "100%", height: "100%" }}
        />
      ) : (
        <span className="metallic-brand-wordmark-static" aria-hidden="true">OXENN</span>
      )}
    </span>
  );
}
