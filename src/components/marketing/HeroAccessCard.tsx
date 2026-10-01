"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";

/**
 * Session-aware hero access card: sends authenticated users to the dashboard
 * and hands everyone else off to registration with their email prefilled.
 */
export function HeroAccessCard({ locale }: { locale: string }) {
  const { session } = useAuth();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const isFa = locale === "fa";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    // Redirect to register with the email prefilled
    window.location.href = `/${locale}/register?email=${encodeURIComponent(email)}`;
    setIsLoading(false);
  };

  return (
    <div className="animated-border-glass p-6 sm:p-7">
      {session.status === "authenticated" ? (
        <div className="space-y-5 text-center">
          <div className="mx-auto grid place-items-center w-14 h-14 rounded-[var(--radius-lg)] neu-surface text-[var(--color-primary-600)] glow-ring">
            <ShieldCheck size={26} />
          </div>
          <div className="space-y-1">
            <h2 className="font-display font-bold text-lg text-[var(--text-primary)]">
              {isFa ? "نشست شما فعال است" : "Your session is active"}
            </h2>
            <p className="text-xs text-[var(--text-muted)] break-all">
              {session.user?.email}
            </p>
          </div>
          <Link href={`/${locale}/dashboard`} className="block">
            <Button variant="primary" size="lg" className="w-full font-bold gap-2">
              {isFa ? "ورود به پیشخوان کاربری" : "Enter admin console"}
              <ArrowRight size={18} className="rtl:-scale-x-100" />
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-start">
          <div className="space-y-1">
            <h2 className="font-display font-bold text-lg text-[var(--text-primary)]">
              {isFa ? "ورود سریع به میز کار" : "Access the workspace"}
            </h2>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              {isFa
                ? "ایمیل سازمانی خود را برای مشاهده‌ی نسخه‌ی نمایشی وارد کنید."
                : "Enter your business email to open the live sandbox demo."}
            </p>
          </div>
          <Input
            type="email"
            placeholder={isFa ? "you@company.com" : "you@company.com"}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-label={isFa ? "ایمیل سازمانی" : "Business email"}
          />
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full font-bold gap-2"
            disabled={isLoading}
          >
            {isLoading
              ? isFa
                ? "در حال اعتبارسنجی..."
                : "Validating secure session..."
              : isFa
                ? "ورود به نسخه‌ی دمو"
                : "Access live sandbox demo"}
            {!isLoading && <ArrowRight size={18} className="rtl:-scale-x-100" />}
          </Button>
          <p className="text-[11px] text-[var(--text-muted)] text-center pt-1">
            {isFa
              ? "بدون نیاز به کارت اعتباری — محیط آزمایشی امن"
              : "No credit card required — secure sandbox environment"}
          </p>
        </form>
      )}
    </div>
  );
}
