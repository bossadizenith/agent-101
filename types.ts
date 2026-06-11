import type { ModelMessage, ToolExecuteFunction } from "ai";

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

export type SerializedError = {
  name: string;
  message: string;
  stack?: string;
};

export type Step = {
  toolCallId: string;
  tool: string;
  input: Record<string, unknown>;
  output: unknown;
  success: boolean;
  durationMs: number;
  error?: SerializedError;
};

export type RunStatus = "running" | "completed" | "error" | "interrupted";

export type RunState = {
  schemaVersion: 1;
  runId: string;
  query: string;
  model: string;
  startDate: string;
  completedAt?: string;
  status: RunStatus;
  failedStepIndex?: number;
  messages: ModelMessage[];
  steps: Step[];
};
