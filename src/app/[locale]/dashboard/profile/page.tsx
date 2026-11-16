import { redirect } from "next/navigation";
import { UserRound } from "lucide-react";
import { getSession } from "@/services/auth/session";
import { DeactivateAccountForm } from "@/components/DeactivateAccountForm";

export default async function DashboardProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isFa = locale === "fa";
  const session = await getSession();
  if (!session?.user) redirect(`/${locale}/login`);
  const user = session.user;
  const rows = [
    [isFa ? "نام و نام خانوادگی" : "Full name", user.name],
    [isFa ? "نام کاربری" : "Username", user.username || (isFa ? "ثبت نشده" : "Not set")],
    [isFa ? "ایمیل" : "Email address", user.email],
    [isFa ? "نقش حساب" : "Account role", user.role],
    [isFa ? "شناسه فضای کاری" : "Workspace ID", user.workspaceId],
  ];
  return (
    <section className="mx-auto max-w-3xl space-y-6 p-4 md:p-6" dir={isFa ? "rtl" : "ltr"}>
      <header className="flex items-center gap-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--muted-surface)] p-3"><UserRound size={24} /></div>
        <div><h1 className="text-2xl font-black text-[var(--text-primary)]">{isFa ? "حساب کاربری" : "My Account"}</h1><p className="mt-1 text-sm text-[var(--text-secondary)]">{isFa ? "اطلاعات حساب ثبت‌شده شما" : "Your registered account information"}</p></div>
      </header>
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        {rows.map(([label, value]) => <div key={label} className="grid gap-2 border-b border-[var(--border)] p-4 last:border-b-0 sm:grid-cols-[minmax(140px,0.7fr)_1.3fr]"><div className="text-sm font-semibold text-[var(--text-secondary)]">{label}</div><div className="break-all text-sm text-[var(--text-primary)]">{value}</div></div>)}
      </div>
      <DeactivateAccountForm locale={locale} />
    </section>
  );
}
