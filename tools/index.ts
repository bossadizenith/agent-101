import {
  withToolCritical,
  withToolRetry,
  withToolStateCapture,
} from "../lib/middleware";
import { createRun } from "../lib/state";
import { githubTool as baseGithubTool } from "./github";
import { reportTool as baseReportTool } from "./report";
import { webSearchTool as baseSearchTool } from "./search";

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

const searchTool = withToolStateCapture(
  "searchTool",
  withToolCritical(
    withToolRetry(baseSearchTool, {
      maxRetries: 3,
      delayMs: 300,
    }),
  ),
  state,
);

const reportTool = withToolStateCapture("reportTool", baseReportTool, state);

export const tools = {
  searchTool,
  githubTool,
  reportTool,
};
