"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ChevronDown,
  Globe2,
  Languages,
  Menu,
  Moon,
  Network,
  Radar,
  ShieldCheck,
  Sun,
  Target,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";

const copy = {
  en: {
    nav: ["Platform", "Intelligence", "Solutions", "Resources"],
    eyebrow: "THE INTELLIGENCE LAYER FOR SEARCH",
    hero: "Own the answer\nbefore it is asked.",
    sub: "Oxenn turns the invisible mechanics of AI search into your clearest growth advantage. Measure, shape, and defend how your brand is understood everywhere people search.",
    primary: "See Oxenn in action",
    secondary: "Explore the platform",
    trusted: "Trusted by teams building what’s next",
    twinLabel: "DIGITAL TWIN / LIVE",
    twinTitle: "Your brand,\nsimulated across\nevery answer engine.",
    twinSub: "A living intelligence model that sees what Google Analytics cannot: the reasons AI recommends you, ignores you, or gets you wrong.",
    view: "Open Digital Twin",
    intelligence: "The signal beneath the signal.",
    intelligenceSub: "One command center for visibility, authority, and the competitive context that changes it.",
    cta: "Make your brand impossible to miss.",
    ctaSub: "The next generation of search is already here. Build your advantage before the market catches up.",
    ctaButton: "Start your intelligence layer",
    footer: "© 2026 Oxenn Intelligence. Built for the answer era.",
  },
  fa: {
    nav: ["پلتفرم", "هوشمندی", "راهکارها", "منابع"],
    eyebrow: "لایه‌ی هوشمندی برای جست‌وجوی نسل جدید",
    hero: "قبل از پرسش،\nصاحب پاسخ باشید.",
    sub: "اکسن سازوکار نامرئی جست‌وجوی هوش مصنوعی را به مزیت روشن رشد شما تبدیل می‌کند؛ بسنجید، شکل دهید و از درک برندتان محافظت کنید.",
    primary: "اکسن را ببینید",
    secondary: "کاوش پلتفرم",
    trusted: "همراه تیم‌هایی که آینده را می‌سازند",
    twinLabel: "دوقلوی دیجیتال / زنده",
    twinTitle: "برند شما،\nشبیه‌سازی‌شده در\nهر موتور پاسخ.",
    twinSub: "مدل هوشمندی زنده‌ای که می‌بیند چرا هوش مصنوعی شما را پیشنهاد می‌دهد، نادیده می‌گیرد یا اشتباه می‌فهمد.",
    view: "باز کردن دوقلوی دیجیتال",
    intelligence: "سیگنالِ زیرِ سیگنال.",
    intelligenceSub: "یک مرکز فرمان برای دیده‌شدن، اعتبار و زمینه‌ی رقابتی که آن را تغییر می‌دهد.",
    cta: "برندتان را غیرقابل چشم‌پوشی کنید.",
    ctaSub: "نسل بعدی جست‌وجو همین حالا اینجاست. پیش از بازار، مزیت خود را بسازید.",
    ctaButton: "ساخت لایه‌ی هوشمندی",
    footer: "© ۲۰۲۶ اکسن اینتلیجنس. ساخته‌شده برای عصر پاسخ.",
  },
};

const signals = [
  { icon: Radar, title: "AI visibility", copy: "Track your share of voice across ChatGPT, Gemini, Claude, and Perplexity.", metric: "+38.4%", color: "cyan" },
  { icon: Network, title: "Entity authority", copy: "Build the knowledge graph that makes your brand legible to machines.", metric: "92/100", color: "violet" },
  { icon: Target, title: "Competitor radar", copy: "See exactly where rivals are winning the prompts that matter.", metric: "14 gaps", color: "orange" },
];

