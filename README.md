# agentruntime

A production runtime engine for AI agents.

## The Problem

AI agents work in demos. They break in production.

Tools fail silently. Agents hallucinate missing data.
Runs die with no way to recover. Costs spiral with no visibility.

**agentruntime** is the reliability layer between your agents and production.

## Install

```bash
npm i agentruntime
```

## Quickstart

```ts
import { createRuntime } from "agentruntime";
import { streamText } from "ai";
import { groq } from "@ai-sdk/groq";

const runtime = createRuntime({
  onToolComplete: (event) => console.log(event),
  onRunComplete: (summary) => console.log(summary),
});

const tools = runtime.tools({
  webSearchTool: { tool: baseSearchTool },
  githubTool: { tool: baseGithubTool, retry: 3, critical: true },
  reportTool: { tool: baseReportTool, retry: 3, critical: true },
});

const result = await streamText({
  model: groq("llama-3.3-70b-versatile"),
  tools,
  prompt: "Research Bossadi Zenith and write a report",
});
```

## What It Does

| Feature           | What it means                                                  |
| ----------------- | -------------------------------------------------------------- |
| `retry`           | Retries failed tools with exponential backoff                  |
| `critical`        | Stops the entire run if this tool exhausts retries             |
| Cost tracking     | Tracks token usage and dollar cost per tool per run            |
| State persistence | Saves every step to disk as the run progresses                 |
| Run replay        | Resume a failed run from the failure point                     |
| Logging           | Full visibility into every tool call — input, output, duration |

## API

### `createRuntime(config)`

```ts
const runtime = createRuntime({
  onToolComplete?: (event: ToolCompleteEvent) => void
  onToolFailure?:  (event: ToolFailureEvent) => void
  onRunComplete?:  (summary: RunSummary) => void
  storage?: {
    save: (state: RunState) => Promise<void>
    load: (runId: string) => Promise<RunState>
  }
})
```

### `runtime.tools(config)`

```ts
const tools = runtime.tools({
  [toolName]: {
    tool:      Tool       // your AI SDK tool definition
    retry?:    number     // number of retries (default: 0)
    critical?: boolean    // stop run if tool fails (default: false)
    timeout?:  number     // ms before tool is considered failed
  }
})
```

Returns a tools object compatible with `streamText`, `generateText`,
and `generateObject` from the Vercel AI SDK.

## Run State

Every run is saved to `./runs/<runId>.json`

```json
{
  "runId": "run_1781239262611",
  "startedAt": "2026-06-10T02:00:00Z",
  "status": "completed",
  "totalTokens": 8664,
  "totalCostUsd": 0.00164576,
  "costByTool": {
    "webSearchTool": 0.00012212,
    "githubTool": 0.00035694,
    "reportTool": 0.00056552
  },
  "steps": [
    {
      "tool": "githubTool",
      "input": { "username": "bossadizenith" },
      "success": true,
      "durationMs": 1255
    }
  ]
}
```

## Replay a Failed Run

```ts
import { replayRun } from "agentruntime";

await replayRun("run_1781239262611");
```

Loads the saved state, finds the first failed step,
and resumes from there — skipping steps that already succeeded.

## Coming Soon

- Memory between runs
- Human-in-the-loop approvals
- Long-running task support
- Dashboard UI

## Built By

[Bossadi Zenith](https://bossadizenith.me) | [X](https://bossadizenith.me/x)
Questions: [hello@bossadizenith.me](mailto:hello@bossadizenith.me)
