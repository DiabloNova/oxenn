import { OwnerDefinedPage, type OwnerPageTab } from "@/components/features/dashboard/OwnerDefinedPage";

const tabs: OwnerPageTab[] = [
  { id: "overview", labelFa: "نمای کلی", labelEn: "Overview" },
  { id: "search-pages", labelFa: "صفحات موتورهای جستجو", labelEn: "Search engine pages" },
  { id: "crawls", labelFa: "خزش‌های موتور جستجو", labelEn: "Search engine crawls" },
  { id: "visits", labelFa: "بازدیدها", labelEn: "Visits" },
  { id: "logs", labelFa: "لاگ‌ها", labelEn: "Logs" },
  { id: "settings", labelFa: "تنظیمات", labelEn: "Settings" },
];

export default function SeoPage() {
  return <OwnerDefinedPage titleFa="سئو (SEO)" titleEn="SEO" tabs={tabs} />;
}
