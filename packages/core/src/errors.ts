import type { SerializedError } from "./lib/types";

export function serializeError(error: unknown): SerializedError {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }

  return {
    name: "UnknownError",
    message: String(error),
  };
}
