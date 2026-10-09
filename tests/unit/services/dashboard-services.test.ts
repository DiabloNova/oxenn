import { describe, it, expect, beforeEach } from 'vitest';
import {
  SERVICE_CATALOG,
  getWorkspacePlan,
  getWorkspaceEntitlements,
  getWorkspaceUsage,
  getMarketplaceData,
  registerWorkspacePlan,
  clearWorkspacePlans
} from "@/services/dashboard-services";

describe('Service Marketplace Architecture', () => {
  beforeEach(() => {
    clearWorkspacePlans();
    registerWorkspacePlan("ws-test-free", "free");
    registerWorkspacePlan("Tehran HQ Workspace", "professional");
    registerWorkspacePlan("ws-pro-tenant", "professional");
    registerWorkspacePlan("ws-enterprise-organization", "enterprise");
    registerWorkspacePlan("ws-free", "free");
    registerWorkspacePlan("ws-enterprise", "enterprise");
  });

  it('verifies service catalog assignment and metadata', () => {
    expect(SERVICE_CATALOG.length).toBeGreaterThan(0);
    const expectedServices = [
      "tech-seo",
      "schema-metadata",
      "ai-visibility",
      "ai-playground",
      "content-studio",
      "content-ingestion",
      "competitor-radar",
      "brand-citations",
      "knowledge-graph",
      "llm-bias"
    ];
    for (const sId of expectedServices) {
      const found = SERVICE_CATALOG.find((s) => s.id === sId);
      expect(found).toBeDefined();
    }
  });

  it('verifies workspace subscription plan resolution', () => {
    expect(getWorkspacePlan("ws-test-free")).toBe("free");
    expect(getWorkspacePlan("Tehran HQ Workspace")).toBe("professional");
    expect(getWorkspacePlan("ws-pro-tenant")).toBe("professional");
    expect(getWorkspacePlan("ws-enterprise-organization")).toBe("enterprise");
  });

  it('verifies workspace service entitlements (Available vs Premium vs Locked vs Unavailable)', () => {
    const freeEnts = getWorkspaceEntitlements("ws-free");
    const techSeoFree = freeEnts.find((e) => e.serviceId === "tech-seo")!;
    const aiVisibilityFree = freeEnts.find((e) => e.serviceId === "ai-visibility")!;
    const knowledgeGraphFree = freeEnts.find((e) => e.serviceId === "knowledge-graph")!;
    const llmBiasFree = freeEnts.find((e) => e.serviceId === "llm-bias")!;

    expect(techSeoFree.status).toBe("AVAILABLE");
    expect(aiVisibilityFree.status).toBe("PREMIUM");
    expect(knowledgeGraphFree.status).toBe("LOCKED");
    expect(llmBiasFree.status).toBe("UNAVAILABLE");

    const proEnts = getWorkspaceEntitlements("Tehran HQ Workspace");
    const aiVisibilityPro = proEnts.find((e) => e.serviceId === "ai-visibility")!;
    const knowledgeGraphPro = proEnts.find((e) => e.serviceId === "knowledge-graph")!;

    expect(aiVisibilityPro.status).toBe("AVAILABLE");
    expect(knowledgeGraphPro.status).toBe("LOCKED");

    const entEnts = getWorkspaceEntitlements("ws-enterprise");
    const knowledgeGraphEnt = entEnts.find((e) => e.serviceId === "knowledge-graph")!;

    expect(knowledgeGraphEnt.status).toBe("AVAILABLE");
  });

  it('verifies usage mapping and progressive indicators', () => {
    const freeUsages = getWorkspaceUsage("ws-free");
    const techSeoFreeUsage = freeUsages.find((u) => u.serviceId === "tech-seo")!;
    const aiVisibilityFreeUsage = freeUsages.find((u) => u.serviceId === "ai-visibility")!;

    expect(techSeoFreeUsage.used).toBe(15);
    expect(techSeoFreeUsage.limit).toBe(50);
    expect(techSeoFreeUsage.percentage).toBe(30);

    expect(aiVisibilityFreeUsage.used).toBe(0);
    expect(aiVisibilityFreeUsage.limit).toBe(0);
    expect(aiVisibilityFreeUsage.percentage).toBe(0);

    const proUsages = getWorkspaceUsage("Tehran HQ Workspace");
    const aiVisibilityProUsage = proUsages.find((u) => u.serviceId === "ai-visibility")!;
    expect(aiVisibilityProUsage.used).toBe(7);
    expect(aiVisibilityProUsage.limit).toBe(20);
    expect(aiVisibilityProUsage.percentage).toBe(35);

    const entUsages = getWorkspaceUsage("ws-enterprise");
    const techSeoEntUsage = entUsages.find((u) => u.serviceId === "tech-seo")!;
    expect(techSeoEntUsage.limit).toBeNull();
    expect(techSeoEntUsage.percentage).toBe(0);
  });

  it('verifies marketplace item retrieval and domain separation', () => {
    const marketplaceData = getMarketplaceData("Tehran HQ Workspace");
    expect(marketplaceData.length).toBe(SERVICE_CATALOG.length);

    const item = marketplaceData[0];
    expect(item.service).toBeDefined();
    expect(item.entitlement).toBeDefined();
    expect(item.usage).toBeDefined();
  });

  it('defaults misleading workspace IDs to free plan without entitlement escalation', () => {
    const misleadingIds = ["ws-provider", "ws-parent", "ws-entertainment", "agent-ws", "ws-pro", "ws-ent", "my-enterprise-mock"];
    for (const id of misleadingIds) {
      const plan = getWorkspacePlan(id);
      expect(plan).toBe("free");

      const entitlements = getWorkspaceEntitlements(id);
      const locked = entitlements.find((e) => e.serviceId === "knowledge-graph")!;
      expect(locked.status).toBe("LOCKED");
    }
  });

  it('verifies explicit plan fixtures and entitlement sets across tiers', () => {
    registerWorkspacePlan("ws-temp-free", "free");
    registerWorkspacePlan("ws-temp-pro", "professional");
    registerWorkspacePlan("ws-temp-ent", "enterprise");

    const freeEntsTemp = getWorkspaceEntitlements("ws-temp-free");
    const proEntsTemp = getWorkspaceEntitlements("ws-temp-pro");
    const entEntsTemp = getWorkspaceEntitlements("ws-temp-ent");

    for (const ent of freeEntsTemp) {
      const s = SERVICE_CATALOG.find((x) => x.id === ent.serviceId)!;
      if (s.pricingTier === "free") expect(ent.status).toBe("AVAILABLE");
      else if (s.pricingTier === "professional") expect(ent.status).toBe("PREMIUM");
      else if (s.pricingTier === "enterprise") expect(ent.status).toBe("LOCKED");
    }

    for (const ent of proEntsTemp) {
      const s = SERVICE_CATALOG.find((x) => x.id === ent.serviceId)!;
      if (s.pricingTier === "free" || s.pricingTier === "professional") expect(ent.status).toBe("AVAILABLE");
      else if (s.pricingTier === "enterprise") expect(ent.status).toBe("LOCKED");
    }

    for (const ent of entEntsTemp) {
      const s = SERVICE_CATALOG.find((x) => x.id === ent.serviceId)!;
      if (s.pricingTier !== "custom") expect(ent.status).toBe("AVAILABLE");
    }
  });

  it('ensures single source of truth for dynamic plan and entitlement changes', () => {
    const ssotWorkspaceId = "ws-ssot-test";
    registerWorkspacePlan(ssotWorkspaceId, "professional");

    expect(getWorkspacePlan(ssotWorkspaceId)).toBe("professional");
    const proServiceEnt = getWorkspaceEntitlements(ssotWorkspaceId).find((e) => e.serviceId === "ai-visibility")!;
    expect(proServiceEnt.status).toBe("AVAILABLE");

    registerWorkspacePlan(ssotWorkspaceId, "free");
    expect(getWorkspacePlan(ssotWorkspaceId)).toBe("free");
    const proServiceEntAfterChange = getWorkspaceEntitlements(ssotWorkspaceId).find((e) => e.serviceId === "ai-visibility")!;
    expect(proServiceEntAfterChange.status).toBe("PREMIUM");
  });
});
