# recov

A reliability runtime for AI agents built on the [Vercel AI SDK](https://sdk.vercel.ai/).

## The Problem

AI agents work in demos. They break in production.

Tools fail silently. Agents hallucinate missing data.
Runs die with no way to recover. Costs spiral with no visibility.

**recov** is the reliability layer between your agents and production.

## Install

```bash
npm i recov
```

Peer dependency: `ai` (Vercel AI SDK v6+).

## Quickstart

recov wraps your existing AI SDK tools with retry, logging, state capture, and critical-failure handling. You still own the agent loop (`streamText`, `generateText`, etc.) — the runtime wires in reliability around it.

```ts
import { createRuntime } from "recov";
import { isLoopFinished, streamText } from "ai";
import { groq } from "@ai-sdk/groq";

const runtime = createRuntime({
  onEvent: (event) => console.log(event),
});

// 1. Register tool policies
const appTools = runtime.tools({
  webSearchTool: { tool: baseSearchTool },
  githubTool: { tool: baseGithubTool, retry: 3, critical: true },
  reportTool: { tool: baseReportTool, retry: 3, critical: true },
});

// 2. Start a tracked run
const run = await runtime.createRun({
  query: "Research Bossadi Zenith and write a report",
  model: "llama-3.3-70b-versatile",
});

// 3. Run your agent — bind tools and hooks from the run handle
const result = streamText({
  model: groq(run.model),
  tools: run.bindTools(appTools),
  messages: [{ role: "user", content: run.query }],
  stopWhen: isLoopFinished(),
  ...run.hooks({
    onStepFinish: ({ cost, finishReason, toolCalls, usage }) => {
      console.log({ finishReason, toolCalls, usage, cost });
    },
  }),
});

for await (const text of result.textStream) {
  process.stdout.write(text);
}
```

## What It Does

| Feature           | What it means                                                    |
| ----------------- | ---------------------------------------------------------------- |
| `retry`           | Retries failed tools with exponential backoff                    |
| `critical`        | Aborts the run if the tool fails after retries are exhausted     |
| Cost tracking     | Built into `run.hooks()` — tracks every step, saves to run state |
| State persistence | Saves every tool step to disk as the run progresses              |
| Run replay        | Load a saved run and re-execute your agent function              |
| Logging           | Structured events for every tool call — input, output, duration  |

## API

### `createRuntime(config?)`

```ts
const runtime = createRuntime({
  onEvent?: (event: RuntimeEvent) => void
  storage?: Storage  // defaults to fileStorage() → ./runs/<runId>.json
})
```

#### `runtime.createRun(options)`

Starts a new run and returns a `RunHandle`.

```ts
const run = await runtime.createRun({
  query: string
  model: string
})
```

#### `runtime.tools(registry)`

Registers a tool policy registry. Returns the registry unchanged — wrapping happens in `run.bindTools()`.

```ts
const appTools = runtime.tools({
  [toolName]: {
    tool:      Tool              // your AI SDK tool definition
    retry?:    number | { maxRetries?: number; delayMs?: number }
    critical?: boolean           // abort run on failure (default: false)
  }
})
```

#### `run.bindTools(registry)`

Returns AI SDK-compatible tools wrapped with runtime middleware (retry, events, state capture, critical abort). Pass this to `streamText`, `generateText`, or `generateObject`.

#### `run.hooks(options?)`

Returns lifecycle hooks to spread into your AI SDK call. Tracks token usage and cost on every step automatically.

```ts
...run.hooks({
  onStepFinish?: (event: RunStepFinishEvent) => void | Promise<void>
})
// returns { onFinish, onStepFinish }
```

- `onStepFinish` (returned) — wired to AI SDK; updates `run.state`, saves, then calls your optional observer
- `onFinish` (returned) — marks run completed, saves state, emits `run:complete`

Your optional `onStepFinish` receives the full AI SDK step event plus a `cost` snapshot:

```ts
{
  // ...all OnStepFinishEvent fields (finishReason, toolCalls, usage, text, etc.)
  cost: {
    stepCost: number;
    totalCostUsd: number;
    totalTokens: number;
    costByTool: Record<string, number>; // tool steps split evenly; text-only steps use "__generation__"
  }
}
```

#### `run.save()` / `run.abort(reason)`

Manually persist state or interrupt a running run.

#### `runtime.loadRun(runId)` / `runtime.replayRun(runId, execute)`

Load a previous run or resume one by re-running your agent function:

```ts
await runtime.replayRun("run_1781239262611", runAgent);
```

`resumeRun(run, execute)` is also exported if you already have a `RunHandle`.

### Events

All runtime activity flows through a single `onEvent` callback:

| Event type      | When it fires                        |
| --------------- | ------------------------------------ |
| `tool:start`    | Before a tool executes               |
| `tool:complete` | After a successful tool call         |
| `tool:failure`  | When a tool throws                   |
| `tool:retry`    | On each retry attempt                |
| `run:complete`  | When the agent finishes (`onFinish`) |
| `run:abort`     | When a critical tool fails           |

### Utilities

```ts
import {
  calculateCost,
  applyStepUsage,
  GENERATION_COST_KEY,
  ModelPricing,
  fileStorage,
  RunNotFoundError,
} from "recov";
```

## Run State

Every run is saved to `./runs/<runId>.json` (configurable via `storage`).

```json
{
  "schemaVersion": 1,
  "runId": "run_1781239262611",
  "query": "Research Bossadi Zenith and write a report",
  "model": "llama-3.3-70b-versatile",
  "startDate": "2026-06-10T02:00:00.000Z",
  "completedAt": "2026-06-10T02:01:30.000Z",
  "status": "completed",
  "totalTokens": 8664,
  "totalCostUsd": 0.00164576,
  "costByTool": {
    "webSearchTool": 0.00012212,
    "githubTool": 0.00035694,
    "reportTool": 0.00056552
  },
  "messages": [],
  "steps": [
    {
      "toolCallId": "abc123",
      "tool": "githubTool",
      "input": { "username": "bossadizenith" },
      "output": [{ "name": "recov", "stars": 42 }],
      "success": true,
      "durationMs": 1255
    }
  ]
}
```

`status` is one of: `"running"` | `"completed"` | `"error"` | `"interrupted"`.

## Replay a Failed Run

```ts
const runtime = createRuntime({ onEvent: console.log });

// Your agent function — same one used for new runs
async function runAgent(run: RunHandle) {
  // streamText({ tools: run.bindTools(appTools), ...run.hooks(), ... })
}

await runtime.replayRun("run_1781239262611", runAgent);
```

Replay loads the saved state (including message transcript from successful steps), resets `error`/`interrupted` runs back to `running`, and calls your agent function again.

## Coming Soon

- Memory between runs
- Human-in-the-loop approvals
- Long-running task support
- Tool timeouts
- Dashboard UI

## Built By

[Bossadi Zenith](https://bossadizenith.me) | [X](https://bossadizenith.me/x)
Questions: [hello@bossadizenith.me](mailto:hello@bossadizenith.me)
