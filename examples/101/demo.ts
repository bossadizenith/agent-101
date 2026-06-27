import { createRuntime, fileStorage } from "agentsist";
import { runManagedAgent } from "./lib/agent-managed";
import { runPlainAgent } from "./lib/agent-plain";
import { runAgent } from "./lib/agent";
import { DEMO_TASK } from "./lib/const";
import { requireDemoEnv } from "./lib/require-env";
import {
  printAgentOutcome,
  printComparison,
  printSection,
} from "./lib/format-demo";
import { disarmGithubFailure } from "./tools/demo-state";

async function runDemo() {
  requireDemoEnv();

  console.log("═".repeat(60));
  console.log("  agentsist Demo: Silent Failure vs Critical Stop");
  console.log("═".repeat(60));
  console.log(`\nTask: "${DEMO_TASK}"`);
  console.log(
    "\nwebSearchTool runs live (Tavily). githubTool fails midway (armed after search).\n",
  );

  disarmGithubFailure();

  printSection("Agent A — no agentsist");
  const agentA = await runPlainAgent();
  printAgentOutcome(agentA);

  disarmGithubFailure();

  printSection("Agent B — with agentsist");
  const agentB = await runManagedAgent();
  printAgentOutcome(agentB);

  printComparison(agentA, agentB);
}

async function replayManaged(runId: string) {
  const runtime = createRuntime({ storage: fileStorage("./runs/demo") });
  await runtime.replayRun(runId, runAgent);
}

function getReplayRunId(): string | undefined {
  const flagIndex = process.argv.indexOf("--replay");
  if (flagIndex !== -1) {
    return process.argv[flagIndex + 1];
  }

  return process.argv.find((arg) => arg.startsWith("run_"));
}

const main = async () => {
  const replayRunId = getReplayRunId();

  if (replayRunId) {
    requireDemoEnv();
    await replayManaged(replayRunId);
    return;
  }

  await runDemo();
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
