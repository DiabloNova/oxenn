"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Languages, Menu, Moon, Sun, X, ArrowUpRight } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { getLandingContent } from "./landing-content";

export function LandingHeader() {
  const { language, setLanguage, theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = getLandingContent(language);
  const navItems = [
    { label: t.nav.tracks, href: "#tracks" },
    { label: t.nav.method, href: "#approach" },
    { label: t.nav.offers, href: "#offers" },
    { label: t.nav.evidence, href: "#evidence" },
  ];
  const closeMenu = () => setMobileOpen(false);

  return (
    <header className="atlas-header">
      <a className="atlas-skip-link" href="#main-content">{language === "fa" ? "رفتن به محتوای اصلی" : "Skip to main content"}</a>
      <div className="atlas-header-inner">
        <Link className="atlas-brand" href={"/" + language} aria-label="OXENN">
          <Image src="/icon.svg" alt="" width={38} height={38} priority /><span>OXENN</span>
        </Link>
        <nav className="atlas-desktop-nav" aria-label={language === "fa" ? "ناوبری اصلی" : "Main navigation"}>
          {navItems.map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}
        </nav>
        <div className="atlas-header-actions">
          <button type="button" className="atlas-icon-button atlas-language-button" onClick={() => setLanguage(language === "fa" ? "en" : "fa")} aria-label={t.nav.switchLanguage}>
            <Languages size={16} aria-hidden="true" /><span>{language === "fa" ? "EN" : "فا"}</span>
          </button>
          <button type="button" className="atlas-icon-button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label={theme === "dark" ? t.nav.themeLight : t.nav.themeDark} title={theme === "dark" ? t.nav.themeLight : t.nav.themeDark} aria-pressed={theme === "dark"}>
            {theme === "dark" ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
          </button>
          <Link className="atlas-header-cta" href={"/" + language + "/register"}><span>{t.nav.signup}</span><ArrowUpRight size={15} aria-hidden="true" /></Link>
          <button type="button" className="atlas-icon-button atlas-mobile-toggle" onClick={() => setMobileOpen((open) => !open)} aria-label={mobileOpen ? t.nav.closeMenu : t.nav.openMenu} aria-expanded={mobileOpen} aria-controls="atlas-mobile-navigation">
            {mobileOpen ? <X size={19} aria-hidden="true" /> : <Menu size={19} aria-hidden="true" />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <nav id="atlas-mobile-navigation" className="atlas-mobile-nav" aria-label={language === "fa" ? "ناوبری موبایل" : "Mobile navigation"}>
          {navItems.map((item) => <a key={item.href} href={item.href} onClick={closeMenu}>{item.label}</a>)}
          <Link href={"/" + language + "/login"} onClick={closeMenu}>{t.nav.login}</Link>
          <Link className="atlas-mobile-signup" href={"/" + language + "/register"} onClick={closeMenu}>{t.nav.signup}</Link>
        </nav>
      )}
    </header>
  );
}
