import { writeFileSync, mkdirSync } from "fs";
import type { Step } from "../types";

export function createRun() {
  const runId = `run_${Date.now()}`;
  mkdirSync(`./runs/${runId}`, { recursive: true });

  const state = {
    runId,
    startDate: new Date().toISOString(),
    status: "running",
    steps: [] as Step[],
  };

  writeFileSync(`./runs/${runId}/state.json`, JSON.stringify(state, null, 2));

  return state;
}
