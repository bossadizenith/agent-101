import type { LanguageModelUsage } from "ai";

import { ModelPricing } from "./const";
import { calculateCost } from "./cost";
import type { CostByTool, ModelPricingKey, RunState, StepCostSnapshot } from "./types";

export const GENERATION_COST_KEY = "__generation__";

function isModelPricingKey(model: string): model is ModelPricingKey {
  return model in ModelPricing;
}

export function applyStepUsage(
  state: RunState,
  model: string,
  usage: LanguageModelUsage,
  toolCalls: ReadonlyArray<{ toolName: string }>,
): StepCostSnapshot {
  const stepCost = isModelPricingKey(model)
    ? calculateCost(model, usage.inputTokens ?? 0, usage.outputTokens ?? 0)
    : 0;

  state.totalCostUsd += stepCost;
  state.totalTokens += usage.totalTokens ?? 0;

  if (toolCalls.length > 0) {
    const costPerTool = stepCost / toolCalls.length;
    for (const toolCall of toolCalls) {
      state.costByTool[toolCall.toolName] =
        (state.costByTool[toolCall.toolName] ?? 0) + costPerTool;
    }
  } else if (stepCost > 0) {
    state.costByTool[GENERATION_COST_KEY] =
      (state.costByTool[GENERATION_COST_KEY] ?? 0) + stepCost;
  }

  return {
    stepCost,
    totalCostUsd: state.totalCostUsd,
    totalTokens: state.totalTokens,
    costByTool: snapshotCostByTool(state.costByTool),
  };
}

function snapshotCostByTool(costByTool: CostByTool): CostByTool {
  return { ...costByTool };
}
