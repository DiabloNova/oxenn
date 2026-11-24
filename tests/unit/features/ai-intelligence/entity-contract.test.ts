import { describe, expect, it } from "vitest";
import {
  entitySchema,
  entityRelationshipSchema,
  brandEntityAssociationSchema
} from "@/features/ai-intelligence/domain/schemas";

const audit = {
  createdAt: "2026-11-24T00:00:00.000Z",
  updatedAt: "2026-11-24T00:00:00.000Z",
  createdBy: "test",
  updatedBy: "test",
  version: 1
};

describe("canonical Entity domain contract", () => {
  it("accepts an Organization-owned Entity without a Brand dependency", () => {
    const result = entitySchema.safeParse({
      id: "11111111-1111-4111-8111-111111111111",
      organizationId: "22222222-2222-4222-8222-222222222222",
      name: "Temperature Sensor",
      type: "Product",
      confidence: { score: 0.9, rating: "high" },
      properties: { source: "manual" },
      audit
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.organizationId).toBe("22222222-2222-4222-8222-222222222222");
      expect(result.data.properties).toEqual({ source: "manual" });
    }
  });

  it("rejects malformed Entity properties", () => {
    const result = entitySchema.safeParse({
      id: "11111111-1111-4111-8111-111111111111",
      organizationId: "22222222-2222-4222-8222-222222222222",
      name: "Temperature Sensor",
      type: "Product",
      properties: [],
      audit
    });

    expect(result.success).toBe(false);
  });
});

describe("canonical EntityRelationship domain contract", () => {
  it("requires its own identity and persists a non-negative edge weight", () => {
    const result = entityRelationshipSchema.safeParse({
      id: "33333333-3333-4333-8333-333333333333",
      organizationId: "22222222-2222-4222-8222-222222222222",
      sourceEntityId: "11111111-1111-4111-8111-111111111111",
      targetEntityId: "44444444-4444-4444-8444-444444444444",
      relationshipType: "related_to",
      weight: 1.5,
      confidence: { score: 0.8, rating: "high" },
      properties: { source: "test" },
      audit
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe("33333333-3333-4333-8333-333333333333");
      expect(result.data.weight).toBe(1.5);
    }
  });

  it("rejects a negative weight", () => {
    const result = entityRelationshipSchema.safeParse({
      id: "33333333-3333-4333-8333-333333333333",
      organizationId: "22222222-2222-4222-8222-222222222222",
      sourceEntityId: "11111111-1111-4111-8111-111111111111",
      targetEntityId: "44444444-4444-4444-8444-444444444444",
      relationshipType: "related_to",
      weight: -1,
      audit
    });

    expect(result.success).toBe(false);
  });
});

describe("BrandEntityAssociation domain contract", () => {
  it("requires explicit links to both Organization-owned aggregates", () => {
    const result = brandEntityAssociationSchema.safeParse({
      id: "55555555-5555-4555-8555-555555555555",
      organizationId: "22222222-2222-4222-8222-222222222222",
      brandId: "66666666-6666-4666-8666-666666666666",
      entityId: "11111111-1111-4111-8111-111111111111",
      relationshipType: "owns",
      weight: 1,
      properties: {},
      audit
    });

    expect(result.success).toBe(true);
  });
});
