import type { ModelMessage, ToolExecuteFunction, TypedToolCall } from "ai";
import type { createTools } from "./tools";
import type { GROQ_PRICING } from "./lib/const";

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
  costByTool: CostByTool;
  totalCostUsd: number;
  totalTokens: number;
};

export type AppTools = ReturnType<typeof createTools>;
export type AppToolCall = TypedToolCall<AppTools>;

export type CostEntry = {
  tool: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  model: string;
};

export type CostByTool = Record<string, number>;

export type CostSummary = {
  runId: string;
  totalCost: number;
  totalTokens: number;
  costByTool: CostByTool;
};

export type GroqPricing = keyof typeof GROQ_PRICING;
