import { OwnerDefinedPage, type OwnerPageTab } from "@/components/features/dashboard/OwnerDefinedPage";

const tabs: OwnerPageTab[] = [
  { id: "visibility", labelFa: "قابلیت مشاهده", labelEn: "Visibility" },
  { id: "perception", labelFa: "ادراک", labelEn: "Perception" },
  { id: "sources", labelFa: "منابع", labelEn: "Sources" },
  { id: "topics", labelFa: "موضوعات", labelEn: "Topics" },
  { id: "queries", labelFa: "کوئری‌ها", labelEn: "Queries" },
  { id: "geography", labelFa: "جغرافیا", labelEn: "Geography" },
];

export default function AeoInsightsPage() {
  return <OwnerDefinedPage titleFa="بینش‌های پاسخ هوش مصنوعی (AEO)" titleEn="AI Answer Insights (AEO)" tabs={tabs} />;
}
