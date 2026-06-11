import "dotenv/config";

import { isLoopFinished, streamText } from "ai";
import { model, SYSTEM_PROMPT } from "./lib/const";
import { createTools } from "./tools";
import { createRun } from "./lib/state";

export const query =
  "who's bossadi zenith, github repos and gimme a report of what you found";

const main = async () => {
  const state = createRun({ model, query });
  const result = streamText({
    model,
    system: SYSTEM_PROMPT,
    tools: createTools(state),
    messages: [{ role: "user" as const, content: query }],
    stopWhen: isLoopFinished(),
  });

  for await (const text of result.textStream) {
    console.log(text);
  }
};

main();
