import { writeFileSync, mkdirSync, readFileSync } from "fs";
import type { RunState, Step } from "../types";

export function createRun({ model, query }: { model: string; query: string }) {
  const runId = `run_${Date.now()}`;
  mkdirSync(`./runs`, { recursive: true });

  const state: RunState = {
    schemaVersion: 1,
    runId,
    startDate: new Date().toISOString(),
    status: "running",
    steps: [] as Step[],
    query,
    model,
    messages: [],
    costByTool: {},
    totalCostUsd: 0,
    totalTokens: 0,
  };

  writeFileSync(`./runs/${runId}.json`, JSON.stringify(state, null, 2));

  return state;
}

export class RunNotFoundError extends Error {
  readonly runId: string;
  readonly path: string;

  constructor(runId: string) {
    const path = `./runs/${runId}.json`;
    super(`Run not found: ${runId} (expected ${path})`);
    this.name = "RunNotFoundError";
    this.runId = runId;
    this.path = path;
  }
}

export function loadState(runId: string): RunState {
  const path = `./runs/${runId}.json`;

  let raw: string;
  try {
    raw = readFileSync(path, "utf-8");
  } catch (error) {
    if (isEnoent(error)) {
      throw new RunNotFoundError(runId);
    }
    throw error;
  }

  try {
    return normalizeRunState(JSON.parse(raw));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid run file: ${path}`);
    }
    throw error;
  }
}

function normalizeRunState(raw: unknown): RunState {
  const state = raw as RunState;

  if (typeof state.model === "object" && state.model !== null) {
    const legacyModel = state.model as { modelId?: string };
    if (legacyModel.modelId) {
      state.model = legacyModel.modelId;
    }
  }

  return state;
}

function isEnoent(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}

export function saveState(state: RunState) {
  writeFileSync(`./runs/${state.runId}.json`, JSON.stringify(state, null, 2));
}
