# OXENN Product Documentation

This directory contains the canonical product-level requirements and product decision references.

## Current product authority

- [OXENN MVP Product Specification](./OXENN_MVP_PRODUCT_SPECIFICATION.md) — owner-approved product definition, target customers, Offer model, independent services, user journey, evidence policy, MVP boundaries, and acceptance criteria FR-01–FR-11.
- [OXENN Product Architecture](../architecture/OXENN_PRODUCT_ARCHITECTURE.md) — nine product domains, cross-cutting platform services, and execution principles.

## How to interpret product documents

Product documentation defines intended customer value, product behavior, and acceptance criteria. It does not prove that a capability is implemented, verified, connected to a live provider, or ready for production.

Use [MVP Engineering Baseline](../project/MVP_ENGINEERING_BASELINE.md) for the repository implementation map and known gaps. Use the [Security Model](../security/SECURITY_MODEL.md) for current authentication and authorization requirements. Treat dated audits and roadmaps as historical or planned records, not as evidence of current runtime behavior.

## Commercial product principles

- SEO, AEO, and GEO can be selected and used independently after registration and authentication.
- Bundles are optional; customers must not be forced to buy unrelated services.
- Customer Offers are distinct from OXENN service SKUs, plans, entitlements, quotas, and usage.
- A standalone service requests only the information and permission it needs; it does not require the comprehensive product-assessment journey.
