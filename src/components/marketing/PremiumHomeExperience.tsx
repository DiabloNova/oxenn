"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity, ArrowRight, ArrowUpRight, BarChart3, BrainCircuit, ChevronRight,
  FileText, Home, Languages, LayoutDashboard, Menu, MessageSquareText, Moon,
  Phone, Search, Settings2, ShieldCheck, Sparkles, Sun, UserRound, UsersRound, X,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { SeorchableLogo } from "./SeorchableLogo";
import { HeroAccessCard } from "./HeroAccessCard";
import "./PremiumHomeExperience.css";

type NavigationItem = {
  id: string;
  label: string;
  href: string;
  keywords: string;
  icon: LucideIcon;
};

export function PremiumHomeExperience({ locale }: { locale: string }) {
  const isFa = locale === "fa";
  const { theme, setTheme, setLanguage } = useTheme();
  const pathname = usePathname() || "/" + locale;
  const router = useRouter();
  const rootPath = "/" + locale;
  const isHomepage = pathname === rootPath || pathname === rootPath + "/";
  const [searchOpen, setSearchOpen] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const copy = isFa
    ? {
        home: "صفحه اصلی", about: "درباره ما", contact: "تماس با ما", docs: "مستندات",
        dashboard: "پیشخوان", brand: "تحلیل برند", competitors: "رقبا", queries: "پرس‌وجوها",
        reports: "گزارش‌ها", settings: "تنظیمات", menuLabel: "منوی اصلی محصول",
        eyebrow: "هوشمندی برند در عصر هوش مصنوعی",
        headline: "ببینید هوش مصنوعی", headlineAccent: "درباره برند شما چه می‌گوید.",
        lead: "حضور برندتان را در پاسخ‌های هوش مصنوعی و جست‌وجو بررسی کنید، با رقبا مقایسه کنید و سیگنال‌های پراکنده را به اقدام‌های روشن تبدیل کنید.",
        primary: "شروع تحلیل رایگان", secondary: "کاوش در پلتفرم",
        proof: "جست‌وجوی سنتی، پاسخ‌های هوش مصنوعی و هوشمندی رقابتی؛ در یک نگاه",
        visibility: "دیده‌شدن برند", sample: "داده نمونه", score: "شاخص دیده‌شدن",
        trend: "روند سیگنال‌ها", platforms: "سهم پلتفرم‌های AI", topQueries: "پرس‌وجوهای نمونه",
        insight: "بینش هوشمند", opportunity: "فرصت‌های روشن‌تر",
        queryOne: "هوش مصنوعی درباره برند من چه می‌گوید؟",
        queryTwo: "بهترین برند در این حوزه کدام است؟",
        queryThree: "برند من در مقایسه با رقبا",
        scroll: "برای کشف بیشتر اسکرول کنید", search: "جستجو در Oxenn", workspaceAccess: "ورود به فضای کار", closeDialog: "بستن پنجره",
        noResults: "نتیجه‌ای پیدا نشد. عبارت دیگری را امتحان کنید.",
        language: "تغییر زبان به انگلیسی",
        themeLabel: theme === "dark" ? "تغییر به تم روشن" : "تغییر به تم تیره",
        sidebarTitle: "فضای هوشمندی برند",
        sampleNote: "مقادیر نمایشی هستند و از سرویس زنده دریافت نشده‌اند.",
      }
    : {
        home: "Home", about: "About us", contact: "Contact us", docs: "Documentation",
        dashboard: "Dashboard", brand: "Brand analysis", competitors: "Competitors",
        queries: "Queries", reports: "Reports", settings: "Settings", menuLabel: "Main product navigation",
        eyebrow: "AI-POWERED BRAND INTELLIGENCE",
        headline: "See what AI says", headlineAccent: "about your brand.",
        lead: "Understand where your brand appears across AI answers and search, compare with competitors, and turn scattered signals into your next clear move.",
        primary: "Start free analysis", secondary: "Explore the platform",
        proof: "Traditional search, AI answers, and competitor intelligence — connected",
        visibility: "Brand visibility", sample: "SAMPLE DATA", score: "VISIBILITY INDEX",
        trend: "Signal momentum", platforms: "AI platform share", topQueries: "Example queries",
        insight: "Smarter insights", opportunity: "Clearer opportunities",
        queryOne: "What does AI say about your brand?",
        queryTwo: "Best brand in this category",
        queryThree: "Your brand vs. competitors",
        scroll: "SCROLL TO EXPLORE", search: "Search Oxenn", workspaceAccess: "Workspace access", closeDialog: "Close dialog",
        noResults: "No matching destination. Try a different search.",
        language: "Switch language to Persian",
        themeLabel: theme === "dark" ? "Switch to light theme" : "Switch to dark theme",
        sidebarTitle: "AI brand intelligence",
        sampleNote: "Illustrative metrics only — not connected to live sources.",
      };

  const sidebarItems: NavigationItem[] = [
    { id: "dashboard", label: copy.dashboard, href: rootPath + "/dashboard", keywords: "workspace overview", icon: LayoutDashboard },
    { id: "brand", label: copy.brand, href: rootPath + "/dashboard/brand-monitoring", keywords: "brand audit identity intelligence برند تحلیل", icon: BrainCircuit },
    { id: "competitors", label: copy.competitors, href: rootPath + "/dashboard/competitors", keywords: "competition rivals market رقبا", icon: UsersRound },
    { id: "queries", label: copy.queries, href: rootPath + "/dashboard/query", keywords: "prompts questions search پرس و جو", icon: MessageSquareText },
    { id: "reports", label: copy.reports, href: rootPath + "/dashboard/reports", keywords: "analytics export گزارش", icon: BarChart3 },
    { id: "settings", label: copy.settings, href: rootPath + "/dashboard/settings", keywords: "preferences configuration تنظیمات", icon: Settings2 },
  ];
  const searchCatalog: NavigationItem[] = [
    { id: "home", label: copy.home, href: rootPath, keywords: "homepage start main خانه", icon: Home },
    { id: "analysis", label: copy.primary, href: rootPath + "#free-audit", keywords: "free audit website analysis ممیزی رایگان", icon: Activity },
    { id: "about", label: copy.about, href: rootPath + "/about", keywords: "company story درباره", icon: UserRound },
    { id: "contact", label: copy.contact, href: rootPath + "/contact", keywords: "email support تماس", icon: Phone },
    { id: "docs", label: copy.docs, href: rootPath + "/docs", keywords: "guides api help مستندات", icon: FileText },
    ...sidebarItems,
  ];

  const normalizedQuery = searchQuery.trim().toLocaleLowerCase(isFa ? "fa-IR" : "en-US");
  const searchResults = normalizedQuery
    ? searchCatalog
        .filter((item) => (item.label + " " + item.keywords).toLocaleLowerCase(isFa ? "fa-IR" : "en-US").includes(normalizedQuery))
        .slice(0, 5)
    : [];

  useEffect(() => {
    let animationFrame = 0;
    const onScroll = () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        const range = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        setScrollProgress(Math.min(1, window.scrollY / range));
        setScrolled(window.scrollY > 20);
        document.documentElement.style.setProperty("--oxen-wave-drift", Math.min(window.scrollY * 0.035, 32) + "px");
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const sections = Array.from(document.querySelectorAll<HTMLElement>(".ox-premium-page section:not(.oxen-hero-scene)"));
    sections.forEach((section) => section.classList.add("ox-scroll-reveal"));

    let observer: IntersectionObserver | undefined;
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer?.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08, rootMargin: "0px 0px -28px 0px" });
      sections.forEach((section) => observer?.observe(section));
    } else {
      sections.forEach((section) => section.classList.add("is-visible"));
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      observer?.disconnect();
      document.documentElement.style.removeProperty("--oxen-wave-drift");
    };
  }, []);

  useEffect(() => {
    if (!searchOpen && !accessOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSearchOpen(false);
        setSearchQuery("");
        setAccessOpen(false);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [searchOpen, accessOpen]);

  useEffect(() => {
    setSearchOpen(false);
    setSearchQuery("");
    setSidebarOpen(false);
    setAccessOpen(false);
  }, [pathname]);

  const isTopItemActive = (id: string) => {
    if (id === "home") return isHomepage;
    if (id === "about") return pathname === rootPath + "/about" || pathname.startsWith(rootPath + "/about/");
    if (id === "contact") return pathname === rootPath + "/contact" || pathname.startsWith(rootPath + "/contact/");
    return pathname === rootPath + "/docs" || pathname.startsWith(rootPath + "/docs/");
  };

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = searchResults[0];
    if (!result) return;
    router.push(result.href);
    setSearchOpen(false);
    setSearchQuery("");
  };

  const toggleLanguage = () => {
    const nextLocale = isFa ? "en" : "fa";
    const route = pathname.replace(/^\/(?:fa|en)(?=\/|$)/, "");
    setLanguage(nextLocale);
    router.push("/" + nextLocale + (route || ""));
  };

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="oxen-home-experience" dir={isFa ? "rtl" : "ltr"} lang={locale} data-theme={theme}>
      <div className="oxen-page-progress" aria-hidden="true" style={{ transform: "scaleX(" + scrollProgress + ")" }} />

      <aside className={"oxen-sidebar" + (sidebarOpen ? " is-open" : "")} aria-label={copy.menuLabel}>
        <div className="oxen-sidebar-head">
          <Link href={rootPath} aria-label={copy.home} className="oxen-sidebar-logo">
            <SeorchableLogo className="oxen-sidebar-logo-mark" />
          </Link>
          <span className="oxen-sidebar-kicker">{copy.sidebarTitle}</span>
        </div>

        <nav className="oxen-sidebar-menu" aria-label={isFa ? "بخش‌های محصول" : "Product sections"}>
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.id}
                href={item.href}
                className={"oxen-sidebar-link" + (active ? " is-active" : "")}
                title={item.label}
                aria-current={active ? "page" : undefined}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
                <ChevronRight size={14} className="oxen-sidebar-chevron" aria-hidden="true" />
              </Link>
            );
          })}
        </nav>

        <div className="oxen-sidebar-footer">
          <div className="oxen-sidebar-brand">
            <span className="oxen-sidebar-brand-icon"><Activity size={17} aria-hidden="true" /></span>
            <span><b>Oxenn</b><small>{copy.sidebarTitle}</small></span>
          </div>
          <div className="oxen-sidebar-controls" aria-label={isFa ? "تنظیمات نمایش" : "Display controls"}>
            <button type="button" onClick={toggleTheme} title={copy.themeLabel} aria-label={copy.themeLabel}>
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button type="button" onClick={toggleLanguage} title={copy.language} aria-label={copy.language}>
              <Languages size={16} /><span>{isFa ? "EN" : "فا"}</span>
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          className="oxen-sidebar-scrim"
          aria-label={isFa ? "بستن منو" : "Close menu"}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <header className={"oxen-floating-nav" + (scrolled ? " is-scrolled" : "") + (searchOpen ? " is-searching" : "")}>
        <button
          type="button"
          className="oxen-mobile-menu"
          aria-label={sidebarOpen ? (isFa ? "بستن منو" : "Close menu") : (isFa ? "باز کردن منو" : "Open menu")}
          aria-expanded={sidebarOpen}
          onClick={() => setSidebarOpen((open) => !open)}
        >
          {sidebarOpen ? <X size={19} /> : <Menu size={19} />}
        </button>

        <Link href={rootPath} aria-label={isFa ? "لوگوی صفحه اصلی Oxenn" : "Oxenn home"} className="oxen-nav-logo">
          <SeorchableLogo className="oxen-nav-logo-mark" />
        </Link>

        {!searchOpen ? (
          <nav className="oxen-top-nav" aria-label={isFa ? "ناوبری عمومی سایت" : "Main site navigation"}>
            {[
              { id: "home", label: copy.home, href: rootPath, icon: Home },
              { id: "about", label: copy.about, href: rootPath + "/about", icon: UserRound },
              { id: "contact", label: copy.contact, href: rootPath + "/contact", icon: Phone },
              { id: "docs", label: copy.docs, href: rootPath + "/docs", icon: FileText },
            ].map((item) => {
              const Icon = item.icon;
              const active = isTopItemActive(item.id);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={"oxen-top-nav-link" + (active ? " is-active" : "")}
                  title={item.label}
                  data-tooltip={item.label}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
                  <span className="oxen-active-dot" aria-hidden="true" />
                </Link>
              );
            })}
          </nav>
        ) : (
          <form className="oxen-search-form" role="search" onSubmit={submitSearch}>
            <Search size={19} aria-hidden="true" />
            <input
              autoFocus
              type="search"
              role="searchbox"
              aria-label={copy.search}
              placeholder={copy.search + "..."}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            {searchQuery.trim() && <span className="oxen-search-count" aria-live="polite">{searchResults.length}</span>}
            {searchQuery.trim() && (
              <div className="oxen-search-results">
                {searchResults.length ? searchResults.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.id} href={item.href} onClick={() => { setSearchOpen(false); setSearchQuery(""); }}>
                      <Icon size={16} aria-hidden="true" /><span>{item.label}</span><ArrowUpRight size={14} aria-hidden="true" />
                    </Link>
                  );
                }) : <p>{copy.noResults}</p>}
              </div>
            )}
          </form>
        )}

        <div className="oxen-nav-actions">
          {!searchOpen ? (
            <button type="button" className="oxen-search-trigger" onClick={() => setSearchOpen(true)} aria-label={copy.search} title={copy.search}>
              <Search size={20} strokeWidth={1.8} aria-hidden="true" />
            </button>
          ) : (
            <button type="button" className="oxen-search-trigger is-close" onClick={() => { setSearchOpen(false); setSearchQuery(""); }} aria-label={isFa ? "بستن جستجو" : "Close search"} title={isFa ? "بستن جستجو" : "Close search"}>
              <X size={20} aria-hidden="true" />
            </button>
          )}
        </div>
      </header>

      <section className="oxen-hero-scene" id="top">
        <div className="oxen-hero-content">
          <div className="oxen-hero-copy">
            <div className="oxen-eyebrow"><span className="oxen-eyebrow-mark"><Sparkles size={14} /></span>{copy.eyebrow}</div>
            <h1>{copy.headline}<span>{copy.headlineAccent}</span></h1>
            <p className="oxen-hero-lede">{copy.lead}</p>
            <div className="oxen-hero-actions">
              <button type="button" className="oxen-primary-cta" onClick={() => scrollTo("free-audit")}>
                <span>{copy.primary}</span><ArrowRight size={17} className="oxen-directional-arrow" aria-hidden="true" />
              </button>
              <button type="button" className="oxen-secondary-cta" onClick={() => scrollTo("dashboards")}>
                <span>{copy.secondary}</span><span className="oxen-secondary-arrow">↘</span>
              </button>
            </div>
            <button type="button" className="oxen-workspace-link" onClick={() => setAccessOpen(true)}>
              <UserRound size={14} aria-hidden="true" /><span>{copy.workspaceAccess}</span><ArrowUpRight size={13} aria-hidden="true" />
            </button>
            <div className="oxen-hero-proof"><ShieldCheck size={17} aria-hidden="true" /><span>{copy.proof}</span></div>
            <div className="oxen-scroll-cue"><span>01</span><i /><span>04</span><small>{copy.scroll}</small></div>
          </div>

          <div className="oxen-product-stage" aria-label={isFa ? "پیش‌نمایش مفهومی پیشخوان هوشمندی برند" : "Illustrative brand intelligence dashboard preview"}>
            <div className="oxen-stage-orbit orbit-one" aria-hidden="true" />
            <div className="oxen-stage-orbit orbit-two" aria-hidden="true" />
            <div className="oxen-floating-insight">
              <span className="oxen-insight-spark"><Sparkles size={19} /></span>
              <span><b>{copy.insight}</b><small>{copy.opportunity}</small></span>
              <ArrowRight size={17} aria-hidden="true" />
            </div>

            <div className="oxen-glass-dashboard">
              <div className="oxen-dashboard-heading">
                <div className="oxen-dashboard-title">
                  <span className="oxen-dashboard-icon"><Activity size={16} aria-hidden="true" /></span>
                  <span><b>{copy.visibility}</b><small>yourbrand.com</small></span>
                </div>
                <span className="oxen-sample-badge"><i />{copy.sample}</span>
              </div>
              <div className="oxen-dashboard-topline">
                <div><span>{copy.score}</span><div className="oxen-main-score">74<small>/100</small></div></div>
                <div className="oxen-growth-badge"><b>+24%</b><small>{isFa ? "نمونه · ۳۰ روز" : "sample · 30 days"}</small></div>
              </div>
              <div className="oxen-chart-legend">
                <span><i className="legend-teal" />ChatGPT</span>
                <span><i className="legend-blue" />Gemini</span>
                <span><i className="legend-purple" />Perplexity</span>
              </div>
              <div className="oxen-chart-wrap">
                <svg viewBox="0 0 520 154" preserveAspectRatio="none" role="img" aria-label={isFa ? "نمودار نمایشی روند دیده‌شدن برند" : "Illustrative brand visibility trend chart"}>
                  <defs><linearGradient id="oxen-chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#26b8ad" stopOpacity=".25" /><stop offset="100%" stopColor="#26b8ad" stopOpacity="0" /></linearGradient></defs>
                  {[25, 60, 95, 130].map((y) => <line key={y} x1="4" y1={y} x2="516" y2={y} className="oxen-chart-gridline" />)}
                  <path d="M4 124 C28 116 43 98 67 109 S99 79 123 88 S154 92 177 71 S210 86 235 67 S268 38 294 57 S325 70 349 41 S384 49 409 32 S444 41 470 22 S497 21 516 10 L516 146 L4 146Z" fill="url(#oxen-chart-fill)" />
                  <path className="oxen-chart-line line-teal" d="M4 124 C28 116 43 98 67 109 S99 79 123 88 S154 92 177 71 S210 86 235 67 S268 38 294 57 S325 70 349 41 S384 49 409 32 S444 41 470 22 S497 21 516 10" />
                  <path className="oxen-chart-line line-blue" d="M4 133 C27 126 46 128 68 115 S103 111 126 100 S163 108 183 92 S218 105 242 91 S279 79 299 87 S334 66 353 78 S388 67 410 56 S445 67 467 51 S497 48 516 38" />
                  <path className="oxen-chart-line line-purple" d="M4 140 C32 137 45 129 67 132 S104 117 129 126 S162 115 184 120 S222 96 245 107 S278 98 300 103 S337 86 357 94 S387 81 412 88 S446 68 468 77 S494 64 516 62" />
                  <circle cx="349" cy="41" r="4" className="oxen-chart-point" /><circle cx="349" cy="41" r="9" className="oxen-chart-point-halo" />
                </svg>
              </div>
              <div className="oxen-chart-axis"><span>Apr 10</span><span>Apr 17</span><span>Apr 24</span><span>May 1</span><span>May 8</span></div>
              <div className="oxen-dashboard-lower">
                <div className="oxen-platform-share">
                  <b>{copy.platforms}</b>
                  <div className="oxen-share-content">
                    <div className="oxen-donut" aria-label="Illustrative platform share"><span>AI</span></div>
                    <div className="oxen-share-legend">
                      <span><i className="legend-teal" />ChatGPT <b>42%</b></span>
                      <span><i className="legend-blue" />Gemini <b>34%</b></span>
                      <span><i className="legend-purple" />Perplexity <b>24%</b></span>
                    </div>
                  </div>
                </div>
                <div className="oxen-top-queries">
                  <b>{copy.topQueries}</b>
                  <div><span>1</span><p>{copy.queryOne}</p><small>12.4%</small><ChevronRight size={13} /></div>
                  <div><span>2</span><p>{copy.queryTwo}</p><small>9.8%</small><ChevronRight size={13} /></div>
                  <div><span>3</span><p>{copy.queryThree}</p><small>7.1%</small><ChevronRight size={13} /></div>
                </div>
              </div>
              <div className="oxen-dashboard-foot"><span><i />{copy.sampleNote}</span><ArrowUpRight size={14} aria-hidden="true" /></div>
            </div>
          </div>
        </div>
      </section>
      {accessOpen && (
        <div className="oxen-access-overlay">
          <button type="button" className="oxen-access-backdrop" aria-label={copy.closeDialog} onClick={() => setAccessOpen(false)} />
          <div className="oxen-access-dialog" role="dialog" aria-modal="true" aria-label={copy.workspaceAccess}>
            <button type="button" className="oxen-access-close" autoFocus aria-label={copy.closeDialog} onClick={() => setAccessOpen(false)}><X size={18} /></button>
            <HeroAccessCard locale={locale} />
          </div>
        </div>
      )}
    </div>
  );
}
