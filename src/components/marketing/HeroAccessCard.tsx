"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";

export function HeroAccessCard({ locale }: { locale: string }) {
  const { session } = useAuth();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const isFa = locale === "fa";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email) return;
    setIsLoading(true);
    window.location.href = "/" + locale + "/register?email=" + encodeURIComponent(email);
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
      {session.status === "authenticated" ? (
        <div className="space-y-5 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-[var(--muted-surface)] text-[var(--color-primary-600)]"><ShieldCheck size={26} /></div>
          <div className="space-y-1">
            <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">{isFa ? "حساب شما فعال است" : "Your account is signed in"}</h2>
            <p className="break-all text-xs text-[var(--text-muted)]">{session.user?.email}</p>
          </div>
          <Link href={"/" + locale + "/dashboard"} className="block">
            <Button variant="primary" size="lg" className="w-full gap-2 font-bold">{isFa ? "ورود به فضای کاری" : "Open your workspace"}<ArrowRight size={18} className="rtl:-scale-x-100" /></Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-start">
          <div className="space-y-1">
            <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">{isFa ? "با حساب کاربری خود شروع کنید" : "Start with your account"}</h2>
            <p className="text-xs leading-relaxed text-[var(--text-muted)]">{isFa ? "برای ادامه، ثبت‌نام کنید یا وارد حساب خود شوید." : "Create an account or sign in to continue."}</p>
          </div>
          <Input type="email" placeholder="you@company.com" value={email} onChange={(event) => setEmail(event.target.value)} required aria-label={isFa ? "ایمیل" : "Email"} />
          <Button type="submit" variant="primary" size="lg" className="w-full gap-2 font-bold" disabled={isLoading}>
            {isLoading ? (isFa ? "در حال انتقال..." : "Continuing...") : (isFa ? "ادامه با ایمیل" : "Continue with email")}
            {!isLoading && <ArrowRight size={18} className="rtl:-scale-x-100" />}
          </Button>
          <p className="pt-1 text-center text-[11px] text-[var(--text-muted)]">{isFa ? "دسترسی به خدمات پس از ثبت‌نام و ورود انجام می‌شود." : "Services are available after registration and sign-in."}</p>
        </form>
      )}
    </div>
  );
}
