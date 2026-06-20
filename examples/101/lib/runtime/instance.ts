import { createRuntime } from "agentruntime";

export const runtime = createRuntime({
  onEvent: (event) => {
    console.log(event);
  },
});
