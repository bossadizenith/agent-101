import type { ToolExecuteFunction } from "ai";

export type Repo = {
  name: string;
  html_url: string;
  stargazers_count: number;
  description: string;
};

export type SearchResult = {
  title: string;
  url: string;
  content: string;
};

export type ToolMiddlewareFunction<INPUT, OUTPUT> = (
  next: ToolExecuteFunction<INPUT, OUTPUT>,
) => ToolExecuteFunction<INPUT, OUTPUT>;

export type Step = {
  tool: string;
  input: Record<string, unknown>;
  output: unknown;
  success: boolean;
  durationMs: number;
};

export type RunState = {
  runId: string;
  startDate: string;
  status: string;
  steps: Step[];
};
