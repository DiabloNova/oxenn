"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getUserWebsiteDirectoryAction } from "@/app/actions/user-identity";
import { useTheme } from "@/components/ThemeProvider";

export type UserWebsite = { id: string; url: string; platformType: string; createdAt: string; updatedAt: string };
type WebsiteDirectoryContextValue = {
  websites: UserWebsite[];
  selectedWebsite: UserWebsite | null;
  selectedWebsiteId: string;
  setSelectedWebsiteId: (id: string) => void;
  loading: boolean;
  refresh: () => Promise<void>;
};
const WebsiteDirectoryContext = createContext<WebsiteDirectoryContextValue | null>(null);
const STORAGE_KEY = "oxenn:selected-user-website";

export function UserWebsiteDirectoryProvider({ children }: { children: ReactNode }) {
  const [websites, setWebsites] = useState<UserWebsite[]>([]);
  const [selectedWebsiteId, setSelectedWebsiteIdState] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getUserWebsiteDirectoryAction();
      if (!result.success) return;
      setWebsites(result.websites);
      const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) ?? "" : "";
      setSelectedWebsiteIdState((current) => {
        const candidate = current || stored;
        if (candidate && result.websites.some((website) => website.id === candidate)) return candidate;
        return result.websites.length === 1 ? result.websites[0].id : "";
      });
    } catch {
      setWebsites([]);
      setSelectedWebsiteIdState("");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const setSelectedWebsiteId = useCallback((id: string) => {
    setSelectedWebsiteIdState(id);
    if (typeof window !== "undefined") {
      if (id) window.localStorage.setItem(STORAGE_KEY, id);
      else window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const selectedWebsite = useMemo(() => websites.find((website) => website.id === selectedWebsiteId) ?? null, [websites, selectedWebsiteId]);
  const value = useMemo(() => ({ websites, selectedWebsite, selectedWebsiteId, setSelectedWebsiteId, loading, refresh }), [websites, selectedWebsite, selectedWebsiteId, setSelectedWebsiteId, loading, refresh]);
  return <WebsiteDirectoryContext.Provider value={value}>{children}</WebsiteDirectoryContext.Provider>;
}

export function useUserWebsiteDirectory() {
  const context = useContext(WebsiteDirectoryContext);
  if (!context) throw new Error("useUserWebsiteDirectory must be used inside UserWebsiteDirectoryProvider.");
  return context;
}

export function UserWebsiteSelector() {
  const { language } = useTheme();
  const isFa = language === "fa";
  const { websites, selectedWebsiteId, setSelectedWebsiteId, loading } = useUserWebsiteDirectory();
  if (loading || websites.length === 0) return null;
  return <div className="mx-4 mt-2 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 md:mx-8">
    <label htmlFor="dashboard-user-website" className="text-xs font-bold text-[var(--text-secondary)]">{isFa ? "وب‌سایت فعال" : "Active website"}</label>
    <select id="dashboard-user-website" className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs text-[var(--text-primary)]" value={selectedWebsiteId} onChange={(event) => setSelectedWebsiteId(event.target.value)}>
      {websites.length > 1 && <option value="">{isFa ? "انتخاب وب‌سایت" : "Select a website"}</option>}
      {websites.map((website) => <option key={website.id} value={website.id}>{website.url}</option>)}
    </select>
    {websites.length > 1 && !selectedWebsiteId && <span className="text-[10px] text-[var(--text-muted)]">{isFa ? "برای جلوگیری از انتخاب اشتباه، یک وب‌سایت را مشخص کنید." : "Choose one to avoid using the wrong website."}</span>}
  </div>;
}
