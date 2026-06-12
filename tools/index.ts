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
    webSearchTool: withToolStateCapture("webSearchTool", baseSearchTool, state),
    githubTool: withToolCritical(
      withToolStateCapture(
        "githubTool",
        withToolRetry(baseGithubTool, {
          maxRetries: 3,
          delayMs: 300,
        }),
        state,
      ),
    ),
    reportTool: withToolCritical(
      withToolStateCapture(
        "reportTool",
        withToolRetry(baseReportTool, {
          maxRetries: 3,
          delayMs: 300,
        }),
        state,
      ),
    ),
  };
}
