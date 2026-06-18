import { createRuntime } from "./index";

export const runtime = createRuntime({
  onEvent: (event) => {
    console.log(event);
  },
});
