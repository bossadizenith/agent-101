import type { GroqPricing } from "./types";
import { GROQ_PRICING } from "./const";

export function calculateCost(
  model: GroqPricing,
  inputTokens: number,
  outputTokens: number,
) {
  const pricing = GROQ_PRICING[model];
  if (!pricing) return 0;

  const inputCost = (inputTokens / 1_000_000) * pricing.inputCostPer1M;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputCostPer1M;

  return inputCost + outputCost;
}
