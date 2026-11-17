"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Moon, Sun, Languages, ChevronDown, Sparkles, LogIn, Menu } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { Dropdown } from "@/components/Dropdown";
import AppSidebar from "@/components/navigation/AppSidebar";

/**
 * Enterprise-grade Sticky navigation bar with advanced adjacent Hamburger selector and sliding drawer,
 * mapped to the product-first flow sections (Platform, Solutions, Comparison, Trust, Pricing, Docs, Resources).
 */
export function LandingHeader() {
  const { language, setLanguage, theme, setTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isFa = language === "fa";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solutionsItems = [
    { label: isFa ? "بهینه‌سازی GEO" : "GEO Optimization", value: "geo", href: `/${language}/solutions/geo` },
    { label: isFa ? "بهینه‌سازی پاسخ‌ها AEO" : "AEO Optimization", value: "aeo", href: `/${language}/solutions/aeo` },
    { label: isFa ? "محافظت از برند" : "Brand Protection", value: "protection", href: `/${language}/solutions/protection` },
    { label: isFa ? "رادار تحلیل رقابتی" : "Competitive Radar", value: "radar", href: `/${language}/solutions/radar` },
    { label: isFa ? "همه راهکارها" : "All Solutions", value: "solutions", href: `/${language}/solutions` },
  ];

  const platformItems = [
    { label: isFa ? "قابلیت‌های پلتفرم" : "Features", value: "features", href: `/${language}/features` },
    { label: isFa ? "صنایع هدف" : "Industries", value: "industries", href: `/${language}/industries` },
{ label: isFa ? "معماری اکوسیستم" : "Ecosystem Architecture", value: "ecosystem", href: `/${language}/#capabilities` },
  { label: isFa ? "بررسی کلان پلتفرم" : "Platform Overview", value: "overview", href: `/${language}/#platform` },
  { label: isFa ? "داستان چرخه محصول" : "Product Lifecycle Story", value: "story", href: `/${language}/#workflow` },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-50 px-3 sm:px-6 pt-3">
      {/* Outer Flex Container for Menu Button + Floating Navigation Bar */}
      <div className="mx-auto max-w-7xl flex items-center gap-3">
        {/* Navigation Menu Button - Perfectly adjacent and matches glassmorphism */}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label={isFa ? "باز کردن منوی ناوبری" : "Open navigation menu"}
          className={`h-16 w-16 flex items-center justify-center rounded-[var(--radius-full)] border transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] hover:border-[var(--sky-blue-500)]/40 focus:ring-2 focus:ring-[var(--sky-blue-500)]/20 cursor-pointer shrink-0 ${
            scrolled || true
              ? "glass-panel border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-md shadow-md text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              : "border-transparent bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          <Menu size={20} className="text-[var(--sky-blue-500)] hover:text-[var(--orange-500)] transition-colors duration-300" />
        </button>

        {/* Floating Navigation Bar - Reduced slightly on the left to fit the adjacent menu button */}
        <div
          className={`flex-1 flex items-center justify-between gap-3 rounded-[var(--radius-full)] px-3 sm:px-6 h-16 transition-all duration-300 ${
            scrolled || true
              ? "glass-panel border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-md shadow-md"
              : "border border-transparent bg-transparent"
          }`}
        >
          {/* Brand & Logo */}
          <Link
            href={`/${language}`}
            aria-label={isFa ? "صفحه نخست اوکسن" : "Oxenn homepage"}
            className="flex items-center gap-2 shrink-0 rounded-[var(--radius-md)] focus-visible:ring-2 focus-visible:ring-[var(--sky-blue-500)]/40 focus-visible:outline-none outline-none"
          >
            <span className="ox-brand-mark" aria-hidden="true">O</span>
            <span className="font-display text-sm font-bold tracking-wide text-[var(--text-primary)]">OXENN</span>
          </Link>

          {/* Enterprise-grade Nav Menu */}
          <nav className="hidden xl:flex items-center gap-2">
            {/* Platform Dropdown */}
            <Dropdown
              trigger={
                <button className="flex items-center gap-1 px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors rounded-[var(--radius-md)]">
                  <span>{isFa ? "پلتفرم" : "Platform"}</span>
                  <ChevronDown size={14} />
                </button>
              }
              items={platformItems.map((item) => ({
                label: item.label,
                value: item.value,
                onClick: () => { window.location.href = item.href; }
              }))}
            />

            {/* Solutions Dropdown */}
            <Dropdown
              trigger={
                <button className="flex items-center gap-1 px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors rounded-[var(--radius-md)]">
                  <span>{isFa ? "راهکارها" : "Solutions"}</span>
                  <ChevronDown size={14} />
                </button>
              }
              items={solutionsItems.map((item) => ({
                label: item.label,
                value: item.value,
                onClick: () => { window.location.href = item.href; }
              }))}
            />

            {/* Comparison table link */}
            <a
              href={`/${language}/#approach`}
              className="px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-[var(--radius-md)] transition-colors"
            >
              {isFa ? "رویکرد ما" : "Our approach"}
            </a>

            {/* Audit entry point */}
            <a
              href={`/${language}/#audit`}
              className="px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-[var(--radius-md)] transition-colors"
            >
              {isFa ? "ممیزی رایگان" : "Free audit"}
            </a>

            {/* Documentation Section (Opens in new browser tab) */}
            <Link
              href={`/${language}/docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-[var(--radius-md)] transition-colors flex items-center gap-1"
            >
              <span>{isFa ? "مستندات فنی" : "Documentation"}</span>
              <span className="text-[9px] bg-[var(--sky-blue-500)]/20 text-[var(--sky-blue-500)] px-1.5 py-0.5 rounded font-black font-mono">NEW</span>
            </Link>

            {/* Resources */}
            <Link
              href={`/${language}/resources`}
              className="px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-[var(--radius-md)] transition-colors"
            >
              {isFa ? "منابع" : "Resources"}
            </Link>

            {/* About */}
            <Link
              href={`/${language}/about`}
              className="px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-[var(--radius-md)] transition-colors"
            >
              {isFa ? "درباره ما" : "About"}
            </Link>

            {/* Contact */}
            <Link
              href={`/${language}/contact`}
              className="px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-[var(--radius-md)] transition-colors"
            >
              {isFa ? "تماس با ما" : "Contact"}
            </Link>
          </nav>

          {/* Global Configuration Controls + Toggles + CTA */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Language Toggle */}
            <button
              type="button"
              onClick={() => setLanguage(isFa ? "en" : "fa")}
              aria-label={isFa ? "Switch to English" : "تغییر به فارسی"}
              className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--muted-surface)] transition-colors text-xs font-bold border border-[var(--glass-border)]"
            >
              <Languages size={15} />
              <span className="font-mono">{isFa ? "EN" : "FA"}</span>
            </button>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label={theme === "dark" ? "حالت روشن" : "حالت تاریک"}
              className="grid place-items-center w-9 h-9 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--muted-surface)] border border-[var(--glass-border)] transition-colors"
            >
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Separator */}
            <span className="hidden sm:inline h-6 w-px bg-[var(--glass-border)]" />

            {/* Enterprise Action CTA Buttons */}
            <div className="flex items-center gap-2">
              <Link href={`/${language}/dashboard`}>
                <button className="px-4 h-9 text-xs font-bold rounded-[var(--radius-md)] border border-[var(--glass-border)] hover:bg-[var(--muted-surface)] text-[var(--text-primary)] transition-all flex items-center gap-1.5">
                  <LogIn size={14} />
                  <span>{isFa ? "ورود" : "Login"}</span>
                </button>
              </Link>

              <Link href={`/${language}/#audit`} className="hidden sm:inline-block">
                <button className="relative overflow-hidden group px-4 h-9 text-xs font-bold rounded-[var(--radius-md)] text-white bg-gradient-to-r from-[#38bdf8] to-[#f97316] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5">
                  <Sparkles size={13} className="animate-pulse" />
                  <span>{isFa ? "آنالیز رایگان" : "Free Audit"}</span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Reusable AppSidebar as the Global Sliding Drawer, sharing the exact category IA */}
      <AppSidebar mobileOpen={drawerOpen} setMobileOpen={setDrawerOpen} hideToggle={true} />
    </header>
  );
}
