import type { Tool } from "ai";

import type { RunState, SerializedError } from "../../types";

export type RunSummary = {
  runId: string;
  status: RunState["status"];
  totalTokens: number;
  totalCostUsd: number;
  costByTool: RunState["costByTool"];
  stepCount: number;
};

export type RuntimeEvent =
  | {
      type: "tool:start";
      runId: string;
      tool: string;
      input: unknown;
    }
  | {
      type: "tool:complete";
      runId: string;
      tool: string;
      output: unknown;
      durationMs: number;
    }
  | {
      type: "tool:failure";
      runId: string;
      tool: string;
      error: SerializedError;
      durationMs: number;
    }
  | {
      type: "tool:retry";
      runId: string;
      tool: string;
      attempt: number;
      max: number;
      error: SerializedError;
    }
  | {
      type: "run:complete";
      runId: string;
      summary: RunSummary;
    }
  | {
      type: "run:abort";
      runId: string;
      reason: string;
      tool?: string;
      error?: SerializedError;
    };

export type ToolRetryPolicy =
  | number
  | {
      maxRetries?: number;
      delayMs?: number;
    };

export type ToolPolicy = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tool: Tool<any, any>;
  retry?: ToolRetryPolicy;
  critical?: boolean;
};

export type ToolRegistry = Record<string, ToolPolicy>;

export type Storage = {
  save: (state: RunState) => Promise<void>;
  load: (runId: string) => Promise<RunState>;
};

export type RuntimeConfig = {
  onEvent?: (event: RuntimeEvent) => void;
  storage?: Storage;
};

export type CreateRunOptions = {
  query: string;
  model: string;
};
