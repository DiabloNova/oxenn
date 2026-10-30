"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/components/AuthProvider";
import { NAVIGATION_START_EVENT } from "@/lib/navigation-transition";
import { BarChart2, FileText, LogOut, Menu, Sparkles, X, Check } from "lucide-react";

interface QuickAction {
  id: "playground" | "analytics" | "content";
  icon: React.ComponentType<{ className?: string }>;
  labelEn: string;
  labelFa: string;
  path: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "playground",
    icon: Sparkles,
    labelEn: "AI Model Playground",
    labelFa: "محیط آزمون مدل‌های هوش مصنوعی",
    path: "/dashboard/aeo/playground",
  },
  {
    id: "analytics",
    icon: BarChart2,
    labelEn: "Reports & Analytics Explorer",
    labelFa: "کاوشگر گزارش‌ها و تحلیل‌ها",
    path: "/dashboard/analytics/llm-bias",
  },
  {
    id: "content",
    icon: FileText,
    labelEn: "Content Studio",
    labelFa: "استودیوی محتوا",
    path: "/dashboard/content/studio",
  },
];

export default function FloatingSidebar() {
  const { language } = useTheme();
  const { logout } = useAuth();
  const pathname = usePathname();
  const isFa = language === "fa";
  const reduceMotion = useReducedMotion() ?? false;

  const [isOpen, setIsOpen] = useState(false);
  const [isMobileArmed, setIsMobileArmed] = useState(false);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [navigationFromPath, setNavigationFromPath] = useState<string | null>(null);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  const dockRef = useRef<HTMLDivElement | null>(null);
  const logoutConfirmationRef = useRef<HTMLDivElement | null>(null);
  const desktopTriggerRef = useRef<HTMLButtonElement | null>(null);
  const mobileTriggerRef = useRef<HTMLButtonElement | null>(null);
  const focusDockOnOpenRef = useRef(false);
  const restoreFocusRef = useRef(false);
  const hoverTimerRef = useRef<number | undefined>(undefined);
  const mobileActivationTimerRef = useRef<number | undefined>(undefined);
  const hasObservedPathChangeRef = useRef(false);

  useEffect(() => {
    setPortalRoot(document.body);
  }, []);

  const clearHoverTimer = useCallback(() => {
    if (hoverTimerRef.current !== undefined) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = undefined;
    }
  }, []);

  const clearMobileActivationTimer = useCallback(() => {
    if (mobileActivationTimerRef.current !== undefined) {
      window.clearTimeout(mobileActivationTimerRef.current);
      mobileActivationTimerRef.current = undefined;
    }
  }, []);

  const openDock = useCallback((moveFocus = false) => {
    clearHoverTimer();
    clearMobileActivationTimer();
    focusDockOnOpenRef.current =
      moveFocus ||
      document.activeElement === desktopTriggerRef.current ||
      document.activeElement === mobileTriggerRef.current;
    restoreFocusRef.current = false;
    setIsOpen(true);
    setIsMobileArmed(false);
    setShowLogoutConfirmation(false);
    setLogoutError(null);
  }, [clearHoverTimer, clearMobileActivationTimer]);

  const closeDock = useCallback((restoreFocus = false) => {
    clearHoverTimer();
    clearMobileActivationTimer();
    restoreFocusRef.current = restoreFocus;
    focusDockOnOpenRef.current = false;
    setIsOpen(false);
    setIsMobileArmed(false);
    setShowLogoutConfirmation(false);
    setLogoutError(null);
  }, [clearHoverTimer, clearMobileActivationTimer]);

  const scheduleDesktopOpen = useCallback(() => {
    clearHoverTimer();
    hoverTimerRef.current = window.setTimeout(() => {
      hoverTimerRef.current = undefined;
      focusDockOnOpenRef.current =
        document.activeElement === desktopTriggerRef.current;
      setIsOpen(true);
      setIsMobileArmed(false);
      setShowLogoutConfirmation(false);
      setLogoutError(null);
    }, 1_000);
  }, [clearHoverTimer]);

  const handleMobileTrigger = useCallback(() => {
    if (isMobileArmed) {
      openDock(true);
      return;
    }

    clearMobileActivationTimer();
    setIsMobileArmed(true);
    mobileActivationTimerRef.current = window.setTimeout(() => {
      mobileActivationTimerRef.current = undefined;
      setIsMobileArmed(false);
    }, 3_000);
  }, [isMobileArmed, clearMobileActivationTimer, openDock]);

  const getLocalizedHref = (path: string) => "/" + language + path;

  const isItemActive = (path: string) => {
    const localizedPath = getLocalizedHref(path);
    return pathname === localizedPath || pathname?.startsWith(localizedPath + "/");
  };

  useEffect(() => {
    let recoveryTimer: number | undefined;

    const clearRecoveryTimer = () => {
      if (recoveryTimer !== undefined) {
        window.clearTimeout(recoveryTimer);
        recoveryTimer = undefined;
      }
    };

    const handleNavigationStart = () => {
      const sourcePath = pathname ?? null;
      setNavigationFromPath(sourcePath);
      hasObservedPathChangeRef.current = false;
      clearRecoveryTimer();
      clearHoverTimer();
      clearMobileActivationTimer();
      setIsOpen(false);
      setIsMobileArmed(false);
      setShowLogoutConfirmation(false);
      setLogoutError(null);

      recoveryTimer = window.setTimeout(() => {
        setNavigationFromPath((pendingPath) =>
          pendingPath === sourcePath ? null : pendingPath
        );
        recoveryTimer = undefined;
      }, 10_000);
    };

    const handleInternalLinkClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      try {
        const destination = new URL(anchor.href, window.location.href);
        if (
          destination.origin === window.location.origin &&
          destination.pathname !== window.location.pathname
        ) {
          handleNavigationStart();
        }
      } catch {
        // Ignore malformed or non-navigation link targets.
      }
    };

    const handlePopState = () => {
      if (pathname && window.location.pathname === pathname) {
        clearRecoveryTimer();
        setNavigationFromPath(null);
        hasObservedPathChangeRef.current = false;
      }
    };

    window.addEventListener(NAVIGATION_START_EVENT, handleNavigationStart);
    document.addEventListener("click", handleInternalLinkClick, true);
    window.addEventListener("popstate", handlePopState);

    return () => {
      clearRecoveryTimer();
      clearHoverTimer();
      clearMobileActivationTimer();
      window.removeEventListener(NAVIGATION_START_EVENT, handleNavigationStart);
      document.removeEventListener("click", handleInternalLinkClick, true);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [pathname, clearHoverTimer, clearMobileActivationTimer]);

  useEffect(() => {
    if (navigationFromPath === null || pathname === null) return;

    if (pathname !== navigationFromPath) {
      hasObservedPathChangeRef.current = true;
    }

    if (!hasObservedPathChangeRef.current) return;

    const settleTimer = window.setTimeout(() => {
      setNavigationFromPath(null);
      hasObservedPathChangeRef.current = false;
    }, 300);

    return () => window.clearTimeout(settleTimer);
  }, [navigationFromPath, pathname]);

  useEffect(() => {
    if (isOpen && focusDockOnOpenRef.current) {
      focusDockOnOpenRef.current = false;
      dockRef.current
        ?.querySelector<HTMLElement>('a[href], button:not([disabled])')
        ?.focus();
      return;
    }

    if (isOpen || !restoreFocusRef.current) return;

    restoreFocusRef.current = false;
    const desktop = window.matchMedia("(min-width: 768px)").matches;
    (desktop ? desktopTriggerRef.current : mobileTriggerRef.current)?.focus();
  }, [isOpen, isMobileArmed]);

  useEffect(() => {
    if (!isOpen && !isMobileArmed) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || isLoggingOut) return;
      closeDock(true);
    };

    const handleOutsidePointerDown = (event: PointerEvent) => {
      if (isLoggingOut) return;
      const target = event.target;
      if (!(target instanceof Node)) return;

      if (
        dockRef.current?.contains(target) ||
        logoutConfirmationRef.current?.contains(target) ||
        desktopTriggerRef.current?.contains(target) ||
        mobileTriggerRef.current?.contains(target)
      ) {
        return;
      }

      closeDock();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handleOutsidePointerDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handleOutsidePointerDown);
    };
  }, [isOpen, isMobileArmed, isLoggingOut, closeDock]);

  const isWorkspace = /^\/(?:fa|en)\/(?:dashboard|settings|profile)(?:\/|$)/.test(
    pathname ?? ""
  );
  const isNavigationPending = navigationFromPath !== null;

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setLogoutError(null);

    try {
      await logout();
      closeDock();
    } catch {
      setLogoutError(
        isFa
          ? "خروج انجام نشد. لطفاً دوباره تلاش کنید."
          : "Sign out failed. Please try again."
      );
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!isWorkspace || isNavigationPending) return null;

  return (
    <>
      {!isOpen && (
        <div className="fixed bottom-6 left-1/2 z-[999] hidden -translate-x-1/2 md:block">
          <button
            ref={desktopTriggerRef}
            type="button"
            data-testid="desktop-dock-trigger"
            aria-label={isFa ? "باز کردن دسترسی‌های سریع" : "Open quick actions"}
            aria-expanded={false}
            title={isFa ? "برای باز شدن مکث کنید یا کلیک کنید" : "Hover for one second or click to open"}
            onMouseEnter={scheduleDesktopOpen}
            onMouseLeave={clearHoverTimer}
            onClick={() => openDock(true)}
            className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-slate-950/85 text-slate-100 shadow-[0_16px_40px_rgba(2,6,23,0.42)] backdrop-blur-2xl transition-colors hover:border-sky-300/35 hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/80"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      )}

      {!isOpen && (
        <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-[999] md:hidden">
          {isMobileArmed && (
            <span
              role="status"
              aria-live="polite"
              className="absolute bottom-full right-0 mb-3 whitespace-nowrap rounded-lg border border-white/10 bg-slate-950/95 px-3 py-2 text-xs font-medium text-white shadow-xl"
            >
              {isFa ? "دوباره ضربه بزنید" : "Tap again to open"}
            </span>
          )}
          <button
            ref={mobileTriggerRef}
            type="button"
            data-testid="mobile-dock-trigger"
            aria-label={
              isFa
                ? isMobileArmed
                  ? "برای باز کردن، دوباره ضربه بزنید"
                  : "فعال‌کردن دسترسی‌های سریع"
                : isMobileArmed
                  ? "Tap again to open quick actions"
                  : "Activate quick actions"
            }
            aria-expanded={false}
            onClick={handleMobileTrigger}
            className={[
              "flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-slate-950/90 text-white shadow-[0_12px_32px_rgba(2,6,23,0.38)] backdrop-blur-2xl transition-opacity duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/80",
              isMobileArmed ? "opacity-100 ring-2 ring-sky-300/50" : "opacity-35 hover:opacity-100",
            ].join(" ")}
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dockRef}
            key="workspace-quick-action-dock"
            data-testid="workspace-quick-action-dock"
            dir={isFa ? "rtl" : "ltr"}
            className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 left-auto z-[999] max-w-[calc(100vw-2rem)] translate-x-0 md:bottom-6 md:right-auto md:left-1/2 md:-translate-x-1/2"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
            transition={{ duration: reduceMotion ? 0 : 0.72, ease: [0.2, 0.85, 0.2, 1] }}
          >
            <motion.div
              className="relative flex items-center gap-0.5 rounded-full border border-white/10 bg-slate-950/[0.88] p-1.5 text-white shadow-[0_18px_45px_rgba(2,6,23,0.46)] backdrop-blur-2xl"
              animate={reduceMotion ? undefined : { y: [0, -2, 0] }}
              transition={reduceMotion ? undefined : { duration: 7, repeat: Infinity, ease: "easeInOut" }}
            >
              {QUICK_ACTIONS.map((item) => {
                const Icon = item.icon;
                const label = isFa ? item.labelFa : item.labelEn;
                const isActive = isItemActive(item.path);

                return (
                  <Link
                    key={item.id}
                    href={getLocalizedHref(item.path)}
                    data-testid={"quick-action-" + item.id}
                    aria-label={label}
                    aria-current={isActive ? "page" : undefined}
                    title={label}
                    className={[
                      "group relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/80",
                      isActive
                        ? "border-sky-300/35 bg-sky-300/15 text-sky-200"
                        : "border-transparent text-slate-300 hover:border-white/10 hover:bg-white/10 hover:text-white",
                    ].join(" ")}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    <span
                      role="tooltip"
                      className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-slate-900/95 px-2.5 py-1.5 text-[11px] font-medium text-white opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
                    >
                      {label}
                    </span>
                  </Link>
                );
              })}

              <span className="mx-0.5 h-7 w-px shrink-0 bg-white/15" aria-hidden="true" />

              <button
                type="button"
                data-testid="quick-action-logout"
                aria-label={isFa ? "خروج از حساب کاربری" : "Sign out"}
                title={isFa ? "خروج از حساب کاربری" : "Sign out"}
                onClick={() => {
                  setShowLogoutConfirmation(true);
                  setLogoutError(null);
                }}
                className="group relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-transparent text-rose-300 transition-colors hover:border-rose-300/15 hover:bg-rose-400/10 hover:text-rose-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/80"
              >
                <LogOut className="h-5 w-5" aria-hidden="true" />
                <span
                  role="tooltip"
                  className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-slate-900/95 px-2.5 py-1.5 text-[11px] font-medium text-white opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
                >
                  {isFa ? "خروج از حساب کاربری" : "Sign out"}
                </span>
              </button>

              <button
                type="button"
                aria-label={isFa ? "بستن دسترسی‌های سریع" : "Close quick actions"}
                onClick={() => closeDock(true)}
                disabled={isLoggingOut}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-transparent text-slate-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/80"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {showLogoutConfirmation && portalRoot && createPortal(
        <div
          ref={logoutConfirmationRef}
          role="group"
          aria-label={isFa ? "تأیید خروج از حساب" : "Confirm sign out"}
          data-testid="logout-confirmation"
          className={[
            "fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] z-[1000] w-[min(17rem,calc(100vw-6rem))] rounded-2xl border border-white/10 bg-slate-950/95 p-4 text-start shadow-2xl backdrop-blur-2xl",
            isFa ? "right-4" : "left-4",
            "md:bottom-[calc(5.75rem+env(safe-area-inset-bottom))] md:left-1/2 md:right-auto md:w-[min(17rem,calc(100vw-2rem))] md:-translate-x-1/2",
          ].join(" ")}
        >
          <p className="text-sm font-semibold text-white">
            {isFa ? "از حساب کاربری خارج می‌شوید؟" : "Sign out of your account?"}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            {isFa ? "برای جلوگیری از خروج تصادفی، این اقدام را تأیید کنید." : "Confirm to avoid signing out by mistake."}
          </p>
          {logoutError && <p role="alert" className="mt-2 text-xs text-rose-300">{logoutError}</p>}
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowLogoutConfirmation(false)}
              disabled={isLoggingOut}
              className="rounded-lg px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/80 disabled:opacity-50"
            >
              {isFa ? "انصراف" : "Cancel"}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/15 px-3 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/80 disabled:opacity-50"
            >
              {isLoggingOut ? null : <Check className="h-3.5 w-3.5" aria-hidden="true" />}
              {isLoggingOut
                ? isFa
                  ? "در حال خروج..."
                  : "Signing out..."
                : isFa
                  ? "تأیید خروج"
                  : "Sign out"}
            </button>
          </div>
        </div>,
        portalRoot
      )}
    </>
  );
}
