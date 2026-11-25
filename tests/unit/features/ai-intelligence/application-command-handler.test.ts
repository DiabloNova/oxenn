import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createEntity: vi.fn(),
  publish: vi.fn()
}));

vi.mock("@/features/ai-intelligence/services", () => ({
  EntityService: class {
    createEntity(...args: unknown[]) { return mocks.createEntity(...args); }
  },
  CitationService: class {},
  VisibilityService: class {},
  ObservationService: class {}
}));

vi.mock("@/features/ai-intelligence/domain/events", () => ({
  DomainEventFactory: { create: vi.fn(() => ({ type: "aibi.entity.discovered" })) },
  eventBus: { publish: (...args: unknown[]) => mocks.publish(...args) }
}));

import { TenantContextManager } from "@/core/database/tenant-context";
import { ApplicationCommandHandler } from "@/features/ai-intelligence/application/handlers";

const organizationId = "11111111-1111-4111-8111-111111111111";
const actorId = "22222222-2222-4222-8222-222222222222";
const entity = {
  id: "33333333-3333-4333-8333-333333333333",
  organizationId,
  name: "Example entity",
  type: "organization",
  confidence: { score: 0.9, rating: "high" },
  audit: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: actorId, updatedBy: actorId, version: 1 }
};

afterEach(() => vi.restoreAllMocks());

describe("ApplicationCommandHandler.handleDiscoverEntity transaction boundary", () => {
  it("runs Entity and Brand association writes inside the same tenant transaction", async () => {
    const associationError = new Error("association insert rejected");
    mocks.createEntity.mockResolvedValue(entity);
    mocks.publish.mockResolvedValue(undefined);

    const brandRepo = { findById: vi.fn(async () => ({ id: "brand-1" })) };
    const entityRepo = {};
    const associationRepo = { save: vi.fn(async () => { throw associationError; }) };
    const handler = new ApplicationCommandHandler(brandRepo as never, entityRepo as never, undefined, undefined, undefined, undefined, associationRepo as never);

    vi.spyOn(TenantContextManager, "getContext").mockReturnValue(null);
    const runTransaction = vi.spyOn(TenantContextManager, "runWithTenantContext").mockImplementation(
      (async (_tenantId, _userId, _requestId, work) => work()) as typeof TenantContextManager.runWithTenantContext
    );

    await expect(handler.handleDiscoverEntity({
      organizationId,
      actorId,
      name: entity.name,
      type: entity.type,
      confidenceScore: 0.9,
      brandId: "brand-1"
    } as never)).rejects.toBe(associationError);

    expect(runTransaction).toHaveBeenCalledWith(
      organizationId,
      actorId,
      "ai-intelligence:discover-entity",
      expect.any(Function)
    );
    expect(brandRepo.findById).toHaveBeenCalledOnce();
    expect(mocks.createEntity).toHaveBeenCalledOnce();
    expect(associationRepo.save).toHaveBeenCalledOnce();
    expect(mocks.publish).not.toHaveBeenCalled();
  });

  it("reuses an existing System Context transaction instead of opening a tenant transaction", async () => {
    mocks.createEntity.mockResolvedValue(entity);
    mocks.publish.mockResolvedValue(undefined);
    const brandRepo = { findById: vi.fn(async () => ({ id: "brand-1" })) };
    const associationRepo = { save: vi.fn(async () => undefined) };
    const handler = new ApplicationCommandHandler(brandRepo as never, {} as never, undefined, undefined, undefined, undefined, associationRepo as never);

    vi.spyOn(TenantContextManager, "getContext").mockReturnValue({
      tenantId: null,
      userId: actorId,
      requestId: null,
      executionMode: "system",
      dbClient: { query: vi.fn() }
    });
    const runTransaction = vi.spyOn(TenantContextManager, "runWithTenantContext");

    await handler.handleDiscoverEntity({
      organizationId,
      actorId,
      name: entity.name,
      type: entity.type,
      confidenceScore: 0.9,
      brandId: "brand-1"
    } as never);

    expect(runTransaction).not.toHaveBeenCalled();
    expect(associationRepo.save).toHaveBeenCalledOnce();
  });
});
