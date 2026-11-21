"use client";

import React, { useId, useRef, useState } from "react";

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  defaultTabId?: string;
  activeTabId?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
  ariaLabel?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTabId,
  activeTabId,
  onTabChange,
  className = "",
  ariaLabel = "Page sections",
}) => {
  const [localActiveTab, setLocalActiveTab] = useState(defaultTabId || tabs[0]?.id);
  const tabsId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const isControlled = activeTabId !== undefined;
  const activeTab = isControlled ? activeTabId : localActiveTab;
  const activeIndex = tabs.findIndex((tab) => tab.id === activeTab);

  const handleTabClick = (tabId: string) => {
    if (!isControlled) {
      setLocalActiveTab(tabId);
    }
    onTabChange?.(tabId);
  };

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const direction = event.currentTarget.closest("[dir]")?.getAttribute("dir") || document.documentElement.dir || "ltr";
    const isRtl = direction === "rtl";
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight") {
      nextIndex = (index + (isRtl ? -1 : 1) + tabs.length) % tabs.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (index + (isRtl ? 1 : -1) + tabs.length) % tabs.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = tabs.length - 1;
    }

    if (nextIndex === null || tabs.length === 0) return;

    event.preventDefault();
    const nextTab = tabs[nextIndex];
    if (!isControlled) {
      setLocalActiveTab(nextTab.id);
    }
    onTabChange?.(nextTab.id);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="border-b border-[var(--border)]">
        <nav
          className="-mb-px flex gap-8"
          aria-label={ariaLabel}
          role="tablist"
          aria-orientation="horizontal"
        >
          {tabs.map((tab, index) => {
            const isActive = activeTab === tab.id;
            const tabId = `${tabsId}-tab-${index}`;
            const tabPanelId = `${tabsId}-panel-${index}`;

            return (
              <button
                key={tab.id}
                ref={(element) => {
                  tabRefs.current[index] = element;
                }}
                id={tabId}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={tabPanelId}
                tabIndex={isActive ? 0 : -1}
                onClick={() => handleTabClick(tab.id)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all duration-150 ${
                  isActive
                    ? "border-[var(--color-accent-600)] text-[var(--color-accent-600)] font-semibold"
                    : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border)]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-6">
        {tabs.map((tab, index) => {
          const isActive = index === activeIndex;
          return (
            <div
              key={tab.id}
              id={`${tabsId}-panel-${index}`}
              role="tabpanel"
              aria-labelledby={`${tabsId}-tab-${index}`}
              tabIndex={isActive ? 0 : -1}
              hidden={!isActive}
            >
              {isActive ? tab.content : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};
