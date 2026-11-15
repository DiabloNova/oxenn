import {
  LayoutDashboard,
  LayoutGrid,
  Settings,
  Sparkles,
  BookOpen,
  BarChart3,
  Award,
  Network,
  LineChart,
  Receipt,
  HelpCircle,
  UserRound
} from "lucide-react";
import React from "react";

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
  href?: string; // If undefined, it can be a collapsible parent
  icon: React.ComponentType<{ size?: number; className?: string }>;
  children?: NavigationSubItem[];
}

export interface NavigationSection {
  id: string;
  titleEn: string;
  titleFa: string;
  items: NavigationItem[];
}

export const dashboardNavigation: NavigationSection[] = [
  {
    id: "main",
    titleEn: "Workspace",
    titleFa: "فضای کاری",
    items: [
      {
        id: "overview",
        labelEn: "Overview",
        labelFa: "نمای کلی",
        href: "/dashboard",
        icon: LayoutDashboard
      },
      {
        id: "services",
        labelEn: "Service Marketplace",
        labelFa: "بازارچه خدمات",
        href: "/dashboard/services",
        icon: LayoutGrid
      },
      {
        id: "seo",
        labelEn: "SEO Tools",
        labelFa: "ابزارهای سئو",
        icon: Settings,
        children: [
          {
            id: "seo-technical",
            labelEn: "Technical SEO",
            labelFa: "سئوی تکنیکال",
            href: "/dashboard/seo/technical"
          },
          {
            id: "seo-schema",
            labelEn: "Schema & Metadata",
            labelFa: "طرح‌واره و متا داتا",
            href: "/dashboard/seo/schema"
          }
        ]
      },
      {
        id: "aeo",
        labelEn: "AI Visibility Tools",
        labelFa: "ابزارهای رویت‌پذیری هوش مصنوعی",
        icon: Sparkles,
        children: [
          {
            id: "aeo-audits",
            labelEn: "AI Visibility Audits",
            labelFa: "سنجش رویت‌پذیری هوش مصنوعی",
            href: "/dashboard/aeo/audits"
          },
          {
            id: "aeo-playground",
            labelEn: "AI Playground",
            labelFa: "محیط اجرای هوش مصنوعی",
            href: "/dashboard/aeo/playground"
          },
          {
            id: "aeo-content",
            labelEn: "AEO Content Intelligence",
            labelFa: "هوشمندی محتوای AEO",
            href: "/dashboard/aeo/content"
          }
        ]
      },
      {
        id: "content",
        labelEn: "Content Tools",
        labelFa: "ابزارهای محتوایی",
        icon: BookOpen,
        children: [
          {
            id: "content-studio",
            labelEn: "Content Studio",
            labelFa: "استودیوی محتوا",
            href: "/dashboard/content/studio"
          },
          {
            id: "content-ingestion",
            labelEn: "Content Ingestion",
            labelFa: "بارگذاری محتوا و مستندات",
            href: "/dashboard/content/ingestion"
          }
        ]
      },
      {
        id: "competitors",
        labelEn: "Competitive Tools",
        labelFa: "ابزارهای رقابتی",
        icon: BarChart3,
        children: [
          {
            id: "competitors-radar",
            labelEn: "Competitor Radar",
            labelFa: "رادار رقیبان",
            href: "/dashboard/competitors/radar"
          }
        ]
      },
      {
        id: "brand",
        labelEn: "Brand & Citation Tools",
        labelFa: "ابزارهای برند و استناد",
        icon: Award,
        children: [
          {
            id: "brand-citations",
            labelEn: "Citation Explorer",
            labelFa: "کاوشگر استنادها",
            href: "/dashboard/brand/citations"
          }
        ]
      },
      {
        id: "entities",
        labelEn: "Knowledge & Entity Tools",
        labelFa: "ابزارهای دانش و موجودیت‌ها",
        icon: Network,
        children: [
          {
            id: "entities-graph",
            labelEn: "Live Knowledge Graph",
            labelFa: "نمودار زنده دانش",
            href: "/dashboard/entities/graph"
          }
        ]
      },
      {
        id: "analytics",
        labelEn: "Analytics & Reporting",
        labelFa: "تحلیل‌ها و گزارش‌دهی",
        icon: LineChart,
        children: [
          {
            id: "analytics-llm-bias",
            labelEn: "LLM Response Share & Bias",
            labelFa: "سهم پاسخ و انحراف مدل‌ها",
            href: "/dashboard/analytics/llm-bias"
          }
        ]
      }
    ]
  },
  {
    id: "admin",
    titleEn: "Administration",
    titleFa: "مدیریت سیستم",
    items: [
      {
        id: "profile",
        labelEn: "My Account",
        labelFa: "حساب کاربری",
        href: "/dashboard/profile",
        icon: UserRound
      },
      {
        id: "settings",
        labelEn: "Workspace Settings",
        labelFa: "تنظیمات فضای کاری",
        href: "/dashboard/settings",
        icon: Settings
      },
      {
        id: "billing",
        labelEn: "Billing & Subscriptions",
        labelFa: "اشتراک و صورت‌حساب",
        href: "/dashboard/billing",
        icon: Receipt
      }
    ]
  },
  {
    id: "support",
    titleEn: "Support",
    titleFa: "پشتیبانی",
    items: [
      {
        id: "help",
        labelEn: "Help & Guide",
        labelFa: "راهنما و پشتیبانی",
        href: "#help", // Trigger overlay or support drawer
        icon: HelpCircle
      }
    ]
  }
];
