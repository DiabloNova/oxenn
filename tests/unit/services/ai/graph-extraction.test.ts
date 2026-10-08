import { describe, it, expect } from "vitest";
import { extractGraphEntities } from "@/services/ai/graph-extraction";

describe("Graph Extraction Service", () => {
  it("extracts entities and relationships for Optimus AI text", async () => {
    const text1 = "سیستم هوشمند اپتیموس ای آی (Optimus AI) از هوش مصنوعی گوگل استفاده می‌کند.";
    const graph1 = await extractGraphEntities(text1);

    expect(graph1.entities).toBeDefined();
    expect(graph1.entities.length).toBeGreaterThan(0);

    const optimusEntity = graph1.entities.find((e) =>
      e.name.toLowerCase().includes("optimus")
    );
    expect(optimusEntity).toBeDefined();
    expect(optimusEntity?.type).toBe("brand");

    const geminiEntity = graph1.entities.find((e) =>
      e.name.toLowerCase().includes("gemini")
    );
    expect(geminiEntity).toBeDefined();
    expect(geminiEntity?.type).toBe("product");

    expect(graph1.relationships).toBeDefined();
    expect(graph1.relationships.length).toBeGreaterThan(0);

    const relationship = graph1.relationships[0];
    expect(relationship.sourceEntityName).toBe("Optimus AI");
    expect(relationship.targetEntityName).toBe("Gemini");
  });

  it("extracts entity for Apple text", async () => {
    const text2 = "شرکت اپل گوشی آیفون را معرفی کرد.";
    const graph2 = await extractGraphEntities(text2);

    const appleEntity = graph2.entities.find(
      (e) => e.name.toLowerCase() === "apple"
    );
    expect(appleEntity).toBeDefined();
  });
});
