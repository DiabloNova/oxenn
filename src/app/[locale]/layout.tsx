import React from "react";
import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { persianPrimary, persianDisplay, englishTitleFont } from "@/config/fonts";
import { siteConfig } from "@/config/site";
import FloatingSidebar from "@/components/navigation/FloatingSidebar";
import GlobalNavigationControls from "@/components/navigation/GlobalNavigationControls";
import "../globals.css";

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} — هوشمندی و دیده‌شدن برند سئورچبل`,
    template: `%s | ${siteConfig.name}`,
  },
  description:
    "سنجش، محافظت و بهینه‌سازی نحوه‌ی ارجاع به برند شما در ChatGPT، Gemini، Claude و Perplexity. پلتفرم نسل‌بعدی AEO و GEO با سئورچبل seorchable.ir.",
  keywords: ["AEO", "GEO", "Brand Intelligence", "AI visibility", "سئورچبل", "seorchable.ir", "دیده‌شدن برند"],
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
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
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

  // Apply all primary, display, and English title font variable classes to html
  const fontClasses = `${persianPrimary.variable} ${persianDisplay.variable} ${englishTitleFont.variable}`;

  return (
    <html
      lang={locale}
      dir={locale === "fa" ? "rtl" : "ltr"}
      className={fontClasses}
      style={{ backgroundColor: "var(--background)" }}
    >
      <body>
        <ThemeProvider initialLanguage={locale as "en" | "fa"}>
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
