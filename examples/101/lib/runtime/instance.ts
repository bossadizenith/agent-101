import { createRuntime } from "agentsist";

export const runtime = createRuntime({
  onEvent: (event) => {
    console.log(event);
  },
});
