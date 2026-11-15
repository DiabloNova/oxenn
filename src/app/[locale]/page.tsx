import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isSupportedLocale } from "@/config/i18n";
import { LandingHeader } from "@/components/marketing/LandingHeader";
import { LandingSections } from "@/components/marketing/LandingSections";
import { LandingFooter } from "@/components/marketing/LandingFooter";

type PageProps = { params: Promise<{ locale: string }> };

const pageMetadata = {
  fa: {
    title: "هوشمندی ارزیابی و بهبود محصول و بازار",
    description: "محصول یا خدمت خود را در زمینه بازار، حضور دیجیتال و رقابت ارزیابی کنید؛ شواهد را از فرضیه‌ها جدا نگه دارید و فرصت‌های بهبود را به برنامه‌ای قابل بررسی تبدیل کنید.",
  },
  en: {
    title: "Product & Market Improvement Intelligence",
    description: "Assess existing products and services across digital presence and competitive context, distinguish evidence from hypotheses, and shape reviewable improvement plans.",
  },
} as const;

export function generateStaticParams() {
  return [{ locale: "fa" }, { locale: "en" }];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) return {};
  const copy = pageMetadata[locale];
  return {
    title: copy.title,
    description: copy.description,
    applicationName: "OXENN",
    alternates: { languages: { fa: "/fa", en: "/en" } },
    openGraph: { title: copy.title, description: copy.description, siteName: "OXENN", type: "website" },
    twitter: { card: "summary", title: copy.title, description: copy.description },
  };
}

export default async function MarketingLandingPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  return (
    <div className="signal-atlas" dir={locale === "fa" ? "rtl" : "ltr"} lang={locale}>
      <LandingHeader />
      <LandingSections locale={locale} />
      <LandingFooter />
    </div>
  );
}
