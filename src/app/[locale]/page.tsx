"use client";

import { AmbientSpheres } from "@/components/backgrounds/AmbientSpheres";
import React, { useState, use, useRef } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Globe,
  Database,
  Check,
  FileText,
  Activity,
  MessageSquare,
  Network,
  Zap,
  Brain,
  Search,
  CheckCircle,
  TrendingUp,
  ShieldCheck,
  Eye,
  Radar,
  Lock,
  Compass,
  DollarSign,
  Workflow,
  BarChart3,
  Terminal,
  FileCode,
  HeartHandshake,
  AlertTriangle,
  Layers,
  HelpCircle,
  PlayCircle,
  FileSpreadsheet,
  CheckSquare,
  BookOpen,
  MessagesSquare,
  Newspaper,
  BookMarked,
  Award,
  ArrowDown,
  Receipt,
  ExternalLink
} from "lucide-react";
import { LandingHeader } from "@/components/marketing/LandingHeader";
import { LandingFooter } from "@/components/marketing/LandingFooter";
import { FreeAuditPanel } from "@/components/features/audit/FreeAuditPanel";
import { RadialPolarGraph } from "@/components/features/graph/RadialPolarGraph";
import { LiveKnowledgeGraph } from "@/components/features/graph/LiveKnowledgeGraph";

/**
 * High-fidelity, Product-First Enterprise AI Platform Homepage for seorchable.ir.
 * Redesigned from scratch to establish category supremacy comparable to Stripe, Vercel, and Semrush.
 * Perfectly localized, supports RTL/LTR, dark/light modes, and follows the specified logical flow.
 */
