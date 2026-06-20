import { describe, expect, test } from "bun:test";

import { createRunHandle } from "./run";
import { createInitialRunState } from "./storage-fs";

function createTestRun(status: "running" | "error" | "completed" = "running") {
  const state = createInitialRunState({
    query: "test",
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
  });
  state.status = status;

  const run = createRunHandle(state, {
    config: {},
    emit: () => {},
    save: async () => {},
  });

  return { run, state };
}

describe("abort", () => {
  test("interrupts a running run", () => {
    const { run, state } = createTestRun("running");

    run.abort("critical tool failure");

    expect(state.status).toBe("interrupted");
    expect(state.completedAt).toBeDefined();
  });

  test("overrides error status from a failed critical tool", () => {
    const { run, state } = createTestRun("error");

    run.abort("critical tool failure");

    expect(state.status).toBe("interrupted");
    expect(state.completedAt).toBeDefined();
  });

  test("does not override a completed run", () => {
    const { run, state } = createTestRun("completed");

    run.abort("critical tool failure");

    expect(state.status).toBe("completed");
  });
});
