import { isLoopFinished, streamText } from "ai";

import { appTools } from "../tools";
import type { GroqPricing } from "../types";
import { resolveModel, SYSTEM_PROMPT } from "./const";
import { calculateCost } from "./cost";
import type { RunHandle } from "./runtime";

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
    onChunk: ({ chunk }) => {
      console.log({
        phase: "chunk",
        chunk,
      });
    },
  });

  for await (const text of result.textStream) {
    console.log(text);
  }
}
