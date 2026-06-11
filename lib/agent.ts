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
  });

  for await (const text of result.textStream) {
    console.log(text);
  }
}
