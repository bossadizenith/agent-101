import { writeFileSync, mkdirSync, readFileSync } from "fs";
import type { RunState, Step } from "../types";
import type { LanguageModel } from "ai";

export function createRun({
  model,
  query,
}: {
  model: LanguageModel;
  query: string;
}) {
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
  };

  writeFileSync(`./runs/${runId}.json`, JSON.stringify(state, null, 2));

  return state;
}

export function loadState(runId: string) {
  const state = readFileSync(`./runs/${runId}.json`, "utf-8");
  return JSON.parse(state) as RunState;
}

export function saveState(state: RunState) {
  writeFileSync(`./runs/${state.runId}.json`, JSON.stringify(state, null, 2));
}
