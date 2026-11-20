"use client";

import React, { useEffect, useMemo, useState, type ComponentType, type CSSProperties, type ReactNode } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, CircleHelp, LogOut, Search, Settings2, Sparkles, X } from "lucide-react";

export type SidebarNavigationItem = {
  id: string;
  label: string;
  href: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  exact?: boolean;
};

export type SidebarSection = {
  id: string;
  label: string;
  items: SidebarNavigationItem[];
};

export type SidebarProps = {
  sections: SidebarSection[];
  activeId: string;
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  onNavigate?: (href: string, id: string, label: string) => void;
  brandContent?: ReactNode;
  profileName: string;
  profileSubtitle: string;
  profileInitial?: string;
  menuLabel: string;
  searchPlaceholder: string;
  helpLabel: string;
  settingsLabel: string;
  accountLabel: string;
  logoutLabel: string;
  closeLabel: string;
  onHelpClick?: () => void;
  onSettingsClick?: () => void;
  onProfileClick?: () => void;
  onLogout?: () => void | Promise<void>;
  className?: string;
  style?: CSSProperties;
  direction?: "ltr" | "rtl";
};

const normalizeSearch = (value: string) => value.normalize("NFC")
  .replace(/\u064A/g, "\u06CC")
  .replace(/\u0643/g, "\u06A9")
  .replace(/[\u200C\s]+/g, "")
  .toLowerCase();

