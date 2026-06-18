import type {
  CreateRunOptions,
  RunState,
  RuntimeConfig,
  ToolRegistry,
} from "./lib/types";
import { createRunHandle } from "./run";
import { createInitialRunState, fileStorage } from "./storage-fs";

export type {
  CreateRunOptions,
  RunSummary,
  RuntimeConfig,
  RuntimeEvent,
  Storage,
  ToolPolicy,
  ToolRegistry,
  ToolRetryPolicy,
} from "./lib/types";
export type { RunHandle } from "./run";

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
  };
}
