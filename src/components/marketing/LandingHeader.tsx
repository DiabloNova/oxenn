"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Languages, Menu, Moon, Sun, X, ArrowUpRight } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { getLandingContent } from "./landing-content";
import { MetallicBrandMark } from "./MetallicBrand";

export function LandingHeader() {
  const { language, setLanguage, theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const t = getLandingContent(language);
  const isHomepage = pathname === `/${language}` || pathname === `/${language}/`;
  const sectionHref = (hash: string) => isHomepage ? hash : `/${language}${hash}`;
  const navItems = [
    { label: t.nav.tracks, href: sectionHref("#tracks") },
    { label: t.nav.method, href: sectionHref("#approach") },
    { label: t.nav.offers, href: sectionHref("#offers") },
    { label: t.nav.evidence, href: sectionHref("#evidence") },
  ];
  const closeMenu = () => {
    setMobileOpen(false);
    toggleRef.current?.focus();
  };

  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  return (
    <header className="atlas-header">
      <a className="atlas-skip-link" href="#page-content">{t.nav.skipToContent}</a>
      <div className="atlas-header-inner">
        <Link className="atlas-brand" href={`/${language}`} aria-label="OXENN">
          <MetallicBrandMark size={38} priority /><span>OXENN</span>
        </Link>
        <nav className="atlas-desktop-nav" aria-label={t.nav.mainNavigationLabel}>
          {navItems.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
        </nav>
        <div className="atlas-header-actions">
          <button type="button" className="atlas-icon-button atlas-language-button" onClick={() => setLanguage(language === "fa" ? "en" : "fa")} aria-label={t.nav.switchLanguage}>
            <Languages size={16} aria-hidden="true" /><span>{language === "fa" ? "EN" : "فا"}</span>
          </button>
          <button type="button" className="atlas-icon-button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label={theme === "dark" ? t.nav.themeLight : t.nav.themeDark} title={theme === "dark" ? t.nav.themeLight : t.nav.themeDark}>
            {theme === "dark" ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
          </button>
          <Link className="atlas-header-login" href={`/${language}/login`}>{t.nav.login}</Link>
          <Link className="atlas-header-cta" href={`/${language}/register`}><span>{t.nav.signup}</span><ArrowUpRight size={15} aria-hidden="true" /></Link>
          <button ref={toggleRef} type="button" className="atlas-icon-button atlas-mobile-toggle" onClick={() => setMobileOpen((open) => !open)} aria-label={mobileOpen ? t.nav.closeMenu : t.nav.openMenu} aria-expanded={mobileOpen} aria-controls="atlas-mobile-navigation">
            {mobileOpen ? <X size={19} aria-hidden="true" /> : <Menu size={19} aria-hidden="true" />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <nav id="atlas-mobile-navigation" className="atlas-mobile-nav" aria-label={t.nav.mobileNavigationLabel}>
          {navItems.map((item) => <Link key={item.href} href={item.href} onClick={closeMenu}>{item.label}</Link>)}
          <Link href={`/${language}/login`} onClick={closeMenu}>{t.nav.login}</Link>
          <Link className="atlas-mobile-signup" href={`/${language}/register`} onClick={closeMenu}>{t.nav.signup}</Link>
        </nav>
      )}
    </header>
  );
}
