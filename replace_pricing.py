import os
import re

filepath = "src/app/[locale]/pricing/page.tsx"
if not os.path.exists(filepath):
    print("File not found")
    exit(1)

with open(filepath, 'r') as f:
    content = f.read()

# I will write a completely new pricing page based on the previous code but using the domain plans.ts
new_content = """"use client";

import { AmbientSpheres } from "@/components/backgrounds/AmbientSpheres";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/Card";
import { Button } from "@/components/Button";
import { Check, Sparkles, ChevronRight, Construction } from "lucide-react";
import { PLANS } from "@/features/billing/domain/plans";

export default function PricingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, direction } = useTheme();
  const isRtl = language === "fa";

  const handlePlanSelection = React.useCallback((planName: string) => {
    router.push(`/${language}/register?plan=${encodeURIComponent(planName)}`);
  }, [router, language]);

  // Check if there was a pre-selected plan in the query params (e.g. from landing page)
  useEffect(() => {
    const planParam = searchParams?.get("plan");
    if (planParam) {
      queueMicrotask(() => {
        handlePlanSelection(planParam);
      });
    }
  }, [searchParams, handlePlanSelection]);

  const strings = {
    title: isRtl ? "طرح‌های اشتراک و تعرفه‌ها" : "Enterprise Grade Pricing",
    subtitle: isRtl
      ? "پیکربندی هوشمند و ممیزی دیده‌شدن برند خود در مدل‌های زبانی با پلن‌های متناسب با مقیاس کسب‌وکار شما."
      : "Start measuring and optimizing your LLM footprint. Choose the subscription matching your scale.",
    currency: isRtl ? "دلار / ماه" : "$ / mo",
    cta: isRtl ? "شروع و ثبت‌نام" : "Start & Register",
  };

  const planArray = [PLANS.free, PLANS.professional, PLANS.business, PLANS.enterprise];

  return (
    <div className="min-h-screen relative overflow-hidden text-[var(--foreground)] py-12 px-4 sm:px-6 lg:px-8" dir={direction}>
      <AmbientSpheres />

      <div className="max-w-7xl mx-auto space-y-12 animate-fade-in text-center">
        {/* Header Title */}
        <div className="space-y-4 max-w-2xl mx-auto">
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-[var(--sky-blue-500)] border border-[var(--sky-blue-500)]/20 bg-[var(--sky-blue-500)]/5 inline-block">
            {isRtl ? "تعرفه‌ها" : "PRICING PLANS"}
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-gradient-brand leading-none font-display">
            {strings.title}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            {strings.subtitle}
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {planArray.map((plan, index) => {
             const isPopular = plan.id === "business";
             const price = plan.quotas.monthlyCostLimitUsd === 0 ? "0" : plan.quotas.monthlyCostLimitUsd.toString();
             const isEnterprise = plan.id === "enterprise";

             return (
              <div key={plan.id} className={`relative rounded-3xl p-[2px] transition-transform duration-300 ${isPopular ? "bg-gradient-to-br from-[var(--sky-blue-500)] to-[var(--orange-500)] shadow-xl md:-translate-y-2" : ""}`}>
                {isPopular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[var(--sky-blue-500)] to-[var(--orange-500)] text-white text-[9px] font-black rounded-full uppercase tracking-widest shadow-md">
                    {isRtl ? "محبوب‌ترین پلن" : "MOST POPULAR"}
                  </span>
                )}

                <Card className={`h-full border ${isPopular ? "border-none bg-slate-950/95 text-white" : "border-[var(--border)] bg-[var(--card)]"} backdrop-blur-md flex flex-col justify-between text-start rounded-[22px] hover:border-sky-500/20`}>
                  <CardHeader className="pb-4">
                    <CardTitle className={`text-lg font-black ${isPopular ? "text-white" : "text-[var(--text-primary)]"}`}>{plan.name}</CardTitle>
                    <div className="pt-4 flex items-baseline gap-1">
                      <span className={`text-4xl font-black font-display ${isPopular ? "text-white" : "text-[var(--text-primary)]"}`}>
                        {isEnterprise ? (isRtl ? "تماس" : "Custom") : price}
                      </span>
                      {!isEnterprise && (
                        <span className={`text-xs font-bold ${isPopular ? "text-slate-400" : "text-[var(--text-muted)]"}`}>{strings.currency}</span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-0 flex-1 flex flex-col justify-between">
                    <ul className={`space-y-2.5 text-xs font-semibold border-t pt-4 ${isPopular ? "text-slate-200 border-white/10" : "text-[var(--text-secondary)] border-[var(--border)]"}`}>
                      <li className="flex items-center gap-2">
                        <Check size={14} className={isPopular ? "text-[var(--sky-blue-500)]" : "text-emerald-400"} />
                        <span>{isRtl ? `حداکثر پروژه: ${plan.entitlements.maxProjects}` : `Max Projects: ${plan.entitlements.maxProjects}`}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={14} className={isPopular ? "text-[var(--sky-blue-500)]" : "text-emerald-400"} />
                        <span>{isRtl ? `حداکثر کلمه کلیدی: ${plan.entitlements.maxKeywords}` : `Max Keywords: ${plan.entitlements.maxKeywords}`}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={14} className={isPopular ? "text-[var(--sky-blue-500)]" : "text-emerald-400"} />
                        <span>{isRtl ? `محدودیت توکن ماهانه: ${plan.quotas.monthlyTokenLimit}` : `Monthly Token Limit: ${plan.quotas.monthlyTokenLimit}`}</span>
                      </li>
                      {plan.entitlements.canExportReports && (
                        <li className="flex items-center gap-2">
                          <Check size={14} className={isPopular ? "text-[var(--sky-blue-500)]" : "text-emerald-400"} />
                          <span>{isRtl ? "خروجی گزارش" : "Export Reports"}</span>
                        </li>
                      )}
                      {plan.entitlements.canUseCustomPrompts && (
                        <li className="flex items-center gap-2">
                          <Construction size={14} className="text-orange-400 shrink-0" title="Coming soon" />
                          <span className="opacity-70 line-through decoration-orange-400/50">{isRtl ? "پرامپت‌های سفارشی (به زودی)" : "Custom Prompts (Coming Soon)"}</span>
                        </li>
                      )}
                      {plan.entitlements.canAccessApi && (
                         <li className="flex items-center gap-2">
                           <Construction size={14} className="text-orange-400 shrink-0" title="Coming soon" />
                           <span className="opacity-70 line-through decoration-orange-400/50">{isRtl ? "دسترسی API (به زودی)" : "API Access (Coming Soon)"}</span>
                         </li>
                      )}
                    </ul>

                    <Button
                      variant={isPopular ? "primary" : "outline"}
                      onClick={() => handlePlanSelection(plan.id)}
                      className={`w-full mt-6 py-3 rounded-xl text-xs font-black gap-2 flex items-center justify-center cursor-pointer ${isPopular ? "bg-gradient-to-r from-[var(--sky-blue-500)] to-[var(--orange-500)] border-none text-white shadow-lg" : "hover:bg-white/5"}`}
                    >
                      {isPopular && <Sparkles size={14} className="animate-pulse" />}
                      <span>{strings.cta}</span>
                      {!isPopular && <ChevronRight size={13} className={isRtl ? "rotate-180" : ""} />}
                    </Button>
                  </CardContent>
                </Card>
              </div>
             )
          })}
        </div>
      </div>
    </div>
  );
}
"""

with open(filepath, 'w') as f:
    f.write(new_content)
