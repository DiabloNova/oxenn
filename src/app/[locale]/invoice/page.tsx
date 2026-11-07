"use client";

import { use } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Printer, Receipt } from "lucide-react";

export default function InvoicePaymentPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const isFa = locale === "fa";

  // This page currently contains demonstration data only. It is not a payable invoice.
  const invoiceData = {
    id: "INV-2025-089",
    date: isFa ? "۱۴۰۳/۱۲/۱۵" : "March 5, 2025",
    dueDate: isFa ? "۱۴۰۳/۱۲/۲۹" : "March 19, 2025",
    amount: 1450,
    amountFa: "۷۲,۵۰۰,۰۰۰ تومان",
    tax: 130.5,
    taxFa: "۶,۵۲۵,۰۰۰ تومان",
    discount: 50,
    discountFa: "۲,۵۰۰,۰۰۰ تومان",
    total: 1530.5,
    totalFa: "۷۶,۵۲۵,۰۰۰ تومان",
    plan: isFa ? "طرح سازمانی پیشرفته (Enterprise Pro)" : "Enterprise Pro Platform Annual",
  };

  return (
    <div
      className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
      dir={isFa ? "rtl" : "ltr"}
    >
      <div className="absolute top-0 right-1/4 w-[40vw] h-[40vw] bg-gradient-to-br from-[#38bdf8]/10 to-[#f97316]/5 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-1/4 w-[35vw] h-[35vw] bg-gradient-to-tr from-[#f97316]/10 to-[#38bdf8]/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto z-10 relative">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <Link
            href={`/${locale}/dashboard`}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors border border-white/10 px-4 py-2 rounded-xl bg-slate-900/30 backdrop-blur-md"
          >
            <ArrowLeft size={16} className="rtl:rotate-180" />
            <span>{isFa ? "بازگشت به پیشخوان" : "Back to Workspace"}</span>
          </Link>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-mono text-amber-300">
            <AlertCircle size={14} />
            <span>{isFa ? "پرداخت آنلاین فعال نیست" : "Payment Processing Unavailable"}</span>
          </div>
        </div>

        <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-8">
          <section
            aria-labelledby="payment-unavailable-title"
            className="glass-panel p-6 sm:p-8 rounded-3xl border border-amber-500/20 bg-slate-950/75 shadow-2xl flex flex-col justify-between"
          >
            <div>
              <h1 id="payment-unavailable-title" className="text-xl sm:text-2xl font-black font-display text-white mb-3">
                {isFa ? "پرداخت در حال حاضر در دسترس نیست" : "Payment Is Not Available Yet"}
              </h1>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-6">
                {isFa
                  ? "در حال حاضر هیچ درگاه پرداخت تأییدشده‌ای به این صفحه متصل نیست. هیچ پرداختی انجام یا ثبت نمی‌شود. لطفاً اطلاعات کارت بانکی یا شناسه انتقال بانکی و رمزارز را در این صفحه وارد نکنید."
                  : "No verified payment provider is connected to this page. No payment will be processed or recorded here. Do not enter card details or submit bank-transfer or cryptocurrency transaction references."}
              </p>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <AlertCircle size={15} />
                  <span>{isFa ? "وضعیت پرداخت: ثبت نشده" : "Payment status: Not submitted"}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isFa
                    ? "وضعیت صورتحساب یا اشتراک فقط پس از تأیید سمت سرور از طریق یک فرایند پرداخت معتبر قابل تغییر است."
                    : "An invoice or subscription status may change only after server-side confirmation through an approved payment flow."}
                </p>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-white/10 text-[10px] text-slate-500 leading-relaxed">
              {isFa
                ? "این صفحه فعلاً فقط پیش‌نمایش اطلاعات نمونه صورتحساب است و امکان دریافت وجه یا تأیید تراکنش را ندارد."
                : "This page currently displays sample invoice information only. It cannot collect funds or verify transactions."}
            </div>
          </section>

          <section
            aria-labelledby="invoice-preview-title"
            className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-md shadow-2xl flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6 gap-3">
                <div className="flex items-center gap-2">
                  <Receipt size={20} className="text-[var(--sky-blue-500)]" />
                  <h2 id="invoice-preview-title" className="font-extrabold text-xs tracking-wider uppercase">
                    {isFa ? "پیش‌نمایش صورتحساب نمونه" : "Sample Invoice Preview"}
                  </h2>
                </div>
                <span className="text-[9px] px-2 py-1 rounded bg-amber-500/10 text-amber-300 font-bold whitespace-nowrap">
                  {isFa ? "غیرقابل پرداخت" : "NOT PAYABLE"}
                </span>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 text-xs">
                  <span className="text-slate-400">{isFa ? "شناسه نمونه:" : "Sample Invoice ID:"}</span>
                  <span className="font-mono font-bold text-end text-white">{invoiceData.id}</span>
                </div>
                <div className="grid grid-cols-2 text-xs">
                  <span className="text-slate-400">{isFa ? "تاریخ صدور:" : "Issue Date:"}</span>
                  <span className="text-end text-white">{invoiceData.date}</span>
                </div>
                <div className="grid grid-cols-2 text-xs">
                  <span className="text-slate-400">{isFa ? "مهلت پرداخت نمونه:" : "Sample Due Date:"}</span>
                  <span className="text-end text-slate-300">{invoiceData.dueDate}</span>
                </div>

                <div className="h-px bg-white/10 my-4" />

                <div className="space-y-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {isFa ? "شرح نمونه اشتراک" : "Sample Service Description"}
                  </span>
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                    <p className="text-xs font-bold text-white">{invoiceData.plan}</p>
                    <p className="text-[10px] text-slate-400">
                      {isFa
                        ? "شرح نمایشی خدمات؛ این مورد نشان‌دهنده اشتراک فعال یا خریداری‌شده نیست."
                        : "Illustrative service description; this does not indicate an active or purchased subscription."}
                    </p>
                  </div>
                </div>

                <div className="h-px bg-white/10 my-4" />

                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-2">
                    <span className="text-slate-400">{isFa ? "مبلغ اولیه:" : "Subtotal:"}</span>
                    <span className="text-end text-white font-mono">{isFa ? invoiceData.amountFa : `$${invoiceData.amount}`}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-slate-400">{isFa ? "تخفیف نمونه:" : "Sample Discount:"}</span>
                    <span className="text-end text-slate-300 font-mono">-{isFa ? invoiceData.discountFa : `$${invoiceData.discount}`}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-slate-400">{isFa ? "مالیات نمونه:" : "Sample Tax:"}</span>
                    <span className="text-end text-white font-mono">{isFa ? invoiceData.taxFa : `$${invoiceData.tax}`}</span>
                  </div>
                  <div className="h-px bg-white/10 my-2" />
                  <div className="grid grid-cols-2 text-sm font-black text-white">
                    <span className="text-[var(--sky-blue-500)]">{isFa ? "جمع نمونه:" : "Sample Total:"}</span>
                    <span className="text-end text-gradient-brand font-mono">{isFa ? invoiceData.totalFa : `$${invoiceData.total}`}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 justify-center pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/20 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer bg-slate-900/50"
              >
                <Printer size={14} />
                <span>{isFa ? "چاپ پیش‌نمایش" : "Print Preview"}</span>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
