import { OwnerDefinedPage, type OwnerPageSection } from "@/components/features/dashboard/OwnerDefinedPage";

const sections: OwnerPageSection[] = [
  { id: "skills", titleFa: "مهارت‌ها", titleEn: "Skills" },
];

export default function AgentSkillsPage() {
  return <OwnerDefinedPage titleFa="مهارت‌ها" titleEn="Skills" sections={sections} />;
}
