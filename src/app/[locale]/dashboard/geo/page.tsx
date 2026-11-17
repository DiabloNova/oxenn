import { OwnerDefinedPage, type OwnerPageSection } from "@/components/features/dashboard/OwnerDefinedPage";

const sections: OwnerPageSection[] = [
  { id: "answer-content", titleFa: "تولید محتوای مبتنی بر پاسخ هوش مصنوعی", titleEn: "AI-answer-based content generation" },
  { id: "brand-citation", titleFa: "ساختار استناد داخلی برند", titleEn: "Brand internal citation structure" },
  { id: "technical-issues", titleFa: "مشکلات فنی", titleEn: "Technical issues" },
  { id: "sitemap", titleFa: "سایت‌مپ", titleEn: "Sitemap" },
  { id: "model-understanding", titleFa: "درک برند توسط مدل‌های زبانی", titleEn: "Brand understanding by language models" },
];

export default function GeoPage() {
  return <OwnerDefinedPage titleFa="تجزیه و تحلیل ماشین‌های زبانی (GEO)" titleEn="Language Model Analytics (GEO)" sections={sections} />;
}
