import { createRuntime } from "recov";
import { githubTool as baseGithubTool } from "./github";
import { reportTool as baseReportTool } from "./report";
import { webSearchTool as baseSearchTool } from "./search";

const runtime = createRuntime();

export const appTools = runtime.tools({
  webSearchTool: { tool: baseSearchTool },
  githubTool: { tool: baseGithubTool, retry: 3, critical: true },
  reportTool: { tool: baseReportTool, retry: 3, critical: true },
});

export type AppTools = {
  [K in keyof typeof appTools]: (typeof appTools)[K]["tool"];
};
