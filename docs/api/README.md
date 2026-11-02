# API Documentation

This section describes the application's API surface.

## Status Dictionary
- **Implemented**: API endpoint is verified and functional.
- **Partial**: API endpoint is in development or missing edge case handling.
- **Planned**: Endpoint is not currently implemented.

## Authentication and Tenant Context

Protected internal endpoints under `src/app/api/v1/` resolve the current user and workspace from a validated server-side session (the opaque `oxenn_session` cookie), through `authorizeApiRequest` or an equivalent `requireSession` boundary.

Caller-controlled `x-user-id` and `x-tenant-id` headers are not identity credentials and must never establish a user or tenant context. Protected endpoints fail closed with HTTP 401 when no valid server session is available. The active workspace is taken from that validated session; clients cannot switch tenant context by changing headers.

Bearer API-key authentication is a separate mechanism implemented by `withPublicApi`. It applies only to routes that explicitly wrap their handler with that middleware; the existence of the middleware does not mean every internal dashboard endpoint accepts API keys.

The following endpoints are intentionally unauthenticated because they provide public or non-tenant-scoped content:
- `/api/v1/audit/free` — public free audit workflow.
- `/api/v1/docs` — public documentation lookup.

## Knowledge Graph API
- **Endpoint**: `/api/v1/knowledge-graph/query`
- **Behavior**: Requires a server session and performs tenant-scoped entity and relationship lookups.

## Dashboard Analytics API
- **Endpoint**: `/api/v1/dashboard/summary`
- **Behavior**: Resolves the authenticated session and returns a tenant-scoped dashboard summary.

## Competitive API
- **Endpoint**: `/api/v1/analysis/competitive`
- **Behavior**: Requires a validated server session before running the tenant-scoped analysis. Its current response generation may still use simulated competitive data; authentication does not imply data-source validation.

## LLM Analytics API
- **Endpoint**: `/api/v1/analytics/llm`
- **Behavior**: Requires a validated server session. The current workflow asks an LLM to generate simulated model responses; it is not a direct query to ChatGPT, Claude, or other providers.

## Server Actions

In Next.js, many interactions are handled through Server Actions (for example, `ingestDocumentAction`, `queryKnowledgeGraphAction`, `loginAction`, and `registerAction`). Protected actions resolve identity and tenant context on the server and perform authorization checks there.
