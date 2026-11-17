"use client";

import { useRef, useState, type KeyboardEvent } from "react";
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
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const active = tabs?.find((tab) => tab.id === activeTab) ?? tabs?.[0];
  const pendingCopy = isFa
    ? "جزئیات این بخش هنوز تعیین نشده و به منبع دادهٔ معتبر متصل نیست."
    : "The details for this section have not been specified, and no verified data source is connected yet.";

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!tabs?.length) return;
    const nextKey = isFa ? "ArrowLeft" : "ArrowRight";
    const previousKey = isFa ? "ArrowRight" : "ArrowLeft";
    let nextIndex = index;
    if (event.key === nextKey) nextIndex = (index + 1) % tabs.length;
    else if (event.key === previousKey) nextIndex = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = tabs.length - 1;
    else return;

    event.preventDefault();
    const nextTab = tabs[nextIndex];
    setActiveTab(nextTab.id);
    tabRefs.current[nextTab.id]?.focus();
  };

  return (
    <div className="space-y-6" dir={direction}>
      <header>
        <h1 className="text-2xl md:text-3xl font-black text-[var(--text-primary)]">{isFa ? titleFa : titleEn}</h1>
      </header>
      {tabs && tabs.length > 0 && (
        <div role="tablist" aria-orientation="horizontal" aria-label={isFa ? titleFa : titleEn} className="flex flex-wrap gap-2 border-b border-[var(--border)]">
          {tabs.map((tab) => (
            <button key={tab.id} ref={(element) => { tabRefs.current[tab.id] = element; }} type="button" role="tab"
              id={"owner-tab-" + tab.id}
              tabIndex={active?.id === tab.id ? 0 : -1}
              onKeyDown={(event) => handleTabKeyDown(event, tabs.indexOf(tab))}
              aria-selected={active?.id === tab.id}
              aria-controls="owner-tab-panel"
              onClick={() => setActiveTab(tab.id)}
              className={"px-4 py-3 text-sm font-bold border-b-2 transition-colors " + (active?.id === tab.id ? "border-[var(--sky-blue-500)] text-[var(--text-primary)]" : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]")}>
              {isFa ? tab.labelFa : tab.labelEn}
            </button>
          ))}
        </div>
      )}
      {!active && (!sections || sections.length === 0) && (
        <p className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-sm leading-7 text-[var(--text-muted)]">{pendingCopy}</p>
      )}
      {active && (
        <section id="owner-tab-panel" role="tabpanel" tabIndex={0} aria-labelledby={"owner-tab-" + active.id} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 md:p-7">
          <h2 className="text-lg font-extrabold text-[var(--text-primary)]">{isFa ? active.labelFa : active.labelEn}</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">{pendingCopy}</p>
        </section>
      )}
      {sections && sections.length > 0 && (
        <section aria-label={isFa ? "بخش‌های این صفحه" : "Page sections"} className="space-y-4">
          <p className="text-sm leading-7 text-[var(--text-muted)]">{pendingCopy}</p>
          <ul className="flex flex-wrap gap-3 list-none p-0 m-0">
            {sections.map((section) => (
              <li key={section.id} id={section.id} className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">
                {isFa ? section.titleFa : section.titleEn}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
