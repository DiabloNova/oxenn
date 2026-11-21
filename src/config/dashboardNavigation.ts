import type { ComponentType } from "react";
import {
  Building2,
  Sparkles,
  Search,
  BrainCircuit,
  Zap,
  FileText,
  CalendarClock,
  MessageSquareText,
  FileBarChart,
  PenTool,
  FlaskConical,
  ListChecks,
  Megaphone,
  TrendingUp,
  HeartPulse,
  Wrench,
  ClipboardCheck,
} from "lucide-react";

export interface NavigationSubItem {
  id: string;
  labelEn: string;
  labelFa: string;
  href: string;
}

export interface NavigationItem {
  id: string;
  labelEn: string;
  labelFa: string;
  href?: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  children?: NavigationSubItem[];
  exact?: boolean;
}

export interface NavigationSection {
  id: string;
  titleEn: string;
  titleFa: string;
  items: NavigationItem[];
}

export function isDashboardRouteActive(
  pathname: string | null,
  href: string | undefined,
  language: string,
  exact = false,
): boolean {
  if (!href) return false;
  const pathOnly = href.split(/[?#]/, 1)[0];
  const localizedHref = `/${language}${pathOnly === "/" ? "" : pathOnly}`;
  if (exact || pathOnly === "/dashboard") return pathname === localizedHref;
  return pathname === localizedHref || Boolean(pathname?.startsWith(localizedHref + "/"));
}

export function matchesDashboardNavigationSearch(
  item: { labelEn: string; labelFa: string },
  query: string,
): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;
  const normalizeFa = (value: string) => value.normalize("NFC")
    .replace(/\u064A/g, "\u06CC")
    .replace(/\u0643/g, "\u06A9")
    .replace(/[\u200C\s]+/g, "");
  return item.labelEn.toLowerCase().includes(normalizedQuery) || normalizeFa(item.labelFa).includes(normalizeFa(query));
}

/**
 * Owner-approved primary dashboard navigation.
 * Secondary/embedded capability routes remain available to their destination pages;
 * they must not be promoted to additional top-level sidebar items.
 */
export const dashboardNavigation: NavigationSection[] = [
  {
    id: "analytics",
    titleEn: "Analytics",
    titleFa: "تجزیه و تحلیل",
    items: [
      { id: "brand", labelEn: "Your brand", labelFa: "برند شما", href: "/dashboard/brand", icon: Building2 },
      { id: "aeo", labelEn: "AI answers (AEO)", labelFa: "پاسخ‌های هوش مصنوعی (AEO)", href: "/dashboard/aeo", icon: Sparkles },
      { id: "seo", labelEn: "Brand search rankings (SEO)", labelFa: "رتبه برند در موتورهای جستجو (SEO)", href: "/dashboard/seo", icon: Search, exact: true },
      { id: "geo", labelEn: "AI answer optimization (GEO)", labelFa: "بهینه‌سازی پاسخ‌های هوش مصنوعی (GEO)", href: "/dashboard/geo", icon: BrainCircuit },
      { id: "quick-analysis", labelEn: "Quick analysis", labelFa: "تحلیل سریع", href: "/dashboard/audit/free", icon: Zap },
    ],
  },
  {
    id: "reports",
    titleEn: "Reports",
    titleFa: "گزارش‌ها",
    items: [
      { id: "seo-user-reports", labelEn: "Your search engine reports", labelFa: "گزارش‌های کاربران شما در موتورهای جستجو", href: "/dashboard/reports/seo-users", icon: FileText },
      { id: "periodic-reports", labelEn: "Periodic reports", labelFa: "گزارش‌های دوره‌ای", href: "/dashboard/reports/periodic", icon: CalendarClock },
      { id: "aeo-brand-reports", labelEn: "AI answer reports", labelFa: "گزارش‌های پاسخ‌های هوش مصنوعی", href: "/dashboard/reports/aeo-brand", icon: FileBarChart },
      { id: "geo-prompt-reports", labelEn: "Prompt query reports", labelFa: "گزارش‌های کوئری‌های پرامپت", href: "/dashboard/reports/geo-prompts", icon: MessageSquareText },
    ],
  },
  {
    id: "actions",
    titleEn: "Actions",
    titleFa: "اقدامات",
    items: [
      { id: "content-studio", labelEn: "Content studio", labelFa: "استودیو محتوا", href: "/dashboard/content/studio", icon: PenTool },
      { id: "prompt-research", labelEn: "Prompt research", labelFa: "تحقیقات پرامپت", href: "/dashboard/aeo/playground", icon: FlaskConical },
      { id: "execution-plan", labelEn: "Execution plan", labelFa: "برنامه اجرایی", href: "/dashboard/planning", icon: ListChecks },
      { id: "marketing", labelEn: "Marketing", labelFa: "بازاریابی", href: "/dashboard/services", icon: Megaphone },
    ],
  },
  {
    id: "on-page",
    titleEn: "On-page",
    titleFa: "در صفحه",
    items: [
      { id: "search-ranking", labelEn: "Improve search rankings", labelFa: "بهبود رتبه موتورهای جستجو", href: "/dashboard/seo/technical", icon: TrendingUp },
      { id: "site-health", labelEn: "Site health", labelFa: "سلامت سایت", href: "/dashboard/audit/premium", icon: HeartPulse },
      { id: "technical-issues", labelEn: "Technical issues", labelFa: "مشکلات فنی", href: "/dashboard/technical-issues", icon: Wrench },
      { id: "product-review", labelEn: "Product review", labelFa: "بررسی محصول", href: "/dashboard/product-review", icon: ClipboardCheck },
    ],
  },
];
