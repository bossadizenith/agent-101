import {
  withToolCritical,
  withToolLogging,
  withToolRetry,
  withToolStateCapture,
} from "../lib/middleware";
import { githubTool as baseGithubTool } from "./github";
import { reportTool as baseReportTool } from "./report";
import { createRun } from "../lib/state";

const state = createRun();

const githubTool = withToolStateCapture(
  "githubTool",
  withToolCritical(
    withToolRetry(baseGithubTool, {
      maxRetries: 3,
      delayMs: 300,
    }),
  ),
  state,
);

export const tools = {
  githubTool,
  reportTool: withToolStateCapture("reportTool", baseReportTool, state),
};
