import { groq } from "@ai-sdk/groq";

export const DEFAULT_MODEL_ID = "meta-llama/llama-4-scout-17b-16e-instruct";

export const DEMO_TASK =
  "Search for the top 5 AI companies in 2026, fetch their GitHub repos, and write a report.";

export const AGENT_A_REPORT_PATH = "reports/agent-a-report.md";
export const AGENT_B_REPORT_PATH = "reports/agent-b-report.md";

export function resolveModel(modelId: string) {
  return groq(modelId);
}

export const SYSTEM_PROMPT = `You are a research assistant.

When asked to research AI companies:
1. Use webSearchTool first to find the top AI companies and their GitHub organization names
2. Use githubTool for each company's GitHub org to fetch their public repos
3. Use reportTool last to write a markdown report to disk

Include company names, GitHub org handles, and repo details in the report.
Never skip tools or invent data. If a tool fails, say so clearly.`;
