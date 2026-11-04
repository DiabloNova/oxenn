/** Free workspaces may follow at most five redirects per HTTP fetch. */
export const FREE_CRAWLER_MAX_REDIRECTS = 5;

/** Paid workspaces have no hop-count cap; time and request budgets still apply. */
export const PAID_CRAWLER_MAX_REDIRECTS: null = null;

/** Hard wall-clock budget for a redirect chain, independent of plan. */
export const MAX_REDIRECT_CHAIN_DURATION_MS = 60_000;
