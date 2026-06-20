import { isLoopFinished, streamText } from "ai";
import type { RunHandle } from "agentruntime";
import { appTools, type AppTools } from "../tools";
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
    ...run.hooks<AppTools>({
      onStepFinish: ({ cost }) => {
        console.log({
          stepCost: cost.stepCost,
          totalCostUsd: cost.totalCostUsd,
          totalTokens: cost.totalTokens,
          costByTool: cost.costByTool,
        });
      },
    }),
  });

  for await (const text of result.textStream) {
    console.log(text);
  }
}
