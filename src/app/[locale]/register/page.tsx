"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/Card";
import { SeorchableLogo } from "@/components/marketing/SeorchableLogo";
import { AlertCircle, ArrowLeft, ArrowRight, UserPlus } from "lucide-react";
import {
  emailLocalPartHasUppercase,
  getEmailValidationError,
  getPasswordValidationError,
  getPersonNameValidationError,
  getUsernameValidationError,
  passwordHasUppercase,
} from "@/services/auth/registration-validation";
import { getSafeLocaleReturnTo } from "@/services/auth/return-to";

export default function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const isFa = locale === "fa";
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuth();
  const requestedReturnTo = searchParams.get("returnTo");
  const returnTo = getSafeLocaleReturnTo(requestedReturnTo, locale) ?? "";
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const liveEmailValidationError = getEmailValidationError(email);

  const t = {
    title: isFa ? "ایجاد حساب کاربری" : "Create your account",
    desc: isFa ? "برای ساخت حساب، اطلاعات زیر را وارد کنید." : "Enter your details to create your Oxenn account.",
    firstName: isFa ? "نام" : "First name",
    lastName: isFa ? "نام خانوادگی" : "Last name",
    email: isFa ? "آدرس ایمیل" : "Email address",
    password: isFa ? "رمز عبور" : "Password",
    username: isFa ? "نام کاربری" : "Username",
    submit: isFa ? "ثبت‌نام و ارسال کد تأیید" : "Register and send verification code",
    loading: isFa ? "در حال ایجاد حساب..." : "Creating account...",
    home: isFa ? "بازگشت به صفحه اصلی" : "Back to home",
    haveAccount: isFa ? "قبلاً حساب دارید؟" : "Already have an account?",
    login: isFa ? "ورود" : "Sign in",
    localUpperWarning: isFa ? "حروف بزرگ در بخش ابتدایی ایمیل مجاز است؛ آدرس هنگام ذخیره‌سازی یکسان‌سازی می‌شود." : "Uppercase letters in the part before @ are allowed; the address is normalized when saved.",
    domainUpperError: isFa ? "حروف بزرگ در بخش دامنه ایمیل مجاز نیست. دامنه را کاملاً با حروف کوچک بنویسید." : "Uppercase letters are not allowed in the email domain. Use lowercase letters only.",
    passwordUpperWarning: isFa ? "رمز عبور باید حداقل یک حرف بزرگ انگلیسی داشته باشد." : "Add at least one uppercase letter to your password.",
    passwordHint: isFa ? "حداقل ۱۰ نویسه انگلیسی، یک حرف بزرگ، یک عدد و دو کاراکتر خاص." : "At least 10 ASCII characters, one uppercase letter, one number and two special characters.",
  };

  const validate = () => {
    const next: Record<string, string> = {};
    const firstError = getPersonNameValidationError(firstName, locale as "fa" | "en");
    const lastError = getPersonNameValidationError(lastName, locale as "fa" | "en");
    const emailError = getEmailValidationError(email);
    const passwordError = getPasswordValidationError(password);
    const usernameError = getUsernameValidationError(username);
    if (firstError) next.firstName = firstError === "NAME_REQUIRED"
      ? (isFa ? "وارد کردن نام الزامی است." : "First name is required.")
      : firstError === "NAME_TOO_LONG"
        ? (isFa ? "نام نمی‌تواند بیش از ۱۰۰ نویسه باشد." : "First name cannot exceed 100 characters.")
        : (isFa ? "نام باید به زبان فارسی وارد شود." : "Enter your first name using English letters only.");
    if (lastError) next.lastName = lastError === "NAME_REQUIRED"
      ? (isFa ? "وارد کردن نام خانوادگی الزامی است." : "Last name is required.")
      : lastError === "NAME_TOO_LONG"
        ? (isFa ? "نام خانوادگی نمی‌تواند بیش از ۱۰۰ نویسه باشد." : "Last name cannot exceed 100 characters.")
        : (isFa ? "نام خانوادگی باید به زبان فارسی وارد شود." : "Enter your last name using English letters only.");
    if (emailError) {
      const messages: Record<string, string> = isFa ? {
        EMAIL_REQUIRED: "ایمیل الزامی است.", EMAIL_ENGLISH_ONLY: "ایمیل باید فقط شامل نویسه‌های انگلیسی باشد.", EMAIL_DOMAIN_UPPERCASE: "حروف بزرگ در بخش دامنه ایمیل مجاز نیست؛ دامنه را با حروف کوچک وارد کنید.", EMAIL_HYPHEN_NOT_ALLOWED: "استفاده از خط فاصله در ایمیل مجاز نیست.", EMAIL_INVALID_FORMAT: "قالب ایمیل باید مانند x@x.x باشد.",
      } : {
        EMAIL_REQUIRED: "Email is required.", EMAIL_ENGLISH_ONLY: "Email must contain English ASCII characters only.", EMAIL_DOMAIN_UPPERCASE: "Uppercase letters are not allowed in the email domain. Use lowercase letters.", EMAIL_HYPHEN_NOT_ALLOWED: "Hyphens are not allowed in email addresses.", EMAIL_INVALID_FORMAT: "Email must use the x@x.x format.",
      };
      next.email = messages[emailError];
    }
    if (passwordError) {
      const messages: Record<string, string> = isFa ? {
        PASSWORD_REQUIRED: "رمز عبور الزامی است.", PASSWORD_TOO_SHORT: "رمز عبور باید حداقل ۱۰ نویسه باشد.", PASSWORD_TOO_LONG: "رمز عبور نمی‌تواند بیشتر از ۲۵۵ نویسه باشد.", PASSWORD_ENGLISH_ONLY: "رمز عبور باید فقط از نویسه‌های انگلیسی استفاده کند و فاصله نداشته باشد.", PASSWORD_UPPERCASE_REQUIRED: "رمز عبور باید حداقل یک حرف بزرگ انگلیسی داشته باشد.", PASSWORD_NUMBER_REQUIRED: "رمز عبور باید حداقل یک عدد داشته باشد.", PASSWORD_TWO_SPECIAL_REQUIRED: "رمز عبور باید حداقل دو کاراکتر خاص داشته باشد.",
      } : {
        PASSWORD_REQUIRED: "Password is required.", PASSWORD_TOO_SHORT: "Password must contain at least 10 characters.", PASSWORD_TOO_LONG: "Password cannot exceed 255 characters.", PASSWORD_ENGLISH_ONLY: "Password must use English ASCII characters only and contain no spaces.", PASSWORD_UPPERCASE_REQUIRED: "Password must include at least one uppercase letter.", PASSWORD_NUMBER_REQUIRED: "Password must include at least one number.", PASSWORD_TWO_SPECIAL_REQUIRED: "Password must include at least two special characters.",
      };
      next.password = messages[passwordError];
    }
    if (usernameError) next.username = isFa
      ? "نام کاربری باید ۳ تا ۳۲ نویسه و فقط شامل حروف، اعداد، نقطه، زیرخط یا خط تیره باشد."
      : "Username must be 3–32 characters and use only letters, numbers, dots, underscores, or hyphens.";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError("");
    if (!validate()) return;
    setIsLoading(true);
    try {
      const result = await register(firstName.trim(), lastName.trim(), email.trim(), password, username.trim(), locale as "fa" | "en");
      const verificationParams = new URLSearchParams({ email: email.trim() });
      if (!result.verificationEmailSent) verificationParams.set("delivery", "failed");
      if (returnTo) verificationParams.set("returnTo", returnTo);
      router.replace(`/${locale}/verify-email?${verificationParams.toString()}`);
    } catch (error) {
      const code = (error as { code?: string })?.code;
      const errors: Record<string, string> = isFa ? {
        USERNAME_EXISTS: "این نام کاربری قبلاً انتخاب شده است.", TooManyRequests: "تعداد درخواست‌ها بیش از حد مجاز است. بعداً تلاش کنید.", INVALID_REGISTRATION: "اطلاعات واردشده معتبر نیست.",
      } : {
        USERNAME_EXISTS: "This username is already taken.", TooManyRequests: "Too many registration attempts. Try again later.", INVALID_REGISTRATION: "The registration details are invalid.",
      };
      setSubmitError((code && errors[code]) || (isFa ? "ثبت‌نام انجام نشد. اطلاعات را بررسی و دوباره تلاش کنید." : "Registration failed. Check your details and try again."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[var(--background)] p-4" dir={isFa ? "rtl" : "ltr"}>
      <div className="pointer-events-none absolute inset-0 grid-backdrop opacity-20" />
      <div className="relative z-10 w-full max-w-[480px] space-y-6">
        <div className="flex flex-col items-center text-center">
          <Link href={`/${locale}`} className="flex items-center gap-2"><SeorchableLogo className="h-10 w-10" /><span className="text-xl font-black text-[var(--text-primary)]">Oxenn</span></Link>
        </div>
        <Card className="rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-2 shadow-2xl sm:p-4">
          <CardHeader className="pb-2 text-center">
            <CardTitle className="text-xl font-black">{t.title}</CardTitle>
            <CardDescription className="mt-1 text-xs leading-relaxed">{t.desc}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {submitError && <div role="alert" className="flex items-start gap-2 rounded-xl border border-[var(--color-error)]/25 bg-[var(--color-error)]/10 p-3 text-xs text-[var(--color-error)]"><AlertCircle size={15} className="mt-0.5 shrink-0"/><span>{submitError}</span></div>}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label={t.firstName} value={firstName} onChange={(e) => setFirstName(e.target.value)} error={fieldErrors.firstName} disabled={isLoading} required autoComplete="given-name" />
                <Input label={t.lastName} value={lastName} onChange={(e) => setLastName(e.target.value)} error={fieldErrors.lastName} disabled={isLoading} required autoComplete="family-name" />
              </div>
              <Input
                type="email"
                inputMode="email"
                label={t.email}
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (!getEmailValidationError(event.target.value)) {
                    setFieldErrors((previous) => ({ ...previous, email: "" }));
                  }
                }}
                error={fieldErrors.email}
                disabled={isLoading}
                required
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
              {!fieldErrors.email && liveEmailValidationError === "EMAIL_DOMAIN_UPPERCASE" && (
                <p className="text-xs text-[var(--color-error)]">{t.domainUpperError}</p>
              )}
              {!fieldErrors.email && emailLocalPartHasUppercase(email) && (
                <p className="text-xs text-amber-600">{t.localUpperWarning}</p>
              )}
              <Input type="password" label={t.password} value={password} onChange={(e) => setPassword(e.target.value)} error={fieldErrors.password} disabled={isLoading} required autoComplete="new-password" autoCapitalize="none" autoCorrect="off" spellCheck={false} />
              <p className="text-xs text-[var(--text-muted)]">{t.passwordHint}</p>
              {password.length > 0 && !passwordHasUppercase(password) && <p className="text-xs text-amber-600">{t.passwordUpperWarning}</p>}
              <Input label={t.username} value={username} onChange={(e) => setUsername(e.target.value)} error={fieldErrors.username} disabled={isLoading} required autoComplete="username" />
              <Button type="submit" variant="primary" disabled={isLoading} className="w-full py-3">
                {isLoading ? t.loading : <span className="inline-flex items-center justify-center gap-2"><UserPlus size={15}/>{t.submit}</span>}
              </Button>
            </form>
            <div className="mt-6 border-t border-[var(--border)] pt-4 text-center text-xs font-semibold">
              <span className="text-[var(--text-muted)]">{t.haveAccount} </span><Link href={`/${locale}/login`} className="text-[var(--sky-blue-500)] hover:underline">{t.login}</Link>
            </div>
          </CardContent>
        </Card>
        <div className="text-center"><Link href={`/${locale}`} className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]">{isFa ? <ArrowRight size={14}/> : <ArrowLeft size={14}/>}<span>{t.home}</span></Link></div>
      </div>
    </div>
  );
}
