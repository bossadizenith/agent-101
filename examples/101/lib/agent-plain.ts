import { calculateCost } from "agentsist";
import { isLoopFinished, streamText } from "ai";
import { githubTool as baseGithubTool } from "../tools/github";
import { reportTool as baseReportTool } from "../tools/report";
import { webSearchTool as baseSearchTool } from "../tools/search";
import {
  AGENT_A_REPORT_PATH,
  DEFAULT_MODEL_ID,
  DEMO_TASK,
  SYSTEM_PROMPT,
  resolveModel,
} from "./const";
import type { AgentSummary } from "./format-demo";
import { trackTools, type ToolRunRecord } from "./tool-tracker";
import fs from "node:fs/promises";

export async function runPlainAgent(): Promise<AgentSummary> {
  const records: ToolRunRecord[] = [];
  const tools = trackTools(
    {
      webSearchTool: baseSearchTool,
      githubTool: baseGithubTool,
      reportTool: baseReportTool,
    },
    (record) => records.push(record),
  );

  let inputTokens = 0;
  let outputTokens = 0;

  const result = streamText({
    model: resolveModel(DEFAULT_MODEL_ID),
    system: SYSTEM_PROMPT,
    tools,
    messages: [
      {
        role: "user",
        content: `${DEMO_TASK}\n\nWrite the report to ${AGENT_A_REPORT_PATH}.`,
      },
    ],
    stopWhen: isLoopFinished(),
    onStepFinish: ({ usage }) => {
      inputTokens += usage.inputTokens ?? 0;
      outputTokens += usage.outputTokens ?? 0;
    },
  });

  try {
    for await (const _chunk of result.textStream) {
    }
  } catch {}

  const totalCostUsd = calculateCost(
    DEFAULT_MODEL_ID,
    inputTokens,
    outputTokens,
  );

  let reportExcerpt: string | undefined;
  try {
    const content = await fs.readFile(AGENT_A_REPORT_PATH, "utf-8");
    const githubSection = content.match(/github|repo/i);
    reportExcerpt = githubSection
      ? content.slice(0, 400).trim() + (content.length > 400 ? "…" : "")
      : content.slice(0, 200);
  } catch {}

  const githubFailed = records.some(
    (r) => r.tool === "githubTool" && r.status === "failure",
  );
  const reportWritten = records.some(
    (r) => r.tool === "reportTool" && r.status === "success",
  );

  return {
    label: "Agent A (no agentsist)",
    records,
    totalCostUsd,
    status: reportWritten ? "completed" : githubFailed ? "error" : "running",
    reportPath: reportWritten ? AGENT_A_REPORT_PATH : undefined,
    reportExcerpt,
    message: githubFailed
      ? "Report may include hallucinated GitHub data — user never knows the data is fake."
      : undefined,
  };
}
