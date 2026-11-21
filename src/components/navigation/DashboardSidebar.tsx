"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";
import { notifyNavigationStart } from "@/lib/navigation-transition";
import { useAuth } from "@/components/AuthProvider";
import {
  dashboardNavigation,
  isDashboardRouteActive,
  NavigationItem,
  NavigationSubItem
} from "@/config/dashboardNavigation";
import { SeorchableLogo } from "../marketing/SeorchableLogo";
import {
  X,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  LogOut,
  Bot,
  LayoutDashboard,
  Plus,
  BookOpen,
  MessageSquareText,
  UserCircle,
  Settings,
  Receipt,
  HelpCircle
} from "lucide-react";

interface DashboardSidebarProps {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (val: boolean) => void;
  onHelpClick?: () => void;
}

export default function DashboardSidebar({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
  onHelpClick
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { language, direction } = useTheme();
  const { session, logout } = useAuth();
  const isRtl = language === "fa";
  const agentBasePath = `/${language}/dashboard/agent`;
  const isAgentMode = pathname === agentBasePath || Boolean(pathname?.startsWith(agentBasePath + "/"));

  // Accordion state manually toggled by user (key is item id, value is boolean)
  const [toggledItems, setToggledItems] = useState<Record<string, boolean>>({});
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const closeMobileDrawer = useCallback(() => {
    setAccountMenuOpen(false);
    setMobileOpen(false);
  }, [setMobileOpen]);

  // Trap focus for mobile drawer
  const drawerRef = useRef<HTMLDivElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const accountTriggerRef = useRef<HTMLButtonElement>(null);

  // Support Escape key to close mobile menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileOpen && !accountMenuOpen) {
        closeMobileDrawer();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, accountMenuOpen, closeMobileDrawer]);

  // Dismiss the account menu when pointer or keyboard focus moves outside it.
  useEffect(() => {
    if (!accountMenuOpen) return;
    const handleOutsidePointer = (event: PointerEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    const handleOutsideFocus = (event: FocusEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    const handleAccountEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setAccountMenuOpen(false);
      accountTriggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", handleOutsidePointer);
    document.addEventListener("focusin", handleOutsideFocus);
    window.addEventListener("keydown", handleAccountEscape);
    return () => {
      document.removeEventListener("pointerdown", handleOutsidePointer);
      document.removeEventListener("focusin", handleOutsideFocus);
      window.removeEventListener("keydown", handleAccountEscape);
    };
  }, [accountMenuOpen]);


  // Trap focus implementation for mobile drawer
  useEffect(() => {
    if (!mobileOpen || !drawerRef.current) return;

    const focusableElements = drawerRef.current.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select'
    );
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleFocusTrap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    window.addEventListener("keydown", handleFocusTrap);
    firstElement.focus();

    return () => window.removeEventListener("keydown", handleFocusTrap);
  }, [mobileOpen]);

  const toggleExpand = (id: string) => {
    setToggledItems((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getLocalizedHref = (href: string) => {
    return `/${language}${href === "/" ? "" : href}`;
  };

  const isRouteActive = (href?: string, exact = false) =>
    isDashboardRouteActive(pathname, href, language, exact);

  const navigateTo = (href: string) => {
    const destination = getLocalizedHref(href);
    notifyNavigationStart(destination);
    router.push(destination);
    closeMobileDrawer();
  };

  const isParentActive = (item: NavigationItem) => {
    if (item.href) return isRouteActive(item.href, item.exact);
    if (item.children) {
      return item.children.some((child) => isRouteActive(child.href));
    }
    return false;
  };

  const handleItemClick = (item: NavigationItem) => {
    if (item.href) {
      if (item.href === "#help") {
        closeMobileDrawer();
        if (onHelpClick) onHelpClick();
      } else {
        const destination = getLocalizedHref(item.href);
        notifyNavigationStart(destination);
        router.push(destination);
        closeMobileDrawer();
      }
    } else {
      toggleExpand(item.id);
    }
  };

  const handleSubItemClick = (child: NavigationSubItem) => {
    const destination = getLocalizedHref(child.href);
    notifyNavigationStart(destination);
    router.push(destination);
    closeMobileDrawer();
  };

  const renderNavItems = (items: NavigationItem[], isMobileState: boolean) => {
    return items.map((item) => {
      const IconComp = item.icon;
      const hasChildren = !!item.children && item.children.length > 0;
      const isChildActive = hasChildren && item.children!.some((child) => isRouteActive(child.href));

      // Accordion is expanded if toggled state is true OR if we haven't manually toggled it but a child is active
      const isExpanded = toggledItems[item.id] !== undefined
        ? toggledItems[item.id]
        : isChildActive;

      const isActive = isParentActive(item);

      return (
        <div key={item.id} className="space-y-1">
          {/* Main Item Button */}
          <button
            type="button"
            onClick={() => handleItemClick(item)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 border cursor-pointer group outline-none focus:ring-1 focus:ring-[var(--sky-blue-500)]
              ${isActive
                ? "bg-gradient-to-r from-[var(--sky-blue-500)]/15 to-[var(--orange-500)]/5 text-[var(--text-primary)] border-[var(--sky-blue-500)]/30 font-bold"
                : "text-[var(--text-secondary)] hover:bg-[var(--muted-surface)] hover:text-[var(--text-primary)] border-transparent"
              }
              ${collapsed && !isMobileState ? "justify-center" : ""}`}
            title={collapsed && !isMobileState ? (isRtl ? item.labelFa : item.labelEn) : undefined}
            aria-expanded={hasChildren ? isExpanded : undefined}
            aria-current={isActive ? "page" : undefined}
            aria-label={isRtl ? item.labelFa : item.labelEn}
          >
            <div className="flex items-center gap-3 min-w-0">
              <IconComp
                size={16}
                className={`shrink-0 transition-transform group-hover:scale-105 duration-200
                  ${isActive ? "text-[var(--sky-blue-500)]" : "text-[var(--text-muted)] group-hover:text-[var(--sky-blue-500)]"}`}
              />
              {(!collapsed || isMobileState) && (
                <span className="truncate">{isRtl ? item.labelFa : item.labelEn}</span>
              )}
            </div>

            {hasChildren && (!collapsed || isMobileState) && (
              <div className="shrink-0 text-[var(--text-muted)]">
                {isExpanded ? <ChevronDown size={14} /> : (isRtl ? <ChevronLeft size={14} /> : <ChevronRight size={14} />)}
              </div>
            )}
          </button>

          {/* Children / Accordion list */}
          {hasChildren && isExpanded && (!collapsed || isMobileState) && (
            <div className={`space-y-1 ${isRtl ? "pr-6 border-r border-[var(--border)]" : "pl-6 border-l border-[var(--border)]"} mt-1 mr-2 ml-2`}>
              {item.children?.map((child) => {
                const isChildActiveRoute = isRouteActive(child.href);
                return (
                  <button
                    key={child.id}
                    onClick={() => handleSubItemClick(child)}
                    className={`w-full text-start px-3 py-2 rounded-lg text-[11px] font-medium transition-all duration-150 cursor-pointer outline-none focus:text-[var(--sky-blue-500)]
                      ${isChildActiveRoute
                        ? "text-[var(--sky-blue-500)] font-black"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      }`}
                    aria-label={isRtl ? child.labelFa : child.labelEn}
                  >
                    {isRtl ? child.labelFa : child.labelEn}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      );
    });
  };

  const renderSidebarContents = (isMobileState: boolean) => {
    const showLabels = !collapsed || isMobileState;
    const accountName = session.user?.name || (isRtl ? "حساب کاربری" : "Account");
    const accountEmail = session.user?.email || (isRtl ? "اطلاعات حساب در دسترس نیست" : "Account details unavailable");

    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-[var(--border)] shrink-0 bg-[rgba(15,23,42,0.15)]">
          <SeorchableLogo className="w-7 h-7" glow={false} />
          {showLabels && <span className="font-black text-[var(--text-primary)] text-sm tracking-tight font-display">OXENN</span>}
        </div>

        <div className="grid grid-cols-2 gap-1 p-2 border-b border-[var(--border)] shrink-0" aria-label={isRtl ? "بخش‌های اصلی" : "Primary areas"}>
          <button type="button" onClick={() => navigateTo("/dashboard")}
            className={"min-w-0 flex items-center justify-center gap-2 rounded-lg px-2 py-2.5 text-xs font-bold transition-colors " + (!isAgentMode ? "bg-[var(--sky-blue-500)]/15 text-[var(--text-primary)] border border-[var(--sky-blue-500)]/30" : "border border-transparent text-[var(--text-secondary)] hover:bg-[var(--muted-surface)]")}
            aria-current={!isAgentMode ? "page" : undefined}
            title={showLabels ? undefined : (isRtl ? "تجزیه و تحلیل" : "Analytics")}>
            <LayoutDashboard size={16} aria-hidden="true" />{showLabels && <span>{isRtl ? "تجزیه و تحلیل" : "Analytics"}</span>}
          </button>
          <button type="button" onClick={() => navigateTo("/dashboard/agent")}
            className={"min-w-0 flex items-center justify-center gap-2 rounded-lg px-2 py-2.5 text-xs font-bold transition-colors " + (isAgentMode ? "bg-[var(--sky-blue-500)]/15 text-[var(--text-primary)] border border-[var(--sky-blue-500)]/30" : "border border-transparent text-[var(--text-secondary)] hover:bg-[var(--muted-surface)]")}
            aria-current={isAgentMode ? "page" : undefined}
            title={showLabels ? undefined : (isRtl ? "عامل" : "Agent")}>
            <Bot size={16} aria-hidden="true" />{showLabels && <span>{isRtl ? "عامل" : "Agent"}</span>}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-6 scrollbar-none" aria-label={isRtl ? "منوی فضای کاری" : "Workspace navigation"}>
          {isAgentMode ? (
            <div className="space-y-5">
              <div className="space-y-1">
                <button type="button" onClick={() => navigateTo("/dashboard/agent?new=" + Date.now())}
                  className={"w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold border border-transparent text-[var(--text-secondary)] hover:bg-[var(--muted-surface)] hover:text-[var(--text-primary)] " + (collapsed && !isMobileState ? "justify-center" : "")}
                  title={showLabels ? undefined : (isRtl ? "گفتگوی جدید" : "New conversation")}>
                  <Plus size={16} className="shrink-0" aria-hidden="true" />{showLabels && <span>{isRtl ? "گفتگوی جدید" : "New conversation"}</span>}
                </button>
                <button type="button" onClick={() => navigateTo("/dashboard/agent/skills")}
                  className={"w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold border border-transparent text-[var(--text-secondary)] hover:bg-[var(--muted-surface)] hover:text-[var(--text-primary)] " + (collapsed && !isMobileState ? "justify-center" : "")}
                  title={showLabels ? undefined : (isRtl ? "مهارت‌ها" : "Skills")}>
                  <BookOpen size={16} className="shrink-0" aria-hidden="true" />{showLabels && <span>{isRtl ? "مهارت‌ها" : "Skills"}</span>}
                </button>
              </div>
              <div className="border-t border-[var(--border)] pt-4 space-y-2">
                <div className={"flex items-center gap-2 px-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] " + (collapsed && !isMobileState ? "justify-center" : "")}>
                  <MessageSquareText size={14} aria-hidden="true" />{showLabels && <span>{isRtl ? "تاریخچه گفتگوها" : "Conversation history"}</span>}
                </div>
                {showLabels && <p className="px-3 py-2 text-[11px] leading-6 text-[var(--text-muted)]">{isRtl ? "گفتگوی ذخیره‌شده‌ای برای نمایش در تاریخچه وجود ندارد." : "There are no saved conversations to display yet."}</p>}
              </div>
            </div>
          ) : (
            dashboardNavigation.map((sec) => {
              if (sec.items.length === 0) return null;
              return (
                <div key={sec.id} className="space-y-2">
                  {showLabels ? (
                    <h3 className="px-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{isRtl ? sec.titleFa : sec.titleEn}</h3>
                  ) : (
                    <div className="h-px bg-[var(--border)] mx-2 my-4" />
                  )}
                  <div className="space-y-1">{renderNavItems(sec.items, isMobileState)}</div>
                </div>
              );
            })
          )}
        </nav>

        <div ref={accountMenuRef} className="relative p-3 border-t border-[var(--border)] bg-[rgba(15,23,42,0.15)] shrink-0">
          {accountMenuOpen && (
            <div className="absolute bottom-full left-2 right-2 mb-2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-2 shadow-2xl z-[120]" role="menu">
              <button type="button" role="menuitem" onClick={() => navigateTo("/profile")} className="w-full flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--muted-surface)] hover:text-[var(--text-primary)]">
                <UserCircle size={15} aria-hidden="true" />{isRtl ? "پروفایل کاربری" : "Account profile"}
              </button>
              <button type="button" role="menuitem" onClick={() => navigateTo("/dashboard/settings")} className="w-full flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--muted-surface)] hover:text-[var(--text-primary)]">
                <Settings size={15} aria-hidden="true" />{isRtl ? "تنظیمات فضای کاری" : "Workspace settings"}
              </button>
              <button type="button" role="menuitem" onClick={() => navigateTo("/dashboard/billing")} className="w-full flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--muted-surface)] hover:text-[var(--text-primary)]">
                <Receipt size={15} aria-hidden="true" />{isRtl ? "اشتراک و صورت‌حساب" : "Billing and subscription"}
              </button>
              <button type="button" role="menuitem" onClick={() => { closeMobileDrawer(); onHelpClick?.(); }} className="w-full flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--muted-surface)] hover:text-[var(--text-primary)]">
                <HelpCircle size={15} aria-hidden="true" />{isRtl ? "راهنما و پشتیبانی" : "Help and support"}
              </button>
              <div className="my-1 border-t border-[var(--border)]" />
              <button type="button" role="menuitem" onClick={async () => { closeMobileDrawer(); await logout(); }} className="w-full flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/10">
                <LogOut size={15} aria-hidden="true" />{isRtl ? "خروج از حساب" : "Sign out"}
              </button>
            </div>
          )}
          <button ref={accountTriggerRef} type="button"
            onClick={() => { if (collapsed && !isMobileState) setCollapsed(false); setAccountMenuOpen((open) => !open); }}
            className={"w-full flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white/[0.02] px-2.5 py-2 text-start hover:bg-[var(--muted-surface)] " + (showLabels ? "" : "justify-center")}
            aria-expanded={accountMenuOpen} aria-haspopup="menu"
            >
            <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--sky-blue-500)] to-[var(--orange-500)] text-white flex items-center justify-center text-xs font-bold uppercase shrink-0">
              {session.user?.name?.slice(0, 1) || (isRtl ? "ک" : "U")}
            </span>
            {!showLabels && <span className="sr-only">{accountName}, {accountEmail}</span>}
            {showLabels && <span className="min-w-0 flex-1">
              <span className="block text-xs font-black text-[var(--text-primary)] truncate">{accountName}</span>
              <span className="block text-[10px] text-[var(--text-muted)] truncate">{accountEmail}</span>
            </span>}
            {showLabels && <ChevronUp size={14} className="shrink-0 text-[var(--text-muted)]" aria-hidden="true" />}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* DESKTOP SIDEBAR CONTAINER (Hidden on Mobile <768px) */}
      <aside
        className={`hidden md:flex flex-col h-screen sticky top-0 bg-[var(--card)] border-r border-l border-[var(--border)] transition-all duration-300 shrink-0 z-30 select-none overflow-hidden
          ${collapsed ? "w-20" : "w-64 lg:w-72"}`}
        dir={direction}
        style={{ order: isRtl ? 0 : 1 }}
      >
        {renderSidebarContents(false)}

        {/* Collapse Button floating indicator on desktop */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`absolute bottom-20 -left-3 w-6 h-6 rounded-full bg-[var(--background)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center shadow-md cursor-pointer transition-transform duration-200 z-50`}
          aria-label={isRtl ? "تغییر عرض سایدبار" : "Toggle Sidebar Collapse"}
        >
          {collapsed ? (
            isRtl ? <ChevronLeft size={12} /> : <ChevronRight size={12} />
          ) : (
            isRtl ? <ChevronRight size={12} /> : <ChevronLeft size={12} />
          )}
        </button>
      </aside>

      {/* MOBILE DRAWER (Controlled by mobileOpen) */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-[100] md:hidden" dir={direction} ref={drawerRef} role="dialog" aria-modal="true" aria-label={isRtl ? "ناوبری" : "Navigation"}>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={closeMobileDrawer}
            />

            {/* Sliding Drawer Panel */}
            <motion.div
              initial={{ x: isRtl ? "100%" : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: isRtl ? "100%" : "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className={`absolute top-0 bottom-0 ${isRtl ? "right-0" : "left-0"} w-80 max-w-[85vw] bg-[var(--card)] border-r border-l border-[var(--border)] flex flex-col shadow-2xl overflow-hidden`}
            >
              {/* Close Button floating top inner */}
              <button
                onClick={closeMobileDrawer}
                className={`absolute top-4 ${isRtl ? "left-4" : "right-4"} p-1.5 rounded-full hover:bg-[var(--muted-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer outline-none focus:ring-1 focus:ring-[var(--sky-blue-500)]`}
                aria-label={isRtl ? "بستن منو" : "Close menu"}
              >
                <X size={16} />
              </button>

              {renderSidebarContents(true)}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
