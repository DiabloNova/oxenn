import { beforeEach, describe, expect, it, vi } from "vitest";
import { PromptIntelligenceService } from "@/features/ai-intelligence/services/prompt-intelligence-service";
import type { PromptIntelligenceRepository, BrandRepository, CompetitorRepository } from "@/features/ai-intelligence/repositories";
import type { PromptDefinition } from "@/features/ai-intelligence/domain/types";

describe("PromptIntelligenceService execution input guard", () => {
  const definition = {
    id: "prompt-test",
    brandId: "brand-test",
    promptTemplate: "Describe {topic}",
    variables: [{ name: "topic", defaultValue: "SEO" }],
    version: 1,
  } as unknown as PromptDefinition;

  const findDefinitionById = vi.fn();
  const saveExecution = vi.fn();
  const findBrandById = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    findDefinitionById.mockResolvedValue(definition);
  });

  function createService() {
    const repository = {
      findDefinitionById,
      saveExecution,
    } as unknown as PromptIntelligenceRepository;
    const brandRepository = {
      findById: findBrandById,
    } as unknown as BrandRepository;
    const competitorRepository = {} as CompetitorRepository;
    return new PromptIntelligenceService(repository, brandRepository, competitorRepository);
  }

  it("rejects over-limit variable maps before brand lookup or execution persistence", async () => {
    const values = Object.fromEntries(Array.from({ length: 21 }, (_, index) => [`v${index}`, "x"]));
    await expect(
      createService().executePrompt("tenant-test", "prompt-test", values, "sonar-medium"),
    ).rejects.toThrow("Invalid prompt variable values");
    expect(findBrandById).not.toHaveBeenCalled();
    expect(saveExecution).not.toHaveBeenCalled();
  });

  it("rejects variable names not declared by the prompt definition", async () => {
    await expect(
      createService().executePrompt("tenant-test", "prompt-test", { unknown: "value" }, "sonar-medium"),
    ).rejects.toThrow("Unknown prompt variable(s): unknown");
    expect(findBrandById).not.toHaveBeenCalled();
    expect(saveExecution).not.toHaveBeenCalled();
  });

  it("rejects an undeclared variable during model comparison before any persistence", async () => {
    await expect(
      createService().executeComparison("tenant-test", "prompt-test", { topic: "SEO", unknown: "value" }, ["sonar-medium"]),
    ).rejects.toThrow("Unknown prompt variable(s): unknown");
    expect(findBrandById).not.toHaveBeenCalled();
    expect(saveExecution).not.toHaveBeenCalled();
  });
});
