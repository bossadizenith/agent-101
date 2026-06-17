import { runtime } from "../../../packages/core/lib/runtime/instance";
import { githubTool as baseGithubTool } from "./github";
import { reportTool as baseReportTool } from "./report";
import { webSearchTool as baseSearchTool } from "./search";

export const appTools = runtime.tools({
  webSearchTool: { tool: baseSearchTool },
  githubTool: { tool: baseGithubTool, retry: 3, critical: true },
  reportTool: { tool: baseReportTool, retry: 3, critical: true },
});

export type AppTools = {
  [K in keyof typeof appTools]: (typeof appTools)[K]["tool"];
};
