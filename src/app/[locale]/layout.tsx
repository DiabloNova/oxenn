import React from "react";
import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { RouteAwareAuthProvider } from "@/components/auth/RouteAwareAuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { persianPrimary, persianDisplay } from "@/config/fonts";
import { isSupportedLocale } from "@/config/i18n";
import FloatingSidebar from "@/components/navigation/FloatingSidebar";
import GlobalNavigationControls from "@/components/navigation/GlobalNavigationControls";
import "../globals.css";

export const metadata: Metadata = {
  title: { default: "OXENN — Product & Market Improvement Intelligence", template: "%s | OXENN" },
  description: "Evidence-grounded product and market assessment to help businesses understand existing offers, digital presence, and competitive context.",
  applicationName: "OXENN",
  openGraph: { siteName: "OXENN", type: "website" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#102024" },
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
  const fontClasses = persianPrimary.variable + " " + persianDisplay.variable;

  return (
    <html lang={locale} dir={locale === "fa" ? "rtl" : "ltr"} className={fontClasses} style={{ backgroundColor: "var(--background)" }}>
      <body>
        <ThemeProvider initialLanguage={locale}>
          <RouteAwareAuthProvider>
            {children}
            <FloatingSidebar />
            <GlobalNavigationControls />
          </RouteAwareAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
