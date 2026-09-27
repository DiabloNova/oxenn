# FE-001: Design Token Foundation

## Token Architecture Summary
- Dark-first approach, meaning dark theme tokens are the default values, and light theme tokens override them inside `:root.light`.
- Namespaced `ox-` prefix used for semantic separation to avoid collision with existing variables.
- Fluid typography utilizing `clamp()` with distinct scales for UI display and data/tables, ensuring mobile responsiveness.
- Elevation and Glass properties decoupled from specific colors using `rgba` layering.
- Full Persian/Farsi (RTL) + English (LTR) language coverage with variable line-heights.
- Additive approach: No existing globals.css properties are deleted.

## Contrast Matrix

| Role | Semantic Variable | Value (Dark) | Value (Light) | Contrast vs Background (Dark) | Contrast vs Background (Light) | Result |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Text Primary | `--ox-text-primary` | `#F8FAFC` | `#0F172A` | 17.06:1 | 17.85:1 | PASS |
| Text Secondary | `--ox-text-secondary` | `#CBD5E1` | `#334155` | 12.02:1 | 10.35:1 | PASS |
| Text Muted | `--ox-text-muted` | `#94A3B8` | `#64748B` | 6.96:1 | 4.76:1 | PASS |
| Success | `--ox-success` | `#10B981` | `#047857` | 7.04:1 | 5.48:1 | PASS |
| Error | `--ox-error` | `#EF4444` | `#DC2626` | 4.74:1 | 4.83:1 | PASS |
| Warning | `--ox-warning` | `#F59E0B` | `#B45309` | 8.31:1 | 5.02:1 | PASS |
| Info | `--ox-info` | `#38BDF8` | `#0369A1` | 8.33:1 | 5.93:1 | PASS |

## Deviations from FE-000 Recommendations
- `globals.css` freeze-list: As per the objective, we append only, and all legacy tokens stay as is. To ensure clean separation, new tokens are namespaced with `ox-` (e.g. `--ox-text-primary`).
- Instead of fully migrating arbitrary utility classes globally right now, we setup `@theme` overrides specifically targeting our `ox-` custom properties, effectively enabling future component refactoring in subsequent FE-002/FE-003 phases without risking existing renders.

## Seams Left for FE-002 / FE-003
- Existing components use legacy `bg-[var(--key)]` format. The new `tokens.css` introduces standardized CSS variables. Future PRs can rewrite `bg-[var(--key)]` to the newly defined Tailwind util (e.g. `bg-ox-background`).
- `ThemeProvider.tsx` remains untouched. `useThemeTokens.ts` provides a reactive bridge specifically for any new UI that prefers typed JS token reads, but existing context hydration logic remains for FE-003 to handle.
