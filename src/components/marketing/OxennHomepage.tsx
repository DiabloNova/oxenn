"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  ArrowDown, ArrowRight, ArrowUpRight, BarChart3, Check, ChevronRight,
  CircleDot, Compass, Eye, Globe2, Layers3, Network, ShieldCheck, Sparkles,
  Target, Workflow,
} from "lucide-react";
import { LandingHeader } from "@/components/marketing/LandingHeader";
import { LandingFooter } from "@/components/marketing/LandingFooter";
import { FreeAuditPanel } from "@/components/features/audit/FreeAuditPanel";

const copy = {
  en: {
    eyebrow: "PRODUCT & MARKET IMPROVEMENT INTELLIGENCE",
    title: <>See the whole picture.<br /><span>Move with clarity.</span></>,
    intro: "Oxenn connects what you know about your product with what the market can see—turning evidence into a more confident next move.",
    primary: "Explore the platform", secondary: "Try the audit preview", note: "Built for teams making consequential decisions.",
    signal: "SIGNAL ATLAS", overview: "A living picture of your product in the market.",
    overviewText: "Bring product context, digital presence, and market evidence into one view. See what is known, where the gaps are, and what deserves attention next.",
    preview: "Illustrative product preview · Sample data", profile: "Product profile", evidence: "Evidence map", opportunity: "Priority opportunity", discover: "Digital discovery", product: "Product value", market: "Market context", score: "Evidence coverage", scoreValue: "78%", trend: "Signals connected", trendValue: "24", finding: "A clear story earns attention.", findingText: "Your product detail pages describe features well. Customer outcomes could be easier to verify.", action: "Strengthen proof points", confidence: "Confidence", confidenceValue: "High",
    gapLabel: "FROM SIGNALS TO BETTER DECISIONS", gapTitle: <>Your product is more than<br />its search result.</>, gapText: "A stronger market position starts with understanding the full context—not just a single ranking or score.", gapOne: "What people can find", gapOneText: "Content, technical signals, answers, and the sources that represent your product online.", gapTwo: "What people understand", gapTwoText: "How clearly your value, differentiators, and proof show up across relevant experiences.", gapThree: "What to improve next", gapThreeText: "A grounded view of what is missing, why it matters, and which move is worth considering.",
    workflowLabel: "A CONNECTED IMPROVEMENT CYCLE", workflowTitle: "From understanding to action.", workflowText: "One considered workflow connects the evidence to decisions—without confusing a recommendation with an outcome.", steps: ["Build the product picture", "Assess the evidence", "Find the meaningful gap", "Prioritize a next move"], stepTexts: ["Capture your product, goals, audience, and markets.", "Review discoverability, product signals, and source coverage.", "Compare what is observed with what you want to achieve.", "Turn supported findings into a focused improvement plan."],
    capabilitiesLabel: "ONE PLATFORM. USEFUL PERSPECTIVE.", capabilitiesTitle: "The context behind the next move.", capabilitiesText: "Bring the disciplines that shape digital discovery and product competitiveness into a coherent view.", capabilities: [{ title: "Digital visibility", text: "Understand how your product is surfaced in search and answer experiences.", icon: Eye }, { title: "Product intelligence", text: "Keep product context, goals, and observed evidence connected.", icon: Layers3 }, { title: "Market perspective", text: "Put relevant alternatives and market signals in context.", icon: Compass }, { title: "Evidence graph", text: "Trace findings back to the sources and relationships behind them.", icon: Network }, { title: "Improvement planning", text: "Prioritize considered next steps with clear ownership and intent.", icon: Workflow }, { title: "Governed decisions", text: "Keep review, approval, and execution distinct from AI suggestions.", icon: ShieldCheck }],
    auditLabel: "A FIRST LOOK", auditTitle: "Start with a small signal.", auditText: "Explore a sample technical audit to see how structured findings can become a clearer picture. This preview uses synthetic data and does not crawl a website.", auditDisclaimer: "Illustrative preview · No website is crawled · No live provider data", auditAction: "Open your workspace", closing: "Better decisions begin with a clearer picture.", closingText: "Give your team the context to understand where you stand—and choose what to do next.", closingAction: "Get started", footer: "Product intelligence, made actionable.",
  },
  fa: {
    eyebrow: "هوشمندی محصول و بهبود بازار",
    title: <>تصویر کامل را ببینید.<br /><span>با اطمینان حرکت کنید.</span></>,
    intro: "اوکسن شناخت شما از محصول را به آنچه بازار می‌بیند پیوند می‌دهد؛ تا شواهد به تصمیم بعدی مطمئن‌تری تبدیل شوند.",
    primary: "کاوش پلتفرم", secondary: "مشاهده پیش‌نمایش ممیزی", note: "برای تیم‌هایی که تصمیم‌های مهم می‌گیرند.",
    signal: "اطلس سیگنال", overview: "تصویری زنده از جایگاه محصول در بازار.",
    overviewText: "شناخت محصول، حضور دیجیتال و شواهد بازار را در یک نما ببینید؛ آنچه می‌دانیم، فاصله‌ها و اولویت بعدی.",
    preview: "پیش‌نمایش محصول · داده نمونه", profile: "شناخت محصول", evidence: "نقشه شواهد", opportunity: "فرصت اولویت‌دار", discover: "کشف دیجیتال", product: "ارزش محصول", market: "بافت بازار", score: "پوشش شواهد", scoreValue: "۷۸٪", trend: "سیگنال‌های پیوندخورده", trendValue: "۲۴", finding: "روایت روشن، توجه می‌سازد.", findingText: "صفحات محصول ویژگی‌ها را خوب شرح می‌دهند؛ اثبات نتایج مشتری می‌تواند روشن‌تر باشد.", action: "تقویت شواهد محصول", confidence: "اطمینان", confidenceValue: "بالا",
    gapLabel: "از سیگنال تا تصمیم بهتر", gapTitle: <>محصول شما، بزرگ‌تر از<br />یک نتیجه جست‌وجوست.</>, gapText: "جایگاه قوی‌تر در بازار با شناخت زمینه کامل آغاز می‌شود؛ نه تنها یک رتبه یا امتیاز.", gapOne: "آنچه پیدا می‌شود", gapOneText: "محتوا، نشانه‌های فنی، پاسخ‌ها و منابعی که محصول شما را در فضای دیجیتال معرفی می‌کنند.", gapTwo: "آنچه درک می‌شود", gapTwoText: "وضوح ارزش، تمایزها و شواهد محصول در تجربه‌های مرتبط.", gapThree: "گام بعدی بهبود", gapThreeText: "شناخت مستند آنچه کم است، اهمیت آن و اقدامی که ارزش بررسی دارد.",
    workflowLabel: "چرخه پیوسته بهبود", workflowTitle: "از شناخت تا اقدام.", workflowText: "جریانی سنجیده شواهد را به تصمیم وصل می‌کند؛ بدون یکی دانستن پیشنهاد و نتیجه.", steps: ["ساخت تصویر محصول", "ارزیابی شواهد", "یافتن فاصله مهم", "اولویت‌بندی گام بعد"], stepTexts: ["محصول، هدف‌ها، مخاطب و بازار را مشخص کنید.", "کشف‌پذیری، نشانه‌های محصول و پوشش منابع را بررسی کنید.", "وضعیت مشاهده‌شده را با هدف موردنظر مقایسه کنید.", "یافته‌های پشتیبانی‌شده را به برنامه بهبود تبدیل کنید."],
    capabilitiesLabel: "یک پلتفرم، دیدی کاربردی", capabilitiesTitle: "زمینه‌ای برای گام بعدی.", capabilitiesText: "حوزه‌های مؤثر بر کشف دیجیتال و رقابت‌پذیری محصول را در یک نمای منسجم کنار هم بیاورید.", capabilities: [{ title: "دیده‌شدن دیجیتال", text: "نحوه نمایش محصول در جست‌وجو و تجربه‌های پاسخ‌محور را بشناسید.", icon: Eye }, { title: "هوشمندی محصول", text: "شناخت محصول، هدف‌ها و شواهد را به هم پیوند دهید.", icon: Layers3 }, { title: "دیدگاه بازار", text: "گزینه‌های جایگزین و سیگنال‌های بازار را در بافت خود ببینید.", icon: Compass }, { title: "گراف شواهد", text: "یافته‌ها را تا منابع و روابط پشتیبان دنبال کنید.", icon: Network }, { title: "برنامه‌ریزی بهبود", text: "گام‌های بعدی را با هدف و مسئولیت روشن اولویت‌بندی کنید.", icon: Workflow }, { title: "تصمیم‌گیری مسئولانه", text: "بازبینی، تأیید و اجرا را از پیشنهادهای هوش مصنوعی جدا نگه دارید.", icon: ShieldCheck }],
    auditLabel: "نگاهی در آغاز", auditTitle: "با یک سیگنال شروع کنید.", auditText: "ممیزی فنی نمونه را ببینید و با شیوه تبدیل یافته‌های ساختاریافته به تصویری روشن‌تر آشنا شوید. این پیش‌نمایش داده ساختگی دارد و وب‌سایتی را خزش نمی‌کند.", auditDisclaimer: "پیش‌نمایش نمونه · بدون خزش وب‌سایت · بدون داده زنده", auditAction: "ورود به فضای کار", closing: "تصویر روشن‌تر، آغاز تصمیم بهتر است.", closingText: "زمینه لازم را در اختیار تیم خود بگذارید تا جایگاه فعلی و گام بعدی را با اطمینان بررسی کند.", closingAction: "شروع کنید", footer: "هوشمندی محصول، آماده اقدام.",
  },
} as const;

