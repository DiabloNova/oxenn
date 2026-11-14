# CSP Report-Only Discovery

## Scope

Content Security Policy reporting is enabled only when the Vercel deployment environment is `preview`. Production and local development receive no CSP reporting headers from this change. No enforcing `Content-Security-Policy` header is introduced.

The Preview policy is a deliberately narrow discovery baseline. It permits same-origin resources, plus data/blob URLs for images and fonts and blob workers. It does not grant wildcard hosts or unsafe inline/eval script allowances. Violations are reported but not blocked.

## Reporting endpoint

The endpoint is `POST /api/security/csp-report`. The build derives an absolute, same-origin endpoint URL from Vercel's `VERCEL_URL` system variable. If the environment is not Preview or the deployment host is missing/invalid, the reporting headers are omitted.

The response advertises the endpoint using `Reporting-Endpoints` and selects it with `report-to`. The policy also includes `report-uri` for older CSP reporting implementations. Both modern Reporting API batches (`application/reports+json`) and the legacy CSP envelope (`application/csp-report`) are accepted. A JSON legacy envelope is also accepted for compatibility.

## Input and privacy controls

- The endpoint is active only in Vercel Preview and returns 404 elsewhere.
- It does not require an application session and does not access Workspace or Platform Admin databases.
- Request bodies are capped at 16 KiB and at 20 CSP reports per batch.
- Unsupported content types, malformed JSON, and invalid report envelopes are rejected.
- Reports are treated as attacker-controlled. Raw payloads are never persisted or logged.
- Logs contain only the directive, report disposition, status code, and origin-level values. Paths, query strings, fragments, referrers, script samples, cookies, and user-agent values are not logged.
- Distributed IP rate limiting is configured separately in the Vercel Firewall for this Preview route.

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
