"use client";

import React, { createContext, useContext, useCallback, useLayoutEffect, useSyncExternalStore } from "react";
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
const THEME_CHANGE_EVENT = "oxenn:theme-change";
const LANGUAGE_CHANGE_EVENT = "oxenn:language-change";

let inMemoryTheme: Theme | null = null;
let inMemoryLanguage: Language | null = null;

function readStoredPreference(key: string): string | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStoredPreference(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // The in-memory snapshot remains authoritative for this tab when storage is unavailable.
  }
}

function getThemeSnapshot(): Theme {
  if (inMemoryTheme) return inMemoryTheme;
  const storedTheme = readStoredPreference("theme");
  if (storedTheme === "light" || storedTheme === "dark") return storedTheme;
  return typeof window !== "undefined" && typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getServerThemeSnapshot(): Theme {
  return "light";
}

function subscribeTheme(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === "theme") {
      inMemoryTheme = null;
      onStoreChange();
    }
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);
  const media = typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : null;
  media?.addEventListener?.("change", onStoreChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
    media?.removeEventListener?.("change", onStoreChange);
  };
}

function getLanguageSnapshot(
  fallback: Language,
  routeLanguage: Language | null,
): Language {
  if (routeLanguage) return routeLanguage;
  if (inMemoryLanguage) return inMemoryLanguage;
  const storedLanguage = readStoredPreference("language");
  return storedLanguage === "fa" || storedLanguage === "en" ? storedLanguage : fallback;
}

function subscribeLanguage(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === "language") {
      inMemoryLanguage = null;
      onStoreChange();
    }
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener(LANGUAGE_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(LANGUAGE_CHANGE_EVENT, onStoreChange);
  };
}

export function ThemeProvider({
  children,
  initialLanguage = "fa",
}: {
  children: React.ReactNode;
  initialLanguage?: Language;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const routeLanguage = pathname?.match(/^\/(fa|en)(?=\/|$)/)?.[1] as Language | undefined;
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot);
  const getLanguage = useCallback(
    () => getLanguageSnapshot(initialLanguage, routeLanguage ?? null),
    [initialLanguage, routeLanguage],
  );
  const getServerLanguage = useCallback(() => initialLanguage, [initialLanguage]);
  const language = useSyncExternalStore(subscribeLanguage, getLanguage, getServerLanguage);
  const direction: Direction = language === "fa" ? "rtl" : "ltr";

  const setTheme = useCallback((newTheme: Theme) => {
    inMemoryTheme = newTheme;
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(newTheme);
    writeStoredPreference("theme", newTheme);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }, []);

  const setLanguage = useCallback(
    (newLang: Language) => {
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
          // The route locale remains authoritative until navigation commits.
          // A cancelled transition therefore cannot leak an optimistic preference.
          notifyNavigationStart(localizedPath);
          router.replace(localizedPath + window.location.search + window.location.hash);
          return;
        }
      }

      inMemoryLanguage = newLang;
      writeStoredPreference("language", newLang);
      window.dispatchEvent(new Event(LANGUAGE_CHANGE_EVENT));
    },
    [pathname, router],
  );

  useLayoutEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  useLayoutEffect(() => {
    const root = window.document.documentElement;
    const currentLanguage = routeLanguage ?? getLanguageSnapshot(initialLanguage, null);
    if (routeLanguage) {
      inMemoryLanguage = routeLanguage;
      writeStoredPreference("language", routeLanguage);
    }
    root.setAttribute("lang", currentLanguage);
    root.setAttribute("dir", currentLanguage === "fa" ? "rtl" : "ltr");
  }, [initialLanguage, routeLanguage, pathname]);

  return <ThemeContext.Provider value={{ theme, setTheme, direction, language, setLanguage }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
}
