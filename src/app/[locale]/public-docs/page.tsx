import { readFileSync } from "node:fs";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import MarkdownContent from "@/components/public-docs/MarkdownContent";
import { isSupportedLocale, SUPPORTED_LOCALES, type Locale } from "@/config/i18n";

export const dynamic = "force-static";
export const dynamicParams = false;

interface PublicDocsPageProps {
  params: Promise<{ locale: string }>;
}

function readPublicDocument(locale: Locale): string {
  // Keep both source paths literal so the build tracer can include only these files.
  if (locale === "fa") {
    return readFileSync("docs/public/fa/README.md", "utf8");
  }
  return readFileSync("docs/public/en/README.md", "utf8");
}

export function generateStaticParams(): Array<{ locale: Locale }> {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PublicDocsPageProps): Promise<Metadata> {
  const resolved = await params;
  if (!isSupportedLocale(resolved.locale)) notFound();

  const locale = resolved.locale;
  const isPersian = locale === "fa";
  const title = isPersian ? "مستندات عمومی OXENN" : "OXENN Public Documentation";
  const description = isPersian
    ? "مرجع معرفی محصولات، خدمات و مفاهیم اصلی OXENN."
    : "An overview of OXENN products, services, and core concepts.";

  return {
    title,
    description,
    alternates: {
      canonical: "/" + locale + "/public-docs",
      languages: { fa: "/fa/public-docs", en: "/en/public-docs" },
    },
    openGraph: {
      title,
      description,
      locale: isPersian ? "fa_IR" : "en_US",
      type: "article",
    },
  };
}

export default async function PublicDocsPage({ params }: PublicDocsPageProps) {
  const resolved = await params;
  if (!isSupportedLocale(resolved.locale)) notFound();

  const locale = resolved.locale;
  const alternateLocale: Locale = locale === "fa" ? "en" : "fa";
  const isPersian = locale === "fa";
  const markdown = readPublicDocument(locale);

  return (
    <main
      dir={isPersian ? "rtl" : "ltr"}
      lang={locale}
      className="min-h-screen bg-[var(--background)] px-4 py-8 text-[var(--text-primary)] sm:px-6 lg:px-8"
    >
      <div className="mx-auto w-full max-w-4xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--glass-border)] pb-5">
          <Link
            href={"/" + locale}
            className="text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          >
            {isPersian ? "بازگشت به صفحه اصلی OXENN" : "Back to OXENN home"}
          </Link>
          <Link
            href={"/" + alternateLocale + "/public-docs"}
            hrefLang={alternateLocale}
            lang={alternateLocale}
            className="rounded-full border border-[var(--glass-border)] px-4 py-2 text-sm font-semibold transition-colors hover:bg-[var(--glass-bg)]"
          >
            {isPersian ? "English" : "فارسی"}
          </Link>
        </header>

        <article className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-5 shadow-sm sm:p-8 lg:p-10">
          <MarkdownContent markdown={markdown} locale={locale} />
        </article>
      </div>
    </main>
  );
}
