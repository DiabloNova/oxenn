import { OwnerDefinedPage, type OwnerPageTab } from "@/components/features/dashboard/OwnerDefinedPage";

const tabs: OwnerPageTab[] = [
  { id: "visibility", labelFa: "قابلیت مشاهده", labelEn: "Visibility" },
  { id: "sentiment", labelFa: "احساسات", labelEn: "Sentiment" },
  { id: "mentions", labelFa: "اشاره‌ها", labelEn: "Mentions" },
  { id: "sources", labelFa: "منابع", labelEn: "Sources" },
  { id: "fan-out", labelFa: "فن‌آوت", labelEn: "Fan-out" },
  { id: "topics", labelFa: "مباحث", labelEn: "Topics" },
  { id: "locations", labelFa: "مکان", labelEn: "Locations" },
];

export default function AeoInsightsPage() {
  return <OwnerDefinedPage titleFa="بینش‌های پاسخ هوش مصنوعی (AEO)" titleEn="AI Answer Insights (AEO)" tabs={tabs} />;
}
