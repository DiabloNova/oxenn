"use client";

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useTheme } from "@/components/ThemeProvider";

type Field = { id: string; labelFa: string; labelEn: string; kind?: "text" | "textarea" | "select"; required?: boolean; options?: Array<{ value: string; labelFa: string; labelEn: string }> };
type FieldGroup = { id: string; titleFa: string; titleEn: string; fields: Field[] };

const groups: FieldGroup[] = [
  { id: "identity", titleFa: "شناسه و توصیف برند و پیشنهاد شما", titleEn: "Brand and offer identity", fields: [
    { id: "brandName", labelFa: "نام برند", labelEn: "Brand name", required: true },
    { id: "website", labelFa: "وب‌سایت اصلی", labelEn: "Primary website" },
    { id: "offerName", labelFa: "نام محصول یا خدمت", labelEn: "Product or service name" },
    { id: "offerType", labelFa: "نوع پیشنهاد", labelEn: "Offer type", kind: "select", options: [
      { value: "physical", labelFa: "محصول فیزیکی", labelEn: "Physical product" },
      { value: "digital", labelFa: "محصول دیجیتال", labelEn: "Digital product" },
      { value: "service", labelFa: "خدمت", labelEn: "Service" },
    ] },
    { id: "category", labelFa: "دسته یا صنعت", labelEn: "Category or industry" },
    { id: "lifecycle", labelFa: "مرحله چرخه عمر", labelEn: "Lifecycle stage" },
    { id: "availability", labelFa: "وضعیت و محدوده دسترسی", labelEn: "Availability and access" },
    { id: "description", labelFa: "شرح محصول، خدمت و مسئله‌ای که حل می‌کند", labelEn: "Offer description and problem addressed", kind: "textarea" },
  ] },
  { id: "value", titleFa: "ارزش پیشنهادی و تمایز", titleEn: "Value proposition and differentiation", fields: [
    { id: "valueProposition", labelFa: "ارزش پیشنهادی اصلی", labelEn: "Core value proposition", kind: "textarea" },
    { id: "differentiators", labelFa: "ویژگی‌ها و ادعاهای متمایزکننده", labelEn: "Differentiators and claims", kind: "textarea" },
    { id: "supportingEvidence", labelFa: "شواهد پشتیبان ادعاها", labelEn: "Evidence supporting the claims", kind: "textarea" },
  ] },
  { id: "customers", titleFa: "مشتریان و زمینه بازار", titleEn: "Customers and market context", fields: [
    { id: "customerGroups", labelFa: "گروه‌های مشتریان فعلی و هدف", labelEn: "Current and target customer groups", kind: "textarea" },
    { id: "needsUseCases", labelFa: "نیازها، کاربردها و موقعیت‌های استفاده", labelEn: "Needs, use cases and usage contexts", kind: "textarea" },
    { id: "purchaseBarriers", labelFa: "موانع و معیارهای تصمیم خرید", labelEn: "Purchase barriers and decision criteria", kind: "textarea" },
    { id: "targetMarkets", labelFa: "بازارهای هدف", labelEn: "Target markets", kind: "textarea" },
    { id: "geographiesLanguagesChannels", labelFa: "مناطق جغرافیایی، زبان‌ها و کانال‌ها", labelEn: "Geographies, languages and channels", kind: "textarea" },
  ] },
  { id: "commercial", titleFa: "زمینه تجاری و عملیاتی", titleEn: "Commercial and operational context", fields: [
    { id: "pricingBusinessModel", labelFa: "قیمت‌گذاری و مدل کسب‌وکار", labelEn: "Pricing and business model", kind: "textarea" },
    { id: "competitorsAlternatives", labelFa: "رقبا و جایگزین‌ها", labelEn: "Competitors and alternatives", kind: "textarea" },
    { id: "operationalConstraints", labelFa: "محدودیت‌های عملیاتی", labelEn: "Operational constraints", kind: "textarea" },
    { id: "capacity", labelFa: "ظرفیت‌ها و منابع در دسترس", labelEn: "Available capacity and resources", kind: "textarea" },
    { id: "successMeasures", labelFa: "معیارهای موفقیت", labelEn: "Success measures", kind: "textarea" },
  ] },
  { id: "evidence", titleFa: "شکاف‌های اطلاعاتی و شواهد موردنیاز", titleEn: "Information gaps and evidence needs", fields: [
    { id: "knownGaps", labelFa: "اطلاعات نامشخص یا ناقص", labelEn: "Unknown or incomplete information", kind: "textarea" },
    { id: "contradictions", labelFa: "تعارض‌ها یا ابهام‌های شناخته‌شده", labelEn: "Known contradictions or ambiguities", kind: "textarea" },
    { id: "evidenceRequired", labelFa: "شواهدی که باید گردآوری شوند", labelEn: "Evidence still to be collected", kind: "textarea" },
  ] },
];