function ArrowLink({ href, children, secondary = false }: { href: string; children: React.ReactNode; secondary?: boolean }) {
  return <a className={`ox-button ${secondary ? "ox-button-secondary" : ""}`} href={href}>{children}<ArrowUpRight aria-hidden="true" size={16} /></a>;
}

function ProductAtlas({ t }: { t: (typeof copy)["en"] | (typeof copy)["fa"] }) {
  return (
    <div className="ox-atlas" aria-label={t.preview}>
      <div className="ox-atlas-top"><span className="ox-window-dots"><i /><i /><i /></span><span>{t.signal}</span><span className="ox-preview-tag"><CircleDot size={10} /> {t.preview}</span></div>
      <div className="ox-atlas-body">
        <div className="ox-atlas-sidebar"><div className="ox-mini-mark">O</div><span className="ox-side-active"><Layers3 size={15} /></span><span><BarChart3 size={15} /></span><span><Globe2 size={15} /></span><span><Target size={15} /></span><div className="ox-side-avatar">O</div></div>
        <div className="ox-atlas-content">
          <div className="ox-product-heading"><div><span className="ox-overline">{t.profile} / NORTHSTAR</span><h3>{t.overview}</h3></div><span className="ox-avatar-stack"><i>NS</i><i>+2</i></span></div>
          <div className="ox-metrics"><article><span>{t.score}</span><strong>{t.scoreValue}</strong><small><span className="ox-status-dot" />{t.evidence}</small></article><article><span>{t.trend}</span><strong>{t.trendValue}</strong><small>{t.market}</small></article></div>
          <div className="ox-graph-card"><div className="ox-graph-title"><div><span className="ox-overline">{t.evidence}</span><strong>{t.discover} <span>↗</span></strong></div><span className="ox-period">30 {t.market}</span></div><svg className="ox-chart" viewBox="0 0 600 126" role="img" aria-label={t.preview} preserveAspectRatio="none"><defs><linearGradient id="oxArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#f15b3d" stopOpacity=".19"/><stop offset="1" stopColor="#f15b3d" stopOpacity="0"/></linearGradient></defs><path d="M0 100 C42 96 52 83 87 87 S139 97 174 71 S226 78 257 59 S311 71 349 45 S397 62 431 36 S487 47 519 20 S566 36 600 10 V126 H0Z" fill="url(#oxArea)"/><path d="M0 100 C42 96 52 83 87 87 S139 97 174 71 S226 78 257 59 S311 71 349 45 S397 62 431 36 S487 47 519 20 S566 36 600 10" fill="none" stroke="#e85b3f" strokeWidth="2.5" vectorEffect="non-scaling-stroke"/><path d="M0 105 C45 101 57 99 87 97 S140 99 174 91 S227 92 257 83 S311 85 349 72 S397 82 431 69 S487 72 519 60 S566 68 600 49" fill="none" stroke="#79879a" strokeWidth="1.5" strokeDasharray="4 5" vectorEffect="non-scaling-stroke"/><path d="M0 124H600" stroke="#e9e8e3" strokeWidth="1" vectorEffect="non-scaling-stroke"/></svg><div className="ox-chart-legend"><span><i />{t.discover}</span><span><i />{t.product}</span><span>Illustrative</span></div></div>
          <div className="ox-finding-card"><span className="ox-finding-icon"><Sparkles size={15} /></span><div><span className="ox-overline">{t.opportunity}</span><strong>{t.finding}</strong><p>{t.findingText}</p><span className="ox-inline-action">{t.action}<ArrowRight size={13} /></span></div><span className="ox-confidence"><Check size={12} />{t.confidenceValue}</span></div>
        </div>
      </div>
    </div>
  );
}

