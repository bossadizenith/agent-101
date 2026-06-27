import type { RuntimeEvent } from "agentsist";
import type { ToolRunRecord } from "./tool-tracker";

const OK = "✅";
const FAIL = "❌";

export type AgentSummary = {
  label: string;
  records: ToolRunRecord[];
  totalCostUsd: number;
  costByTool?: Record<string, number>;
  status: string;
  runId?: string;
  reportPath?: string;
  reportExcerpt?: string;
  message?: string;
  githubRetries?: number;
};

export function printSection(title: string) {
  const line = "─".repeat(60);
  console.log(`\n${line}`);
  console.log(`  ${title}`);
  console.log(line);
}

export function printAgentOutcome(summary: AgentSummary) {
  console.log("\nWhat happened:\n");

  const search = summary.records.find((r) => r.tool === "webSearchTool");
  const github = summary.records.find((r) => r.tool === "githubTool");
  const report = summary.records.find((r) => r.tool === "reportTool");

  console.log(
    `webSearchTool    ${search?.status === "success" ? OK : FAIL} ${searchLabel(search)}`,
  );

  if (summary.githubRetries && summary.githubRetries > 0) {
    console.log(
      `githubTool       ${FAIL} failed → retried ${summary.githubRetries}x → critical stop`,
    );
  } else {
    console.log(
      `githubTool       ${github?.status === "success" ? OK : FAIL} ${githubLabel(github)}`,
    );
  }

  console.log(
    `reportTool       ${report?.status === "success" ? OK : FAIL} ${reportLabel(report, summary)}`,
  );

  if (summary.message) {
    console.log(`\n${summary.message}`);
  }

  if (summary.reportExcerpt) {
    console.log(`\nReport excerpt:\n${summary.reportExcerpt}`);
  }

  console.log(`\nCost: $${summary.totalCostUsd.toFixed(4)}${costDetail(summary)}`);

  if (summary.runId) {
    console.log(`Run state saved: ./runs/demo/${summary.runId}.json`);
  }
}

export function printComparison(a: AgentSummary, b: AgentSummary) {
  printSection("Side by side");

  console.log(`
┌────────────────────────────┬────────────────────────────┐
│ Agent A (no agentsist)     │ Agent B (with agentsist)   │
├────────────────────────────┼────────────────────────────┤
│ GitHub fails silently      │ GitHub fails → 3 retries   │
│ Agent keeps going          │ Run halted (critical)      │
│ Report with fake GitHub    │ No report written          │
│ $${a.totalCostUsd.toFixed(4).padEnd(26)}│ $${b.totalCostUsd.toFixed(4).padEnd(26)}│
│ No tool visibility         │ Full event + cost breakdown│
└────────────────────────────┴────────────────────────────┘
`);
}

function searchLabel(record?: ToolRunRecord) {
  if (record?.status === "success") return "found companies";
  return record?.error ?? "not called";
}

function githubLabel(record?: ToolRunRecord) {
  if (record?.status === "success") return "fetched repos";
  if (record?.status === "failure") return "failed silently";
  return "not called";
}

function reportLabel(record?: ToolRunRecord, summary?: AgentSummary) {
  if (record?.status === "success") return "wrote report";
  if (summary?.status === "interrupted" || summary?.status === "error") {
    return "not written (run stopped)";
  }
  return "not called";
}

function costDetail(summary: AgentSummary) {
  if (!summary.costByTool || Object.keys(summary.costByTool).length === 0) {
    return ", no visibility";
  }

  const parts = Object.entries(summary.costByTool)
    .filter(([, cost]) => cost > 0)
    .map(([tool, cost]) => `${tool}: $${cost.toFixed(4)}`);

  return parts.length > 0 ? `, breakdown: ${parts.join(", ")}` : ", full breakdown by tool";
}

export function collectGithubRetries(events: RuntimeEvent[]) {
  return events.filter(
    (e) => e.type === "tool:retry" && e.tool === "githubTool",
  ).length;
}
