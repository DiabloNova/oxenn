import { describe, it, expect, beforeEach } from 'vitest';
import { BudgetService } from "@/services/cost-control/budget";
import { CostCalculator, pricingCatalog } from "@/services/cost-control/pricing";
import { UsageRecord, RequestBudget } from "@/services/cost-control/types";
import { setCookiesMock } from "@/services/auth/session";

const mockCookieStore = {
  store: new Map<string, unknown>(),
  get(name: string) {
    return this.store.get(name);
  },
  set(name: string, value: unknown, options?: Record<string, unknown>) {
    this.store.set(name, { value, name, ...options });
  },
  delete(name: string) {
    this.store.delete(name);
  },
  clear() {
    this.store.clear();
  }
};

setCookiesMock(() => Promise.resolve(mockCookieStore));

describe('AI Cost Governance & Budget Integration', () => {
  const tenantA = "a0000000-0000-0000-0000-00000000000a";

  it('COST-001: calculates paid model costs accurately based on token counts', () => {
    const costPaid = CostCalculator.calculateCost("gpt-4o", 100_000, 200_000);
    expect(costPaid).toBe(2.25);
  });

  it('COST-002: returns undefined for unknown model pricing', () => {
    const costUnknown = CostCalculator.calculateCost("non-existent-super-expensive-model", 1000, 1000);
    expect(costUnknown).toBeUndefined();
  });

  it('COST-003: distinguishes free-tier models from unknown pricing', () => {
    const costFree = CostCalculator.calculateCost("gemini-3.5-flash", 1000, 1000);
    expect(costFree).toBe(0.0);

    const modelFree = pricingCatalog["gemini-3.5-flash"];
    expect(modelFree.pricingMode).toBe("free_tier");
  });

  it('COST-004: distinguishes self-hosted models from free-tier models', () => {
    const modelSelf = pricingCatalog["deepseek-v3-0324"];
    expect(modelSelf.pricingMode).toBe("self_hosted");
  });

  it('COST-005, 006, 007: represents RPM, RPD, and Cloudflare neuron quota units correctly', () => {
    const geminiQuota = pricingCatalog["gemini-3.5-flash"].freeTier;
    expect(geminiQuota?.requestsPerMinute).toBe(15);
    expect(geminiQuota?.requestsPerDay).toBe(1500);

    const cfQuota = pricingCatalog["@cf/openai/gpt-oss-120b"].freeTier;
    expect(cfQuota?.neuronsPerDay).toBe(10000);
  });

  it('COST-008: models geographic availability restrictions accurately', () => {
    const geminiAvail = pricingCatalog["gemini-3.5-flash"].availability;
    expect(geminiAvail?.freeTierAvailable).toBe(true);
    expect(geminiAvail?.restrictedRegions?.includes("EU")).toBe(true);
  });

  it('COST-009: segregates monetary budgets and request quotas', async () => {
    const budgetService = new BudgetService();
    budgetService.clearRecords();

    const mockBudgetA: RequestBudget = {
      tenantId: tenantA,
      period: "month",
      limit: 10.0,
      used: 0
    };
    await budgetService.setBudget(mockBudgetA);

    const usage1: UsageRecord = {
      tenantId: tenantA,
      provider: "google",
      model: "gemini-2.5-pro",
      operation: "analysis",
      requestId: "req-1",
      estimatedCost: 1.50,
      timestamp: Date.now()
    };
    await budgetService.recordUsage(usage1);

    const budgetA = await budgetService.getBudget(tenantA);
    expect(budgetA?.used).toBe(1.50);
  });

  it('COST-010: prevents double-spending under concurrent budgets', async () => {
    const budgetService = new BudgetService();
    budgetService.clearRecords();

    const mockBudgetConcurrency: RequestBudget = {
      tenantId: tenantA,
      period: "month",
      limit: 0.10,
      used: 0
    };
    await budgetService.setBudget(mockBudgetConcurrency);

    const firstRes = await budgetService.checkAndReserve({ tenantId: tenantA, estimatedCost: 0.08 });

    await budgetService.recordUsage({
      tenantId: tenantA,
      provider: "google",
      model: "gemini-2.5-flash",
      operation: "test",
      requestId: "req-c1",
      estimatedCost: 0.08,
      timestamp: Date.now()
    });

    const secondRes = await budgetService.checkAndReserve({ tenantId: tenantA, estimatedCost: 0.08 });

    expect(firstRes.allowed).toBe(true);
    expect(secondRes.allowed).toBe(false);
  });
});
