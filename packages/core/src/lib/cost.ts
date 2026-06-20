import type { ModelPricingKey } from "./types";
import { ModelPricing } from "./const";

export function calculateCost(
  model: ModelPricingKey,
  inputTokens: number,
  outputTokens: number,
) {
  const pricing = ModelPricing[model];
  if (!pricing) return 0;

  const inputCost = (inputTokens / 1_000_000) * pricing.inputCostPer1M;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputCostPer1M;

  return inputCost + outputCost;
}
