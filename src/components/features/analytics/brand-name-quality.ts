export type BrandNameFindingSeverity = "info" | "warning";

export interface BrandNameSuggestion {
  originalName: string;
  suggestedName: string;
  matchedTerms: string[];
}

export interface BrandNameFinding {
  code: "mixed-script" | "arabic-persian-variant" | "invisible-character" | "english-term";
  severity: BrandNameFindingSeverity;
  messageFa: string;
  messageEn: string;
  suggestions: BrandNameSuggestion[];
}

const persianScript = /[\u0600-\u06ff]/u;
const latinScript = /[A-Za-z]/u;
const arabicYehOrKaf = /[\u064a\u0643]/u;
const invisibleFormatting = /[\u200b\u200e\u200f\u202a-\u202e\u2060\ufeff]/u;

const termEquivalents: Array<{ term: string; fa: string }> = [
  { term: "artificial intelligence", fa: "هوش مصنوعی" },
  { term: "machine learning", fa: "یادگیری ماشین" },
  { term: "SEO", fa: "بهینه‌سازی برای موتورهای جست‌وجو" },
  { term: "AEO", fa: "بهینه‌سازی برای موتورهای پاسخ‌گو" },
  { term: "GEO", fa: "بهینه‌سازی برای موتورهای مولد" },
  { term: "LLM", fa: "مدل زبانی بزرگ" },
  { term: "API", fa: "رابط برنامه‌نویسی کاربردی" },
  { term: "AI", fa: "هوش مصنوعی" },
  { term: "cloud", fa: "رایانش ابری" },
  { term: "smart", fa: "هوشمند" },
  { term: "tech", fa: "فناوری" },
];

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const findEnglishTerms = (name: string) => {
  const matches: Array<{ term: string; fa: string; index: number; end: number }> = [];
  const terms = [...termEquivalents].sort((a, b) => b.term.length - a.term.length);
  for (const item of terms) {
    const matcher = new RegExp("(?<![\\p{L}\\p{N}])" + escapeRegExp(item.term) + "(?![\\p{L}\\p{N}])", "giu");
    let match: RegExpExecArray | null;
    while ((match = matcher.exec(name)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      if (matches.some((existing) => start < existing.end && end > existing.index)) continue;
      matches.push({ ...item, index: start, end });
    }
  }
  return matches.sort((a, b) => a.index - b.index);
};

/**
 * Deterministic, local-only brand-name checks. These are guidance signals,
 * not proof that an LLM will misunderstand a brand or that the name is invalid.
 */
export function analyzeBrandName(name: string, language: "fa" | "en" = "fa"): BrandNameFinding[] {
  const findings: BrandNameFinding[] = [];
  if (!name.trim()) return findings;

  if (arabicYehOrKaf.test(name) && persianScript.test(name)) {
    findings.push({
      code: "arabic-persian-variant",
      severity: "warning",
      messageFa: "نام برند حاوی «ی» یا «ک» عربی است. این نویسه‌ها ممکن است با شکل فارسی آن‌ها متفاوت تطبیق داده شوند؛ نام رسمی را بررسی کنید.",
      messageEn: "The brand name contains Arabic Yeh/Kaf variants that may not match Persian spellings consistently. Review the official spelling.",
      suggestions: [],
    });
  }

  if (invisibleFormatting.test(name)) {
    findings.push({
      code: "invisible-character",
      severity: "warning",
      messageFa: "نام برند شامل یک نویسهٔ کنترلی یا نامرئی است. آن را بررسی کنید؛ این هشدار شامل نیم‌فاصلهٔ فارسی نیست.",
      messageEn: "The brand name contains an invisible formatting character. Review it; Persian ZWNJ is not flagged.",
      suggestions: [],
    });
  }

  const terms = findEnglishTerms(name);
  if (terms.length > 0) {
    let suggestedName = "";
    let cursor = 0;
    for (const term of terms) {
      suggestedName += name.slice(cursor, term.index) + term.fa;
      cursor = term.end;
    }
    suggestedName += name.slice(cursor);
    if (suggestedName.trim() && suggestedName !== name) {
      findings.push({
        code: "english-term",
        severity: "info",
        messageFa: "عبارت انگلیسی شناخته‌شده‌ای در نام برند پیدا شد. می‌توانید معادل فارسی را به‌عنوان نام جایگزین برای تطبیق و تحلیل اضافه کنید؛ نام رسمی تغییر نمی‌کند.",
        messageEn: "A recognized English term was found. You can add its Persian equivalent as an analysis alias; the official brand name will not be changed.",
        suggestions: [{ originalName: name, suggestedName, matchedTerms: terms.map((term) => term.term) }],
      });
    }
  } else if (language === "fa" && persianScript.test(name) && latinScript.test(name)) {
    findings.push({
      code: "mixed-script",
      severity: "info",
      messageFa: "نام برند ترکیبی از فارسی و لاتین است. این لزوماً خطا نیست؛ اگر معادل فارسی شناخته‌شده‌ای دارد، می‌توانید آن را به‌عنوان نام جایگزین اضافه کنید.",
      messageEn: "The brand name mixes Persian and Latin scripts. This is not necessarily an error; add a Persian alias if one is appropriate.",
      suggestions: [],
    });
  }

  return findings;
}
