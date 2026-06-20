import { isLoopFinished, streamText } from "ai";
import {
  calculateCost,
  type ModelPricingKey,
  type RunHandle,
} from "agentruntime";
import { appTools } from "../tools";
import { resolveModel, SYSTEM_PROMPT } from "./const";

export async function runAgent(run: RunHandle) {
  const state = run.state;
  const messages =
    state.messages.length > 0
      ? state.messages
      : [{ role: "user" as const, content: state.query }];

  const result = streamText({
    model: resolveModel(state.model),
    system: SYSTEM_PROMPT,
    tools: run.bindTools(appTools),
    messages,
    stopWhen: isLoopFinished(),
    ...run.hooks(),
    onStepFinish: ({ finishReason, toolCalls, usage }) => {
      if (finishReason === "tool-calls") {
        const stepCost = calculateCost(
          state.model as ModelPricingKey,
          usage.inputTokens ?? 0,
          usage.outputTokens ?? 0,
        );
        state.totalCostUsd += stepCost;
        state.totalTokens += usage.totalTokens ?? 0;

        const costPerTool = stepCost / toolCalls.length;
        for (const t of toolCalls) {
          state.costByTool[t.toolName] =
            (state.costByTool[t.toolName] ?? 0) + costPerTool;
        }
        void run.save();
      }
    },
  });

  for await (const text of result.textStream) {
    console.log(text);
  }
}
