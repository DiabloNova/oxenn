"use client";

import { ShieldCheck, TrendingUp, Zap } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { HeroAccessCard } from "@/components/marketing/HeroAccessCard";

/**
 * Award-grade hero: aurora + dotted grid backdrop, Peyda display headline with
 * a brand gradient, YekanBakh supporting copy, and a glassmorphic access card
 * wrapped in an animated conic border.
 */
export function HeroSection() {
  const { language } = useTheme();
  const isFa = language === "fa";

  const chips = [
    { icon: TrendingUp, fa: "افزایش ۳٫۸ برابری ارجاع", en: "3.8× more citations" },
    { icon: ShieldCheck, fa: "پایش لحظه‌ای توهم برند", en: "Live hallucination watch" },
    { icon: Zap, fa: "اتصال به ۴ موتور هوش مصنوعی", en: "4 AI engines connected" },
  ];

  return (
    <section className="aurora-bg relative isolate overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
      {/* dotted grid layer */}
      <div className="grid-backdrop absolute inset-0 -z-10 opacity-60 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 grid lg:grid-cols-[1.15fr_0.85fr] gap-12 lg:gap-10 items-center">
        {/* Copy column */}
        <div className="text-center lg:text-start space-y-7">
          <span className="inline-flex items-center gap-2 rounded-[var(--radius-full)] border border-[color-mix(in_srgb,var(--color-primary-600)_35%,transparent)] bg-[color-mix(in_srgb,var(--color-primary-600)_10%,transparent)] px-3.5 py-1.5 text-xs font-semibold text-[var(--color-primary-600)]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--color-primary-600)] opacity-70 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-primary-600)]" />
            </span>
            {isFa ? "پلتفرم نسل‌بعدی AEO و GEO" : "Next-generation AEO & GEO platform"}
          </span>

          <h1 className="font-display font-black tracking-tight text-balance text-4xl sm:text-5xl md:text-6xl leading-[1.15]">
            <span className="text-[var(--text-primary)]">
              {isFa ? "ارتقای جایگاه دیجیتال شما، در " : "Elevating your digital presence in "}
            </span>
            <span className="text-gradient-brand">
              {isFa ? "نسل جدید موتورهای جستجو" : "the new generation of search engines"}
            </span>
            <span className="text-[var(--text-primary)]">
              {isFa ? " و هوش مصنوعی" : " and AI"}
            </span>
          </h1>

          <p className="text-base md:text-lg text-[var(--text-secondary)] leading-relaxed max-w-xl mx-auto lg:mx-0 text-pretty">
            {isFa
              ? "ما با ارائه راهکارهای یکپارچه بهینه‌سازی سایت (SEO) و موتورهای پاسخگو (AEO)، شما را به اولین انتخاب مخاطبان تبدیل می‌کنیم."
              : "With integrated Search (SEO) and Answer Engine (AEO) optimization, we make your brand the first choice for your audience."}
          </p>

          <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
            {chips.map((chip, i) => {
              const Icon = chip.icon;
              return (
                <span
                  key={i}
                  className="inline-flex items-center gap-2 rounded-[var(--radius-full)] neu-surface px-3.5 py-2 text-xs font-semibold text-[var(--text-secondary)]"
                >
                  <Icon size={15} className="text-[var(--color-primary-600)] rtl:-scale-x-100" />
                  {isFa ? chip.fa : chip.en}
                </span>
              );
            })}
          </div>
        </div>

        {/* Access card column */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <HeroAccessCard locale={language} />
        </div>
      </div>
    </section>
  );
}
