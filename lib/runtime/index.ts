import type { RunState } from "../../types";
import { createRunHandle } from "./run";
import { createInitialRunState, fileStorage } from "./storage-fs";
import type { CreateRunOptions, RuntimeConfig, ToolRegistry } from "./types";

export type { RunHandle } from "./run";
export { RunNotFoundError, fileStorage } from "./storage-fs";
export type {
  CreateRunOptions,
  RuntimeConfig,
  RuntimeEvent,
  RunSummary,
  Storage,
  ToolPolicy,
  ToolRegistry,
  ToolRetryPolicy,
} from "./types";

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
