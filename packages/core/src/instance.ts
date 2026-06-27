import { createRuntime } from "./index";

export const runtime = createRuntime({
  onEvent: (event) => {
    if (event.type === "tool:failure") {
      console.error(event.error);
    }
  },
});
