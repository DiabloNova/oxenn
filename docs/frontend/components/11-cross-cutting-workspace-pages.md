# Component Design — Cross-Cutting Workspace Pages

**Pages covered:** P25 Reports; P26 Data Sources & Integrations; P27 Activity, Notifications & Workspace Settings; AI Copilot

## P25 — Reports
Composition: `ReportLibraryHeader → ReportFilters → ReportList → ReportPreview → MethodologyAndEvidence → ExportShareActions`
- ReportList fields: title, domain, product, market, period, generated/updated date, state.
- ReportPreview: scope, method, evidence coverage, findings, assumptions, recommendations, decisions, limitations.
- Export/share controls appear only if the repository already supports the action.
- A report with illustrative fixtures must carry a visible illustrative label.

## P26 — Data Sources & Integrations
Composition: `SourceInventory → SourceDetail → PermissionScope → FreshnessAndCoverage → FailureRecoveryPanel → ProvenanceLinks`
- SourceInventory: source type, owner, state, scope, last successful collection, freshness.
- SourceDetail: authorization scope and collection behavior.
- FailureRecoveryPanel: error, effect on affected metrics, and recovery guidance.
- Do not add or connect providers in this task. A source without a verified connection is not "live".

## P27 — Activity, Notifications & Workspace Settings
- **ActivityFeed:** actor, event, object, timestamp, product/workspace scope, provenance.
- **NotificationCenter:** approval required, assessment completed, execution failed, outcome measured, general update; unread state only if backed by actual state.
- **WorkspaceSettingsForm:** workspace identity and preferences supported by existing code.
- **MemberRoleTable:** existing members/roles and permission visibility; do not invent a new RBAC system.
- **LocaleThemeControls:** reuse existing locale/theme provider behavior; preserve route and user preference.

## AI Copilot shared component
Composition: `CopilotLauncher → ConversationPanel → ContextHeader → MessageThread → EvidenceCitationList → SuggestedNextActions → ApprovalBoundaryNotice`
- ContextHeader displays the authorized product, market, and page context.
- MessageThread distinguishes user input, assistant response, tool/result evidence, and system status.
- EvidenceCitationList links claims to source records.
- SuggestedNextActions are proposals, not approvals or executed tasks.
- ApprovalBoundaryNotice explains when a human decision is required.
- Do not claim hidden model reasoning or access to unconnected services.

## Shared safeguards
- Do not display fake connection state, sync time, notification count, member count, or activity.
- Preserve server-side permission enforcement in existing code; client visibility is not authorization.
- Empty and unavailable states must explain whether the capability is not configured, not implemented, or simply has no data.
