import { isLoopFinished, streamText } from "ai";

import { createTools } from "../tools";
import type { RunState } from "../types";
import { resolveModel, SYSTEM_PROMPT } from "./const";
import { saveState } from "./state";

export async function runAgent(state: RunState) {
  const messages =
    state.messages.length > 0
      ? state.messages
      : [{ role: "user" as const, content: state.query }];

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
    },
    onStepFinish: ({ finishReason, toolCalls, usage }) => {
      if (finishReason === "tool-calls") {
        for (const t of toolCalls) {
          console.log({
            tool: t.toolName,
            usage,
          });
        }
      }
    },
  });

  for await (const text of result.textStream) {
    console.log(text);
  }
}

{
  /*
  {
  tool: "webSearchTool",
  usage: {
    inputTokens: 1002,
    inputTokenDetails: {
      noCacheTokens: 1002,
      cacheReadTokens: undefined,
      cacheWriteTokens: undefined,
    },
    outputTokens: 35,
    outputTokenDetails: {
      textTokens: 35,
      reasoningTokens: undefined,
    },
    totalTokens: 1037,
    raw: {
      prompt_tokens: 1002,
      completion_tokens: 35,
      total_tokens: 1037,
    },
    reasoningTokens: undefined,
    cachedInputTokens: undefined,
  },
}
Attempt 1 of 3
{
  tool: "githubTool",
  usage: {
    inputTokens: 3146,
    inputTokenDetails: {
      noCacheTokens: 3146,
      cacheReadTokens: undefined,
      cacheWriteTokens: undefined,
    },
    outputTokens: 32,
    outputTokenDetails: {
      textTokens: 32,
      reasoningTokens: undefined,
    },
    totalTokens: 3178,
    raw: {
      prompt_tokens: 3146,
      completion_tokens: 32,
      total_tokens: 3178,
    },
    reasoningTokens: undefined,
    cachedInputTokens: undefined,
  },
}
Attempt 1 of 3
{
  tool: "reportTool",
  usage: {
    inputTokens: 4118,
    inputTokenDetails: {
      noCacheTokens: 4118,
      cacheReadTokens: undefined,
      cacheWriteTokens: undefined,
    },
    outputTokens: 285,
    outputTokenDetails: {
      textTokens: 285,
      reasoningTokens: undefined,
    },
    totalTokens: 4403,
    raw: {
      prompt_tokens: 4118,
      completion_tokens: 285,
      total_tokens: 4403,
    },
    reasoningTokens: undefined,
    cachedInputTokens: undefined,
  },
}
  */
}
