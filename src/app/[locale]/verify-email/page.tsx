"use client";

import React, { useState, use, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/Card";
import { SeorchableLogo } from "@/components/marketing/SeorchableLogo";
import { AlertCircle, CheckCircle2, ShieldAlert, ArrowLeft, ArrowRight, RotateCw } from "lucide-react";
import { verifyEmailAction } from "@/app/actions/auth";
import { requestVerification } from "@/app/actions/auth";



export default function VerifyEmailPage({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = use(params);
  const locale = resolvedParams.locale;
  const isFa = locale === "fa";
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams?.get("email") || "";

  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);

  // Fill token from URL if available, but only if it changed to prevent overwriting manual input unexpectedly
  const tokenParam = searchParams?.get("token");
  const [lastUrlToken, setLastUrlToken] = useState<string | null>(null);

  useEffect(() => {
    if (tokenParam && tokenParam !== lastUrlToken) {
      // Defer state update slightly to avoid synchronous cascade warnings in some React configurations
      setTimeout(() => {
        setCode(tokenParam);
        setLastUrlToken(tokenParam);
      }, 0);
    }
  }, [tokenParam, lastUrlToken]);

  // Resend code countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const strings = {
    title: isFa ? "تایید ایمیل سازمانی" : "Verify Your Email Address",
    desc: isFa
      ? `یک لینک و توکن تایید به آدرس ${emailParam || "ایمیل شما"} ارسال گردید. لطفاً توکن را وارد نمایید.`
      : `We sent a secure confirmation link to ${emailParam || "your email"}. Enter your token to continue.`,
    codeLabel: isFa ? "توکن تایید" : "Verification Token",
    codePlaceholder: isFa ? "توکن تایید را اینجا وارد کنید" : "Enter confirmation token here",
    submitBtn: isFa ? "تایید نهایی و فعال‌سازی" : "Verify & Activate Workspace",
    loading: isFa ? "در حال اعتبارسنجی توکن..." : "Validating token...",
    resendBtn: isFa ? "ارسال مجدد توکن" : "Resend Verification Token",
    resendWait: isFa
      ? `ارسال مجدد تا ${resendCooldown} ثانیه دیگر`
      : `Resend token in ${resendCooldown}s`,
    successTitle: isFa ? "فعال‌سازی با موفقیت انجام شد!" : "Verification Complete!",
    successDesc: isFa
      ? "ایمیل سازمانی شما تایید گردید. در حال انتقال به پیشخوان کاربری..."
      : "Your workspace has been successfully verified. Entering the dashboard...",
    backToHome: isFa ? "بازگشت به صفحه اصلی" : "Back to landing page",
    validationCodeRequired: isFa ? "وارد کردن توکن تایید الزامی است." : "Verification token is required.",
    validationCodeLength: isFa ? "توکن وارد شده معتبر نمی‌باشد." : "The token format is invalid.",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setCodeError("");

    if (!code.trim()) {
      setCodeError(strings.validationCodeRequired);
      return;
    }
    // we drop exact length requirements since it's an opaque token

    setIsLoading(true);
    try {
      // Use the actual backend action
      const res = await verifyEmailAction(code.trim());
      if (res && res.success) {
        setIsSuccess(true);
        setTimeout(() => {
          router.push(`/${locale}/dashboard`);
        }, 1500);
      } else {
        throw new Error("Invalid token");
      }
    } catch (err: unknown) {
      setSubmitError(isFa ? "کد تایید نامعتبر یا منقضی شده است." : "The verification token is invalid or has expired.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;

    if (!emailParam) {
      setSubmitError(isFa ? "آدرس ایمیل برای ارسال مجدد مشخص نیست." : "Email address is missing for resend.");
      return;
    }

    setIsResending(true);
    try {
      await requestVerification(emailParam);
      setResendCooldown(60);
      setSubmitError(""); // Clear any previous errors on success
    } catch (e) {
      setSubmitError(isFa ? "خطا در ارسال مجدد توکن." : "Failed to resend verification token.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-[var(--background)] relative overflow-hidden" style={{ direction: isFa ? "rtl" : "ltr" }}>
      {/* Decorative Gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--sky-blue-500)]/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--orange-500)]/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute inset-0 grid-backdrop opacity-[0.2] pointer-events-none -z-10" />

      {/* Main Container */}
      <div className="w-full max-w-[460px] space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center text-center">
          <Link href={`/${locale}`} className="flex items-center gap-2 group cursor-pointer">
            <SeorchableLogo className="w-10 h-10 group-hover:scale-105 transition-transform duration-300" />
            <span className="font-display font-black text-xl bg-gradient-to-r from-[var(--sky-blue-500)] to-[var(--orange-500)] bg-clip-text text-transparent">
              {isFa ? "سئورچبل" : "seorchable.ir"}
            </span>
          </Link>
        </div>

        {/* Card */}
        <Card className="glass-panel border border-[var(--glass-border)] bg-[var(--glass-bg)] shadow-2xl rounded-3xl p-2 sm:p-4">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl font-black font-display text-[var(--text-primary)]">
              {isSuccess ? strings.successTitle : strings.title}
            </CardTitle>
            <CardDescription className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed mt-1">
              {isSuccess ? strings.successDesc : strings.desc}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-fade-in text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 size={36} className="animate-pulse" />
                </div>
                <div className="text-sm font-semibold text-[var(--text-primary)]">{isFa ? "درحال ورود به محیط داشبورد..." : "Loading Workspace Dashboard..."}</div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {submitError && (
                  <div className="p-3.5 rounded-xl border border-[var(--color-error)]/25 bg-[var(--color-error)]/10 text-[var(--color-error)] text-xs flex items-start gap-2 animate-shake">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <p className="font-bold">{submitError}</p>
                  </div>
                )}

                {/* Verification Code Input */}
                <Input
                  type="text"
                  label={strings.codeLabel}
                  placeholder={strings.codePlaceholder}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  error={codeError}
                  disabled={isLoading}
                  required
                  className="text-center text-sm font-mono focus:tracking-normal"
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isLoading}
                  className="w-full py-3 mt-2 rounded-xl text-xs font-black flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>{strings.loading}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      <span>{strings.submitBtn}</span>
                    </>
                  )}
                </Button>

                {/* Resend Code controls */}
                <div className="pt-4 border-t border-[var(--border)] text-center flex flex-col items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || isLoading || isResending}
                    className="text-xs text-[var(--sky-blue-500)] hover:text-[var(--orange-500)] transition-colors font-bold disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCw size={13} className={isResending ? "animate-spin" : ""} />
                    <span>{resendCooldown > 0 ? strings.resendWait : strings.resendBtn}</span>
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Back to Home CTA */}
        <div className="text-center">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors font-bold cursor-pointer"
          >
            {isFa ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
            <span>{strings.backToHome}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
