import type {
  CreateRunOptions,
  RunState,
  RuntimeConfig,
  ToolRegistry,
} from "./lib/types";
import { resumeRun } from "./replay";
import { createRunHandle, type RunHandle } from "./run";
import { createInitialRunState, fileStorage } from "./storage-fs";

export type {
  CreateRunOptions,
  GroqPricing,
  Repo,
  RunState,
  RunSummary,
  RuntimeConfig,
  RuntimeEvent,
  SearchResult,
  Step,
  Storage,
  ToolPolicy,
  ToolRegistry,
  ToolRetryPolicy,
} from "./lib/types";
export type { RunHandle } from "./run";
export { calculateCost } from "./lib/cost";
export { GROQ_PRICING } from "./lib/const";
export { resumeRun } from "./replay";

export { fileStorage, RunNotFoundError } from "./storage-fs";

export function createRuntime(config: RuntimeConfig = {}) {
  const storage = config.storage ?? fileStorage();
  const emit = config.onEvent;

  const internals = {
    config,
    emit,
    save: (state: RunState) => storage.save(state),
  };

  return {
    tools<TOOLS extends ToolRegistry>(registry: TOOLS): TOOLS {
      return registry;
    },

    async createRun(options: CreateRunOptions) {
      const state = createInitialRunState(options);
      await storage.save(state);
      return createRunHandle(state, internals);
    },

    async loadRun(runId: string) {
      const state = await storage.load(runId);
      return createRunHandle(state, internals);
    },

    async replayRun(
      runId: string,
      execute: (run: RunHandle) => Promise<void>,
    ) {
      const run = await this.loadRun(runId);
      await resumeRun(run, execute);
    },
  };
}
