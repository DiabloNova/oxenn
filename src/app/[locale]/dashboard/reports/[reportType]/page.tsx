import { notFound } from "next/navigation";

const reportTypes = {
  "seo-users": { fa: "گزارش کاربران شما SEO", en: "Your SEO user reports" },
  periodic: { fa: "گزارش‌های دوره‌ای", en: "Periodic reports" },
  "aeo-brand": { fa: "گزارش‌های برند در هوش مصنوعی AEO", en: "AI brand reports (AEO)" },
  "geo-prompts": { fa: "گزارش‌های پرامپت GEO", en: "GEO prompt reports" },
} as const;

interface ReportPageProps { params: Promise<{ locale: string; reportType: string }> }

export default async function ReportPage({ params }: ReportPageProps) {
  const { locale, reportType } = await params;
  if (!Object.prototype.hasOwnProperty.call(reportTypes, reportType)) notFound();
  const report = reportTypes[reportType as keyof typeof reportTypes];
  const isFa = locale === "fa";
  return (
    <div className="space-y-4" dir={isFa ? "rtl" : "ltr"}>
      <h1 className="text-2xl md:text-3xl font-black text-[var(--text-primary)]">{isFa ? report.fa : report.en}</h1>
      <p className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-sm leading-7 text-[var(--text-muted)]">
        {isFa ? "جزئیات و داده‌های این گزارش هنوز در این صفحه ارائه نشده‌اند." : "The details and data for this report have not yet been provided on this page."}
      </p>
    </div>
  );
}
