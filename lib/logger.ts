import type { OnToolCallFinishEvent, OnToolCallStartEvent } from "ai";
import type { AppTools, SerializedError } from "../types";

export function logToolCallStart(event: OnToolCallStartEvent<AppTools>) {
  const { toolCall, stepNumber } = event;
  console.log({
    phase: "start",
    stepNumber,
    tool: toolCall.toolName,
    input: toolCall.input,
    toolCallId: toolCall.toolCallId,
  });
}

export function logToolCallFinish(event: OnToolCallFinishEvent<AppTools>) {
  console.log({
    phase: "finish",
    tool: event.toolCall.toolName,
    input: event.toolCall.input,
    success: event.success,
    durationMs: event.durationMs,
    // output: event.success ? event.output : undefined,
    error: event.success ? undefined : serializeError(event.error),
  });
}

export function serializeError(error: unknown): SerializedError {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  return {
    name: "UnknownError",
    message: "Unknown error",
    stack: "Unknown stack",
  };
}
