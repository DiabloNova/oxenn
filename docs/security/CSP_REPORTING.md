# CSP Report-Only Discovery

## Scope

Content Security Policy reporting is enabled only for requests that execute in the Vercel `preview` environment. Production and local development receive no CSP reporting headers. No enforcing `Content-Security-Policy` header is introduced.

The Preview policy is a deliberately narrow discovery baseline. It permits same-origin resources, plus data/blob URLs for images, data URLs for fonts, and blob workers. It does not grant wildcard hosts or unsafe inline/eval script allowances. Violations are reported but not blocked.

The Preview check runs at request time in the existing `src/proxy.ts`, rather than being frozen into `next.config.ts` during the build. The CSP report endpoint also checks the runtime `VERCEL_ENV`. This keeps the header and collector disabled when a request is served in Production, including after a deployment promotion.

## Reporting endpoint

The endpoint is `POST /api/security/csp-report`. The modern Reporting API endpoint is the origin-relative path `/api/security/csp-report`, so reports follow the exact document origin users opened, including branch aliases and custom Preview domains. The leading slash is required by the Reporting API endpoint syntax. The legacy `Report-To` mapping uses the request's current HTTPS origin to construct its absolute endpoint URL; it does not use the build's unique `VERCEL_URL`.

The response advertises the modern endpoint using `Reporting-Endpoints` and selects it with the CSP `report-to` directive. It also includes the deprecated `Report-To` header for older Reporting API v0 browsers, plus `report-uri` for browsers that support only legacy CSP reporting. Both modern Reporting API batches (`application/reports+json`) and the legacy CSP envelope (`application/csp-report`) are accepted. A JSON legacy envelope is also accepted for compatibility.

## Input and privacy controls

- The endpoint is active only in Vercel Preview and returns 404 elsewhere.
- It does not require an application session and does not access Workspace or Platform Admin databases.
- Request bodies are capped at 16 KiB and at 20 CSP report entries per batch.
- Unsupported content types, malformed JSON, and invalid top-level report envelopes are rejected. Non-CSP entries in Reporting API batches are ignored.
- Reports are treated as attacker-controlled. Raw payloads are never persisted or logged.
- Logs contain sanitized report summaries: the directive, report disposition, status code, and origin-level values, plus a fixed event name, environment, and report count. Paths, query strings, fragments, referrers, script samples, cookies, and user-agent values are not logged.

## Vercel Firewall rate limit

The collector is protected by a Vercel Firewall custom rule configured outside the repository. The checked active configuration for the Vercel project `oxenn` is:

| Setting | Required value |
|---|---|
| Rule name | `CSP report endpoint - Preview rate limit` |
| Rule status | Active and valid |
| Conditions (AND) | Environment = `preview`; Path = `/api/security/csp-report`; Method = `POST` |
| Mitigation | Rate limit |
| Algorithm | Fixed window |
| Window | 60 seconds |
| Limit | 60 requests |
| Key | Client IP |

The current Vercel Firewall rule ID is `rule_csp_report_endpoint_preview_rate_limit_32ZUnN`. The active firewall configuration was read back after creation; the rule reported `valid: true`, and the project firewall reported `firewallEnabled: true`.

### Reproducible verification

Before relying on this protection for a Preview deployment, an operator should:

1. Open the Vercel team `oxenn` and project `oxenn`, then open its Firewall custom rules.
2. Find `CSP report endpoint - Preview rate limit` and confirm it is enabled/valid.
3. Confirm the three AND conditions exactly match the table above.
4. Confirm the mitigation is a fixed-window rate limit of 60 requests per 60 seconds keyed by IP.
5. Read the project's active Firewall configuration through Vercel's Firewall configuration API and confirm the rule is present and the firewall is enabled.
6. Recheck after any Firewall configuration change or project transfer. This rule is external operational configuration; repository code and unit tests alone cannot prove that it remains deployed.

Do not broaden the rule to Production or unrelated routes as part of RF-006.

## Operational limits

Sanitized summaries are written to Vercel Runtime Logs for initial Preview validation. No Log Drain or durable external reporting destination is currently configured. Vercel Runtime Logs have plan-dependent retention and are not a permanent security evidence store. This phase is therefore an initial collection/validation stage, not a claim of durable monitoring or a completed security-control rollout.

Preview deployments are protected by Vercel Authentication. Reviewers must access the Preview with an authorized Vercel session; same-origin browser reports use the Preview origin and its credentials. Deployment protection is not disabled by this change.

## Promotion requirements

Do not enable CSP in Production or move this policy to enforcement until:
1. the landing page and dashboard overhaul is complete in its own scope/PR;
2. the updated resource graph has been re-inventoried;
3. Preview reports from the final UI have been reviewed;
4. a durable reporting destination and retention/alerting policy are selected;
5. an explicit enforcement policy and rollback plan are approved.

HSTS is intentionally unchanged and must be reviewed separately against confirmed domain ownership and HTTPS coverage.
