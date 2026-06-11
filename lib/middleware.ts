import type { JSONValue } from "@ai-sdk/provider";
import { tool, type Tool, type ToolExecuteFunction } from "ai";

import type { RunState, ToolMiddlewareFunction } from "../types";
import { serializeError } from "./logger";
import { saveState } from "./state";

export function withToolMiddleware<INPUT, OUTPUT>(
  t: Tool<INPUT, OUTPUT>,
  middleware: ToolMiddlewareFunction<INPUT, OUTPUT>,
): Tool<INPUT, OUTPUT> {
  if (!t.execute) return t;

  const { execute, ...rest } = t;

  return tool({
    ...rest,
    execute: middleware(execute),
  });
}

export function withToolLogging<INPUT, OUTPUT>(
  toolName: string,
  t: Tool<INPUT, OUTPUT>,
): Tool<INPUT, OUTPUT> {
  return withToolMiddleware(t, (next) => {
    const wrapped = async (
      ...args: Parameters<ToolExecuteFunction<INPUT, OUTPUT>>
    ) => {
      const [input, options] = args;
      const start = performance.now();
      try {
        const output = await next(input, options);
        console.log({
          phase: "execute",
          tool: toolName,
          durationMs: performance.now() - start,
          success: true,
          input,
        });
        return output;
      } catch (error) {
        console.error({
          phase: "execute",
          tool: toolName,
          durationMs: performance.now() - start,
          success: false,
          error: serializeError(error),
        });
        throw error;
      }
    };
    return wrapped as ToolExecuteFunction<INPUT, OUTPUT>;
  });
}

export function withToolRetry<INPUT, OUTPUT>(
  t: Tool<INPUT, OUTPUT>,
  { maxRetries = 3, delayMs = 300 },
) {
  return withToolMiddleware(t, (next) => {
    const wrapped = async (
      ...args: Parameters<ToolExecuteFunction<INPUT, OUTPUT>>
    ) => {
      let lastError: unknown;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const wait = delayMs * Math.pow(2, attempt - 1);
        console.log(`Attempt ${attempt} of ${maxRetries}`);
        try {
          return await next(...args);
        } catch (error) {
          lastError = error;
          console.log({
            phase: "retry",
            attempt,
            maxRetries,
            error: serializeError(error),
            nextRetryMs: attempt < maxRetries ? wait : null,
          });
          if (attempt < maxRetries)
            await new Promise((resolve) => setTimeout(resolve, wait));
        }
      }
      throw lastError;
    };
    return wrapped as ToolExecuteFunction<INPUT, OUTPUT>;
  });
}

export function withToolCritical<INPUT, OUTPUT>(
  t: Tool<INPUT, OUTPUT>,
): Tool<INPUT, OUTPUT> {
  return withToolMiddleware(t, (next) => {
    const wrapped = async (
      ...args: Parameters<ToolExecuteFunction<INPUT, OUTPUT>>
    ) => {
      try {
        return await next(...args);
      } catch (error) {
        console.error({
          phase: "critical_failure",
          message: "Tool critical failure",
          error: serializeError(error),
        });

        process.exit(1);
      }
    };
    return wrapped as ToolExecuteFunction<INPUT, OUTPUT>;
  });
}

export function withToolStateCapture<INPUT, OUTPUT>(
  toolName: string,
  t: Tool<INPUT, OUTPUT>,
  state: RunState,
): Tool<INPUT, OUTPUT> {
  return withToolMiddleware(t, (next) => {
    const wrapped = async (
      ...args: Parameters<ToolExecuteFunction<INPUT, OUTPUT>>
    ) => {
      const [input, call] = args;
      const start = performance.now();

      seedMessages(state, call.messages);

      try {
        const output = await next(...args);
        state.steps.push({
          toolCallId: call.toolCallId,
          tool: toolName,
          input: input as Record<string, unknown>,
          output,
          success: true,
          durationMs: Math.round(performance.now() - start),
        });
        appendToolTranscript(state, {
          toolCallId: call.toolCallId,
          toolName,
          input,
          output,
        });
        saveState(state);
        return output;
      } catch (error) {
        const failedStepIndex = state.steps.length;
        state.status = "error";
        state.failedStepIndex = failedStepIndex;
        state.completedAt = new Date().toISOString();
        state.steps.push({
          toolCallId: call.toolCallId,
          tool: toolName,
          input: input as unknown as Record<string, unknown>,
          output: null,
          success: false,
          durationMs: Math.round(performance.now() - start),
          error: serializeError(error),
        });
        saveState(state);
        throw error;
      }
    };
    return wrapped as ToolExecuteFunction<INPUT, OUTPUT>;
  });
}

function seedMessages(
  state: RunState,
  priorMessages: RunState["messages"],
): void {
  if (state.messages.length === 0 && priorMessages.length > 0) {
    state.messages.push(...priorMessages);
  }
}

function appendToolTranscript(
  state: RunState,
  {
    toolCallId,
    toolName,
    input,
    output,
  }: {
    toolCallId: string;
    toolName: string;
    input: unknown;
    output: unknown;
  },
): void {
  state.messages.push(
    {
      role: "assistant",
      content: [
        {
          type: "tool-call",
          toolCallId,
          toolName,
          input,
        },
      ],
    },
    {
      role: "tool",
      content: [
        {
          type: "tool-result",
          toolCallId,
          toolName,
          output: toToolResultOutput(output),
        },
      ],
    },
  );
}

function toToolResultOutput(output: unknown) {
  return typeof output === "string"
    ? { type: "text" as const, value: output }
    : { type: "json" as const, value: (output ?? null) as JSONValue };
}
