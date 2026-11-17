import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/services/auth/session";
import { getPremiumAuditById } from "@/services/audits/dashboard-audits";
interface AuditDetailPageProps { params: Promise<{ locale: string; id: string }> }
const METRIC_LABELS: Record<string, { en: string; fa: string }> = {
  contentQuality: { en: "Content quality", fa: "کیفیت محتوا" },
  technicalHealth: { en: "Technical health", fa: "سلامت فنی" },
  seoHealth: { en: "SEO health", fa: "سلامت سئو" },
  aiVisibility: { en: "AI visibility", fa: "میزان دیده‌شدن در هوش مصنوعی" },
  brandAuthority: { en: "Brand authority", fa: "اعتبار برند" },
  citationVisibility: { en: "Citation visibility", fa: "میزان دیده‌شدن ارجاعات" },
  contentHealth: { en: "Content health", fa: "سلامت محتوا" },
  competitivePosition: { en: "Competitive position", fa: "جایگاه رقابتی" },
};

function metricLabel(key: string, isFa: boolean): string {
  const labels = METRIC_LABELS[key];
  return labels ? labels[isFa ? "fa" : "en"] : key;
}

function displayValue(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return null;
}
export default async function AuditDetailPage({ params }: AuditDetailPageProps) {
  const { locale: requestedLocale, id } = await params;
  const locale = requestedLocale === "fa" ? "fa" : "en";
  const isFa = locale === "fa";
  const session = await getSession();
  if (!session?.user?.workspaceId) {
    const returnTo = `/${locale}/dashboard/audits/${id}`;
    redirect(`/${locale}/login?returnTo=${encodeURIComponent(returnTo)}`);
  }
  const audit = await getPremiumAuditById(id);
  if (!audit) notFound();
  const metrics = Object.entries(audit.metrics).filter(([, value]) => typeof value === "number" || typeof value === "string");
  const date = new Date(audit.createdAt).toLocaleString(isFa ? "fa-IR" : "en-US", { dateStyle: "full", timeStyle: "short" });
  return <div className="space-y-6" dir={isFa ? "rtl" : "ltr"}>
    <Link href={`/${locale}/dashboard/audits`} className="inline-flex text-sm font-semibold text-[var(--color-primary-600)] hover:underline">{isFa ? "بازگشت به گزارش‌ها" : "Back to audit reports"}</Link>
    <header className="space-y-2"><p className="text-xs text-[var(--text-secondary)]">{date}</p><h1 className="break-all text-2xl font-black text-[var(--text-primary)]">{isFa ? "گزارش ممیزی" : "Audit report"}</h1><p className="break-all text-sm text-[var(--text-secondary)]">{audit.url}</p></header>
    <section className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"><p className="text-xs text-[var(--text-secondary)]">{isFa ? "امتیاز کل" : "Overall score"}</p><p className="mt-2 text-3xl font-black tabular-nums text-[var(--text-primary)]">{audit.score}<span className="text-base text-[var(--text-muted)]">/100</span></p></div>
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"><p className="text-xs text-[var(--text-secondary)]">{isFa ? "رتبه" : "Grade"}</p><p className="mt-2 text-3xl font-black text-[var(--text-primary)]">{audit.grade}</p></div>
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"><p className="text-xs text-[var(--text-secondary)]">{isFa ? "صفحات بررسی‌شده" : "Pages analyzed"}</p><p className="mt-2 text-3xl font-black tabular-nums text-[var(--text-primary)]">{audit.pagesAnalyzed}</p></div>
    </section>
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"><h2 className="text-lg font-bold text-[var(--text-primary)]">{isFa ? "شاخص‌های ثبت‌شده" : "Recorded metrics"}</h2>
      {metrics.length === 0 ? <p className="mt-3 text-sm text-[var(--text-secondary)]">{isFa ? "شاخص جداگانه‌ای در این گزارش ثبت نشده است." : "No individual metrics were recorded for this report."}</p> : <dl className="mt-4 grid gap-3 sm:grid-cols-2">{metrics.map(([key, value]) => <div key={key} className="flex items-center justify-between gap-3 rounded-xl bg-[var(--muted-surface)] p-3"><dt className="break-all text-sm text-[var(--text-secondary)]">{metricLabel(key, isFa)}</dt><dd className="font-bold tabular-nums text-[var(--text-primary)]">{displayValue(value)}</dd></div>)}</dl>}
    </section>
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"><h2 className="text-lg font-bold text-[var(--text-primary)]">{isFa ? "یافته‌ها" : "Findings"}</h2>
      {audit.issues.length === 0 ? <p className="mt-3 text-sm text-[var(--text-secondary)]">{isFa ? "یافته‌ای در این گزارش ثبت نشده است." : "No findings were recorded for this report."}</p> : <ul className="mt-4 space-y-3">{audit.issues.map((issue, index) => { const item = issue && typeof issue === "object" ? issue as Record<string, unknown> : {}; const description = displayValue(issue) ?? displayValue(item.description) ?? displayValue(item.issue) ?? (isFa ? "یافته بدون شرح" : "Finding without a description"); const recommendation = displayValue(item.recommendation); return <li key={index} className="rounded-xl border border-[var(--border)] p-4"><p className="text-sm font-semibold text-[var(--text-primary)]">{description}</p>{recommendation && <p className="mt-2 text-sm text-[var(--text-secondary)]">{recommendation}</p>}</li>; })}</ul>}
    </section>
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"><h2 className="text-lg font-bold text-[var(--text-primary)]">{isFa ? "پیشنهادها" : "Recommendations"}</h2>
      {audit.recommendations.length === 0 ? <p className="mt-3 text-sm text-[var(--text-secondary)]">{isFa ? "پیشنهادی در این گزارش ثبت نشده است." : "No recommendations were recorded for this report."}</p> : <ul className="mt-4 space-y-3">{audit.recommendations.map((recommendation, index) => { const item = recommendation && typeof recommendation === "object" ? recommendation as Record<string, unknown> : {}; const title = displayValue(recommendation) ?? displayValue(item.insight) ?? displayValue(item.recommendation) ?? displayValue(item.issue) ?? (isFa ? "پیشنهاد بدون عنوان" : "Untitled recommendation"); const impact = displayValue(item.estimatedImpact); return <li key={index} className="rounded-xl border border-[var(--border)] p-4"><p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>{impact && <p className="mt-2 text-sm text-[var(--text-secondary)]">{impact}</p>}</li>; })}</ul>}
    </section>
  </div>;
}
