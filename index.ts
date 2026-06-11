import "dotenv/config";

import { runAgent } from "./lib/agent";
import { DEFAULT_MODEL_ID } from "./lib/const";
import { replayRun } from "./lib/replay";
import { createRun } from "./lib/state";

export const query =
  "who's bossadi zenith, github repos and gimme a report of what you found";

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
    await replayRun(replayRunId);
    return;
  }

  const state = createRun({ model: DEFAULT_MODEL_ID, query });
  await runAgent(state);
};

main();
