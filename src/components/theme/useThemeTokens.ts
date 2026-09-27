import { useEffect, useState } from "react";

export type ThemeType = "light" | "dark";

export function useThemeTokens() {
  const [theme, setTheme] = useState<ThemeType>("dark");

  useEffect(() => {
    // Check initial active class without triggering cascading render
    // Use an effect with setTimeout to match hydration gap in ThemeProvider or simply let observer handle the rest
    const timer = setTimeout(() => {
      const isLight = document.documentElement.classList.contains("light");
      setTheme(isLight ? "light" : "dark");
    }, 0);

    // Create an observer to watch for class changes on the html element (handled by ThemeProvider)
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === "class") {
          const isNowLight = document.documentElement.classList.contains("light");
          setTheme(isNowLight ? "light" : "dark");
        }
      }
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  return { theme };
}