export default function MarketingLandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = use(params);
  const locale = resolvedParams.locale;
  const isFa = locale === "fa";

  // State for high-fidelity Mock Dashboard visualizations
  const [activeDashboardTab, setActiveDashboardTab] = useState<"visibility" | "authority" | "citation" | "competitor" | "graph" | "timeline">("visibility");

  // References for scrolling
  const freeAuditRef = useRef<HTMLDivElement | null>(null);
  const platformOverviewRef = useRef<HTMLDivElement | null>(null);
  const dashboardsRef = useRef<HTMLDivElement | null>(null);

  const scrollToRef = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // 12 Product Modules for Platform Overview
  const platformModules = [
    {
      id: "ai-visibility",
      icon: Eye,
      name: isFa ? "پایش میزان دیده‌شدن برند" : "AI Visibility Monitoring",
      desc: isFa ? "ردیابی زنده سهم استناد و حضور برند شما در پاسخ‌های ChatGPT، Claude و موتورهای نوظهور." : "Real-time auditing of your brand's citation frequency and share of voice inside LLM responses."
    },
    {
      id: "brand-intelligence",
      icon: Brain,
      name: isFa ? "تحلیل هوشمندی و درک معنایی" : "Brand Intelligence Analyzer",
      desc: isFa ? "کالبدشکافی دقیق برداشت مدل‌های زبانی از ارزش، هویت و خدمات اصلی کسب‌وکار شما." : "Deconstruct how generative engines interpret your core value proposition and brand context."
    },
    {
      id: "citation-tracking",
      icon: Activity,
      name: isFa ? "ردیابی استنادهای هوش مصنوعی" : "AI Citation Tracking",
      desc: isFa ? "پایش پیوندها، رفرنس‌های متنی و لینک‌های ارجاعی صادر شده توسط موتورهای مکالمه‌محور." : "Monitor exact hyperlinks and reference materials cited by conversational agents inside answers."
    },
    {
      id: "competitor-intelligence",
      icon: Compass,
      name: isFa ? "هوشمندی رقابتی پیشرفته" : "Competitor Intelligence",
      desc: isFa ? "تحلیل و مقایسه برداری سهم استناد و رتبه‌بندی رقبای هم‌سطح بازار در پاسخ‌ها." : "Execute multi-competitor spatial comparisons to dissect where your search share is leaking."
    },
    {
      id: "kg-explorer",
      icon: Network,
      name: isFa ? "گراف دانش معنایی برند" : "Knowledge Graph Explorer",
      desc: isFa ? "مدل‌سازی و ترسیم موجودیت‌ها و مفاهیم برای تثبیت لایه‌های برند در حافظه معنایی هوش مصنوعی." : "Map, explore, and establish entity-relationship graphs to inject brand context into foundational indices."
    },
    {
      id: "prompt-monitoring",
      icon: Terminal,
      name: isFa ? "رصد پرومپت‌ها و کوئری‌ها" : "Prompt Monitoring",
      desc: isFa ? "تحلیل روزانه الگوهای جستجوی کاربران و شبیه‌سازی پرومپت‌های پرتکرار صنعت شما." : "Track daily query prompts, simulate high-frequency user behaviors, and model sentiment shifts."
    },
    {
      id: "search-analytics",
      icon: Search,
      name: isFa ? "تحلیل آماری موتورهای پاسخگو" : "AI Search Analytics",
      desc: isFa ? "اندازه‌گیری و گزارش عمیق ایمپرشن، کلیک و ترافیک ارجاعی از موتورهای پاسخ‌دهنده." : "Measure impressions, click-through equivalents, and referral traffic driving from generative platforms."
    },
    {
      id: "geo-optimization",
      icon: Zap,
      name: isFa ? "بهینه‌سازی موتورهای پاسخگو (GEO)" : "Generative Engine Optimization",
      desc: isFa ? "فرم‌دهی متون صفحات، متادیتا و میکرودیتا جهت فهم و ترجیح داده‌ها توسط کراولرها." : "Format page structure, XML schemas, and semantic data to guarantee optimal parsing by AI crawlers."
    },
    {
      id: "authority-score",
      icon: Award,
      name: isFa ? "شاخص اعتبار برند در هوش زبانی" : "Brand Authority Score",
      desc: isFa ? "سنتز آماری فاکتورهای اطمینان، حقیقت‌محوری و کیفیت پاسخ‌های مربوط به برند شما." : "A unified metric scoring brand reliability, sentiment, and factuality across top model ecosystems."
    },
    {
      id: "website-audit",
      icon: Globe,
      name: isFa ? "خزش ساختاری و آنالیز وب‌سایت" : "Website Audit Engine",
      desc: isFa ? "خزش فنی با Firecrawl برای رصد سورس‌کدها، فایل‌های دسترسی و بهینه‌سازی خوانش وب‌سایت." : "Crawl public pages with advanced Firecrawl integration to discover structural indexation anomalies."
    },
    {
      id: "content-intelligence",
      icon: FileText,
      name: isFa ? "هوشمندی و بهینه‌سازی محتوا" : "Content Intelligence",
      desc: isFa ? "تولید پیشنهادات عملی متنی و ساختاربندی مقالات برای تطبیق با الگوریتم‌های رتبه‌دهی LLM." : "Generate copywriting revisions and content structure changes calculated to rank higher in LLM citations."
    },
    {
      id: "entity-monitoring",
      icon: Layers,
      name: isFa ? "پایش موجودیت‌ها و مفاهیم برند" : "Entity Monitoring",
      desc: isFa ? "رصد پیوسته نام برند، زیربرندها، نام مدیران ارشد و دارایی‌های فکری در پایگاه‌های دانش هوش مصنوعی." : "Continuous tracking of corporate entities, executive names, and brand variants in model repositories."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--text-primary)]" style={{ direction: isFa ? "rtl" : "ltr" }}>
      {/* Navigation */}
      <LandingHeader />

      {/* QUESTION 1: "What is this platform?" - Product-First Hero Section */}
      <section className="relative pt-36 pb-20 md:pt-44 md:pb-24 overflow-hidden border-b border-[var(--border)]">
        {/* Sky Blue / Orange Signature Gradients */}
        <AmbientSpheres />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <LiveKnowledgeGraph />
        </div>
      </section>

      {/* QUESTION 3: "How does it work?" - Rebuilt Product Story Lifecycle Timeline */}
      <section id="story" className="py-24 bg-[var(--background)] dark:bg-[#06080d] relative border-b border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs uppercase font-black tracking-widest text-[#f97316]">{isFa ? "داستان و چرخه حرکت محصول" : "PRODUCT LIFECYCLE STORY"}</span>
            <h2 className="font-display font-black text-3xl md:text-4xl text-gradient-brand">
              {isFa ? "چرخه کامل بهینه‌سازی و ارتقای حضور برند" : "How the Platform Operates"}
            </h2>
            <p className="text-[var(--text-secondary)]">
              {isFa
                ? "از لحظه ثبت آدرس سایت تا پایش دائمی و تثبیت استنادها در چت‌بات‌ها؛ گام به گام در کنار شما هستیم."
                : "Step-by-step lifecycle flow from website ingestion to continuous AI citation monitoring."}
            </p>
          </div>

          {/* Connected timeline lifecycle component */}
          <div className="grid md:grid-cols-4 lg:grid-cols-8 gap-6 relative">
            {/* Timeline connector line for desktop */}
            <div className="hidden lg:block absolute top-[40px] inset-x-8 h-0.5 border-t border-dashed border-[var(--border)] -z-10" />

            {[
              { step: "۱", title: isFa ? "ثبت وب‌سایت" : "Ingest", desc: isFa ? "آدرس یا متون مرجع خود را ثبت می‌کنید." : "Submit brand domain or offline documentation repository." },
              { step: "۲", title: isFa ? "خزش فنی" : "Crawl", desc: isFa ? "هوش مصنوعی با Firecrawl داده‌ها را خزش می‌کند." : "Specialized bot clusters scan, retrieve, and structure files." },
              { step: "۳", title: isFa ? "سنجش حضور" : "Measure", desc: isFa ? "میزان دیده‌شدن برند در مدل‌ها سنجیده می‌شود." : "Evaluate baseline brand visibility scores across major LLMs." },
              { step: "۴", title: isFa ? "تحلیل رقبا" : "Compare", desc: isFa ? "سیگنال‌های رقبا بررسی و ارزیابی می‌گردد." : "Conduct spatial comparison and share of voice audits." },
              { step: "۵", title: isFa ? "گراف روابط" : "Extract", desc: isFa ? "موجودیت‌ها و گراف روابط استخراج می‌شوند." : "Inject semantic entity-relationship tuples into the model index." },
              { step: "۶", title: isFa ? "یافتن استنادها" : "Discover", desc: isFa ? "لینک‌های ارجاعی صادر شده مانیتور می‌شوند." : "Scan for verbatim model answers delivering accurate citations." },
              { step: "۷", title: isFa ? "بهبود و تولید" : "Optimize", desc: isFa ? "پیشنهادات اصلاح متون و GEO تولید می‌گردد." : "Inject schema markups and copy optimization proposals." },
              { step: "۸", title: isFa ? "پایش مستمر" : "Monitor", desc: isFa ? "رصد پیوسته خطاها و نمرات سلامت برند آغاز می‌شود." : "Set alerts for Claim Errors, Hallucinations, or citation leaks." }
            ].map((item, idx) => (
              <div key={idx} className="glass-panel p-5 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] hover-lift flex flex-col items-center text-center space-y-3 relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#38bdf8] to-[#f97316] flex items-center justify-center text-white font-black text-sm shadow-md">
                  {item.step}
                </div>
                <h4 className="text-xs font-black text-[var(--text-primary)] font-display">{item.title}</h4>
                <p className="text-[10px] text-[var(--text-muted)] leading-relaxed font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QUESTION 4: "Why should I trust it?" - Enterprise Trust Layer */}
      <section id="trust" className="py-24 bg-[var(--background-subtle)]/40 dark:bg-[#080b12]/40 border-b border-[var(--border)] relative overflow-hidden">
        <div className="absolute inset-0 grid-backdrop opacity-[0.2] pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs uppercase font-black tracking-widest text-[#38bdf8]">{isFa ? "اعتماد، اعتبار و انطباق فنی" : "ENTERPRISE TRUST & COMPLIANCE"}</span>
            <h2 className="font-display font-black text-3xl md:text-4xl text-gradient-brand">
              {isFa ? "امنیت و پایبندی به بالاترین استانداردهای جهانی" : "Enterprise Compliance & Infrastructure"}
            </h2>
            <p className="text-[var(--text-secondary)]">
              {isFa
                ? "پلتفرم اپتیموس بر روی پیشرفته‌ترین ساختارهای ابری سوار شده و تمام گواهینامه‌های امنیتی را پوشش می‌دهد."
                : "Optimus AI operates on military-grade secure infrastructure with robust SLAs and compliance frameworks."}
            </p>
          </div>

          {/* Stats & Infrastructure partners */}
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8">
            <div className="glass-panel p-6 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] text-center space-y-3">
              <ShieldCheck size={36} className="mx-auto text-[#38bdf8]" />
              <h4 className="text-xl font-black text-[var(--text-primary)] font-display">{isFa ? "امنیت داده‌ها" : "SSO & MFA Ready"}</h4>
              <p className="text-base text-slate-800 dark:text-slate-200 leading-relaxed font-semibold">{isFa ? "پشتیبانی کامل از SAML SSO و تایید دومرحله‌ای" : "Full enterprise SAML Single Sign-On integration."}</p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] text-center space-y-3">
              <Database size={36} className="mx-auto text-[#f97316]" />
              <h4 className="text-xl font-black text-[var(--text-primary)] font-display">SOC2 & ISO Ready</h4>
              <p className="text-base text-slate-800 dark:text-slate-200 leading-relaxed font-semibold">{isFa ? "منطبق بر الزامات امنیت اطلاعات استاندارد جهانی" : "Adhering to strict compliance and auditing standards."}</p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] text-center space-y-3">
              <Globe size={36} className="mx-auto text-emerald-400 animate-pulse" />
              <h4 className="text-xl font-black text-[var(--text-primary)] font-display">GDPR Compliant</h4>
              <p className="text-base text-slate-800 dark:text-slate-200 leading-relaxed font-semibold">{isFa ? "رعایت کامل قوانین حفظ حریم خصوصی کاربران" : "Total data privacy guarantee and localized hosting parameters."}</p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] text-center space-y-3">
              <Receipt size={36} className="mx-auto text-[#38bdf8]" />
              <h4 className="text-xl font-black text-[var(--text-primary)] font-display">{isFa ? "شبکه شتاب ایران" : "Iran Payment Support"}</h4>
              <p className="text-base text-slate-800 dark:text-slate-200 leading-relaxed font-semibold">{isFa ? "پشتیبانی کامل از درگاه‌های پرداخت عضو شبکه شتاب" : "Fully localized billing integration and printable invoice receipts."}</p>
            </div>
          </div>
        </div>
      </section>

      {/* QUESTION 5: "What features does it provide?" - Platform Overview (12 Modules Grid) */}
      <section id="overview" ref={platformOverviewRef} className="py-24 bg-[var(--background)] dark:bg-[#06080d] relative border-b border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs uppercase font-black tracking-widest text-[#f97316]">{isFa ? "بررسی کلان ابزارها" : "PLATFORM MODULES OVERVIEW"}</span>
            <h2 className="font-display font-black text-3xl md:text-4xl text-gradient-brand">
              {isFa ? "۱۲ ماژول نرم‌افزاری کاملاً یکپارچه" : "Twelve Specialized AI Modules"}
            </h2>
            <p className="text-[var(--text-secondary)]">
              {isFa
                ? "ببینید این پلتفرم فراتر از ممیزی ساده، چه گستره عظیمی از ابزارها را برای مدیریت موجودیت‌های شما فراهم می‌کند."
                : "No single-tool setup. We host a complete software ecosystem to scale your brand authority."}
            </p>
          </div>

          {/* 12 cards grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {platformModules.map((mod, idx) => {
              const Icon = mod.icon;
              return (
                <div key={idx} className="glass-panel p-6 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] flex flex-col justify-between hover-lift h-full relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#38bdf8]/5 to-transparent rounded-full blur-lg pointer-events-none group-hover:scale-150 transition-transform duration-500" />
                  <div className="space-y-4">
                    <div className="w-10 h-10 rounded-xl bg-[#38bdf8]/10 border border-[#38bdf8]/30 flex items-center justify-center text-[#38bdf8]">
                      <Icon size={20} />
                    </div>
                    <h3 className="text-sm font-black text-[var(--text-primary)] font-display truncate">{mod.name}</h3>
                    <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-medium">{mod.desc}</p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-[var(--border)] flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                    <span>{isFa ? "مشاهده جزئیات ماژول" : "Explore module"}</span>
                    <ArrowRight size={12} className="rtl:-scale-x-100" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* QUESTION 6: "What products are included?" - Product Ecosystem Interconnectivity */}
      <section id="ecosystem" className="py-24 bg-[var(--background-subtle)]/40 dark:bg-[#080b12]/40 border-b border-[var(--border)] relative overflow-hidden">
        <div className="absolute inset-0 grid-backdrop opacity-[0.25] pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs md:text-[11px] uppercase font-black tracking-widest text-[#38bdf8]">{isFa ? "اتصال اجزا و لایه‌های سیستم" : "INTERCONNECTED CORE ECOSYSTEM"}</span>
            <h2 className="font-display font-black text-2xl md:text-4xl text-gradient-brand leading-snug md:leading-normal">
              {isFa ? "چگونه تمام محصولات ما با هم هم‌افزایی می‌کنند" : "Platform Product Synapse"}
            </h2>
            <p className="text-sm md:text-base text-[var(--text-secondary)] leading-relaxed md:leading-normal">
              {isFa
                ? "پلتفرم ما یک ابزار تک افتاده نیست. تمام محصولات در قالب یک اکوسیستم متصل با هم تعامل دارند."
                : "Understand how website audit flows into semantic mapping, citation mining, and continuous alerts."}
            </p>
          </div>

          {/* Visual connected cards showing Ecosystem depth */}
          <div className="grid md:grid-cols-7 gap-4 text-center">
            {[
              { title: isFa ? "۱. ممیزی وب‌سایت" : "Website Ingestion", desc: isFa ? "تحلیل کدهای پایه" : "Crawl public pages" },
              { title: isFa ? "۲. تحلیل هوشمند" : "Brand Context", desc: isFa ? "استخراج موجودیت‌ها" : "Extract entity triples" },
              { title: isFa ? "۳. دیده‌شدن برخط" : "AI Visibility Index", desc: isFa ? "سنجش سهم استناد" : "Calculate Voice metrics" },
              { title: isFa ? "۴. ردیابی منبع" : "Citation Mining", desc: isFa ? "پایش پیوندهای زنده" : "Track backlink paths" },
              { title: isFa ? "۵. تحلیل رقبا" : "Competitor Gap", desc: isFa ? "مقایسه سهم بازار" : "Compare vector metrics" },
              { title: isFa ? "۶. بهینه‌سازی" : "GEO & Sitemaps", desc: isFa ? "تزریق تگ‌های معنایی" : "Inject schema hints" },
              { title: isFa ? "۷. پایش مستمر" : " Hallucination Watch", desc: isFa ? "هشدار خطا و توهم" : "Continuous claim safety" }
            ].map((eco, idx) => (
              <div key={idx} className="glass-panel p-5 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] space-y-2 relative flex flex-col justify-between hover:border-[#38bdf8]/50 transition-colors">
                <span className="text-xs md:text-[10px] font-black text-[#38bdf8] block">Step {idx + 1}</span>
                <h4 className="text-sm md:text-xs font-black text-white font-display leading-normal md:leading-tight">{eco.title}</h4>
                <p className="text-xs md:text-[10px] text-slate-400 font-medium leading-relaxed md:leading-normal">{eco.desc}</p>
                {idx < 6 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 -translate-y-1/2 text-[var(--border)] font-bold text-lg z-20">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QUESTION 7: "What results will I receive?" - "Why We Are Different" (Traditional SEO vs AI Visibility) */}
      <section id="why-different" className="py-24 bg-[var(--background)] dark:bg-[#06080d] relative border-b border-[var(--border)]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-16 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs uppercase font-black tracking-widest text-[#f97316]">{isFa ? "تمایز کلیدی و آموزش مخاطب" : "WHY WE ARE COMPLETELY DIFFERENT"}</span>
            <h2 className="font-display font-black text-3xl md:text-4xl text-gradient-brand">
              {isFa ? "بهینه‌سازی سئو سنتی در مقابل بهینه‌سازی هوش مصنوعی (GEO)" : "Traditional SEO vs. Generative Engine Optimization"}
            </h2>
            <p className="text-[var(--text-secondary)]">
              {isFa
                ? "دنیای جستجو تغییر کرده است. چرا روش‌های قدیمی رتبه‌بندی کلمات کلیدی، برای پاسخ‌های چت‌بات‌ها بی‌استفاده است؟"
                : "Understand how conversational discovery diverges from static web page search indexing."}
            </p>
          </div>

          {/* Comparison table */}
          <div className="glass-panel rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-bg)] shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-start border-collapse text-[var(--text-secondary)]">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--muted-surface)]/40 text-[var(--text-secondary)]">
                    <th className="py-5 px-6 font-display font-extrabold text-sm text-start">{isFa ? "معیارهای مقایسه و کارکرد" : "Comparison Dimension"}</th>
                    <th className="py-5 px-6 font-display font-bold text-sm text-center bg-white/[0.02]">{isFa ? "سئو سنتی (Classic SEO)" : "Traditional SEO"}</th>
                    <th className="py-5 px-6 font-display font-black text-sm text-[#0284c7] dark:text-[#38bdf8] text-center bg-[#38bdf8]/5">{isFa ? "بهینه‌سازی هوش مصنوعی (GEO)" : "Generative Optimization (GEO)"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-xs font-bold">
                  {[
                    { dim: isFa ? "محل نمایش رتبه‌بندی" : "Primary Search Target", seo: isFa ? "صفحات آبی و نتایج متنی ده تایی گوگل" : "Standard Blue Page Link List (10-blue links)", geo: isFa ? "پاسخ‌های ترکیبی و ارجاعات چت‌بات‌ها" : "Synthesized Paragraph Answers & Dynamic Conversational Widgets" },
                    { dim: isFa ? "سیستم استناد و لینک" : "Citation & Reference Logic", seo: isFa ? "لینک‌های فالو و نوفالو در صفحات وب" : "Backlink Anchor", geo: isFa ? "ارجاعات متنی مرجع و دایالکتیکی مدل زبانی" : "Inline markdown citation annotations linked directly to brand docs" },
                    { dim: isFa ? "گراف دانش برند" : "Entity Understanding", seo: isFa ? "تگ‌های متاداده و کلمات کلیدی هدرها" : "Keyword Densities", geo: isFa ? "نگاشت موجودیت‌های ۳-تایی و روابط منطقی" : "Semantic entity triples & localized contextual relevance matching" },
                    { dim: isFa ? "رصد پرومپت و پاسخ" : "Interactive Prompt Focus", seo: isFa ? "حجم جستجوی کلمات کلیدی ساده" : "Static Keyword Volumes", geo: isFa ? "پایش سناریوهای پرومپت و شبیه‌سازی کاربر" : "Simulated conversational prompt patterns and dialectic query streams" },
                    { dim: isFa ? "پایش توهم زبانی" : "Hallucination Control", seo: isFa ? "تطابق نداشتن متن با کوئری جستجو" : "Not applicable", geo: isFa ? "شناسایی استناد غلط و ارجاع اشتباه به رقیب" : "Identifying claim hijack events & factual errors generated by model" },
                    { dim: isFa ? "رویکرد بهینه‌سازی" : "Optimization Directives", seo: isFa ? "افزایش چگالی کلمات کلیدی صفحه" : "Keyword stuffing & static indexing tags", geo: isFa ? "اصلاح انسجام متون و مدل‌سازی معنایی" : "Refining document semantic cohesion & semantic authority declaration" },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-[var(--muted-surface)]/20 transition-colors">
                      <td className="py-4.5 px-6 text-[var(--text-secondary)] text-start">{row.dim}</td>
                      <td className="py-4.5 px-6 text-center text-[var(--text-muted)] bg-white/[0.01]">{row.seo}</td>
                      <td className="py-4.5 px-6 text-center text-[var(--text-primary)] bg-[#38bdf8]/5">{row.geo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* QUESTION 8: "How can I start?" - Part 1: Documentation Hub Preview */}
      <section id="docs" className="py-24 bg-[var(--background-subtle)]/40 dark:bg-[#07090e]/40 border-b border-[var(--border)] relative overflow-hidden">
        <div className="absolute inset-0 grid-backdrop opacity-[0.25] pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs uppercase font-black tracking-widest text-[#38bdf8]">{isFa ? "محیط برنامه‌نویسان و راهنمای استقرار" : "DEVELOPER & API HUB"}</span>
            <h2 className="font-display font-black text-3xl md:text-4xl text-gradient-brand">
              {isFa ? "پیش‌نمایش مرکز مستندات فنی و API" : "System Documentation Hub"}
            </h2>
            <p className="text-[var(--text-secondary)]">
              {isFa
                ? "پلتفرم ما مجهز به REST API قدرتمند، کیت‌های توسعه نرم‌افزار (SDK) و هوک‌های امن برای توسعه‌دهندگان است."
                : "Explore core concepts, REST API reference, webhooks, and developer guidelines to scale custom setups."}
            </p>
          </div>

          {/* Grid of 12 documentation categories */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: isFa ? "شروع سریع" : "Getting Started", desc: isFa ? "مفاهیم اساسی AEO و GEO" : "Introduction to brand footprint modeling.", icon: BookOpen, slug: "introduction-to-brandgraph" },
              { title: isFa ? "معماری پلتفرم" : "Platform Concepts", desc: isFa ? "مکانیزم خزش Firecrawl" : "How crawler clusters scan public pages.", icon: Layers, slug: "infrastructure-architecture" },
              { title: isFa ? "رابط برنامه‌نویسی REST API" : "REST API References", desc: isFa ? "توضیح متدهای GET / POST" : "Exposing JSON endpoints for external RAG queries.", icon: Terminal, slug: "ai-pipeline-architecture" },
              { title: isFa ? "اعتبارسنجی و امنیت" : "Authentication Tokens", desc: isFa ? "امضای کلیدهای API و دسترسی" : "How API keys enforce tenant-isolation rules.", icon: Lock, slug: "multi-tenant-isolation" },
              { title: isFa ? "کیت‌های توسعه (SDKs)" : "Software SDKs", desc: isFa ? "کتابخانه‌های پایتون و جاوااسکریپت" : "Official NPM and Python packages.", icon: FileCode, slug: "knowledge-graph-design" },
              { title: isFa ? "وب‌هوک‌ها" : "Webhooks Stream", desc: isFa ? "هشدارهای توهم زنده" : "Send claim safety flags to Discord/Slack.", icon: Workflow, slug: "ai-pipeline-architecture" },
              { title: isFa ? "تامین‌کنندگان هوش زبانی" : "AI Providers Integrated", desc: isFa ? "پشتیبانی OpenAI و کلود" : "Details on OpenAI, Anthropic, and Llama setups.", icon: Brain, slug: "introduction-to-brandgraph" },
              { title: isFa ? "امنیت و جداسازی داده" : "Architecture & Security", desc: isFa ? "مدیریت لایه‌ها و RLS" : "Enforcing enterprise-grade RLS guidelines.", icon: ShieldCheck, slug: "multi-tenant-isolation" }
            ].map((doc, idx) => {
              const Icon = doc.icon;
              return (
                <div key={idx} className="glass-panel p-6 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] hover-lift flex flex-col justify-between h-full">
                  <div className="space-y-4">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#38bdf8]">
                      <Icon size={16} />
                    </div>
                    <h4 className="text-xs font-black text-white font-display truncate">{doc.title}</h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed font-medium">{doc.desc}</p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-white/5">
                    <Link
                      href={`/${locale}/docs/${doc.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-black text-[#38bdf8] hover:underline flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>{isFa ? "مطالعه سند فنی" : "Read docs"}</span>
                      <ExternalLink size={10} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* QUESTION 8: "How can I start?" - Part 2: Enterprise Resource Center */}
      <section id="resources" className="py-24 bg-[var(--background)] dark:bg-[#06080d] relative border-b border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs uppercase font-black tracking-widest text-[#f97316]">{isFa ? "کتابخانه دانش، گزارشات و نقشه راه" : "RESOURCE & INSIGHT CENTER"}</span>
            <h2 className="font-display font-black text-3xl md:text-4xl text-gradient-brand">
              {isFa ? "مرکز تخصصی مطالعات و پژوهش هوش زبانی" : "Enterprise Resource Center"}
            </h2>
            <p className="text-[var(--text-secondary)]">
              {isFa
                ? "دسترسی به آخرین نتایج پژوهشی ما، بنچ‌مارک‌های بازار، بیانیه‌ها و نقشه راه پلتفرم."
                : "Explore rich whitepapers, case studies, benchmarks, and product roadmap updates."}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: isFa ? "وبلاگ مهندسی" : "Engineering Blog", desc: isFa ? "آخرین مقالات تکنولوژی سئو معنایی و هوش زبانی." : "Technical updates on conversational search visibility and web crawlers.", icon: Newspaper, link: `/${locale}/blog` },
              { title: isFa ? "مطالعات موردی و موفقیت" : "Case Studies", desc: isFa ? "بررسی داستان موفقیت برندهای بزرگ در تصاحب سهم استناد." : "Real-world examples of enterprise brands mitigating claims risk.", icon: MessagesSquare, link: `/${locale}/blog` },
              { title: isFa ? "بنچ‌مارک‌های صنعت" : "Industry Benchmarks", desc: isFa ? "سنجش سهم صدای صنایع مختلف در مدل‌های ChatGPT." : "Analyzing conversion metrics and citation performance by sector.", icon: FileSpreadsheet, link: `/${locale}/blog` },
              { title: isFa ? "نقشه راه محصول (Roadmap)" : "Changelog & Roadmap", desc: isFa ? "آخرین دستاوردهای فنی و قابلیت‌های اضافه شده به پلتفرم." : "Exposing the pipeline and quarterly releases for our software suite.", icon: BookMarked, link: `/${locale}/dashboard` }
            ].map((res, idx) => {
              const Icon = res.icon;
              return (
                <Link key={idx} href={res.link} className="glass-panel p-6 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] hover-lift flex flex-col justify-between h-full group">
                  <div className="space-y-4">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#f97316]">
                      <Icon size={16} />
                    </div>
                    <h4 className="text-xs font-black text-white font-display truncate group-hover:text-[#38bdf8] transition-colors">{res.title}</h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed font-medium">{res.desc}</p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-bold group-hover:text-white transition-colors">
                    <span>{isFa ? "مطالعه منبع" : "Read resource"}</span>
                    <ArrowRight size={12} className="rtl:-scale-x-100" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* QUESTION 8: "How can I start?" - Part 3: Pricing Matrix */}
      <section id="pricing" className="py-24 bg-[var(--background-subtle)]/40 dark:bg-[#080b12]/40 border-b border-[var(--border)] relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs uppercase font-black tracking-widest text-[#38bdf8]">{isFa ? "انتخاب تعرفه و بهینه‌سازی بودجه" : "FLEXIBLE ENTERPRISE PRICING"}</span>
            <h2 className="font-display font-black text-3xl md:text-4xl text-gradient-brand">
              {isFa ? "تعرفه‌های منعطف بر اساس حجم کلمات و پایش" : "Simple, Predictable Plans"}
            </h2>
            <p className="text-[var(--text-secondary)]">
              {isFa
                ? "بر اساس تعداد دامنه‌ها، حجم کلمات کلیدی پایش شده و تعداد خزش‌های روزانه پلن کاربری خود را انتخاب نمایید."
                : "Select a plan tailored exactly to your brand footprint size and desired citation tracking scope."}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Starter Plan */}
            <div className="glass-panel p-8 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] hover-lift flex flex-col justify-between h-full">
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-[10px] px-2.5 py-0.5 rounded bg-zinc-500/10 text-zinc-400 font-bold uppercase tracking-wider">{isFa ? "کسب‌وکارهای کوچک" : "STARTER"}</span>
                  <h3 className="text-xl font-black text-[var(--text-primary)] font-display">{isFa ? "پلن آغازین" : "Starter"}</h3>
                  <p className="text-xs text-[var(--text-muted)]">{isFa ? "پایش پایه‌ای حضور برند در نتایج." : "Establish brand footprints inside foundational memories."}</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black font-display text-[var(--text-primary)]">{isFa ? "۴۹" : "$49"}</span>
                  <span className="text-xs text-[var(--text-muted)]">/ {isFa ? "ماهانه" : "month"}</span>
                </div>

                <ul className="space-y-3 text-xs text-[var(--text-secondary)] font-bold">
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-[#38bdf8]" />
                    <span>{isFa ? "پایش ۱۰ کلمه کلیدی اصلی" : "Track up to 10 brand keywords"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-[#38bdf8]" />
                    <span>{isFa ? "خزش تا ۵۰۰ صفحه با Firecrawl" : "Crawl up to 500 pages/mo"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-[#38bdf8]" />
                    <span>{isFa ? "تحلیل ۱-هاپ گراف دانش" : "1-hop entity relationship models"}</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <button
                  onClick={() => scrollToRef(freeAuditRef)}
                  className="w-full py-3 rounded-xl border border-[var(--border)] text-[var(--text-primary)] hover:border-[#38bdf8] text-xs font-bold transition-all cursor-pointer"
                >
                  {isFa ? "انتخاب پلن آغازین" : "Select Starter Plan"}
                </button>
              </div>
            </div>

            {/* Growth Plan */}
            <div className="glass-panel p-8 rounded-2xl border-2 border-[#38bdf8] bg-[#38bdf8]/5 hover-lift flex flex-col justify-between h-full relative">
              <span className="absolute -top-3 right-8 px-3 py-1 bg-[#38bdf8] text-white text-[9px] font-black rounded-full uppercase tracking-widest shadow-md">POPULAR</span>
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-[10px] px-2.5 py-0.5 rounded bg-[#38bdf8]/10 text-[#38bdf8] font-bold uppercase tracking-wider">{isFa ? "شرکت‌های متوسط" : "GROWTH"}</span>
                  <h3 className="text-xl font-black text-[var(--text-primary)] font-display">{isFa ? "پلن رشد" : "Growth"}</h3>
                  <p className="text-xs text-[var(--text-muted)]">{isFa ? "پایش رقبای بازار و تحلیل عمیق توهم‌ها." : "Mitigate claim errors and track multiple competitors."}</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black font-display text-[#38bdf8]">{isFa ? "۱۴۹" : "$149"}</span>
                  <span className="text-xs text-[var(--text-muted)]">/ {isFa ? "ماهانه" : "month"}</span>
                </div>

                <ul className="space-y-3 text-xs text-[var(--text-secondary)] font-bold">
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-[#38bdf8]" />
                    <span>{isFa ? "پایش ۵۰ کلمه کلیدی و رقیب" : "Track up to 50 brand keywords"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-[#38bdf8]" />
                    <span>{isFa ? "خزش تا ۳,۰۰۰ صفحه با Firecrawl" : "Crawl up to 3,000 pages/mo"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-[#38bdf8]" />
                    <span>{isFa ? "تحلیل پیشرفته توهم و استناد" : "Full semantic claim and citation audit"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-[#38bdf8]" />
                    <span>{isFa ? "پشتیبانی پاسخگو اختصاصی" : "Dedicated priority customer support"}</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <button
                  onClick={() => scrollToRef(freeAuditRef)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#f97316] text-white text-xs font-bold shadow-lg shadow-sky-500/20 hover:scale-[1.02] transition-transform cursor-pointer"
                >
                  {isFa ? "انتخاب پلن رشد (پیشنهادی)" : "Choose Growth Plan"}
                </button>
              </div>
            </div>

            {/* Enterprise Plan */}
            <div className="glass-panel p-8 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] hover-lift flex flex-col justify-between h-full">
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-[10px] px-2.5 py-0.5 rounded bg-purple-500/10 text-purple-400 font-bold uppercase tracking-wider">{isFa ? "هلدینگ‌ها و رهبران" : "ENTERPRISE"}</span>
                  <h3 className="text-xl font-black text-[var(--text-primary)] font-display">{isFa ? "پلن سازمانی" : "Enterprise"}</h3>
                  <p className="text-xs text-[var(--text-muted)]">{isFa ? "کلاستر اختصاصی و سیستم‌های امنیتی کامل." : "For market leaders demanding absolute data isolation SLAs."}</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black font-display text-[var(--text-primary)]">{isFa ? "تماس با ما" : "Custom / SLA"}</span>
                </div>

                <ul className="space-y-3 text-xs text-[var(--text-secondary)] font-bold">
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-[#38bdf8]" />
                    <span>{isFa ? "پایش نامحدود واژگان و موجودیت‌ها" : "Unlimited search term extraction"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-[#38bdf8]" />
                    <span>{isFa ? "کلاستر اختصاصی خزش با Firecrawl" : "Dedicated private crawling instances"}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-[#38bdf8]" />
                    <span>{isFa ? "سیستم امنیتی SSO و MFA اختصاصی" : "SAML SSO, custom data retention SLAs"}</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <Link href={`/${locale}/contact`}>
                  <button className="w-full py-3 rounded-xl border border-[var(--border)] text-[var(--text-primary)] hover:border-[#38bdf8] text-xs font-bold transition-all cursor-pointer">
                    {isFa ? "تماس با واحد فروش" : "Contact Sales Department"}
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise CTA Area */}
      <section className="py-24 bg-gradient-to-b from-[#38bdf8]/5 to-[#f97316]/5 dark:from-[#0a0d16]/30 dark:to-slate-950 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-[#38bdf8]/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 relative z-10 space-y-8">
          <h2 className="font-display font-black text-4xl md:text-5xl tracking-tight text-[var(--text-primary)] leading-tight text-balance">
            {isFa ? "آماده تغییر قواعد بازی در عصر هوش پاسخگو هستید؟" : "Supercharge Your Brand Inside conversational search"}
          </h2>
          <p className="text-base md:text-lg text-[var(--text-secondary)] font-medium leading-relaxed max-w-2xl mx-auto">
            {isFa
              ? "آدرس دامنه خود را بلافاصله آنالیز کنید تا تگ‌های متادیتا و سلامت ساختار آن در خزش Firecrawl سنجش گردد."
              : "Analyze your website structure right now to check meta elements, H1 tags, and crawler indexability status."}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => scrollToRef(freeAuditRef)}
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-white text-base font-bold bg-gradient-to-r from-[#38bdf8] to-[#f97316] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles size={16} className="animate-pulse" />
              <span>{isFa ? "شروع آنالیز رایگان وب‌سایت" : "Start Free Audit Scanner"}</span>
            </button>

            <Link href={`/${locale}/contact`} className="w-full sm:w-auto">
              <button className="w-full px-8 py-4 rounded-xl text-base font-bold bg-slate-900/40 hover:bg-[#38bdf8]/10 text-[var(--text-primary)] border border-[var(--glass-border)] transition-all flex items-center justify-center gap-2 cursor-pointer">
                <span>{isFa ? "تماس با کارشناسان ما" : "Contact Sales Unit"}</span>
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Global Landing Footer */}
      <LandingFooter />
    </div>
  );
}
