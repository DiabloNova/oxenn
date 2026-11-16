"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { notifyNavigationStart } from "@/lib/navigation-transition";

type Theme = "light" | "dark";
type Direction = "ltr" | "rtl";
type Language = "en" | "fa";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  direction: Direction;
  language: Language;
  setLanguage: (lang: Language) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
  initialLanguage = "fa",
}: {
  children: React.ReactNode;
  initialLanguage?: Language;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setThemeState] = useState<Theme>("light");
  const [language, setLanguageState] = useState<Language>(initialLanguage);
  const [direction, setDirection] = useState<Direction>(initialLanguage === "fa" ? "rtl" : "ltr");

  const setTheme = useCallback((newTheme: Theme) => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(newTheme);
    localStorage.setItem("theme", newTheme);
    setThemeState(newTheme);
  }, []);

  const setLanguage = useCallback(
    (newLang: Language) => {
      const root = window.document.documentElement;
      const dir: Direction = newLang === "fa" ? "rtl" : "ltr";
      root.setAttribute("lang", newLang);
      root.setAttribute("dir", dir);
      localStorage.setItem("language", newLang);
      setLanguageState(newLang);
      setDirection(dir);

      if (pathname) {
        const localePrefix = /^\/(?:fa|en)(?=\/|$)/;
        let localizedPath = pathname;
        if (localePrefix.test(pathname)) {
          localizedPath = pathname.replace(localePrefix, "/" + newLang);
        } else if (pathname === "/") {
          localizedPath = "/" + newLang;
        } else {
          localizedPath = "/" + newLang + (pathname.startsWith("/") ? pathname : "/" + pathname);
        }
        if (localizedPath !== pathname) {
          notifyNavigationStart(localizedPath);
          router.replace(localizedPath + window.location.search + window.location.hash);
        }
      }
    },
    [pathname, router]
  );

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as Theme | null;
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const initialTheme = storedTheme || systemTheme;

    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(initialTheme);

    const routeLanguage = pathname?.match(/^\/(fa|en)(?=\/|$)/)?.[1];
    const storedLanguage = localStorage.getItem("language");
    let currentLang: Language = initialLanguage;
    if (routeLanguage === "fa" || routeLanguage === "en") {
      currentLang = routeLanguage;
      localStorage.setItem("language", currentLang);
    } else if (storedLanguage === "fa" || storedLanguage === "en") {
      currentLang = storedLanguage;
    }

    const currentDir: Direction = currentLang === "fa" ? "rtl" : "ltr";
    root.setAttribute("lang", currentLang);
    root.setAttribute("dir", currentDir);
    const timer = setTimeout(() => {
      setThemeState(initialTheme);
      setLanguageState(currentLang);
      setDirection(currentDir);
    }, 0);
    return () => clearTimeout(timer);
  }, [initialLanguage, pathname]);

  return <ThemeContext.Provider value={{ theme, setTheme, direction, language, setLanguage }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
}