export default function MarketingLandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const isFa = locale === "fa";
  const t = isFa ? copy.fa : copy.en;
  const [dark, setDark] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSignal, setActiveSignal] = useState(0);

  return (
    <main className={`oxenn-site ${dark ? "oxenn-dark" : "oxenn-light"}`} dir={isFa ? "rtl" : "ltr"}>
      <div className="oxenn-noise" />
      <nav className="oxenn-nav" aria-label="Main navigation">
        <Link href={`/${locale}`} className="oxenn-mark" aria-label="Oxenn home"><span className="oxenn-mark-dot" />OXENN</Link>
        <div className="oxenn-nav-links">
          {t.nav.map((item) => <a key={item} href={`#${item.toLowerCase()}`}>{item}<ChevronDown size={12} /></a>)}
        </div>
        <div className="oxenn-nav-actions">
          <button className="icon-button" onClick={() => setDark(!dark)} aria-label="Toggle theme">{dark ? <Sun size={16} /> : <Moon size={16} />}</button>
          <Link className="lang-switch" href={`/${isFa ? "en" : "fa"}`}><Languages size={15} />{isFa ? "EN" : "فا"}</Link>
          <Link className="nav-cta" href={`/${locale}/register`}>Get started <ArrowUpRight size={15} /></Link>
          <button className="icon-button mobile-menu" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">{mobileOpen ? <X size={18} /> : <Menu size={18} />}</button>
        </div>
        {mobileOpen && <div className="mobile-links">{t.nav.map((item) => <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMobileOpen(false)}>{item}</a>)}</div>}
      </nav>

      <section className="oxenn-hero">
        <div className="hero-orb hero-orb-a" /><div className="hero-orb hero-orb-b" /><div className="hero-grid" />
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-pulse" />{t.eyebrow}</div>
          <h1>{t.hero.split("\n").map((line, i) => <span key={line} className={i === 1 ? "hero-gradient" : ""}>{line}</span>)}</h1>
          <p>{t.sub}</p>
          <div className="hero-buttons"><Link className="button-primary" href={`/${locale}/register`}>{t.primary}<ArrowUpRight size={17} /></Link><a className="button-ghost" href="#platform">{t.secondary}<span className="button-arrow">↓</span></a></div>
          <div className="hero-footnote"><ShieldCheck size={15} /> SOC 2-ready infrastructure <span /> No credit card required</div>
        </div>
        <div className="hero-visual" aria-label="Oxenn AI visibility preview">
          <div className="visual-glow" />
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="visibility-card glass-card">
            <div className="card-topline"><span>OXENN / SIGNAL MAP</span><span className="live-dot">LIVE</span></div>
            <div className="visibility-score"><div><span className="mini-label">AI VISIBILITY SCORE</span><strong>87.4</strong><small><TrendingUp size={12} /> +12.8% this month</small></div><div className="score-ring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="43" /><circle className="score-progress" cx="50" cy="50" r="43" /></svg><span>87%</span></div></div>
            <div className="chart-wrap"><div className="chart-labels"><span>SHARE OF VOICE</span><span>LAST 30 DAYS</span></div><svg className="line-chart" viewBox="0 0 500 130" preserveAspectRatio="none"><defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#52e5ff" stopOpacity=".3" /><stop offset="1" stopColor="#52e5ff" stopOpacity="0" /></linearGradient></defs><path className="chart-area" d="M0 111 C45 105 45 85 85 91 S120 105 150 74 S200 87 230 62 S270 78 303 48 S340 65 370 32 S420 48 455 18 S480 29 500 8 V130 H0Z" /><path className="chart-line" d="M0 111 C45 105 45 85 85 91 S120 105 150 74 S200 87 230 62 S270 78 303 48 S340 65 370 32 S420 48 455 18 S480 29 500 8" /></svg></div>
            <div className="source-row"><span><i className="source-dot cyan-dot" />ChatGPT</span><b>92%</b><span><i className="source-dot violet-dot" />Gemini</span><b>84%</b><span><i className="source-dot orange-dot" />Claude</span><b>78%</b></div>
          </div>
          <div className="floating-chip chip-one"><span className="chip-icon"><Zap size={14} /></span><div><small>NEW CITATION</small><strong>+2.4k mentions</strong></div></div>
          <div className="floating-chip chip-two"><span className="chip-icon purple"><Globe2 size={14} /></span><div><small>ENTITY HEALTH</small><strong>Excellent</strong></div></div>
        </div>
        <div className="hero-trusted"><span>{t.trusted}</span><div className="logo-row"><b>northstar<span>.</span></b><b>arc<span>°</span></b><b>meridian</b><b>vertex<span>+</span></b><b>lumen</b></div></div>
      </section>

      <section id="platform" className="twin-section">
        <div className="section-number">01 <span>/ 04</span></div>
        <div className="twin-copy"><div className="eyebrow">{t.twinLabel}</div><h2>{t.twinTitle.split("\n").map((line) => <span key={line}>{line}</span>)}</h2><p>{t.twinSub}</p><a className="text-link" href={`/${locale}/features`}>{t.view}<ArrowUpRight size={16} /></a></div>
        <div className="twin-visual"><div className="twin-backdrop" /><div className="twin-scanline" /><div className="twin-node node-center"><span>O</span><b>YOUR BRAND</b></div>{["AI SEARCH", "AUTHORITY", "CONTENT", "CITATIONS", "CONTEXT"].map((node, i) => <div key={node} className={`twin-node node-${i + 1}`}><span>{["◈", "✦", "◌", "↗", "⌁"][i]}</span><b>{node}</b></div>)}<div className="twin-connection connection-1" /><div className="twin-connection connection-2" /><div className="twin-connection connection-3" /><div className="twin-coordinates">34°03&apos;N &nbsp; 118°14&apos;W<br /><span>MODEL STATE / 2026.10.24</span></div></div>
      </section>

      <section id="intelligence" className="signals-section"><div className="section-intro"><div className="section-number">02 <span>/ 04</span></div><div><div className="eyebrow">THE OXENN INTELLIGENCE LAYER</div><h2>{t.intelligence}</h2><p>{t.intelligenceSub}</p></div></div><div className="signal-layout"><div className="signal-list">{signals.map((signal, i) => { const Icon = signal.icon; return <button key={signal.title} className={`signal-item ${activeSignal === i ? "active" : ""}`} onClick={() => setActiveSignal(i)}><span className={`signal-icon ${signal.color}`}><Icon size={19} /></span><span><b>{isFa ? ["دیده‌شدن هوش مصنوعی", "اعتبار موجودیت", "رادار رقبا"][i] : signal.title}</b><small>{isFa ? ["سهم صدای برند خود را در موتورهای هوش مصنوعی دنبال کنید.", "گراف دانشی بسازید که برندتان را برای ماشین‌ها قابل فهم کند.", "ببینید رقبا در کدام پرسش‌های مهم پیروز می‌شوند."][i] : signal.copy}</small></span><strong>{signal.metric}</strong></button> })}</div><div className="signal-preview"><div className="preview-header"><span>INTELLIGENCE / {String(activeSignal + 1).padStart(2, "0")}</span><span className="preview-period">LIVE FEED <i /></span></div><div className="radar-chart"><div className="radar-rings" /><div className="radar-cross cross-a" /><div className="radar-cross cross-b" /><div className="radar-sweep" /><div className="radar-point point-a" /><div className="radar-point point-b" /><div className="radar-point point-c" /><span className="radar-label label-a">YOU / 87</span><span className="radar-label label-b">RIVAL / 72</span><span className="radar-label label-c">RIVAL / 61</span></div><div className="preview-bottom"><span><i className="tiny-dot cyan-dot" />Semantic presence</span><span><i className="tiny-dot violet-dot" />Citation velocity</span><span><i className="tiny-dot orange-dot" />Market delta</span></div></div></div></section>

      <section className="quote-section"><div className="quote-mark">“</div><blockquote>Search is no longer a destination.<br /><em>It is an intelligence layer.</em></blockquote><div className="quote-meta"><span />Oxenn point of view <ArrowUpRight size={15} /></div></section>
      <section className="cta-section"><div className="cta-orbit" /><div className="eyebrow">THE ANSWER ERA IS HERE</div><h2>{t.cta}</h2><p>{t.ctaSub}</p><Link className="button-primary" href={`/${locale}/register`}>{t.ctaButton}<ArrowUpRight size={17} /></Link></section>
      <footer className="oxenn-footer"><Link href={`/${locale}`} className="oxenn-mark"><span className="oxenn-mark-dot" />OXENN</Link><span>{t.footer}</span><div><a href="#platform">Platform</a><a href={`/${locale}/contact`}>Contact</a><a href={`/${locale}/privacy`}>Privacy</a></div></footer>
    </main>
  );
}
