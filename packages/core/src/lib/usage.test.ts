import { describe, expect, test } from "bun:test";

import { createInitialRunState } from "../storage-fs";
import { applyStepUsage, GENERATION_COST_KEY } from "./usage";

describe("applyStepUsage", () => {
  test("tracks tool-call step cost split across tools", () => {
    const state = createInitialRunState({
      query: "test",
      model: "llama-3.3-70b-versatile",
    });

    const cost = applyStepUsage(
      state,
      state.model,
      { inputTokens: 1000, outputTokens: 500, totalTokens: 1500 },
      [{ toolName: "githubTool" }, { toolName: "webSearchTool" }],
    );

    expect(cost.stepCost).toBeGreaterThan(0);
    expect(cost.totalCostUsd).toBe(cost.stepCost);
    expect(cost.totalTokens).toBe(1500);
    expect(state.costByTool.githubTool).toBe(cost.stepCost / 2);
    expect(state.costByTool.webSearchTool).toBe(cost.stepCost / 2);
  });

  test("tracks generation-only steps under GENERATION_COST_KEY", () => {
    const state = createInitialRunState({
      query: "test",
      model: "llama-3.3-70b-versatile",
    });

    const cost = applyStepUsage(
      state,
      state.model,
      { inputTokens: 2000, outputTokens: 1000, totalTokens: 3000 },
      [],
    );

    expect(cost.stepCost).toBeGreaterThan(0);
    expect(state.costByTool[GENERATION_COST_KEY]).toBe(cost.stepCost);
  });

  test("accumulates cost across multiple steps", () => {
    const state = createInitialRunState({
      query: "test",
      model: "llama-3.3-70b-versatile",
    });

    const first = applyStepUsage(
      state,
      state.model,
      { inputTokens: 1000, outputTokens: 0, totalTokens: 1000 },
      [{ toolName: "githubTool" }],
    );
    const second = applyStepUsage(
      state,
      state.model,
      { inputTokens: 0, outputTokens: 1000, totalTokens: 1000 },
      [],
    );

    expect(second.totalCostUsd).toBe(first.stepCost + second.stepCost);
    expect(second.totalTokens).toBe(2000);
  });

  test("returns zero cost for unknown models", () => {
    const state = createInitialRunState({
      query: "test",
      model: "unknown-model",
    });

    const cost = applyStepUsage(
      state,
      state.model,
      { inputTokens: 1000, outputTokens: 1000, totalTokens: 2000 },
      [{ toolName: "githubTool" }],
    );

    expect(cost.stepCost).toBe(0);
    expect(cost.totalCostUsd).toBe(0);
    expect(state.costByTool.githubTool).toBe(0);
  });
});
