import { describe, expect, it } from "vitest";
import { promptVariableValuesSchema } from "@/features/ai-intelligence/domain/schemas/prompt-variable-values";
import {
  createPromptDefinitionAction,
  updatePromptDefinitionAction,
  executePromptAction,
  executeModelComparisonAction,
} from "@/app/actions/prompt-intelligence";

const validDefinition = {
  brandId: "00000000-0000-4000-8000-000000000001",
  name: "Bounded prompt",
  promptTemplate: "Explain {topic}",
  category: "Informational" as const,
  intent: "Informational" as const,
  locale: "en",
  variables: [{ name: "topic", defaultValue: "SEO" }],
  competitors: ["Competitor"],
  tags: ["research"],
};

const validUpdate = {
  id: "00000000-0000-4000-8000-000000000002",
};

describe("Prompt Intelligence bounded input contracts", () => {
  it("accepts values exactly at the shared variable-value limits", () => {
    const values = Object.fromEntries(
      Array.from({ length: 20 }, (_, index) => [
        `${"k".repeat(78)}${String(index).padStart(2, "0")}`,
        "v".repeat(2000),
      ]),
    );
    expect(promptVariableValuesSchema.safeParse(values).success).toBe(true);
  });

  it("rejects more than 20 variable definitions before authentication or service work", async () => {
    const result = await createPromptDefinitionAction({
      ...validDefinition,
      variables: Array.from({ length: 21 }, (_, index) => ({ name: `v${index}`, defaultValue: "x" })),
    });
    expect(result).toMatchObject({ success: false, error: "Validation failed" });
  });

  it("rejects oversized variable names, defaults, and descriptions", async () => {
    const tooLongName = await createPromptDefinitionAction({
      ...validDefinition,
      variables: [{ name: "n".repeat(81), defaultValue: "x" }],
    });
    const tooLongDefault = await createPromptDefinitionAction({
      ...validDefinition,
      variables: [{ name: "topic", defaultValue: "x".repeat(2001) }],
    });
    const tooLongDescription = await createPromptDefinitionAction({
      ...validDefinition,
      variables: [{ name: "topic", defaultValue: "x", description: "d".repeat(501) }],
    });

    for (const result of [tooLongName, tooLongDefault, tooLongDescription]) {
      expect(result).toMatchObject({ success: false, error: "Validation failed" });
    }
  });

  it("rejects excessive competitor and tag counts and member lengths", async () => {
    const cases = [
      { ...validDefinition, competitors: Array.from({ length: 26 }, () => "competitor") },
      { ...validDefinition, competitors: ["c".repeat(121)] },
      { ...validDefinition, tags: Array.from({ length: 51 }, () => "tag") },
      { ...validDefinition, tags: ["t".repeat(101)] },
    ];

    for (const input of cases) {
      const result = await createPromptDefinitionAction(input);
      expect(result).toMatchObject({ success: false, error: "Validation failed" });
    }
  });

  it("applies variable, competitor, and tag limits to updates", async () => {
    const invalidUpdates = [
      { variables: Array.from({ length: 21 }, (_, index) => ({ name: `v${index}`, defaultValue: "x" })) },
      { variables: [{ name: "v".repeat(81), defaultValue: "x" }] },
      { variables: [{ name: "v", defaultValue: "x".repeat(2001) }] },
      { variables: [{ name: "v", defaultValue: "x", description: "d".repeat(501) }] },
      { competitors: Array.from({ length: 26 }, () => "competitor") },
      { competitors: ["c".repeat(121)] },
      { tags: Array.from({ length: 51 }, () => "tag") },
      { tags: ["t".repeat(101)] },
    ];

    for (const fields of invalidUpdates) {
      const result = await updatePromptDefinitionAction({ ...validUpdate, ...fields });
      expect(result).toMatchObject({ success: false, error: "Validation failed" });
    }
  });

  it("rejects more than 20 supplied variable values for a single execution", async () => {
    const variablesValues = Object.fromEntries(
      Array.from({ length: 21 }, (_, index) => [`v${index}`, "x"]),
    );
    const result = await executePromptAction({
      promptId: "00000000-0000-4000-8000-000000000003",
      variablesValues,
      modelName: "sonar-medium",
    });
    expect(result).toMatchObject({ success: false, error: "Validation failed" });
  });

  it("rejects oversized variable keys and values for execution and comparison", async () => {
    const promptId = "00000000-0000-4000-8000-000000000003";
    const invalidValues = [
      { ["k".repeat(81)]: "x" },
      { topic: "x".repeat(2001) },
    ];

    for (const variablesValues of invalidValues) {
      const execution = await executePromptAction({ promptId, variablesValues, modelName: "sonar-medium" });
      const comparison = await executeModelComparisonAction({ promptId, variablesValues, models: ["sonar-medium"] });
      expect(execution).toMatchObject({ success: false, error: "Validation failed" });
      expect(comparison).toMatchObject({ success: false, error: "Validation failed" });
    }
  });

  it("rejects more than 10 models and model names longer than 100 characters", async () => {
    const promptId = "00000000-0000-4000-8000-000000000003";
    const tooMany = await executeModelComparisonAction({
      promptId,
      variablesValues: { topic: "SEO" },
      models: Array.from({ length: 11 }, () => "sonar-medium"),
    });
    const tooLongName = await executeModelComparisonAction({
      promptId,
      variablesValues: { topic: "SEO" },
      models: ["m".repeat(101)],
    });
    expect(tooMany).toMatchObject({ success: false, error: "Validation failed" });
    expect(tooLongName).toMatchObject({ success: false, error: "Validation failed" });
  });
});
