"use client";

import { useState } from "react";
import {
  Activity, Bookmark, BriefcaseBusiness, ChevronDown, ChevronLeft, ChevronRight,
  CircleHelp, Compass, CreditCard, Folder, FolderOpen, Home, LayoutGrid, Mail,
  Plus, Search, Settings2, Sparkles, Users, X
} from "lucide-react";
import styles from "./sidebar.module.css";

type SubItem = { label: string; icon?: "folder" | "folderOpen"; count?: number };
type NavItem = {
  id: string; label: string; icon: typeof Home; badge?: string;
  expandable?: boolean; children?: SubItem[];
};

const navigation: NavItem[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "messages", label: "Messages", icon: Mail, badge: "2" },
  { id: "integrations", label: "Integrations", icon: LayoutGrid, expandable: true,
    children: [{ label: "Connected apps" }, { label: "Discover apps" }, { label: "API keys" }] },
  { id: "finance", label: "Finance", icon: CreditCard },
  { id: "threads", label: "Threads", icon: BriefcaseBusiness, expandable: true,
    children: [{ label: "Fignuts" }, { label: "Enlarz System" }, { label: "Hugicons" }] },
  { id: "contacts", label: "Contacts", icon: Users },
  { id: "explore", label: "Explore", icon: Compass, expandable: true,
    children: [{ label: "Discover" }, { label: "Collections" }, { label: "Recently viewed" }] },
];

const quickLinks: SubItem[] = [{ label: "Archive" }, { label: "Favourites" }];
const drafts: SubItem[] = [{ label: "General" }, { label: "Drafts" }, { label: "Feedback" }];
const folders: SubItem[] = [{ label: "Stroke LLC" }, { label: "Duotone" }, { label: "Solid" }, { label: "Animations" }];

export type SidebarProps = {
  defaultExpanded?: boolean;
  onNavigate?: (id: string, label: string) => void;
  className?: string;
};

export default function Sidebar({ defaultExpanded = false, onNavigate, className }: SidebarProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [active, setActive] = useState("threads");
  const [activeSub, setActiveSub] = useState("Enlarz System");
  const [openGroups, setOpenGroups] = useState<string[]>(["threads"]);
  const [query, setQuery] = useState("");

  const choose = (item: NavItem) => {
    setActive(item.id);
    if (item.expandable) {
      setOpenGroups((current) => current.includes(item.id)
        ? current.filter((id) => id !== item.id) : [...current, item.id]);
      if (!expanded) setExpanded(true);
    }
    onNavigate?.(item.id, item.label);
  };

  const renderSubItems = (items: SubItem[], group: string) => (
    <div className={styles.subItems}>
      {items.map((item) => {
        const selected = activeSub === item.label;
        return (
          <button key={item.label} type="button"
            className={`${styles.subItem} ${selected ? styles.subItemActive : ""}`}
            onClick={() => { setActiveSub(item.label); onNavigate?.(group, item.label); }}
            title={!expanded ? item.label : undefined}>
            {item.icon === "folderOpen" ? <FolderOpen size={19} /> : <Folder size={19} />}
            <span className={styles.label}>{item.label}</span>
            {item.count ? <span className={styles.count}>{item.count}</span> : null}
          </button>
        );
      })}
    </div>
  );

  return (
    <aside className={`${styles.shell} ${expanded ? styles.expanded : styles.collapsed} ${className ?? ""}`}
      aria-label="Primary navigation">
      <div className={styles.rail}>
        <button className={styles.brand} type="button" aria-label="Open navigation"
          onClick={() => setExpanded((value) => !value)} title={expanded ? "Collapse menu" : "Expand menu"}>
          <Sparkles size={23} strokeWidth={2.3} />
        </button>
        <div className={styles.railDivider} />
        <nav className={styles.railNav} aria-label="Quick navigation">
          {navigation.map((item) => {
            const Icon = item.icon;
            return <button key={item.id} type="button"
              className={`${styles.railButton} ${active === item.id ? styles.railActive : ""}`}
              onClick={() => choose(item)} aria-label={item.label} title={!expanded ? item.label : undefined}>
              <Icon size={21} strokeWidth={1.8} />
              {item.badge && <span className={styles.railBadge} />}
            </button>;
          })}
        </nav>
        <div className={styles.railSpacer} />
        <button className={styles.railButton} type="button" aria-label="Help" title="Help"><CircleHelp size={20} /></button>
        <button className={styles.railButton} type="button" aria-label="Settings" title="Settings"><Settings2 size={20} /></button>
        <button className={styles.expandToggle} type="button" onClick={() => setExpanded((value) => !value)}
          aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"} aria-expanded={expanded}>
          {expanded ? <ChevronLeft size={17} /> : <ChevronRight size={17} />}
        </button>
      </div>

      <section className={styles.primaryPanel} aria-hidden={!expanded} inert={!expanded}>
        <header className={styles.panelHeader}>
          <Sparkles size={21} fill="currentColor" />
          <span className={styles.label}>Menu</span>
          <button type="button" className={styles.closeButton} aria-label="Collapse menu" onClick={() => setExpanded(false)}><X size={17} /></button>
        </header>
        <div className={styles.searchWrap}>
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search menu…" aria-label="Search menu" tabIndex={expanded ? 0 : -1} />
          {query && <button type="button" aria-label="Clear search" onClick={() => setQuery("")}><X size={14} /></button>}
        </div>
        <nav className={styles.mainNav} aria-label="Main menu">
          {navigation.filter((item) => item.label.toLowerCase().includes(query.toLowerCase())).map((item) => {
            const Icon = item.icon;
            const groupOpen = openGroups.includes(item.id);
            return <div className={styles.navGroup} key={item.id}>
              <button type="button" className={`${styles.navItem} ${active === item.id ? styles.navActive : ""}`}
                onClick={() => choose(item)} tabIndex={expanded ? 0 : -1}>
                <Icon size={20} strokeWidth={1.8} />
                <span className={styles.label}>{item.label}</span>
                {item.badge && <span className={styles.badge}>{item.badge}</span>}
                {item.expandable && <span className={styles.trailing}>{groupOpen ? <ChevronDown size={16} /> : <Plus size={16} />}</span>}
              </button>
              {item.children && groupOpen && expanded && renderSubItems(item.children, item.id)}
            </div>;
          })}
        </nav>
        <footer className={styles.profile}>
          <div className={styles.avatar}>D</div>
          <div className={styles.profileCopy}><strong>Design team</strong><span>Workspace</span></div>
          <button type="button" aria-label="Workspace settings"><Settings2 size={17} /></button>
        </footer>
      </section>

      <section className={styles.secondaryPanel} aria-hidden={!expanded} inert={!expanded}>
        <div className={styles.secondaryTop}>
          <div className={styles.secondaryHeading}>Quick access</div>
          {renderSubItems(quickLinks, "quick-access")}
        </div>
        <div className={styles.secondarySection}>
          <div className={styles.sectionHeading}><span>Drafts <small>(3)</small></span><Bookmark size={17} /></div>
          {renderSubItems(drafts, "drafts")}
        </div>
        <div className={styles.secondarySection}>
          <div className={styles.sectionHeading}><span>Folders <small>(6)</small></span><Folder size={18} /></div>
          {renderSubItems(folders, "folders")}
        </div>
        <div className={styles.storageCard}>
          <div className={styles.storageIcon}><Activity size={16} /></div>
          <div><strong>Workspace storage</strong><span>64% used</span></div>
          <div className={styles.storageTrack}><span /></div>
        </div>
      </section>
    </aside>
  );
}
