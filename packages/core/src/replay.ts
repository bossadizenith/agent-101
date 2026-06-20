import type { RunHandle } from "./run";

export async function resumeRun(
  run: RunHandle,
  execute: (run: RunHandle) => Promise<void>,
): Promise<void> {
  const { state } = run;

  if (state.status === "error" || state.status === "interrupted") {
    state.status = "running";
    state.completedAt = undefined;
    await run.save();
  }

  await execute(run);
}
