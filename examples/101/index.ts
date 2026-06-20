import { runAgent } from "./lib/agent";
import { DEFAULT_MODEL_ID } from "./lib/const";
import { runtime } from "./lib/runtime/instance";

export const query = "what's the weather in tokyo?";

function getReplayRunId(): string | undefined {
  const flagIndex = process.argv.indexOf("--replay");
  if (flagIndex !== -1) {
    return process.argv[flagIndex + 1];
  }

  return (
    process.env.REPLAY_RUN_ID ??
    process.argv.find((arg) => arg.startsWith("run_"))
  );
}

const main = async () => {
  const replayRunId = getReplayRunId();

  if (replayRunId) {
    await runtime.replayRun(replayRunId, runAgent);
    return;
  }

  const run = await runtime.createRun({ model: DEFAULT_MODEL_ID, query });
  await runAgent(run);
};

main();
