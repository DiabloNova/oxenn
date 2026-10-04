# Database Reference Matrix

| Table Name | Scope | RLS Enabled | Status | Consumers |
|---|---|---|---|---|
| `admin_users` | Global | ❌ | `WIRED` | `index.ts`, `mock-db.ts`, `suite.ts`, `cqrs.test.ts` |
| `aeo_analyses` | Tenant-Scoped | ✅ | `WIRED` | `index.ts` |
| `ai_engines` | Global | ❌ | `WIRED` | `suite.ts` |
| `ai_observations` | Tenant-Scoped | ✅ | `WIRED` | `index.ts`, `index.ts`, `diagnostic-engine.test.ts`, `security.test.ts` |
| `ai_provider_configs` | Global | ❌ | `WIRED` | `index.ts`, `suite.ts` |
| `ai_visibility_audits` | Tenant-Scoped | ✅ | `WIRED` | `index.ts`, `index.ts` |
| `api_keys` | Tenant-Scoped | ✅ | `WIRED` | `privileged-paths.ts`, `api-key-repository.ts`, `tenant-tables.test.ts`, `system-mode-bypass.test.ts` |
| `audit_prompts` | Tenant-Scoped | ✅ | `WIRED` | `index.ts` |
| `audit_records` | Global | ❌ | `WIRED` | `account.ts`, `index.ts`, `index.ts`, `mock-db.ts`, `grant-super-admin.ts`, `account.test.ts`, `privileged-paths.test.ts`, `suite.ts`, `cqrs.test.ts` |
| `auth_rate_limits` | Global | ❌ | `WIRED` | `auth.ts`, `auth-deactivated.test.ts`, `authorization-lifecycle.test.ts` |
| `brand_associations` | Tenant-Scoped | ✅ | `WIRED` | `index.ts` |
| `brand_mentions` | Tenant-Scoped | ✅ | `WIRED` | `page.tsx`, `ai-visibility-audit-engine.ts`, `index.ts`, `ai-visibility.test.ts`, `security.test.ts` |
| `brands` | Tenant-Scoped | ✅ | `WIRED` | `graph-extraction.ts`, `ai-visibility-provider.ts`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `ai-visibility-audit.ts`, `entity-service.ts`, `index.ts`, `extractor.ts`, `security.test.ts`, `application.test.ts`, `tenant-pipeline.test.ts`, `public-api.test.ts` |
| `citation_occurrences` | Tenant-Scoped | ✅ | `WIRED` | `index.ts` |
| `citation_sources` | Tenant-Scoped | ✅ | `WIRED` | `competitive-radar-service.ts`, `index.ts`, `index.ts` |
| `citations` | Tenant-Scoped | ✅ | `WIRED` | `index.ts`, `index.ts`, `index.ts`, `auditService.ts`, `ai-visibility-provider.ts`, `ProcessSection.tsx`, `HeroSection.tsx`, `MetricsSection.tsx`, `LiveKnowledgeGraph.tsx`, `DashboardKpiGrid.tsx`, `dashboardNavigation.ts`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `prompt-intelligence-service.ts`, `citation-service.ts`, `observation-service.ts`, `ai-visibility-audit-engine.ts`, `aeo-score-engine.ts`, `observation-aggregate.ts`, `index.ts`, `index.ts`, `index.ts`, `dashboard-services.test.ts`, `intelligence-model.test.ts`, `ai-visibility.test.ts`, `competitive-radar.test.ts`, `competitive-ai.test.ts`, `security.test.ts` |
| `competitive_analyses` | Tenant-Scoped | ✅ | `WIRED` | `route.ts` |
| `competitive_seo_findings` | Tenant-Scoped | ✅ | `WIRED` | `index.ts`, `tenant-tables.test.ts` |
| `competitor_changes` | Tenant-Scoped | ✅ | `WIRED` | `index.ts`, `tenant-tables.test.ts` |
| `competitors` | Tenant-Scoped | ✅ | `WIRED` | `index.ts`, `index.ts`, `graph-extraction.ts`, `ai-visibility-provider.ts`, `FeaturesSection.tsx`, `DashboardKpiGrid.tsx`, `CompetitiveAnalysisPanel.tsx`, `LlmAnalyticsPanel.tsx`, `dashboardNavigation.ts`, `route.ts`, `route.ts`, `route.ts`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `citation-intelligence.ts`, `prompt-intelligence.ts`, `prompt-intelligence-service.ts`, `competitor-discovery-service.ts`, `keyword-intelligence-service.ts`, `citation-intelligence-service.ts`, `brand-intelligence-service.ts`, `competitive-seo-service.ts`, `ai-visibility-audit-engine.ts`, `index.ts`, `index.ts`, `diagnostic-engine.test.ts`, `dashboard-shell.test.ts`, `tenant-tables.test.ts`, `competitive.test.ts` |
| `crawl_cache` | Tenant-Scoped | ✅ | `WIRED` | `crawl-cache-repository.ts`, `suite.ts`, `run-all.ts` |
| `crawl_jobs` | Tenant-Scoped | ✅ | `WIRED` | `crawl-job-repository.ts`, `is-query-tenant-scoped.test.ts`, `suite.ts`, `run-all.ts` |
| `crawl_results` | Tenant-Scoped | ✅ | `WIRED` | `route.ts`, `crawl-result-repository.ts` |
| `crawl_snapshots` | Tenant-Scoped | ✅ | `WIRED` | `crawl-snapshot-repository.ts`, `tenant-isolation.test.ts` |
| `credit_transactions` | Tenant-Scoped | ✅ | `WIRED` | `subscription-service.ts`, `tenant-tables.test.ts` |
| `diagnostic_finding_relationships` | Tenant-Scoped | ✅ | `WIRED` | `index.ts`, `tenant-tables.test.ts` |
| `diagnostic_findings` | Tenant-Scoped | ✅ | `WIRED` | `index.ts`, `tenant-tables.test.ts` |
| `document_embeddings` | Tenant-Scoped | ✅ | `WIRED` | `vector-store.ts`, `route.ts`, `web-crawler.test.ts`, `document-ingestion.test.ts`, `query-service.test.ts`, `suite.ts`, `aeo-insight.test.ts`, `security.test.ts`, `run-all.ts` |
| `email_verification_tokens` | Global | ❌ | `WIRED` | `auth.ts`, `privileged-paths.ts` |
| `entities` | Tenant-Scoped | ✅ | `WIRED` | `index.ts`, `index.ts`, `auditService.ts`, `graph-extraction.ts`, `ai-visibility-provider.ts`, `graph-store.ts`, `DashboardShell.tsx`, `LandingFooter.tsx`, `ProcessSection.tsx`, `FeaturesSection.tsx`, `KnowledgeGraphExplorer.tsx`, `TopEntitiesList.tsx`, `FreeAuditPanel.tsx`, `dashboardNavigation.ts`, `route.ts`, `route.ts`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `index.ts`, `handlers.ts`, `aeo-content-intelligence-service.ts`, `entity-service.ts`, `index.ts`, `index.ts`, `index.ts`, `builder.ts`, `scorer.ts`, `extractor.ts`, `recommendations.ts`, `normalizer.ts`, `audit.ts`, `test-domain.ts`, `engine.test.ts`, `document-ingestion.test.ts`, `graph-extraction.test.ts`, `dashboard-shell.test.ts`, `knowledge-graph-foundation.test.ts`, `graph-store.test.ts`, `domain.test.ts`, `security.test.ts`, `domain.test.ts` |
| `entity_relationships` | Tenant-Scoped | ✅ | `WIRED` | `index.ts`, `security.test.ts` |
| `faq_opportunities` | Tenant-Scoped | ✅ | `WIRED` | `page.tsx`, `aeo-content-intelligence.ts`, `index.ts` |
| `feature_flags` | Global | ❌ | `WIRED` | `index.ts`, `mock-db.ts`, `suite.ts`, `cqrs.test.ts` |
| `historical_metrics` | Tenant-Scoped | ✅ | `WIRED` | `index.ts`, `index.ts`, `diagnostic-engine.test.ts`, `tenant-tables.test.ts` |
| `keywords` | Tenant-Scoped | ✅ | `WIRED` | `technical-seo-analyzer.ts`, `RecommendedActionsPanel.tsx`, `ServiceMarketplaceClient.tsx`, `ContentStudio.tsx`, `route.ts`, `route.ts`, `route.ts`, `page.tsx`, `page.tsx`, `layout.tsx`, `aeo-content-intelligence-service.ts`, `keyword-intelligence-service.ts`, `competitive-seo-service.ts`, `index.ts`, `extractor.ts`, `keyword-intelligence.test.ts`, `tenant-tables.test.ts` |
| `keywords_topics` | Global | ❌ | `WIRED` | `index.ts`, `suite.ts` |
| `kg_alignments` | Tenant-Scoped | ✅ | `WIRED` | `page.tsx`, `aeo-content-intelligence.ts`, `index.ts` |
| `kg_entities` | Tenant-Scoped | ✅ | `WIRED` | `graph-store.ts`, `route.ts`, `document-ingestion.test.ts`, `graph-store.test.ts`, `aeo-insight.test.ts`, `security.test.ts` |
| `kg_relationships` | Tenant-Scoped | ✅ | `WIRED` | `graph-store.ts`, `route.ts`, `document-ingestion.test.ts`, `graph-store.test.ts`, `aeo-insight.test.ts`, `security.test.ts` |
| `monitoring_alerts` | Tenant-Scoped | ✅ | `WIRED` | `monitoring-alert-repository.ts`, `tenant-isolation.test.ts`, `is-query-tenant-scoped.test.ts` |
| `monitoring_configs` | Tenant-Scoped | ✅ | `WIRED` | `monitoring-config-repository.ts`, `tenant-isolation.test.ts`, `is-query-tenant-scoped.test.ts` |
| `organization_invitations` | Tenant-Scoped | ✅ | `WIRED` | `workspace.ts`, `tenant-tables.test.ts` |
| `organization_members` | Tenant-Scoped | ✅ | `WIRED` | `session.ts`, `authorization.ts`, `workspace.ts`, `auth.ts`, `account.ts`, `grant-super-admin.ts`, `session.test.ts`, `tenant-tables.test.ts`, `account.test.ts`, `authorization-lifecycle.test.ts`, `suite.ts` |
| `organizations` | Tenant-Scoped | ✅ | `WIRED` | `session.ts`, `authorization.ts`, `workspace.ts`, `auth.ts`, `account.ts`, `index.ts`, `index.ts`, `tenant-tables.test.ts`, `authorization-lifecycle.test.ts`, `suite.ts`, `run-all.ts`, `tenant-isolation-behavior.test.ts`, `security.test.ts`, `run-all.ts` |
| `pages` | Tenant-Scoped | ✅ | `WIRED` | `auditService.ts`, `LandingFooter.tsx`, `RecentActivityPanel.tsx`, `CriticalIssuesPanel.tsx`, `TechnicalOptimizationPanel.tsx`, `CompetitiveAnalysisPanel.tsx`, `PremiumAuditPanel.tsx`, `route.ts`, `layout.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `technical-seo.ts`, `site-architecture.ts`, `aeo-content-intelligence.ts`, `site-architecture-analyzer-service.ts`, `keyword-intelligence-service.ts`, `competitive-seo-service.ts`, `index.ts`, `index.ts`, `observability.test.ts`, `site-architecture.test.ts`, `competitive-seo.test.ts`, `web-crawler.test.ts`, `tenant-tables.test.ts`, `is-query-tenant-scoped.test.ts`, `premium-audit.test.ts` |
| `pages_entities` | Global | ❌ | `WIRED` | `index.ts`, `suite.ts` |
| `pages_keywords` | Global | ❌ | `WIRED` | `index.ts`, `suite.ts` |
| `pages_topics` | Global | ❌ | `WIRED` | `index.ts`, `suite.ts` |
| `password_reset_tokens` | Global | ❌ | `WIRED` | `auth.ts`, `privileged-paths.ts` |
| `permissions` | Global | ❌ | `WIRED` | `authorization.ts`, `index.ts`, `mock-db.ts`, `index.ts`, `index.ts`, `index.ts`, `types.ts`, `entities.ts`, `commands.ts`, `mappers.ts`, `handlers.ts`, `dto.ts`, `index.ts`, `suite.ts`, `postgres-integration.test.ts`, `cqrs.test.ts`, `security.test.ts`, `domain.test.ts`, `security.test.ts` |
| `position_observations` | Tenant-Scoped | ✅ | `WIRED` | `index.ts` |
| `premium_audits` | Tenant-Scoped | ✅ | `WIRED` | `index.ts`, `route.ts`, `route.ts` |
| `prompt_definitions` | Tenant-Scoped | ✅ | `WIRED` | `ai-visibility-audit-engine.ts`, `index.ts` |
| `prompt_executions` | Tenant-Scoped | ✅ | `WIRED` | `index.ts`, `index.ts` |
| `prompt_schedules` | Tenant-Scoped | ✅ | `WIRED` | `index.ts` |
| `prompts` | Tenant-Scoped | ✅ | `WIRED` | `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `prompt-intelligence.ts`, `ai-visibility-audit.ts`, `brand-intelligence-service.ts`, `ai-visibility-audit-engine.ts`, `index.ts`, `index.ts`, `index.ts`, `observability.test.ts`, `security.test.ts` |
| `recommendation_observations` | Tenant-Scoped | ✅ | `WIRED` | `index.ts` |
| `recommendations` | Tenant-Scoped | ✅ | `WIRED` | `index.ts`, `index.ts`, `auditService.ts`, `technical-seo-analyzer.ts`, `ProcessSection.tsx`, `contracts.ts`, `RecommendedActionsPanel.tsx`, `CompetitiveAnalysisPanel.tsx`, `FreeAuditPanel.tsx`, `PremiumAuditPanel.tsx`, `AeoAuditPanel.tsx`, `route.ts`, `route.ts`, `route.ts`, `route.ts`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `technical-seo.ts`, `mock-db.ts`, `prompt-intelligence-service.ts`, `observation-service.ts`, `competitive-ai-service.ts`, `site-architecture-analyzer-service.ts`, `brand-intelligence-service.ts`, `index.ts`, `builder.ts`, `recommendations.ts`, `audit.ts`, `test-domain.ts`, `dashboard-home.test.ts`, `competitive-ai.test.ts`, `engine.test.ts`, `competitive.test.ts`, `security.test.ts` |
| `roles` | Global | ❌ | `WIRED` | `authorization.ts`, `privileged-paths.ts`, `migrator.ts`, `suite.ts` |
| `sessions` | Global | ❌ | `WIRED` | `session.ts`, `page.tsx`, `workspace.ts`, `account.ts`, `session.test.ts` |
| `system_configurations` | Global | ❌ | `WIRED` | `is-query-tenant-scoped.test.ts`, `suite.ts` |
| `technical_audits` | Tenant-Scoped | ✅ | `WIRED` | `route.ts`, `tenant-tables.test.ts` |
| `tenant_quotas` | Tenant-Scoped | ✅ | `WIRED` | `subscription-service.ts`, `api-quota-service.ts`, `security.test.ts` |
| `tenant_subscriptions` | Tenant-Scoped | ✅ | `WIRED` | `subscription-service.ts`, `security.test.ts` |
| `topics` | Tenant-Scoped | ✅ | `WIRED` | `page.tsx`, `competitive-seo-service.ts`, `index.ts`, `tenant-tables.test.ts` |
| `topics_entities` | Global | ❌ | `WIRED` | `index.ts`, `suite.ts` |
| `user_credentials` | Global | ❌ | `WIRED` | `auth.ts`, `account.ts`, `auth.test.ts`, `account.test.ts`, `authorization-lifecycle.test.ts` |
| `users` | Global | ❌ | `WIRED` | `session.ts`, `HeroAccessCard.tsx`, `VisualizationContainer.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `workspace.ts`, `auth.ts`, `account.ts`, `privileged-paths.ts`, `index.ts`, `index.ts`, `index.ts`, `site-architecture-analyzer-service.ts`, `auth-deactivated.test.ts`, `auth.test.ts`, `account.test.ts`, `authorization-lifecycle.test.ts`, `user-id-format.test.ts`, `suite.ts`, `cqrs.test.ts`, `security.test.ts` |
| `visibility_scores` | Tenant-Scoped | ✅ | `WIRED` | `index.ts`, `index.ts`, `security.test.ts` |
| `websites` | Tenant-Scoped | ✅ | `WIRED` | `link-discovery.ts`, `index.ts`, `competitive-seo.test.ts`, `tenant-tables.test.ts`, `is-query-tenant-scoped.test.ts`, `system-mode-bypass.test.ts`, `tenant-isolation-behavior.test.ts` |

## Summary
- Total Tables: 70
- WIRED Tables: 70
- ORPHAN-TABLE (LEGACY-CANDIDATE) Tables: 0
