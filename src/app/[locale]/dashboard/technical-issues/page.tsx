import { OwnerDefinedPage, type OwnerPageSection } from "@/components/features/dashboard/OwnerDefinedPage";

const sections: OwnerPageSection[] = [
  { id: "technical-issues", titleFa: "مشکلات فنی", titleEn: "Technical issues" },
];

export default function TechnicalIssuesPage() {
  return <OwnerDefinedPage titleFa="مشکلات فنی" titleEn="Technical issues" sections={sections} />;
}
