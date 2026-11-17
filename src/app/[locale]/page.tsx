import { notFound } from "next/navigation";
import { isSupportedLocale } from "@/config/i18n";
import { OxennHomepage } from "@/components/marketing/OxennHomepage";

export default async function MarketingLandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  return <OxennHomepage locale={locale} />;
}
