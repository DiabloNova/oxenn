import type { SubscriptionPlanId } from "@/features/billing/domain/types";
import {
  FREE_CRAWLER_MAX_REDIRECTS,
  MAX_REDIRECT_CHAIN_DURATION_MS,
  PAID_CRAWLER_MAX_REDIRECTS
} from "@/core/network/crawler-redirect-policy";

export {
  FREE_CRAWLER_MAX_REDIRECTS,
  MAX_REDIRECT_CHAIN_DURATION_MS,
  PAID_CRAWLER_MAX_REDIRECTS
};

export interface CrawlerRedirectPolicy {
  maxRedirects: number | null;
  maxRedirectDurationMs: number;
}

export function getCrawlerRedirectPolicy(
  planId: SubscriptionPlanId
): CrawlerRedirectPolicy {
  return {
    maxRedirects:
      planId === "free"
        ? FREE_CRAWLER_MAX_REDIRECTS
        : PAID_CRAWLER_MAX_REDIRECTS,
    maxRedirectDurationMs: MAX_REDIRECT_CHAIN_DURATION_MS
  };
}
