import { tool, type Tool, type ToolExecuteFunction } from "ai";

export function withToolMiddleware<INPUT, OUTPUT>(
  t: Tool<INPUT, OUTPUT>,
  middleware: (
    next: ToolExecuteFunction<INPUT, OUTPUT>,
  ) => ToolExecuteFunction<INPUT, OUTPUT>,
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

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  return { message: String(error) };
}
