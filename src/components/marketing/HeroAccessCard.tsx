"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, LogIn, ShieldCheck, UserPlus } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/Button";

/**
 * Session-aware public entry card. Visitors can create an account or sign in;
 * authenticated users are directed to their dashboard.
 */
export function HeroAccessCard({ locale }: { locale: string }) {
  const { session } = useAuth();
  const isFa = locale === "fa";

  if (session.status === "loading") {
    return (
      <div
        className="animated-border-glass p-6 sm:p-7"
        role="status"
        aria-live="polite"
      >
        <p className="text-center text-sm text-[var(--text-muted)]">
          {isFa ? "در حال بررسی وضعیت حساب کاربری..." : "Checking your account status..."}
        </p>
      </div>
    );
  }

  if (session.status === "authenticated" && session.user) {
    return (
      <div className="animated-border-glass p-6 sm:p-7">
        <div className="space-y-5 text-center">
          <div className="mx-auto grid place-items-center w-14 h-14 rounded-[var(--radius-lg)] neu-surface text-[var(--color-primary-600)] glow-ring">
            <ShieldCheck size={26} />
          </div>
          <div className="space-y-1">
            <h2 className="font-display font-bold text-lg text-[var(--text-primary)]">
              {isFa ? "حساب شما فعال است" : "You are signed in"}
            </h2>
            <p className="text-xs text-[var(--text-muted)] break-all">
              {session.user.email}
            </p>
          </div>
          <Link href={"/" + locale + "/dashboard"} className="block">
            <Button variant="primary" size="lg" className="w-full font-bold gap-2">
              {isFa ? "ورود به داشبورد" : "Open dashboard"}
              <ArrowRight size={18} className="rtl:-scale-x-100" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animated-border-glass p-6 sm:p-7">
      <div className="space-y-4 text-start">
        <div className="space-y-1">
          <h2 className="font-display font-bold text-lg text-[var(--text-primary)]">
            {isFa ? "برای شروع، حساب کاربری ایجاد کنید" : "Create your Oxenn account"}
          </h2>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            {isFa
              ? "اگر حساب کاربری دارید وارد شوید؛ در غیر این صورت ثبت‌نام کنید."
              : "Create an account to get started, or sign in if you already have one."}
          </p>
        </div>

        <Link href={"/" + locale + "/register"} className="block">
          <Button
            variant="primary"
            size="lg"
            className="w-full font-bold gap-2"
          >
            <UserPlus size={17} />
            <span>{isFa ? "ثبت‌نام" : "Create account"}</span>
            <ArrowRight size={18} className="rtl:-scale-x-100" />
          </Button>
        </Link>

        <Link
          href={"/" + locale + "/login"}
          className="flex items-center justify-center gap-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--sky-blue-500)] transition-colors"
        >
          <LogIn size={16} />
          <span>
            {isFa ? "قبلاً حساب ساخته‌اید؟ ورود" : "Already have an account? Sign in"}
          </span>
        </Link>
      </div>
    </div>
  );
}
