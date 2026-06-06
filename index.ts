import "dotenv/config";

import { groq } from "@ai-sdk/groq";
import { isLoopFinished, streamText } from "ai";
import { tools } from "./tools";

const main = async () => {
  const result = streamText({
    model: groq("llama-3.3-70b-versatile"),
    prompt:
      "who is bossadizenith, what are his github repos and produce me a report",
    tools,
    stopWhen: isLoopFinished(),
  });

  for await (const text of result.textStream) {
    console.log(text);
  }
};

main();
