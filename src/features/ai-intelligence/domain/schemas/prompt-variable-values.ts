import { z } from "zod";

export const MAX_PROMPT_VARIABLE_COUNT = 20;
export const MAX_PROMPT_VARIABLE_NAME_LENGTH = 80;
export const MAX_PROMPT_VARIABLE_VALUE_LENGTH = 2000;

/**
 * Bounds user-supplied Prompt Intelligence variables at every execution entry point.
 * Keep these limits aligned with the prompt-definition schema in prompt-intelligence.ts.
 */
export const promptVariableDefinitionSchema = z.object({
  name: z.string().max(MAX_PROMPT_VARIABLE_NAME_LENGTH, "Prompt variable names must be at most 80 characters"),
  defaultValue: z.string().max(MAX_PROMPT_VARIABLE_VALUE_LENGTH, "Prompt variable defaults must be at most 2000 characters"),
  description: z.string().max(500, "Prompt variable descriptions must be at most 500 characters").optional(),
});

export const promptVariableDefinitionsSchema = z.array(promptVariableDefinitionSchema).max(
  MAX_PROMPT_VARIABLE_COUNT,
  `At most ${MAX_PROMPT_VARIABLE_COUNT} prompt variables are supported`,
);

export const promptVariableValuesSchema = z
  .record(
    z.string().max(MAX_PROMPT_VARIABLE_NAME_LENGTH, "Prompt variable names must be at most 80 characters"),
    z.string().max(MAX_PROMPT_VARIABLE_VALUE_LENGTH, "Prompt variable values must be at most 2000 characters"),
  )
  .superRefine((values, context) => {
    if (Object.keys(values).length > MAX_PROMPT_VARIABLE_COUNT) {
      context.addIssue({
        code: "custom",
        message: `At most ${MAX_PROMPT_VARIABLE_COUNT} prompt variable values are supported`,
      });
    }
  });
