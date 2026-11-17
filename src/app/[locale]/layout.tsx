import React from "react";
import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { persianPrimary, persianDisplay } from "@/config/fonts";
import { siteConfig } from "@/config/site";
import { isSupportedLocale } from "@/config/i18n";
import FloatingSidebar from "@/components/navigation/FloatingSidebar";
import GlobalNavigationControls from "@/components/navigation/GlobalNavigationControls";
import "../globals.css";

export const metadata: Metadata = {
  title: {
    default: "Oxenn — Product Intelligence",
    template: `%s | ${siteConfig.name}`,
  },
  description:
    "Product and market intelligence for clearer decisions. Connect product context, digital presence, and market evidence in one view.",
  keywords: ["Oxenn", "Product Intelligence", "Market Intelligence", "Digital Discovery", "Product Strategy"],
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f6f2" },
    { media: "(prefers-color-scheme: dark)", color: "#101514" },
  ],
  colorScheme: "light dark",
};

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

/**
 * Configures the localized application layout and provider hierarchy.
 *
 * @param params - Resolves to the current route locale.
 * @returns The document layout containing the localized direction, theme provider, authentication provider, and page content.
 */
export default async function RootLayout({ children, params }: LayoutProps) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  // Apply the Persian body and display font variables to the document.
  const fontClasses = `${persianPrimary.variable} ${persianDisplay.variable}`;

  return (
    <html
      lang={locale}
      dir={locale === "fa" ? "rtl" : "ltr"}
      className={fontClasses}
      style={{ backgroundColor: "var(--background)" }}
    >
      <body>
        <ThemeProvider initialLanguage={locale}>
          <AuthProvider>
            {children}
            <FloatingSidebar />
            <GlobalNavigationControls />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
