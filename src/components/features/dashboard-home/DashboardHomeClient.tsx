"use client";

import React from "react";
import { useTheme } from "@/components/ThemeProvider";
import type { DashboardSummaryData } from "@/services/dashboard-home";
import {
  Activity,
  ArrowUpLeft,
  ArrowUpRight,
  BarChart3,
  Boxes,
  BrainCircuit,
  Compass,
  FileSearch,
  GitBranch,
  Globe2,
  Lightbulb,
  MessageCircle,
  Network,
  Package,
  Radar,
  Route,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Workflow,
} from "lucide-react";

interface DashboardHomeClientProps {
  initialData: DashboardSummaryData;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    workspaceId: string;
  } | null;
}

const domains = [
  { icon: Package, fa: "پروفایل هوشمندی محصول", en: "Product Intelligence Profile", detailFa: "شناخت و تعریف محصول، مخاطب و هدف", detailEn: "Product, audience and objective context", tone: "sky" },
  { icon: FileSearch, fa: "ارزیابی محصول دیجیتال", en: "Digital Product Assessment", detailFa: "بررسی تجربه و بلوغ محصول", detailEn: "Product experience and maturity", tone: "violet" },
  { icon: BarChart3, fa: "ارزش و رقابت‌پذیری", en: "Value & Competitiveness", detailFa: "تمایز، ارزش پیشنهادی و رقبا", detailEn: "Differentiation, value and competitors", tone: "orange" },
  { icon: Globe2, fa: "هوشمندی بازار جغرافیایی", en: "Geo-Market Intelligence", detailFa: "بازارها، مناطق و فرصت‌های محلی", detailEn: "Markets, regions and local opportunities", tone: "emerald" },
  { icon: Network, fa: "گراف شواهد محصول", en: "Product Evidence Graph", detailFa: "پیوند یافته‌ها، شواهد و تصمیم‌ها", detailEn: "Connect findings, evidence and decisions", tone: "cyan" },
  { icon: Target, fa: "آزمایشگاه شبیه‌سازی و بازده", en: "Simulation & ROI Lab", detailFa: "بررسی سناریوها و پیامدها", detailEn: "Explore scenarios and expected outcomes", tone: "amber" },
  { icon: Users, fa: "شبکه متخصصان", en: "Expert Network", detailFa: "دسترسی به تخصص و همکاری انسانی", detailEn: "Human expertise and collaboration", tone: "pink" },
  { icon: Workflow, fa: "برنامه‌ریزی و اجرای بهبود", en: "Planning & Execution Engine", detailFa: "تبدیل اولویت‌ها به برنامه و اقدام", detailEn: "Turn priorities into plans and actions", tone: "indigo" },
  { icon: TrendingUp, fa: "چرخه بهبود مستمر", en: "Continuous Improvement Loop", detailFa: "اندازه‌گیری پیشرفت و یادگیری", detailEn: "Measure progress and learn over time", tone: "teal" },
];

const cycle = [
  { icon: Radar, fa: "شناخت", en: "Understand", descFa: "تعریف محصول و بازار", descEn: "Product and market context" },
  { icon: BrainCircuit, fa: "ارزیابی", en: "Assess", descFa: "کشف فاصله‌ها و فرصت‌ها", descEn: "Discover gaps and opportunities" },
  { icon: Lightbulb, fa: "تصمیم‌سازی", en: "Decide", descFa: "تحلیل گزینه‌ها و اولویت‌ها", descEn: "Compare options and priorities" },
  { icon: Route, fa: "اقدام", en: "Act", descFa: "برنامه‌ریزی و اجرا", descEn: "Plan and execute" },
  { icon: Activity, fa: "یادگیری", en: "Learn", descFa: "سنجش نتیجه و اصلاح مسیر", descEn: "Measure and improve" },
];

