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
