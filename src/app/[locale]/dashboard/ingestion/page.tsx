"use client";

import React, { useState, useTransition, useRef } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import {
  Database,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Cpu,
  Bookmark
} from "lucide-react";

interface IngestionStats {
  success: boolean;
  tenantId: string;
  totalChunks: number;
  processedChunks: number;
  failedChunks: number;
  errors: Array<{ chunkIndex: number; error: string }>;
}

export default function DocumentIngestionPage() {
  const { language, direction } = useTheme();
  const isRtl = language === "fa";
  const maxUploadBytes = 3 * 1024 * 1024;
  const maxRequestPayloadBytes = 3.5 * 1024 * 1024;

  const [text, setText] = useState("");
  const [fileText, setFileText] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState<string | null>(null);

  const [isReadingFile, setIsReadingFile] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<IngestionStats | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Localization strings
  const strings = {
    title: isRtl ? "ورود و پردازش پیشرفته اسناد" : "Advanced Document Ingestion",
    description: isRtl
      ? "اسناد متنی یا مقالات خود را بارگذاری کنید تا فرآیند پاک‌سازی، خردکردن (Chunking) و تولید بردار جاسازی آغاز شود."
      : "Ingest and process your proprietary text or report files to feed the RAG semantic memory and graph systems.",
    uploadZoneTitle: isRtl ? "کادر بارگذاری فایل متنی" : "Drag & Drop Upload Zone",
    uploadZoneDesc: isRtl
      ? "فایل خود با فرمت .txt، .md یا .json را به اینجا بکشید یا برای مرور کلیک کنید"
      : "Drag and drop your .txt, .md, or .json file here, or click to browse",
    uploadLimit: isRtl ? "حداکثر حجم قابل پذیرش: ۳ مگابایت" : "Maximum supported size: 3MB",
    textInputTitle: isRtl ? "ورودی متنی جایگزین" : "Alternative Direct Text Input",
    textInputPlaceholder: isRtl
      ? "در صورتی که فایل ندارید، متن خام گزارش یا سند خود را مستقیماً در این بخش کپی و پیست کنید..."
      : "Paste raw document content, interview transcripts, or brand reports directly here...",
    processBtn: isRtl ? "شروع پردازش و اینجکشن" : "Process & Index Document",
    processBtnActive: isRtl ? "در حال پردازش و بردارسازی معنایی..." : "Processing & Vectorizing Context...",
    readingFile: isRtl ? "در حال خواندن محتوای فایل..." : "Reading file content...",
    fileSelected: isRtl ? "فایل انتخاب‌شده" : "Selected File",
    size: isRtl ? "حجم" : "Size",
    removeFile: isRtl ? "حذف فایل" : "Remove File",
    successTitle: isRtl ? "پردازش سند با موفقیت انجام شد!" : "Document Ingestion Completed Successfully!",
    successDesc: isRtl
      ? "گراف دانش محلی و بانک برداری شما غنی‌سازی شدند. جزئیات خردکردن:"
      : "Your local knowledge graph and vector indices are now fully updated. Extraction stats:",
    totalChunks: isRtl ? "مجموع چانک‌ها" : "Total Chunks",
    processedChunks: isRtl ? "چانک‌های پردازش‌شده" : "Processed Chunks",
    failedChunks: isRtl ? "چانک‌های ناموفق" : "Failed Chunks",
    tenantId: isRtl ? "شناسه مستأجر" : "Tenant Isolation ID",
    errorTitle: isRtl ? "خطا در فرآیند بارگذاری داده" : "Ingestion Pipeline Failed",
    validationError: isRtl ? "لطفاً فایل متنی را انتخاب کرده یا متن خام را وارد کنید." : "Please provide a file or enter text content before processing.",
    fileReadError: isRtl ? "خطا در خواندن محتوای فایل متنی." : "Failed to parse text-based file contents.",
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    const validExtensions = [".txt", ".md", ".json"];
    const extension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();

    if (!validExtensions.includes(extension)) {
      setActionError(
        isRtl
          ? "فرمت فایل نامعتبر است. فقط اسناد متنی (TXT، MD، JSON) پذیرفته می‌شوند."
          : "Invalid file format. Only TXT, MD, and JSON are supported."
      );
      return;
    }

    if (file.size > maxUploadBytes) {
      setActionError(
        isRtl
          ? "حجم فایل بیشتر از ۳ مگابایت است."
          : "File exceeds maximum size limit of 3MB."
      );
      return;
    }

    setIsReadingFile(true);
    setActionError(null);
    setSuccessResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFileText(content);
      setFileName(file.name);

      const sizeInKb = (file.size / 1024).toFixed(1);
      setFileSize(`${sizeInKb} KB`);
      setIsReadingFile(false);
    };
    reader.onerror = () => {
      setActionError(strings.fileReadError);
      setIsReadingFile(false);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const clearSelectedFile = () => {
    setFileName("");
    setFileText("");
    setFileSize(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const textToIngest = fileText.trim() || text.trim();

    if (!textToIngest) {
      setActionError(strings.validationError);
      return;
    }

    setActionError(null);
    setSuccessResult(null);

    startTransition(async () => {
      const payload = {
        text: textToIngest,
        metadata: {
          source: fileName ? `uploaded-file: ${fileName}` : "direct-text-entry",
          timestamp: new Date().toISOString(),
          locale: language,
        },
        chunkingOptions: {
          maxChunkSize: 500,
          overlap: 50
        }
      };

      const payloadBytes = new TextEncoder().encode(JSON.stringify(payload)).byteLength;
      if (payloadBytes > maxRequestPayloadBytes) {
        setActionError(
          isRtl
            ? "حجم داده ارسالی پس از کدگذاری از سقف مجاز ۳٫۵ مگابایت بیشتر است."
            : "The encoded request exceeds the 3.5MB upload limit."
        );
        return;
      }

      try {
        const response = await fetch("/api/v1/ingest/document", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await response.json().catch(() => null);

        if (!response.ok) {
          setActionError(
            typeof result?.error === "string" ? result.error : strings.errorTitle
          );
          return;
        }

        setSuccessResult(result as IngestionStats);
        setText("");
        clearSelectedFile();
      } catch {
        setActionError(
          isRtl
            ? "ارتباط با سرویس ورود اسناد برقرار نشد. دوباره تلاش کنید."
            : "Could not reach the document ingestion service. Please try again."
        );
      }
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in" dir={direction}>
      {/* Title block */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)] font-display flex items-center gap-2.5">
          <Database className="text-[#1F76F9]" size={24} />
          <span>{strings.title}</span>
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1.5 max-w-3xl leading-relaxed">
          {strings.description}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form column */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-white/[0.06] bg-white/[0.01] backdrop-blur-md shadow-lg">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <UploadCloud size={16} className="text-[#1F76F9]" />
                <span>{strings.uploadZoneTitle}</span>
              </CardTitle>
              <CardDescription className="text-xs">
                {strings.uploadZoneDesc}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".txt,.md,.json"
                className="hidden"
              />

              {/* Drag zone box */}
              {!fileName ? (
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={triggerFileSelect}
                  className={`
                    border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer
                    transition-all duration-300 min-h-[180px] group
                    ${dragActive
                      ? "border-[#1F76F9] bg-[#1F76F9]/10"
                      : "border-white/10 hover:border-white/20 hover:bg-white/[0.01]"}
                  `}
                >
                  <div className={`p-4 rounded-full bg-white/[0.02] border border-white/5 mb-3 group-hover:scale-105 transition-transform duration-300`}>
                    <UploadCloud size={28} className={dragActive ? "text-[#1F76F9]" : "text-white/40"} />
                  </div>
                  <p className="text-xs font-bold text-[var(--text-primary)] mb-1">
                    {isReadingFile ? strings.readingFile : strings.uploadZoneDesc}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    {strings.uploadLimit}
                  </p>
                </div>
              ) : (
                /* Selected File Block */
                <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-between animate-slide-up">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[#1F76F9] flex-shrink-0">
                      <FileText size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                        {fileName}
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                        {strings.size}: {fileSize}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelectedFile}
                    className="p-2 hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              )}

              {/* Direct plain text alternative input */}
              {!fileName && (
                <div className="space-y-2 pt-2">
                  <div className="h-px bg-white/5 my-4" />
                  <label className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-1.5">
                    <FileText size={14} className="text-[#1F76F9]" />
                    <span>{strings.textInputTitle}</span>
                  </label>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={strings.textInputPlaceholder}
                    rows={6}
                    className="
                      w-full px-4 py-3 text-xs rounded-xl outline-none transition-all duration-300
                      bg-white/[0.02] text-white border border-white/10
                      focus:border-[#1F76F9] focus:ring-1 focus:ring-[#1F76F9]/30 focus:bg-white/[0.04]
                      placeholder:text-white/20 resize-none leading-relaxed
                    "
                    disabled={isPending || isReadingFile}
                  />
                </div>
              )}

              <form onSubmit={handleSubmit} className="pt-2">
                <Button
                  type="submit"
                  className="w-full gap-2 py-3 font-bold"
                  disabled={isPending || isReadingFile || (!text.trim() && !fileText.trim())}
                >
                  {isPending ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>{strings.processBtnActive}</span>
                    </>
                  ) : (
                    <>
                      <Database size={16} />
                      <span>{strings.processBtn}</span>
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Results / Help sidebar column */}
        <div className="space-y-6">
          {/* Status Results Alert */}
          {successResult && (
            <Card className="border border-emerald-500/20 bg-emerald-500/[0.02] shadow-lg animate-slide-up">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>{strings.successTitle}</span>
                </CardTitle>
                <CardDescription className="text-xs text-emerald-500/80 leading-relaxed">
                  {strings.successDesc}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl space-y-1">
                    <span className="text-[10px] text-white/40 block">{strings.totalChunks}</span>
                    <span className="text-sm font-black text-[var(--text-primary)]">{successResult.totalChunks}</span>
                  </div>
                  <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl space-y-1">
                    <span className="text-[10px] text-white/40 block">{strings.processedChunks}</span>
                    <span className="text-sm font-black text-emerald-400">{successResult.processedChunks}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-white/[0.01] border border-white/5 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-white/45">{strings.tenantId}:</span>
                    <span className="font-mono font-bold text-white/70">{successResult.tenantId}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-white/45">{strings.failedChunks}:</span>
                    <span className={`font-bold ${successResult.failedChunks > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {successResult.failedChunks}
                    </span>
                  </div>
                </div>

                {successResult.errors.length > 0 && (
                  <div className="pt-2 border-t border-white/5">
                    <p className="text-[10px] font-bold text-red-400 mb-1.5 flex items-center gap-1">
                      <AlertCircle size={10} />
                      <span>{isRtl ? "خطاهای جزئی استخراج:" : "Partial Ingestion Warnings:"}</span>
                    </p>
                    <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                      {successResult.errors.map((err, idx) => (
                        <p key={idx} className="text-[9px] text-red-300 italic">
                          • Ch.{err.chunkIndex}: {err.error}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Error Box */}
          {actionError && (
            <Card className="border border-red-500/20 bg-red-500/[0.02] shadow-lg animate-shake">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-red-400 flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{strings.errorTitle}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <p className="text-xs text-red-300 leading-relaxed italic">
                  {actionError}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Guidelines Sidebar */}
          <Card className="border border-white/[0.05] bg-white/[0.01] backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent-600)] flex items-center gap-1.5">
                <Cpu size={12} />
                <span>{isRtl ? "مراحل ۷ گانه پردازش" : "7-Stage AI Processing Pipeline"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs text-[var(--text-secondary)] leading-relaxed">
              <div className="flex gap-3 items-start">
                <span className="w-5 h-5 bg-white/5 border border-white/10 rounded-md flex items-center justify-center text-[10px] font-bold text-white/55 flex-shrink-0">۱</span>
                <p>{isRtl ? "نرمال‌سازی و پاک‌سازی الفبای فارسی" : "Text cleanup & Farsi character normalization."}</p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="w-5 h-5 bg-white/5 border border-white/10 rounded-md flex items-center justify-center text-[10px] font-bold text-white/55 flex-shrink-0">۲</span>
                <p>{isRtl ? "تقسیم‌بندی معنایی و حفظ یکپارچگی نیم‌فاصله" : "Persian-syntax aware context chunking."}</p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="w-5 h-5 bg-white/5 border border-white/10 rounded-md flex items-center justify-center text-[10px] font-bold text-white/55 flex-shrink-0">۳</span>
                <p>{isRtl ? "استخراج بردار معنایی ۷۶۸ بعدی" : "Dense 768-dim text vector embedding mapping."}</p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="w-5 h-5 bg-white/5 border border-white/10 rounded-md flex items-center justify-center text-[10px] font-bold text-white/55 flex-shrink-0">۴</span>
                <p>{isRtl ? "تحلیل احساسات و بار قطبی کلمات" : "Zod-enforced cognitive sentiment scoring."}</p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="w-5 h-5 bg-white/5 border border-white/10 rounded-md flex items-center justify-center text-[10px] font-bold text-white/55 flex-shrink-0">۵</span>
                <p>{isRtl ? "بارگذاری تراکنش‌محور بردارها در دیتابیس" : "Secure tenant-isolated database vector insertion."}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
