import { isLoopFinished, streamText } from "ai";

import { createTools } from "../tools";
import type { CostByTool, GroqPricing, RunState } from "../types";
import { resolveModel, SYSTEM_PROMPT } from "./const";
import { saveState } from "./state";
import { calculateCost } from "./calculations";

export async function runAgent(state: RunState) {
  const messages =
    state.messages.length > 0
      ? state.messages
      : [{ role: "user" as const, content: state.query }];

  let totalCost = 0;
  const costByTool: CostByTool = {};

  const result = streamText({
    model: resolveModel(state.model),
    system: SYSTEM_PROMPT,
    tools: createTools(state),
    messages,
    stopWhen: isLoopFinished(),
    onFinish: ({ text }) => {
      if (state.status !== "running") return;

      if (text) {
        state.messages.push({ role: "assistant", content: text });
      }

      state.status = "completed";
      state.completedAt = new Date().toISOString();
      saveState(state);
      console.log({
        phase: "run_complete",
        runId: state.runId,
        totalTokens: state.totalTokens,
        totalCostUsd: state.totalCostUsd,
        costByTool: state.costByTool,
        status: state.status,
      });
    },
    onStepFinish: ({ finishReason, toolCalls, usage }) => {
      if (finishReason === "tool-calls") {
        for (const t of toolCalls) {
          state.costByTool[t.toolName] = calculateCost(
            state.model as GroqPricing,
            usage.inputTokens ?? 0,
            usage.outputTokens ?? 0,
          );
        }
        state.totalCostUsd += Object.values(state.costByTool).reduce(
          (acc, curr) => acc + curr,
          0,
        );
        state.totalTokens += usage.totalTokens ?? 0;
      }
    },
  });

  for await (const text of result.textStream) {
    console.log(text);
  }
}
