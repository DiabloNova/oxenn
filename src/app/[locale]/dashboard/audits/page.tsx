import Link from "next/link";
import { listPremiumAudits } from "@/services/audits/dashboard-audits";
interface AuditsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string | string[]; q?: string | string[] }>;
}
export default async function AuditsPage({ params, searchParams }: AuditsPageProps) {
  const [{ locale: requestedLocale }, search] = await Promise.all([params, searchParams]);
  const locale = requestedLocale === "fa" ? "fa" : "en";
  const isFa = locale === "fa";
  const rawPage = Array.isArray(search.page) ? search.page[0] : search.page;
  const rawQuery = Array.isArray(search.q) ? search.q[0] : search.q;
  const result = await listPremiumAudits({ page: Number.parseInt(rawPage ?? "1", 10), query: rawQuery });
  const basePath = `/${locale}/dashboard/audits`;
  const querySuffix = result.query ? `&q=${encodeURIComponent(result.query)}` : "";
  const formatDate = (value: string) => new Date(value).toLocaleString(isFa ? "fa-IR" : "en-US", { dateStyle: "medium", timeStyle: "short" });
  return (
    <main className="space-y-6" dir={isFa ? "rtl" : "ltr"}>
      <header className="flex flex-wrap items-end justify-between gap-4"><div>
        <h1 className="text-2xl font-black text-[var(--text-primary)]">{isFa ? "گزارش‌های ممیزی" : "Audit reports"}</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">{isFa ? "گزارش‌های ثبت‌شده در فضای کاری شما" : "Saved audit reports for your workspace"}</p>
      </div><Link className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--muted-surface)]" href={`/${locale}/dashboard/audit/premium`}>{isFa ? "اجرای ممیزی جدید" : "Run a new audit"}</Link></header>
      <form action={basePath} method="get" className="flex max-w-xl gap-2">
        <input type="search" name="q" defaultValue={result.query} placeholder={isFa ? "جست‌وجوی نشانی وب‌سایت" : "Search website URL"} aria-label={isFa ? "جست‌وجوی گزارش‌ها" : "Search audit reports"} className="min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm text-[var(--text-primary)]" />
        <button type="submit" className="rounded-xl bg-[var(--color-primary-600)] px-4 py-2 text-sm font-bold text-white">{isFa ? "جست‌وجو" : "Search"}</button>
      </form>
      {result.audits.length === 0 ? <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
        <h2 className="font-bold text-[var(--text-primary)]">{result.query ? (isFa ? "گزارشی مطابق جست‌وجو پیدا نشد" : "No matching audit reports") : (isFa ? "هنوز گزارشی ثبت نشده است" : "No audit reports yet")}</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">{isFa ? "پس از اجرای ممیزی، گزارش واقعی آن در این بخش نمایش داده می‌شود." : "Reports will appear here after an audit has been completed and saved."}</p>
      </section> : <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]"><div className="divide-y divide-[var(--border)]">
        {result.audits.map((audit) => <Link key={audit.id} href={`${basePath}/${audit.id}`} className="flex flex-wrap items-center justify-between gap-4 p-5 transition-colors hover:bg-[var(--muted-surface)]">
          <div className="min-w-0 flex-1"><h2 className="truncate font-bold text-[var(--text-primary)]">{audit.url}</h2><p className="mt-1 text-xs text-[var(--text-secondary)]">{formatDate(audit.createdAt)} · {isFa ? `${audit.pagesAnalyzed} صفحه بررسی‌شده` : `${audit.pagesAnalyzed} pages analyzed`}</p></div>
          <div className="flex items-center gap-3"><span className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-bold text-[var(--text-secondary)]">{audit.grade}</span><span className="text-lg font-black tabular-nums text-[var(--text-primary)]">{audit.score}/100</span></div>
        </Link>)}
      </div></section>}
      {result.pageCount > 1 && <nav aria-label={isFa ? "صفحه‌بندی گزارش‌ها" : "Audit report pagination"} className="flex items-center justify-between">
        {result.page > 1 ? <Link className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm" href={`${basePath}?page=${result.page - 1}${querySuffix}`}>{isFa ? "صفحهٔ قبل" : "Previous"}</Link> : <span />}
        <span className="text-xs text-[var(--text-secondary)]">{isFa ? `صفحه ${result.page} از ${result.pageCount}` : `Page ${result.page} of ${result.pageCount}`}</span>
        {result.page < result.pageCount ? <Link className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm" href={`${basePath}?page=${result.page + 1}${querySuffix}`}>{isFa ? "صفحهٔ بعد" : "Next"}</Link> : <span />}
      </nav>}
    </main>
  );
}
