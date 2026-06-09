import { withToolLogging } from "../lib/middleware";
import { githubTool as baseGithubTool } from "./github";
import { reportTool as baseReportTool } from "./report";

export const tools = {
  githubTool: withToolLogging("githubTool", baseGithubTool),
  reportTool: withToolLogging("reportTool", baseReportTool),
};
