import React from "react";
import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { RouteAwareAuthProvider } from "@/components/auth/RouteAwareAuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { persianPrimary } from "@/config/fonts";
import { siteConfig } from "@/config/site";
import { isSupportedLocale } from "@/config/i18n";
import FloatingSidebar from "@/components/navigation/FloatingSidebar";
import GlobalNavigationControls from "@/components/navigation/GlobalNavigationControls";
import "../globals.css";

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) return {};

  const isFa = locale === "fa";
  const title = isFa
    ? "هوشمندی ارزیابی و بهبود محصول و بازار"
    : "Product & Market Improvement Intelligence";
  const description = isFa
    ? "محصول یا خدمت موجود خود را در زمینه بازار، حضور دیجیتال و رقابت ارزیابی کنید و فرصت‌های بهبود را به برنامه‌ای قابل بررسی تبدیل کنید."
    : "Assess existing products and services across digital presence and competitive context, distinguish evidence from hypotheses, and shape reviewable improvement plans.";

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL?.trim() || siteConfig.url),
    title: { default: title, template: "%s | OXENN" },
    description,
    applicationName: "OXENN",
    icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }], shortcut: ["/icon.svg"], apple: ["/icon.svg"] },
    openGraph: { title, description, siteName: "OXENN", type: "website" },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f7fc" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1423" },
  ],
  colorScheme: "light dark",
};

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function RootLayout({ children, params }: LayoutProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const fontClasses = persianPrimary.variable;

  return (
    <html lang={locale} dir={locale === "fa" ? "rtl" : "ltr"} className={fontClasses} style={{ backgroundColor: "var(--background)" }}>
      <body>
        <ThemeProvider initialLanguage={locale}>
          <RouteAwareAuthProvider>
            <div id="page-content" tabIndex={-1}>
              {children}
            </div>
            <FloatingSidebar />
            <GlobalNavigationControls />
          </RouteAwareAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
