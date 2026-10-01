"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, TrendingUp, Zap } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";

/**
 * Award-grade hero: aurora + dotted grid backdrop, Peyda display headline with
 * a brand gradient, YekanBakh supporting copy, and a glassmorphic access card
 * wrapped in an animated conic border.
 */
export function HeroSection() {
  const { session } = useAuth();
  const { language } = useTheme();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const isFa = language === "fa";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    // Redirect to register with the email prefilled
    window.location.href = `/${language}/register?email=${encodeURIComponent(email)}`;
    setIsLoading(false);
  };

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
          <div className="animated-border-glass p-6 sm:p-7">
            {session.status === "authenticated" ? (
              <div className="space-y-5 text-center">
                <div className="mx-auto grid place-items-center w-14 h-14 rounded-[var(--radius-lg)] neu-surface text-[var(--color-primary-600)] glow-ring">
                  <ShieldCheck size={26} />
                </div>
                <div className="space-y-1">
                  <h2 className="font-display font-bold text-lg text-[var(--text-primary)]">
                    {isFa ? "نشست شما فعال است" : "Your session is active"}
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] break-all">
                    {session.user?.email}
                  </p>
                </div>
                <Link href={`/${language}/dashboard`} className="block">
                  <Button variant="primary" size="lg" className="w-full font-bold gap-2">
                    {isFa ? "ورود به پیشخوان کاربری" : "Enter admin console"}
                    <ArrowRight size={18} className="rtl:-scale-x-100" />
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-start">
                <div className="space-y-1">
                  <h2 className="font-display font-bold text-lg text-[var(--text-primary)]">
                    {isFa ? "ورود سریع به میز کار" : "Access the workspace"}
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    {isFa
                      ? "ایمیل سازمانی خود را برای مشاهده‌ی نسخه‌ی نمایشی وارد کنید."
                      : "Enter your business email to open the live sandbox demo."}
                  </p>
                </div>
                <Input
                  type="email"
                  placeholder={isFa ? "you@company.com" : "you@company.com"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  aria-label={isFa ? "ایمیل سازمانی" : "Business email"}
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full font-bold gap-2"
                  disabled={isLoading}
                >
                  {isLoading
                    ? isFa
                      ? "در حال اعتبارسنجی..."
                      : "Validating secure session..."
                    : isFa
                      ? "ورود به نسخه‌ی دمو"
                      : "Access live sandbox demo"}
                  {!isLoading && <ArrowRight size={18} className="rtl:-scale-x-100" />}
                </Button>
                <p className="text-[11px] text-[var(--text-muted)] text-center pt-1">
                  {isFa
                    ? "بدون نیاز به کارت اعتباری — محیط آزمایشی امن"
                    : "No credit card required — secure sandbox environment"}
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
