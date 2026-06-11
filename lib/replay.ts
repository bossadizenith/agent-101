import { loadState } from "./state";

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
