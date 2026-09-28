import os

filepath = "src/components/marketing/MetricsSection.tsx"
with open(filepath, 'r') as f:
    content = f.read()

# Replace metrics with honest feature-focused highlights
# Note: we need to import Link and FileText, Network, Search, Zap or similar from lucide-react?
# Wait, let's keep it simple. We can just use the existing components and change the text.
new_content = """"use client";

import React from "react";
import { useTheme } from "@/components/ThemeProvider";
import Link from "next/link";
import { Search, Network, Bot, Zap } from "lucide-react";

/**
 * Core product capabilities rendered on neumorphic tiles for a tactile, premium feel.
 */
export function MetricsSection() {
  const { language } = useTheme();
  const isFa = language === "fa";

  const metrics = [
    {
      icon: <Search className="w-8 h-8 text-[var(--sky-blue-500)]" />,
      fa: "پایش نتایج جستجوی مکالمه‌ای",
      en: "Conversational search monitoring",
      link: `/${language}/docs`
    },
    {
      icon: <Bot className="w-8 h-8 text-[var(--orange-500)]" />,
      fa: "یکپارچه‌سازی موتورهای هوش مصنوعی",
      en: "AI engine integration",
      link: `/${language}/docs`
    },
    {
      icon: <Network className="w-8 h-8 text-[#c084fc]" />,
      fa: "کشف و تحلیل توهم‌های متنی",
      en: "Hallucination & claim detection",
      link: `/${language}/features`
    },
    {
      icon: <Zap className="w-8 h-8 text-emerald-500" />,
      fa: "آلرت‌های آنی و گزارش‌های زمان‌بندی",
      en: "Real-time alerts & scheduling",
      link: `/${language}/features`
    },
  ];

  return (
    <section id="capabilities" className="py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="neu-surface rounded-[var(--radius-xl)] p-8 md:p-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {metrics.map((m, i) => (
              <Link href={m.link} key={i} className="text-center space-y-4 hover:scale-[1.02] transition-transform block p-4 rounded-xl hover:bg-white/5">
                <div className="flex justify-center mb-2">
                  {m.icon}
                </div>
                <h3 className="font-display font-black text-lg md:text-xl text-[var(--text-primary)] leading-tight">
                  {isFa ? m.fa : m.en}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
"""

with open(filepath, 'w') as f:
    f.write(new_content)

# Log the removal
with open('verification/fe/FE-007-secondary.md', 'a') as f:
    f.write("- Removed fabricated metrics (3.8x, 92%, <60s, 4 AI engines connected) from MetricsSection.tsx and replaced with product capability links.\n")
