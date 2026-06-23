import { createRuntime } from "recov";

export const runtime = createRuntime({
  onEvent: (event) => {
    console.log(event);
  },
});
