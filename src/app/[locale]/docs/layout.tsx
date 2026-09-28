"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Search, Menu, X, Home } from "lucide-react";
import { DOCS_INDEX } from "@/lib/docsIndex";
import { SeorchableLogo } from "@/components/marketing/SeorchableLogo";

interface DocsLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default function DocsLayout({ children, params }: DocsLayoutProps) {
  const resolvedParams = use(params);
  const locale = resolvedParams.locale;
  const pathname = usePathname();
  const isFa = locale === "fa";

  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const filteredTopics = DOCS_INDEX.filter((topic) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      topic.titleFa.toLowerCase().includes(query) ||
      topic.titleEn.toLowerCase().includes(query) ||
      topic.slug.toLowerCase().includes(query) ||
      (topic.snippet && topic.snippet.toLowerCase().includes(query))
    );
  });

  const categoriesMap = filteredTopics.reduce((acc, topic) => {
    if (topic.category === "project") return acc;
    if (!acc[topic.category]) acc[topic.category] = [];
    acc[topic.category].push(topic);
    return acc;
  }, {} as Record<string, typeof DOCS_INDEX>);

  const categories = Object.keys(categoriesMap);

  const isActiveDoc = (slug: string) => pathname?.includes(`/docs/${slug}`);

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-950 text-white border-r border-l border-white/10">
      <div className="p-6 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2.5 mb-4">
          <SeorchableLogo className="w-8 h-8" />
          <div className="flex flex-col leading-none">
            <span className="font-display font-black text-sm text-gradient-brand">seorchable.ir</span>
            <span className="text-[10px] text-slate-400 mt-1">{isFa ? "مستندات پلتفرم" : "Platform Docs"}</span>
          </div>
        </div>
        <div className="relative">
          <Search size={14} className="absolute start-3 top-3 text-slate-500" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isFa ? "جستجو (عنوان یا متن)..." : "Search docs or content..."}
            className="w-full ps-9 pe-4 py-2 text-xs rounded-xl bg-white/[0.03] border border-white/10 focus:border-[var(--sky-blue-500)]/40 focus:bg-white/[0.05] outline-none placeholder:text-slate-500 text-white transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-none text-xs">
        {categories.map((categoryKey) => {
          const categoryTopics = categoriesMap[categoryKey];
          const categoryTitleFa = categoryTopics[0]?.categoryFa;
          const categoryTitleEn = categoryKey.toUpperCase().replace("-", " ");

          return (
            <div key={categoryKey} className="space-y-2">
              <h3 className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
                {isFa ? categoryTitleFa : categoryTitleEn}
              </h3>
              <div className="space-y-1">
                {categoryTopics.map((topic) => {
                  const active = isActiveDoc(topic.slug);
                  return (
                    <div key={topic.slug} className="mb-2">
                      <Link
                        href={`/${locale}/docs/${topic.slug}`}
                        onClick={() => setMobileSidebarOpen(false)}
                        className={`flex flex-col gap-1.5 px-3 py-2.5 rounded-xl border transition-all ${
                          active
                            ? "bg-gradient-to-r from-[var(--sky-blue-500)]/20 to-[var(--orange-500)]/5 border-[var(--sky-blue-500)]/40 text-white font-black"
                            : "border-transparent text-slate-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <BookOpen size={13} className={active ? "text-[var(--sky-blue-500)]" : "text-slate-500"} />
                          <span className="truncate">{isFa ? topic.titleFa : topic.titleEn}</span>
                        </div>
                        {searchQuery && topic.snippet && (
                          <div className="text-[9px] text-slate-500 leading-relaxed ps-6 opacity-70 line-clamp-2">
                            ...{topic.snippet.substring(0, 100)}...
                          </div>
                        )}
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {filteredTopics.length === 0 && (
          <div className="text-center text-slate-500 py-8 opacity-70">
             {isFa ? "مستندی با این محتوا یافت نشد." : "No documentation found for this query."}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col md:flex-row relative" dir={isFa ? "rtl" : "ltr"}>
      <header className="md:hidden flex items-center justify-between h-14 px-4 bg-slate-950 border-b border-white/10 sticky top-0 z-50 text-white w-full shrink-0">
        <button onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)} className="p-2 rounded-lg hover:bg-white/10">
          {mobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <Link href={`/${locale}/docs`} className="flex items-center gap-2">
          <SeorchableLogo className="w-7 h-7" />
        </Link>
        <Link href={`/${locale}/dashboard`} className="p-2 rounded-lg hover:bg-white/10">
          <Home size={18} />
        </Link>
      </header>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`fixed inset-y-0 ${isFa ? 'right-0' : 'left-0'} z-50 w-72 bg-slate-950 transform transition-transform duration-300 ease-in-out md:hidden ${
        mobileSidebarOpen ? 'translate-x-0' : (isFa ? 'translate-x-full' : '-translate-x-full')
      }`}>
        {renderSidebarContent()}
      </aside>

      <aside className="hidden md:flex flex-col w-76 lg:w-80 h-screen sticky top-0 shrink-0 overflow-hidden border-e border-white/10">
        {renderSidebarContent()}
      </aside>

      <main className="flex-1 flex flex-col min-w-0 max-h-screen overflow-y-auto">
        <div className="p-6 md:p-10 lg:p-14 max-w-4xl w-full mx-auto relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