export default function DashboardHomeClient(_props: DashboardHomeClientProps) {
  const { language, direction } = useTheme();
  const isFa = language === "fa";
  const Arrow = isFa ? ArrowUpLeft : ArrowUpRight;

  return (
    <div className="space-y-6 pb-8 text-start" dir={direction}>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-primary-600)]">
            <Sparkles size={15} />
            <span>{isFa ? "مرکز هوشمندی و بهبود محصول" : "PRODUCT INTELLIGENCE WORKSPACE"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--text-primary)]">
            {isFa ? "نمای کلی فضای کاری" : "Workspace Overview"}
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
            {isFa
              ? "تصویری یکپارچه از محصول، بازار، فرصت‌های بهبود و مسیر حرکت پیش رو."
              : "A unified view of your product, market, improvement opportunities and the path ahead."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)]">
            {isFa ? "فضای کاری: کسب‌وکار من" : "Workspace: My Business"}
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary-600)] px-4 py-2.5 text-xs font-bold text-white shadow-sm">
            <Sparkles size={15} />
            {isFa ? "شروع ارزیابی محصول" : "Start product assessment"}
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.8fr)]">
        <div className="relative min-h-[260px] overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8">
          <div className="pointer-events-none absolute -end-16 -top-24 h-64 w-64 rounded-full bg-[var(--color-primary-600)] opacity-[0.09] blur-3xl" />
          <div className="relative flex h-full flex-col justify-between gap-8">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--background)]/60 px-3 py-1.5 text-[11px] font-bold text-[var(--text-secondary)]">
                  <Package size={13} />
                  {isFa ? "نمای محصول" : "PRODUCT OVERVIEW"}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">
                  {isFa ? "محصول خود را از یک نقطه مدیریت کنید" : "One place to understand and improve your product"}
                </h2>
                <p className="max-w-xl text-sm leading-7 text-[var(--text-secondary)]">
                  {isFa
                    ? "پروفایل محصول، ارزیابی‌ها، جایگاه رقابتی، شواهد و برنامه‌های بهبود در یک فضای منسجم کنار هم قرار می‌گیرند."
                    : "Product profile, assessments, competitive position, evidence and improvement plans come together in one coherent workspace."}
                </p>
              </div>
              <div className="hidden sm:grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--background)] text-[var(--color-primary-600)]">
                <Boxes size={26} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { labelFa: "حوزه‌های محصول", labelEn: "Product domains", valueFa: "۰۹", valueEn: "09", icon: Boxes },
                { labelFa: "چرخه‌های کاری", labelEn: "Operating stages", valueFa: "۰۵", valueEn: "05", icon: GitBranch },
                { labelFa: "تمرکز اصلی", labelEn: "Primary focus", valueFa: "محصول", valueEn: "Product", icon: Target },
                { labelFa: "رویکرد", labelEn: "Approach", valueFa: "پیوسته", valueEn: "Continuous", icon: Activity },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.labelEn} className="rounded-2xl border border-[var(--border)] bg-[var(--background)]/65 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold text-[var(--text-muted)]">{isFa ? item.labelFa : item.labelEn}</span>
                      <Icon size={14} className="text-[var(--color-primary-600)]" />
                    </div>
                    <div className="text-base font-black text-[var(--text-primary)]">{isFa ? item.valueFa : item.valueEn}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <aside className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-black text-[var(--text-primary)]">{isFa ? "تمرکز فعلی" : "Current focus"}</h3>
              <span className="rounded-full bg-[var(--color-info-bg)] px-2.5 py-1 text-[10px] font-bold text-[var(--color-info)]">{isFa ? "نمای کلی" : "OVERVIEW"}</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--background)] text-[var(--color-primary-600)]"><Compass size={19} /></div>
              <div>
                <p className="text-sm font-bold text-[var(--text-primary)]">{isFa ? "شناخت وضعیت محصول و بازار" : "Understand product and market"}</p>
                <p className="mt-1 text-xs leading-6 text-[var(--text-secondary)]">{isFa ? "نقطه شروع برای مرور ۹ حوزه اصلی پلتفرم." : "The starting point for exploring the platform's nine domains."}</p>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-[var(--color-primary-600)]/20 bg-[var(--color-info-bg)]/45 p-5">
            <div className="mb-3 flex items-center gap-2 text-[var(--color-primary-600)]"><MessageCircle size={17} /><span className="text-xs font-black">{isFa ? "همراه هوشمند" : "AI companion"}</span></div>
            <p className="text-sm font-bold text-[var(--text-primary)]">{isFa ? "برای بررسی مسیر بهبود آماده‌اید؟" : "Ready to explore an improvement path?"}</p>
            <p className="mt-1 text-xs leading-6 text-[var(--text-secondary)]">{isFa ? "درباره محصول، یافته‌ها یا اولویت‌های خود گفتگو کنید." : "Discuss your product, findings or priorities."}</p>
            <div className="mt-4 inline-flex items-center gap-2 text-xs font-black text-[var(--color-primary-600)]">
              {isFa ? "گفتگو را آغاز کنید" : "Start a conversation"} <Arrow size={14} />
            </button>
          </div>
        </aside>
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-[var(--text-primary)]">{isFa ? "حوزه‌های اصلی پلتفرم" : "Platform domains"}</h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{isFa ? "۹ بخش به‌هم‌پیوسته برای شناخت، تحلیل و بهبود محصول" : "Nine connected areas for understanding, analyzing and improving a product"}</p>
          </div>
          <span className="text-[10px] font-bold text-[var(--text-muted)]">09 {isFa ? "حوزه" : "DOMAINS"}</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
          {domains.map((domain, index) => {
            const Icon = domain.icon;
            return (
              <article key={domain.en} className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 transition duration-200 hover:-translate-y-0.5 hover:border-[var(--color-primary-600)]/40 hover:shadow-md">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--background)] text-[var(--color-primary-600)] transition group-hover:bg-[var(--color-info-bg)]">
                    <Icon size={19} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-[10px] font-black text-[var(--text-muted)]">{String(index + 1).padStart(2, "0")}</span>
                      <h3 className="text-sm font-black text-[var(--text-primary)]">{isFa ? domain.fa : domain.en}</h3>
                    </div>
                    <p className="text-xs leading-6 text-[var(--text-secondary)]">{isFa ? domain.detailFa : domain.detailEn}</p>
                  </div>
                  <Arrow size={15} className="mt-1 shrink-0 text-[var(--text-muted)] opacity-0 transition group-hover:opacity-100" />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-black text-[var(--text-primary)]">{isFa ? "چرخه عملیاتی بهبود محصول" : "Product improvement cycle"}</h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{isFa ? "مسیر پیوسته از شناخت تا یادگیری و بهبود دوباره" : "A continuous path from understanding to learning and improvement"}</p>
          </div>
          <span className="text-[10px] font-bold text-[var(--text-muted)]">{isFa ? "چارچوب کلان پلتفرم" : "PLATFORM FRAMEWORK"}</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {cycle.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.en} className="relative rounded-2xl bg-[var(--background)] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--color-info-bg)] text-[var(--color-primary-600)]"><Icon size={16} /></span>
                  <span className="text-[10px] font-black text-[var(--text-muted)]">0{index + 1}</span>
                </div>
                <h3 className="text-sm font-black text-[var(--text-primary)]">{isFa ? step.fa : step.en}</h3>
                <p className="mt-1 text-[11px] leading-5 text-[var(--text-secondary)]">{isFa ? step.descFa : step.descEn}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-black text-[var(--text-primary)]">{isFa ? "نقشه اولویت‌های بهبود" : "Improvement priorities"}</h2>
            <Target size={17} className="text-[var(--color-primary-600)]" />
          </div>
          <div className="space-y-3">
            {[isFa ? "فرصت‌های کلیدی محصول" : "Key product opportunities", isFa ? "شکاف‌های ارزش پیشنهادی" : "Value proposition gaps", isFa ? "فرصت‌های بازار هدف" : "Target market opportunities"].map((label, index) => (
              <div key={label} className="flex items-center gap-3 rounded-xl bg-[var(--background)] p-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-[var(--border)] text-[10px] font-black text-[var(--text-muted)]">0{index + 1}</span>
                <span className="flex-1 text-xs font-semibold text-[var(--text-secondary)]">{label}</span>
                <span className="text-[10px] text-[var(--text-muted)]">{isFa ? "در انتظار بررسی" : "To explore"}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-black text-[var(--text-primary)]">{isFa ? "فضای اقدام و پیگیری" : "Action & follow-up space"}</h2>
            <Activity size={17} className="text-[var(--color-primary-600)]" />
          </div>
          <div className="flex min-h-[148px] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--background)] px-5 py-6 text-center">
            <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-[var(--color-info-bg)] text-[var(--color-primary-600)]"><GitBranch size={19} /></div>
            <p className="text-sm font-bold text-[var(--text-primary)]">{isFa ? "برنامه‌ها و اقدامات در یک نگاه" : "Plans and actions at a glance"}</p>
            <p className="mt-1 max-w-sm text-xs leading-6 text-[var(--text-muted)]">{isFa ? "این فضا برای نمایش مسیرها، تصمیم‌ها و اقدامات مرتبط با اولویت‌های محصول در نظر گرفته شده است." : "A dedicated area for product plans, decisions and actions linked to current priorities."}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