export default function Sidebar({
  sections,
  activeId,
  expanded,
  defaultExpanded = false,
  onExpandedChange,
  onNavigate,
  brandContent,
  profileName,
  profileSubtitle,
  profileInitial = "O",
  menuLabel,
  searchPlaceholder,
  helpLabel,
  settingsLabel,
  accountLabel,
  logoutLabel,
  closeLabel,
  onHelpClick,
  onSettingsClick,
  onProfileClick,
  onLogout,
  className,
  style,
  direction = "ltr",
}: SidebarProps) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const [query, setQuery] = useState("");
  const [openSections, setOpenSections] = useState<string[]>(() => sections[0] ? [sections[0].id] : []);
  const isExpanded = expanded ?? internalExpanded;

  const allItems = useMemo(() => sections.flatMap((section) => section.items), [sections]);
  const visibleSections = useMemo(() => {
    const normalized = normalizeSearch(query);
    if (!normalized) return sections;
    return sections.map((section) => ({
      ...section,
      items: section.items.filter((item) => normalizeSearch(`${item.label} ${item.id}`).includes(normalized)),
    })).filter((section) => section.items.length > 0);
  }, [query, sections]);

  useEffect(() => {
    const activeSection = sections.find((section) => section.items.some((item) => item.id === activeId));
    if (activeSection) {
      setOpenSections((current) => current.includes(activeSection.id) ? current : [...current, activeSection.id]);
    }
  }, [activeId, sections]);

  const setExpanded = (next: boolean) => {
    if (expanded === undefined) setInternalExpanded(next);
    onExpandedChange?.(next);
  };

  const activate = (item: SidebarNavigationItem) => {
    if (item.href) onNavigate?.(item.href, item.id, item.label);
  };

  const toggleSection = (sectionId: string) => {
    setOpenSections((current) => current.includes(sectionId)
      ? current.filter((id) => id !== sectionId)
      : [...current, sectionId]);
  };

  return (
    <aside
      dir={direction}
      className={`oxenn-component-sidebar ${isExpanded ? "oxenn-component-sidebar-expanded" : "oxenn-component-sidebar-collapsed"} ${className ?? ""}`.trim()}
      style={style}
      aria-label={menuLabel}
    >
      <div className="oxenn-sidebar-rail">
        <button
          className="oxenn-sidebar-brand"
          type="button"
          aria-label={isExpanded ? closeLabel : menuLabel}
          title={isExpanded ? closeLabel : menuLabel}
          onClick={() => setExpanded(!isExpanded)}
        >
          {brandContent ?? <Sparkles size={23} strokeWidth={2.3} />}
        </button>
        <div className="oxenn-sidebar-divider" />
        <nav className="oxenn-sidebar-rail-nav" aria-label={menuLabel}>
          {allItems.slice(0, 6).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={`oxenn-sidebar-rail-button ${activeId === item.id ? "is-active" : ""}`}
                onClick={() => activate(item)}
                aria-label={item.label}
                aria-current={activeId === item.id ? "page" : undefined}
                title={item.label}
              >
                <Icon size={20} />
              </button>
            );
          })}
        </nav>
        <div className="oxenn-sidebar-rail-spacer" />
        <button className="oxenn-sidebar-rail-button" type="button" aria-label={helpLabel} title={helpLabel} onClick={onHelpClick}>
          <CircleHelp size={19} />
        </button>
        <button className="oxenn-sidebar-rail-button" type="button" aria-label={settingsLabel} title={settingsLabel} onClick={onSettingsClick}>
          <Settings2 size={19} />
        </button>
        <button className="oxenn-sidebar-expand" type="button" onClick={() => setExpanded(!isExpanded)} aria-label={isExpanded ? closeLabel : menuLabel} aria-expanded={isExpanded}>
          {isExpanded ? <ChevronLeft size={17} /> : <ChevronRight size={17} />}
        </button>
      </div>

      <section className="oxenn-sidebar-panel" aria-hidden={!isExpanded} inert={!isExpanded}>
        <header className="oxenn-sidebar-panel-header">
          <strong>OXENN</strong>
          <span>{menuLabel}</span>
          <button type="button" className="oxenn-sidebar-close" aria-label={closeLabel} onClick={() => setExpanded(false)}><X size={17} /></button>
        </header>

        <label className="oxenn-sidebar-search">
          <Search size={16} aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={searchPlaceholder} aria-label={searchPlaceholder} tabIndex={isExpanded ? 0 : -1} />
          {query && <button type="button" aria-label={closeLabel} onClick={() => setQuery("")}><X size={14} /></button>}
        </label>

        <nav className="oxenn-sidebar-main-nav" aria-label={menuLabel}>
          {visibleSections.map((section) => {
            const isOpen = Boolean(query.trim()) || openSections.includes(section.id);
            return (
              <section key={section.id} className="oxenn-sidebar-nav-section">
                <button
                  type="button"
                  className="oxenn-sidebar-section-title"
                  onClick={() => toggleSection(section.id)}
                  aria-expanded={isOpen}
                  tabIndex={isExpanded ? 0 : -1}
                >
                  <span>{section.label}</span>
                  <ChevronDown className={isOpen ? "is-open" : ""} size={15} />
                </button>
                {isOpen && (
                  <div className="oxenn-sidebar-section-items">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const selected = activeId === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={`oxenn-sidebar-nav-item ${selected ? "is-active" : ""}`}
                          onClick={() => activate(item)}
                          aria-current={selected ? "page" : undefined}
                          tabIndex={isExpanded ? 0 : -1}
                        >
                          <Icon size={18} strokeWidth={1.8} />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
          {visibleSections.length === 0 && <p className="oxenn-sidebar-empty" role="status">—</p>}
        </nav>

        <footer className="oxenn-sidebar-profile">
          <button type="button" className="oxenn-sidebar-avatar" aria-label={accountLabel} onClick={onProfileClick}>{profileInitial.slice(0, 1)}</button>
          <button type="button" className="oxenn-sidebar-profile-copy" onClick={onProfileClick}>
            <strong>{profileName}</strong><span>{profileSubtitle}</span>
          </button>
          <div className="oxenn-sidebar-profile-actions">
            <button type="button" aria-label={settingsLabel} title={settingsLabel} onClick={onSettingsClick}><Settings2 size={16} /></button>
            {onLogout && <button type="button" aria-label={logoutLabel} title={logoutLabel} onClick={() => { void onLogout(); }}><LogOut size={16} /></button>}
          </div>
        </footer>
      </section>
    </aside>
  );
}
