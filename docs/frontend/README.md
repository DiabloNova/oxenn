# OXENN Frontend Design Work

This directory records the architecture-driven dashboard design sequence.

## Source of truth
- Product architecture: https://github.com/DiabloNova/oxenn_documents/blob/main/product_architecture.md
- Product understanding: [00-PRODUCT-UNDERSTANDING.md](./00-PRODUCT-UNDERSTANDING.md)
- Dashboard page templates: [01-DASHBOARD-PAGE-TEMPLATES.md](./01-DASHBOARD-PAGE-TEMPLATES.md)
- Page-level component specifications: [components/](./components/)
- Dashboard assembly plan: [12-DASHBOARD-ASSEMBLY-PLAN.md](./12-DASHBOARD-ASSEMBLY-PLAN.md)

## Design sequence
1. Understand the complete product architecture and its evidence/governance principles.
2. Define dashboard information architecture and page templates.
3. Specify the components for each page independently.
4. Review the page/component design system as a coherent whole.
5. Assemble pages into the existing authenticated dashboard shell.
6. Verify bilingual, theme, responsive, accessibility, and product-truth behavior.

## Current boundary
This work is frontend-only. It does not authorize changes to backend APIs, database schemas/migrations, infrastructure, authentication architecture, external service connections, deployments, merges, or PR creation. Any fixture data must be labelled illustrative.
