import { withToolLogging, withToolRetry } from "../lib/middleware";
import { githubTool as baseGithubTool } from "./github";
import { reportTool as baseReportTool } from "./report";

export const tools = {
  githubTool: withToolLogging(
    "githubTool",
    withToolRetry(baseGithubTool, { maxRetries: 3, delayMs: 300 }),
  ),
  reportTool: withToolLogging("reportTool", baseReportTool),
};
