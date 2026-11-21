import { getUserWebsiteDirectory, type UserWebsiteDirectoryEntry } from "@/services/user-identity/user-website-directory";

export type AnalysisWebsiteSelection = {
  website: UserWebsiteDirectoryEntry;
  domain: string;
  normalizedUrl: string;
};

/** Resolve a selected user-owned website and restrict crawler-based tools to actual websites/stores. */
export async function resolveAnalysisWebsiteSelection(userId: string, websiteId?: string): Promise<AnalysisWebsiteSelection | null> {
  if (!websiteId) return null;
  const websites = await getUserWebsiteDirectory(userId);
  const website = websites.find((item) => item.id === websiteId);
  if (!website || !["official_website", "ecommerce_store"].includes(website.platformType)) return null;
  try {
    const parsed = new URL(website.url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    return { website, domain: parsed.hostname.toLowerCase(), normalizedUrl: parsed.origin };
  } catch {
    return null;
  }
}
