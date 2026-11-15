"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/Card";
import { SeorchableLogo } from "@/components/marketing/SeorchableLogo";
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Mail, RotateCw } from "lucide-react";
import { requestVerification, verifyEmailAction } from "@/app/actions/auth";

export default function VerifyEmailPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const isFa = locale === "fa";
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshSession } = useAuth();
  const [email, setEmail] = useState(searchParams?.get("email") ?? "");
  const [code, setCode] = useState(searchParams?.get("code") ?? "");
  const deliveryFailed = searchParams?.get("delivery") === "failed";
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [sessionError, setSessionError] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resendMessage, setResendMessage] = useState("");

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const t = {
    title: isFa ? "تأیید ایمیل" : "Verify your email",
    desc: isFa ? "کد ۸ رقمی ارسال‌شده به ایمیل خود را وارد کنید تا ثبت‌نام تکمیل شود." : "Enter the 8-digit code sent to your email to complete registration.",
    email: isFa ? "آدرس ایمیل" : "Email address",
    code: isFa ? "کد تأیید ۸ رقمی" : "8-digit verification code",
    verify: isFa ? "تأیید ایمیل و ورود به حساب" : "Verify email and sign in",
    verifying: isFa ? "در حال تأیید..." : "Verifying...",
    resend: isFa ? "ارسال مجدد کد" : "Resend code",
    resendIn: isFa ? `ارسال مجدد تا ${resendCooldown} ثانیه دیگر` : `Resend in ${resendCooldown}s`,
    home: isFa ? "بازگشت به صفحه اصلی" : "Back to home",
    login: isFa ? "ورود به حساب" : "Sign in",
    verified: isFa ? "ایمیل تأیید شد" : "Email verified",
    account: isFa ? "حساب شما تأیید شد؛ برای ورود به پیشخوان از گزینه زیر استفاده کنید." : "Your account is verified. Use the button below to open your dashboard account.",
    resendFailed: isFa ? "ارسال کد انجام نشد. لطفاً دوباره تلاش کنید." : "The code could not be sent. Please try again.",
    invalid: isFa ? "کد واردشده معتبر نیست یا منقضی شده است." : "The code is invalid or has expired.",
    sessionFailed: isFa ? "ایمیل تأیید شد، اما ایجاد نشست خودکار موفق نشد. لطفاً وارد حساب خود شوید." : "Email was verified, but automatic sign-in could not be completed. Please sign in.",
    deliveryFailed: isFa ? "ارسال اولیه ایمیل ناموفق بود. می‌توانید کد را از این صفحه دوباره درخواست کنید." : "The initial email could not be delivered. You can request a new code here.",
  };

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!email.trim() || !/^\d{8}$/.test(code)) {
      setError(isFa ? "ایمیل و کد ۸ رقمی را به‌درستی وارد کنید." : "Enter a valid email address and an 8-digit code.");
      return;
    }
    setIsVerifying(true);
    try {
      const result = await verifyEmailAction(email.trim(), code);
      if (!result.success) throw new Error("INVALID_CODE");
      setIsVerified(true);
      if (!result.sessionCreated) {
        setSessionError(true);
        return;
      }
      try {
        const session = await refreshSession();
        if (session.status !== "authenticated" || !session.user) {
          setSessionError(true);
          return;
        }
        router.replace(`/${locale}/dashboard/profile`);
        router.refresh();
      } catch {
        setSessionError(true);
      }
    } catch {
      setError(t.invalid);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim() || isResending || resendCooldown > 0) return;
    setIsResending(true);
    setError("");
    setResendMessage("");
    try {
      const result = await requestVerification(email.trim(), locale as "fa" | "en");
      if (!result.success) throw new Error(result.errorCode ?? "SEND_FAILED");
      setResendCooldown(60);
      setResendMessage(isFa ? "در صورت ثبت بودن ایمیل و فعال بودن سرویس ارسال، کد جدید ارسال می‌شود." : "If the email is registered and delivery is configured, a new code will be sent.");
    } catch {
      setError(t.resendFailed);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[var(--background)] p-4" dir={isFa ? "rtl" : "ltr"}>
      <div className="pointer-events-none absolute inset-0 grid-backdrop opacity-20" />
      <div className="relative z-10 w-full max-w-[460px] space-y-6">
        <div className="flex flex-col items-center"><Link href={`/${locale}`} className="flex items-center gap-2"><SeorchableLogo className="h-10 w-10"/><span className="text-xl font-black text-[var(--text-primary)]">Oxenn</span></Link></div>
        <Card className="rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-2 shadow-2xl sm:p-4">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-black">{isVerified ? t.verified : t.title}</CardTitle>
            <CardDescription className="mt-1 text-xs leading-relaxed">{isVerified ? t.account : t.desc}</CardDescription>
          </CardHeader>
          <CardContent>
            {isVerified ? (
              <div className="space-y-4 text-center">
                <CheckCircle2 className="mx-auto text-emerald-500" size={42}/>
                {sessionError && <p role="alert" className="text-sm text-amber-600">{t.sessionFailed}</p>}
                <Link href={sessionError ? `/${locale}/login` : `/${locale}/dashboard/profile`} className="block rounded-xl bg-[var(--sky-blue-500)] px-4 py-3 text-sm font-bold text-white">{sessionError ? t.login : (isFa ? "رفتن به حساب کاربری" : "Go to my account")}</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {deliveryFailed && <p className="rounded-xl bg-amber-500/10 p-3 text-xs text-amber-700">{t.deliveryFailed}</p>}
                {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-[var(--color-error)]/25 bg-[var(--color-error)]/10 p-3 text-xs text-[var(--color-error)]"><AlertCircle size={15} className="mt-0.5 shrink-0"/><span>{error}</span></div>}
                <form onSubmit={handleVerify} className="space-y-4">
                  <Input type="email" inputMode="email" label={t.email} value={email} onChange={(event) => setEmail(event.target.value)} autoCapitalize="none" autoCorrect="off" spellCheck={false} disabled={isVerifying} required />
                  <Input
                    label={t.code}
                    value={code}
                    onChange={(event) => {
                      const asciiDigits = event.target.value
                        .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
                        .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660));
                      setCode(asciiDigits.replace(/[^0-9]/g, "").slice(0, 8));
                    }}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={8}
                    disabled={isVerifying}
                    required
                    className="text-center text-lg tracking-[0.35em]"
                  />
                  <Button type="submit" variant="primary" disabled={isVerifying} className="w-full py-3">{isVerifying ? t.verifying : <span className="inline-flex items-center justify-center gap-2"><CheckCircle2 size={15}/>{t.verify}</span>}</Button>
                </form>
                <div className="border-t border-[var(--border)] pt-4 text-center">
                  <button type="button" onClick={handleResend} disabled={isResending || resendCooldown > 0 || !email.trim()} className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--sky-blue-500)] disabled:cursor-not-allowed disabled:opacity-50">
                    {isResending ? <RotateCw size={14} className="animate-spin"/> : <Mail size={14}/>} {resendCooldown > 0 ? t.resendIn : t.resend}
                  </button>
                  {resendMessage && <p className="mt-2 text-xs text-emerald-600">{resendMessage}</p>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <div className="flex flex-col items-center gap-3 text-center">
          <Link href={`/${locale}`} className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]">{isFa ? <ArrowRight size={14}/> : <ArrowLeft size={14}/>}<span>{t.home}</span></Link>
          <Link href={`/${locale}/login`} className="text-xs text-[var(--sky-blue-500)] hover:underline">{t.login}</Link>
        </div>
      </div>
    </div>
  );
}
