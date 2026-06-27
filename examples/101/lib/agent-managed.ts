import { createRuntime, fileStorage } from "agentsist";
import { isLoopFinished, streamText } from "ai";
import type { RunHandle, RuntimeEvent } from "agentsist";
import { appTools, type AppTools } from "../tools";
import {
  AGENT_B_REPORT_PATH,
  DEFAULT_MODEL_ID,
  DEMO_TASK,
  SYSTEM_PROMPT,
  resolveModel,
} from "./const";
import type { AgentSummary } from "./format-demo";
import { collectGithubRetries } from "./format-demo";
import type { ToolRunRecord } from "./tool-tracker";

function buildRecordsFromEvents(events: RuntimeEvent[]): ToolRunRecord[] {
  const order = ["webSearchTool", "githubTool", "reportTool"];
  const byTool = new Map<string, ToolRunRecord>();

  for (const event of events) {
    if (event.type === "tool:complete") {
      byTool.set(event.tool, { tool: event.tool, status: "success" });
    }
    if (event.type === "tool:failure") {
      byTool.set(event.tool, {
        tool: event.tool,
        status: "failure",
        error: event.error.message,
      });
    }
  }

  return order
    .filter((name) => byTool.has(name))
    .map((name) => byTool.get(name)!);
}

async function runAgentLoop(run: RunHandle) {
  const state = run.state;
  const messages =
    state.messages.length > 0
      ? state.messages
      : [{ role: "user" as const, content: state.query }];

  const result = streamText({
    model: resolveModel(state.model),
    system: SYSTEM_PROMPT,
    tools: run.bindTools(appTools),
    messages,
    stopWhen: isLoopFinished(),
    ...run.hooks<AppTools>({
      // onStepFinish: ({ cost }) => {},
    }),
  });

  for await (const text of result.textStream) {
    if (run.state.status === "interrupted") break;
    process.stdout.write(text);
  }
}

export async function runManagedAgent(): Promise<AgentSummary> {
  const events: RuntimeEvent[] = [];

  const runtime = createRuntime({
    storage: fileStorage("./runs/demo"),
    onEvent: (event) => {
      events.push(event);
      console.log(event);
    },
  });

  const run = await runtime.createRun({
    model: DEFAULT_MODEL_ID,
    query: `${DEMO_TASK}\n\nWrite the report to ${AGENT_B_REPORT_PATH}.`,
  });

  try {
    await runAgentLoop(run);
  } catch {
    // critical tool failure aborts the tool execute path
  }

  const records = buildRecordsFromEvents(events);
  const githubRetries = collectGithubRetries(events);
  const githubFailed = records.some(
    (r) => r.tool === "githubTool" && r.status === "failure",
  );
  const reportWritten = records.some(
    (r) => r.tool === "reportTool" && r.status === "success",
  );

  let message: string | undefined;
  if (githubFailed && !reportWritten) {
    message = [
      "githubTool failed after 3 attempts.",
      "Run stopped to prevent hallucination.",
      `Replay when GitHub is available: bun demo.ts --replay ${run.runId}`,
    ].join("\n");
  }

  return {
    label: "Agent B (with agentsist)",
    records,
    totalCostUsd: run.state.totalCostUsd,
    costByTool: run.state.costByTool,
    status: run.state.status,
    runId: run.runId,
    reportPath: reportWritten ? AGENT_B_REPORT_PATH : undefined,
    githubRetries,
    message,
  };
}