export function OxennHomepage({ locale }: { locale: string }) {
  const isFa = locale === "fa";
  const t = isFa ? copy.fa : copy.en;
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -36px 0px" });
    document.querySelectorAll(".ox-reveal").forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`oxenn-home ${isFa ? "ox-fa" : "ox-en"}`} dir={isFa ? "rtl" : "ltr"}>
      <LandingHeader />
      <main>
        <section className="ox-hero">
          <div className="ox-hero-grid" aria-hidden="true" />
          <div className="ox-wrap ox-hero-layout">
            <div className="ox-hero-copy">
              <span className="ox-kicker"><span className="ox-kicker-line" />{t.eyebrow}</span>
              <h1>{t.title}</h1>
              <p className="ox-lede">{t.intro}</p>
              <div className="ox-hero-actions"><a className="ox-button" href="#platform">{t.primary}<ArrowRight size={16} aria-hidden="true" /></a><a className="ox-text-link" href="#audit">{t.secondary}<ArrowDown size={15} aria-hidden="true" /></a></div>
              <div className="ox-hero-note"><span className="ox-note-symbol"><ShieldCheck size={14} /></span>{t.note}</div>
            </div>
            <div className="ox-hero-art"><div className="ox-orbit ox-orbit-one" /><div className="ox-orbit ox-orbit-two" /><div className="ox-orbit-center"><div className="ox-orbit-mark">O</div><span>PRODUCT</span><span>INTELLIGENCE</span></div><span className="ox-orbit-node ox-node-one"><Eye size={16} /></span><span className="ox-orbit-node ox-node-two"><Network size={16} /></span><span className="ox-orbit-node ox-node-three"><Target size={16} /></span><span className="ox-orbit-caption ox-caption-one">SIGNALS</span><span className="ox-orbit-caption ox-caption-two">EVIDENCE</span><span className="ox-orbit-caption ox-caption-three">DIRECTION</span></div>
          </div>
          <div className="ox-wrap ox-hero-bottom"><span>OXENN / SIGNAL ATLAS</span><a href="#platform" aria-label={t.primary}><span className="ox-scroll-dot" />SCROLL TO EXPLORE</a><span>01 — 04</span></div>
        </section>

        <section id="platform" className="ox-section ox-overview-section">
          <div className="ox-wrap"><div className="ox-overview-intro ox-reveal"><div><span className="ox-kicker"><span className="ox-kicker-line" />{t.signal}</span><h2>{t.overview}</h2><p>{t.overviewText}</p></div><span className="ox-index">01 / PERSPECTIVE</span></div><div className="ox-reveal ox-atlas-wrap"><ProductAtlas t={t} /></div></div>
        </section>

        <section id="approach" className="ox-section ox-gap-section"><div className="ox-wrap ox-gap-layout"><div className="ox-gap-heading ox-reveal"><span className="ox-kicker"><span className="ox-kicker-line" />{t.gapLabel}</span><h2>{t.gapTitle}</h2><p>{t.gapText}</p></div><div className="ox-gap-list">{[[t.gapOne, t.gapOneText, Eye], [t.gapTwo, t.gapTwoText, Network], [t.gapThree, t.gapThreeText, Target]].map(([title, description, Icon], index) => { const ItemIcon = Icon as typeof Eye; return <article className="ox-gap-row ox-reveal" key={index} style={{ transitionDelay: `${index * 90}ms` }}><span className="ox-gap-number">0{index + 1}</span><span className="ox-gap-icon"><ItemIcon size={17} /></span><div><h3>{title as string}</h3><p>{description as string}</p></div><ChevronRight size={17} className="ox-gap-arrow" /></article>; })}</div></div></section>

        <section id="workflow" className="ox-section ox-workflow-section"><div className="ox-wrap"><div className="ox-section-heading ox-reveal"><span className="ox-kicker"><span className="ox-kicker-line" />{t.workflowLabel}</span><h2>{t.workflowTitle}</h2><p>{t.workflowText}</p></div><div className="ox-workflow">{t.steps.map((step, index) => <article className="ox-step ox-reveal" key={step} style={{ transitionDelay: `${index * 90}ms` }}><div className="ox-step-top"><span>0{index + 1}</span><span className="ox-step-icon">{index === 0 ? <Layers3 size={17} /> : index === 1 ? <Eye size={17} /> : index === 2 ? <Target size={17} /> : <Workflow size={17} />}</span></div><h3>{step}</h3><p>{t.stepTexts[index]}</p></article>)}</div></div></section>

        <section id="capabilities" className="ox-section ox-capabilities-section"><div className="ox-wrap"><div className="ox-section-heading ox-reveal"><span className="ox-kicker"><span className="ox-kicker-line" />{t.capabilitiesLabel}</span><h2>{t.capabilitiesTitle}</h2><p>{t.capabilitiesText}</p></div><div className="ox-capabilities">{t.capabilities.map((item, index) => { const Icon = item.icon; return <article className="ox-capability ox-reveal" key={item.title} style={{ transitionDelay: `${(index % 3) * 80}ms` }}><span className="ox-capability-icon"><Icon size={18} /></span><span className="ox-capability-index">0{index + 1}</span><h3>{item.title}</h3><p>{item.text}</p></article>; })}</div></div></section>

        <section id="audit" className="ox-section ox-audit-section"><div className="ox-wrap ox-audit-layout"><div className="ox-audit-copy ox-reveal"><span className="ox-kicker"><span className="ox-kicker-line" />{t.auditLabel}</span><h2>{t.auditTitle}</h2><p>{t.auditText}</p><span className="ox-audit-truth"><CircleDot size={13} />{t.auditDisclaimer}</span><a href={`/${locale}/register`} className="ox-text-link">{t.auditAction}<ArrowUpRight size={15} /></a></div><div className="ox-audit-panel ox-reveal"><FreeAuditPanel /></div></div></section>

        <section className="ox-closing-section"><div className="ox-closing-grid" aria-hidden="true" /><div className="ox-wrap ox-closing-content ox-reveal"><span className="ox-kicker"><span className="ox-kicker-line" />OXENN</span><h2>{t.closing}</h2><p>{t.closingText}</p><ArrowLink href={`/${locale}/register`}>{t.closingAction}</ArrowLink></div><div className="ox-wrap ox-closing-foot"><span>PRODUCT INTELLIGENCE / 2026</span><span>BUILT FOR WHAT COMES NEXT</span></div></section>
      </main>
      <div className="ox-footer-note"><span>O</span>{t.footer}</div>
      <LandingFooter />
    </div>
  );
}
