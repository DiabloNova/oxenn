"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { deactivateAccountAction } from "@/app/actions/account";

export function DeactivateAccountForm({ locale }: { locale: string }) {
  const isFa = locale === "fa";
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const expected = isFa ? "غیرفعال‌سازی" : "DEACTIVATE";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!password || confirmation !== expected || busy) return;
    if (!window.confirm(isFa
      ? "آیا از غیرفعال‌سازی حساب خود مطمئن هستید؟ این عملیات نشست‌های فعال شما را لغو می‌کند و اگر تنها مدیر فعال یک فضای کاری باشید، آن فضا برای همه اعضایش بسته می‌شود."
      : "Deactivate your account? This revokes your active sessions. If you are the only active administrator of a workspace, that workspace will be closed for all of its members.")) return;
    setBusy(true);
    try {
      const result = await deactivateAccountAction(password);
      if (!result.success) {
        const messages: Record<string, string> = isFa
          ? { INVALID_PASSWORD: "رمز عبور صحیح نیست.", ACCOUNT_LOCKED: "حساب موقتاً قفل شده است.", ACCOUNT_ALREADY_DEACTIVATED: "این حساب قبلاً غیرفعال شده است." }
          : { INVALID_PASSWORD: "The password is incorrect.", ACCOUNT_LOCKED: "The account is temporarily locked.", ACCOUNT_ALREADY_DEACTIVATED: "This account is already deactivated." };
        setError(messages[result.errorCode ?? ""] ?? (isFa ? "غیرفعال‌سازی انجام نشد. دوباره تلاش کنید." : "Account deactivation failed. Please try again."));
        return;
      }
      router.replace(`/${locale}/login?account=deactivated`);
      router.refresh();
    } catch {
      setError(isFa ? "غیرفعال‌سازی انجام نشد. دوباره تلاش کنید." : "Account deactivation failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-red-500/30 bg-red-500/5 p-5">
      <div>
        <h2 className="text-lg font-bold text-red-600">{isFa ? "غیرفعال‌سازی حساب" : "Deactivate account"}</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">{isFa
          ? "با این کار نشست‌های فعال شما لغو و عضویت‌های فضای کاری‌تان حذف می‌شوند. اگر تنها مدیر فعال یک فضای کاری باشید، آن فضای کاری برای همه اعضا بسته می‌شود."
          : "This revokes your active sessions and removes your workspace memberships. If you are the only active administrator of a workspace, that workspace will be closed for every member."}</p>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <label className="block text-sm font-medium" htmlFor="deactivation-password">{isFa ? "برای تأیید، رمز عبور خود را وارد کنید" : "Confirm with your password"}</label>
        <input id="deactivation-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm" />
        <label className="block text-sm font-medium" htmlFor="deactivation-confirmation">{isFa ? `عبارت «${expected}» را وارد کنید` : 'Type DEACTIVATE to confirm'}</label>
        <input id="deactivation-confirmation" required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm" />
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={busy || !password || confirmation !== expected} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? (isFa ? "در حال انجام..." : "Deactivating...") : (isFa ? "غیرفعال‌سازی حساب" : "Deactivate account")}</button>
      </form>
    </section>
  );
}
