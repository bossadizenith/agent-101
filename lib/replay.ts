import { runAgent } from "./agent";
import { runtime } from "./runtime/instance";

export async function replayRun(runId: string) {
  const run = await runtime.loadRun(runId);
  const state = run.state;

  const failedStep = state.steps.findIndex((s) => !s.success);

  if (failedStep === -1) {
    console.log(`Run ${runId} completed successfully`);
    return;
  }

  if (state.messages.length === 0) {
    throw new Error(`Run ${runId} has no saved messages to replay from`);
  }

  console.log({
    phase: "replay",
    runId,
    resumingFrom: state.steps[failedStep]?.tool,
    completedSteps: failedStep,
  });

  state.status = "running";
  delete state.failedStepIndex;
  delete state.completedAt;
  await run.save();

  await runAgent(run);
}
