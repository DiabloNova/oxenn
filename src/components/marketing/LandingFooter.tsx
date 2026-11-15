"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { getLandingContent } from "./landing-content";

export function LandingFooter() {
  const { language } = useTheme();
  const t = getLandingContent(language);

  return (
    <footer className="atlas-footer" id="about">
      <div className="atlas-container">
        <div className="atlas-footer-main">
          <div className="atlas-footer-brand-block">
            <Link className="atlas-brand atlas-footer-brand" href={"/" + language} aria-label="OXENN">
              <Image src="/icon.svg" alt="" width={36} height={36} /><span>OXENN</span>
            </Link>
            <p>{t.footer.description}</p>
          </div>
          <nav className="atlas-footer-nav" aria-label={language === "fa" ? "پیوندهای پایین صفحه" : "Footer navigation"}>
            <div><h2>{t.footer.tracks}</h2><a href="#tracks">{t.nav.tracks}</a><a href="#approach">{t.nav.method}</a><a href="#offers">{t.nav.offers}</a></div>
            <div><h2>{t.footer.principles}</h2><a href="#evidence">{t.nav.evidence}</a><a href="#about">{language === "fa" ? "درباره OXENN" : "About OXENN"}</a></div>
            <div><h2>{t.footer.account}</h2><Link href={"/" + language + "/login"}>{t.nav.login}</Link><Link href={"/" + language + "/register"}>{t.nav.signup}<ArrowUpRight size={13} aria-hidden="true" /></Link></div>
          </nav>
        </div>
        <div className="atlas-footer-bottom"><span>OXENN. {t.footer.copyright}</span><span>{t.footer.strapline}</span></div>
      </div>
    </footer>
  );
}
