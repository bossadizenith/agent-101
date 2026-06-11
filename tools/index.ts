import {
  withToolCritical,
  withToolRetry,
  withToolStateCapture,
} from "../lib/middleware";
import type { RunState } from "../types";
import { githubTool as baseGithubTool } from "./github";
import { reportTool as baseReportTool } from "./report";
import { webSearchTool as baseSearchTool } from "./search";

export function createTools(state: RunState) {
  return {
    searchTool: withToolStateCapture("searchTool", baseSearchTool, state),
    githubTool: withToolStateCapture(
      "githubTool",
      withToolCritical(
        withToolRetry(baseGithubTool, {
          maxRetries: 3,
          delayMs: 300,
        }),
      ),
      state,
    ),
    reportTool: withToolStateCapture(
      "reportTool",
      withToolCritical(
        withToolRetry(baseReportTool, {
          maxRetries: 3,
          delayMs: 300,
        }),
      ),
      state,
    ),
  };
}
