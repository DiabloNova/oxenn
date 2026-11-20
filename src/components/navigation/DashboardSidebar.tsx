"use client";

import React, { useCallback, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/components/AuthProvider";
import { dashboardNavigation, isDashboardRouteActive } from "@/config/dashboardNavigation";
import { notifyNavigationStart } from "@/lib/navigation-transition";
import Sidebar, { type SidebarSection } from "@/components/oxenn-library/sidebar/Sidebar";
import { MetallicBrandMark } from "@/components/marketing/MetallicBrand";

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
  onHelpClick,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { language, direction } = useTheme();
  const { session, logout } = useAuth();

  const sections = useMemo<SidebarSection[]>(() => [
    {
      id: "overview",
      label: language === "fa" ? "داشبورد" : "Dashboard",
      items: [{
        id: "dashboard-home",
        label: language === "fa" ? "نمای کلی" : "Overview",
        href: "/dashboard",
        icon: LayoutDashboard,
        exact: true,
      }],
    },
    ...dashboardNavigation.map((section) => ({
      id: section.id,
      label: language === "fa" ? section.titleFa : section.titleEn,
      items: section.items.map((item) => ({
        id: item.id,
        label: language === "fa" ? item.labelFa : item.labelEn,
        href: item.href ?? "",
        icon: item.icon,
        exact: item.exact,
      })),
    })),
  ], [language]);

  const activeId = useMemo(() => {
    for (const section of sections) {
      const activeItem = section.items.find((item) =>
        isDashboardRouteActive(pathname, item.href, language, item.exact),
      );
      if (activeItem) return activeItem.id;
    }
    return "dashboard-home";
  }, [language, pathname, sections]);

  const navigate = useCallback((href: string) => {
    if (!href) return;
    if (href === "#help") {
      onHelpClick?.();
      setMobileOpen(false);
      return;
    }
    if (href.startsWith("#")) return;
    const destination = `/${language}${href.startsWith("/") ? href : `/${href}`}`;
    if (destination !== pathname) {
      notifyNavigationStart(destination);
      router.push(destination);
    }
    setMobileOpen(false);
  }, [language, onHelpClick, pathname, router, setMobileOpen]);

  const handleLogout = useCallback(async () => {
    setMobileOpen(false);
    await logout();
  }, [logout, setMobileOpen]);

  const profileName = session.user?.name || (language === "fa" ? "حساب کاربری" : "Your account");
  const profileSubtitle = session.user?.email || (language === "fa" ? "حساب OXENN" : "OXENN account");
  const profileInitial = session.user?.name?.slice(0, 1) || "O";

  const commonProps = {
    sections,
    activeId,
    brandContent: <MetallicBrandMark size={29} />,
    profileName,
    profileSubtitle,
    profileInitial,
    menuLabel: language === "fa" ? "منوی داشبورد" : "Dashboard menu",
    searchPlaceholder: language === "fa" ? "جستجو در منو..." : "Search dashboard...",
    helpLabel: language === "fa" ? "راهنما و پشتیبانی" : "Help & support",
    settingsLabel: language === "fa" ? "تنظیمات فضای کاری" : "Workspace settings",
    accountLabel: language === "fa" ? "حساب کاربری" : "My account",
    logoutLabel: language === "fa" ? "خروج از حساب" : "Sign out",
    closeLabel: language === "fa" ? "بستن منو" : "Close menu",
    direction,
    onNavigate: (href: string) => navigate(href),
    onHelpClick: () => { onHelpClick?.(); setMobileOpen(false); },
    onSettingsClick: () => navigate("/dashboard/settings"),
    onProfileClick: () => navigate("/dashboard/profile"),
    onLogout: handleLogout,
  };

  return (
    <>
      <div className="hidden lg:flex shrink-0 items-center px-2 py-3">
        <Sidebar
          {...commonProps}
          expanded={!collapsed}
          onExpandedChange={(expanded) => setCollapsed(!expanded)}
          style={{ height: "calc(100dvh - 24px)" }}
        />
      </div>
      {mobileOpen && (
        <div className="fixed inset-0 z-[130] lg:hidden" role="dialog" aria-modal="true" aria-label={commonProps.menuLabel}>
          <button type="button" className="absolute inset-0 h-full w-full bg-slate-950/45 backdrop-blur-[2px]" aria-label={commonProps.closeLabel} onClick={() => setMobileOpen(false)} />
          <div className={`relative z-10 flex h-full items-center p-3 ${direction === "rtl" ? "justify-end" : "justify-start"}`}>
            <Sidebar
              {...commonProps}
              expanded
              onExpandedChange={(expanded) => { if (!expanded) setMobileOpen(false); }}
              style={{ height: "calc(100dvh - 24px)", maxWidth: "calc(100vw - 24px)" }}
            />
          </div>
        </div>
      )}
    </>
  );
}
