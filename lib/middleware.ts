import { tool, type Tool, type ToolExecuteFunction } from "ai";

import type { RunState, ToolMiddlewareFunction } from "../types";
import { writeFileSync } from "fs";

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
      const [input] = args;
      const start = performance.now();

      try {
        const output = await next(...args);
        state.steps.push({
          tool: toolName,
          input: input as unknown as Record<string, unknown>,
          output,
          success: true,
          durationMs: performance.now() - start,
        });
        saveState(state);
        return output;
      } catch (error) {
        state.steps.push({
          tool: toolName,
          input: input as unknown as Record<string, unknown>,
          output: null,
          success: false,
          durationMs: performance.now() - start,
        });
        saveState(state);
        throw error;
      }
    };
    return wrapped as ToolExecuteFunction<INPUT, OUTPUT>;
  });
}

function saveState(state: RunState) {
  writeFileSync(`./runs/${state.runId}.json`, JSON.stringify(state, null, 2));
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  return { message: String(error) };
}