const MAX_TEXT_BYTES = 3 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = new Set([".txt", ".md", ".csv", ".json", ".html", ".xml", ".yaml", ".yml"]);

export function BrandProfileForm() {
  const { language, direction } = useTheme();
  const isFa = language === "fa";
  const [values, setValues] = useState<Record<string, string>>({ offerType: "physical" });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageKind, setMessageKind] = useState<"success" | "error">("success");
  const [uploadedNames, setUploadedNames] = useState<string[]>([]);
  const labels = useMemo(() => Object.fromEntries(groups.flatMap((group) => group.fields.map((field) => [field.id, isFa ? field.labelFa : field.labelEn])), [isFa]);

  const ingestText = async (text: string, metadata: Record<string, unknown>) => {
    if (!text.trim()) throw new Error(isFa ? "محتوای متنی برای ثبت وجود ندارد." : "There is no text content to ingest.");
    if (new TextEncoder().encode(text).byteLength > MAX_TEXT_BYTES) throw new Error(isFa ? "حجم متن از سقف مجاز ۳ مگابایت بیشتر است." : "Text exceeds the 3 MB limit.");
    const response = await fetch("/api/v1/ingest/document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, metadata: { ...metadata, locale: language, brandName: values.brandName || "" } }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || body.success === false) throw new Error(body.error || (isFa ? "ثبت محتوا انجام نشد." : "Content ingestion failed."));
    return body;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true); setMessage("");
    try {
      const content = groups.flatMap((group) => group.fields.map((field) => {
        const value = values[field.id]?.trim();
        return value ? labels[field.id] + ": " + value : "";
      })).filter(Boolean).join("

");
      if (!values.brandName?.trim()) throw new Error(isFa ? "نام برند را وارد کنید." : "Enter the brand name.");
      await ingestText(content, { source: "brand-profile-form", documentType: "brand-context" });
      setMessageKind("success");
      setMessage(isFa ? "اطلاعات به مخزن دانش فضای کاری افزوده شد. این عملیات نسخه رسمی و نسخه‌دار PIP ایجاد نمی‌کند." : "The information was added to the workspace knowledge store. This does not create an official versioned PIP record.");
    } catch (error) {
      setMessageKind("error"); setMessage(error instanceof Error ? error.message : (isFa ? "خطای پیش‌بینی‌نشده رخ داد." : "An unexpected error occurred."));
    } finally { setBusy(false); }
  };

  const handleFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    setBusy(true); setMessage("");
    try {
      for (const file of files) {
        const extension = "." + (file.name.split(".").pop()?.toLowerCase() ?? "");
        if (!ACCEPTED_EXTENSIONS.has(extension)) throw new Error(isFa ? "قالب " + file.name + " پشتیبانی نمی‌شود؛ فقط فایل متنی انتخاب کنید." : file.name + " is not supported. Choose a text-based file.");
        if (file.size > MAX_TEXT_BYTES) throw new Error(isFa ? "حجم " + file.name + " از ۳ مگابایت بیشتر است." : file.name + " exceeds 3 MB.");
        const text = await file.text();
        await ingestText(text, { source: "brand-profile-file", documentType: "brand-supporting-document", originalFilename: file.name, contentType: file.type || "text/plain" });
        setUploadedNames((current) => [...current, file.name]);
      }
      setMessageKind("success"); setMessage(isFa ? "فایل‌های انتخاب‌شده به مخزن دانش افزوده شدند." : "The selected files were added to the knowledge store.");
    } catch (error) {
      setMessageKind("error"); setMessage(error instanceof Error ? error.message : (isFa ? "بارگذاری فایل انجام نشد." : "File upload failed."));
    } finally { setBusy(false); event.target.value = ""; }
  };

  const inputClass = "w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--sky-blue-500)] focus:ring-2 focus:ring-[var(--sky-blue-500)]/15";

  return (
    <div className="space-y-6" dir={direction}>
      <header className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-black text-[var(--text-primary)]">{isFa ? "برند شما" : "Your brand"}</h1>
        <p className="text-sm leading-7 text-[var(--text-muted)]">{isFa ? "اطلاعات برند، محصول یا خدمت، مشتریان، بازار و شواهد مرتبط را وارد کنید." : "Describe your brand, offer, customers, markets and supporting evidence."}</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5">
        {groups.map((group) => (
          <fieldset key={group.id} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 md:p-7 space-y-5">
            <legend className="px-2 text-base font-extrabold text-[var(--text-primary)]">{isFa ? group.titleFa : group.titleEn}</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.fields.map((field) => (
                <label key={field.id} className={"block space-y-2 " + (field.kind === "textarea" ? "md:col-span-2" : "")}>
                  <span className="text-xs font-bold text-[var(--text-secondary)]">{isFa ? field.labelFa : field.labelEn}{field.required ? " *" : ""}</span>
                  {field.kind === "textarea" ? (
                    <textarea className={inputClass + " min-h-24 resize-y"} rows={4} value={values[field.id] ?? ""} onChange={(event) => setValues((current) => ({ ...current, [field.id]: event.target.value }))} required={field.required} />
                  ) : field.kind === "select" ? (
                    <select className={inputClass} value={values[field.id] ?? ""} onChange={(event) => setValues((current) => ({ ...current, [field.id]: event.target.value }))}>
                      {field.options?.map((option) => <option key={option.value} value={option.value}>{isFa ? option.labelFa : option.labelEn}</option>)}
                    </select>
                  ) : (
                    <input className={inputClass} type="text" value={values[field.id] ?? ""} onChange={(event) => setValues((current) => ({ ...current, [field.id]: event.target.value }))} required={field.required} />
                  )}
                </label>
              ))}
            </div>
          </fieldset>
        ))}

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 md:p-7 space-y-4">
          <div>
            <h2 className="text-base font-extrabold text-[var(--text-primary)]">{isFa ? "بارگذاری فایل‌های پشتیبان" : "Upload supporting files"}</h2>
            <p className="mt-2 text-xs leading-6 text-[var(--text-muted)]">{isFa ? "فایل‌های متنی TXT، MD، CSV، JSON، HTML، XML و YAML تا سقف ۳ مگابایت برای هر فایل پذیرفته می‌شوند. متن فایل پردازش می‌شود؛ فایل خام در این مسیر ذخیره نمی‌شود." : "Text files (TXT, MD, CSV, JSON, HTML, XML and YAML) up to 3 MB each are accepted. File text is processed; the original binary file is not stored by this endpoint."}</p>
          </div>
          <input type="file" multiple accept=".txt,.md,.csv,.json,.html,.xml,.yaml,.yml,text/plain,text/markdown,text/csv,application/json,text/html,application/xml,text/yaml" onChange={handleFiles} disabled={busy} className="block w-full text-sm text-[var(--text-secondary)] file:me-3 file:rounded-lg file:border-0 file:bg-[var(--muted-surface)] file:px-4 file:py-2.5 file:text-xs file:font-bold file:text-[var(--text-primary)] disabled:opacity-50" />
          {uploadedNames.length > 0 && <ul className="list-disc ps-5 text-xs text-[var(--text-muted)]">{uploadedNames.map((name, index) => <li key={name + "-" + index}>{name}</li>)}</ul>}
        </section>

        {message && <p role="status" aria-live="polite" className={"rounded-xl border p-4 text-sm leading-6 " + (messageKind === "success" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-rose-500/30 bg-rose-500/10 text-rose-400")}>{message}</p>}
        <div className="space-y-3">
          <button type="submit" disabled={busy} className="w-full md:w-auto rounded-xl bg-[var(--sky-blue-500)] px-5 py-3 text-sm font-extrabold text-white disabled:opacity-50">{busy ? (isFa ? "در حال پردازش..." : "Processing...") : (isFa ? "ثبت اطلاعات در مخزن دانش" : "Add information to knowledge store")}</button>
          <p className="text-[11px] leading-6 text-[var(--text-muted)]">{isFa ? "ثبت اطلاعات در مخزن دانش به‌معنای ایجاد نسخه رسمی و نسخه‌دار Product Intelligence Profile نیست؛ اتصال گردش‌کار نسخه‌سازی PIP در این بخش هنوز ارائه نشده است." : "Adding information to the knowledge store does not create an official versioned Product Intelligence Profile; versioned PIP workflow is not yet available in this section."}</p>
        </div>
      </form>
    </div>
  );
}
