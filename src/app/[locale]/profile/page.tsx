"use client";

import React, { useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { useTheme } from "@/components/ThemeProvider";
import { User, AlertTriangle } from "lucide-react";
import { deactivateAccountAction } from "@/app/actions/account";

export default function ProfilePage() {
  const { language } = useTheme();
  const isRtl = language === "fa";

  const [deactivatePassword, setDeactivatePassword] = useState("");
  const [deactivateError, setDeactivateError] = useState("");
  const [isDeactivating, setIsDeactivating] = useState(false);

  const handleDeactivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deactivatePassword) {
      setDeactivateError(isRtl ? "رمز عبور الزامی است." : "Password is required.");
      return;
    }
    setIsDeactivating(true);
    setDeactivateError("");
    try {
      const res = await deactivateAccountAction(deactivatePassword);
      if (res.success) {
        window.location.href = `/${language}/login`;
      } else {
        if (res.errorCode === "INVALID_PASSWORD") {
          setDeactivateError(isRtl ? "رمز عبور نامعتبر است." : "Invalid password.");
        } else if (res.errorCode === "ACCOUNT_LOCKED") {
          setDeactivateError(isRtl ? "حساب کاربری مسدود شده است." : "Account temporarily locked.");
        } else {
          setDeactivateError(isRtl ? "خطا در غیرفعال‌سازی." : "Deactivation failed.");
        }
      }
    } catch (err) {
      setDeactivateError((err as Error).message || (isRtl ? "خطا در غیرفعال‌سازی." : "Deactivation failed."));
    } finally {
      setIsDeactivating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)] font-display flex items-center gap-2.5">
          <User className="text-[var(--orange-500)]" size={24} />
          <span>{isRtl ? "پروفایل کاربری" : "User Profile"}</span>
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1.5 max-w-3xl leading-relaxed">
          {isRtl
            ? "اطلاعات حساب کاربری، جزئیات اشتراک سازمانی، و سهمیه کوئری مستأجر."
            : "Manage your user account identity, organizational workspace defaults, and billing tokens."}
        </p>
      </div>

      <GlassCard hoverable={false} className="p-8 text-center flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--sky-blue-500)] to-[var(--orange-500)] text-white flex items-center justify-center text-2xl font-bold mb-4">
          U
        </div>
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">User Admin</h3>
        <p className="text-xs text-[var(--text-secondary)] font-mono">tehran@brandgraph.ai</p>
        <span className="mt-4 px-3 py-1 bg-gradient-to-r from-[var(--sky-blue-500)]/20 to-[var(--orange-500)]/20 border border-[var(--sky-blue-500)]/30 text-xs font-semibold text-[var(--text-primary)] rounded-full">
          {isRtl ? "دسترسی مدیریت مستأجر" : "Tenant Admin Access"}
        </span>
      </GlassCard>

      {/* Danger Zone */}
      <GlassCard hoverable={false} className="p-8 mt-12 border-red-500/20 bg-red-500/5">
        <div className="flex items-center gap-2 mb-4 text-red-500">
          <AlertTriangle size={24} />
          <h2 className="text-lg font-bold">
            {isRtl ? "منطقه خطر (Danger Zone)" : "Danger Zone"}
          </h2>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          {isRtl
            ? "غیرفعال‌سازی حساب غیرقابل بازگشت است و دسترسی شما را مسدود می‌کند. در صورت بودن مدیر انحصاری، سازمان حفظ خواهد شد."
            : "Deactivating your account is irreversible and blocks access. If you are the sole administrator, the organization will be preserved."}
        </p>
        <form onSubmit={handleDeactivate} className="flex flex-col gap-4 max-w-sm">
          <input
            type="password"
            placeholder={isRtl ? "تأیید رمز عبور" : "Confirm Password"}
            value={deactivatePassword}
            onChange={(e) => setDeactivatePassword(e.target.value)}
            className="px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-md text-sm text-[var(--text-primary)] outline-none focus:border-red-500/50"
            required
          />
          {deactivateError && (
            <div className="text-red-500 text-xs font-semibold">{deactivateError}</div>
          )}
          <button
            type="submit"
            disabled={isDeactivating}
            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 text-red-500 rounded-md font-semibold text-sm transition-colors disabled:opacity-50"
          >
            {isDeactivating
              ? (isRtl ? "در حال غیرفعال‌سازی..." : "Deactivating...")
              : (isRtl ? "غیرفعال‌سازی حساب" : "Deactivate Account")}
          </button>
        </form>
      </GlassCard>
    </div>
  );
}
