"use client";

import { useState } from "react";
import { useTheme } from "@/components/ThemeProvider";

export interface OwnerPageTab { id: string; labelFa: string; labelEn: string }
export interface OwnerPageSection { id: string; titleFa: string; titleEn: string }

interface OwnerDefinedPageProps {
  titleFa: string;
  titleEn: string;
  tabs?: OwnerPageTab[];
  sections?: OwnerPageSection[];
}

export function OwnerDefinedPage({ titleFa, titleEn, tabs, sections }: OwnerDefinedPageProps) {
  const { language, direction } = useTheme();
  const isFa = language === "fa";
  const [activeTab, setActiveTab] = useState(tabs?.[0]?.id ?? "");
  const active = tabs?.find((tab) => tab.id === activeTab) ?? tabs?.[0];
  const pendingCopy = isFa ? "جزئیات محتوایی این بخش هنوز تعیین نشده است." : "The content details for this section have not been specified yet.";

  return (
    <div className="space-y-6" dir={direction}>
      <header>
        <h1 className="text-2xl md:text-3xl font-black text-[var(--text-primary)]">{isFa ? titleFa : titleEn}</h1>
      </header>
      {tabs && tabs.length > 0 && (
        <div role="tablist" aria-label={isFa ? titleFa : titleEn} className="flex flex-wrap gap-2 border-b border-[var(--border)]">
          {tabs.map((tab) => (
            <button key={tab.id} type="button" role="tab"
              id={"owner-tab-" + tab.id}
              aria-selected={active?.id === tab.id}
              aria-controls="owner-tab-panel"
              onClick={() => setActiveTab(tab.id)}
              className={"px-4 py-3 text-sm font-bold border-b-2 transition-colors " + (active?.id === tab.id ? "border-[var(--sky-blue-500)] text-[var(--text-primary)]" : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]")}>
              {isFa ? tab.labelFa : tab.labelEn}
            </button>
          ))}
        </div>
      )}
      {active && (
        <section id="owner-tab-panel" role="tabpanel" aria-labelledby={"owner-tab-" + active.id} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 md:p-7">
          <h2 className="text-lg font-extrabold text-[var(--text-primary)]">{isFa ? active.labelFa : active.labelEn}</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">{pendingCopy}</p>
        </section>
      )}
      {sections?.map((section) => (
        <section key={section.id} id={section.id} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 md:p-7">
          <h2 className="text-lg font-extrabold text-[var(--text-primary)]">{isFa ? section.titleFa : section.titleEn}</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">{pendingCopy}</p>
        </section>
      ))}
    </div>
  );
}
