import { tool, type Tool, type ToolExecuteFunction } from "ai";

import type { ToolMiddlewareFunction } from "../types";

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
        console.log(`Attempt ${attempt} of ${maxRetries}`);
        try {
          return await next(...args);
        } catch (error) {
          lastError = error;
          if (attempt < maxRetries)
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
      throw lastError;
    };
    return wrapped as ToolExecuteFunction<INPUT, OUTPUT>;
  });
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  return { message: String(error) };
}
