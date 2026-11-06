/** Free workspaces may follow at most five redirects per HTTP fetch. */
export const FREE_CRAWLER_MAX_REDIRECTS = 5;

/** Paid workspaces may follow up to ten redirects per HTTP fetch. */
export const PAID_CRAWLER_MAX_REDIRECTS = 10;

/** Hard wall-clock budget for a redirect chain, independent of plan. */
export const MAX_REDIRECT_CHAIN_DURATION_MS = 60_000;
