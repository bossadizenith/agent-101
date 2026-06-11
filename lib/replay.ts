import { readFileSync } from "fs";
import type { RunState } from "../types";

export async function replayRun(runId: string) {
  const state = loadState(runId);

  const failedStep = state.steps.findIndex((s) => !s.success);

  if (failedStep === -1) {
    console.log(`Run ${runId} completed successfully`);
    return;
  }

  console.log({
    phase: "replay",
    runId,
    resumingFrom: state.steps[failedStep]?.tool,
    skipping: failedStep,
  });

  const completedSteps = state.steps.slice(0, failedStep);

  return { completedSteps, resumedFrom: failedStep };
}

function loadState(runId: string) {
  const state = readFileSync(`./runs/${runId}.json`, "utf-8");
  return JSON.parse(state) as RunState;
}
