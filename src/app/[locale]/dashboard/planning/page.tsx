import { OwnerDefinedPage, type OwnerPageSection } from "@/components/features/dashboard/OwnerDefinedPage";

const sections: OwnerPageSection[] = [
  { id: "execution-plan", titleFa: "برنامه اجرایی", titleEn: "Execution plan" },
];

export default function ExecutionPlanPage() {
  return <OwnerDefinedPage titleFa="برنامه اجرایی" titleEn="Execution plan" sections={sections} />;
}
