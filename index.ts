import "dotenv/config";

import { groq } from "@ai-sdk/groq";
import { isLoopFinished, streamText } from "ai";
import { tools } from "./tools";
import { logToolCallStart, logToolCallFinish } from "./lib/logger";
import { SYSTEM_PROMPT } from "./lib/const";

const model = groq("meta-llama/llama-4-scout-17b-16e-instruct");

export const query =
  "who's bossadi zenith and gimme a report of what you found";

const main = async () => {
  const result = streamText({
    model,
    system: SYSTEM_PROMPT,
    prompt: query,
    tools,
    stopWhen: isLoopFinished(),
    experimental_onToolCallStart: logToolCallStart,
    experimental_onToolCallFinish: logToolCallFinish,
  });

  for await (const text of result.textStream) {
    console.log(text);
  }
};

main();
