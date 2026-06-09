import "dotenv/config";

import { groq } from "@ai-sdk/groq";
import { isLoopFinished, streamText } from "ai";
import { tools } from "./tools";
import { logToolCallStart, logToolCallFinish } from "./lib/logger";
import { SYSTEM_PROMPT } from "./lib/const";
import { searchWithEvaluation } from "./tools/search";
import { model } from "./lib/const";

export const query =
  "who's bossadi zenith and gimme a report of what you found";

const main = async () => {
  const validatedResults = await searchWithEvaluation(query);

  const result = streamText({
    model,
    system: SYSTEM_PROMPT,
    tools,
    messages: [
      {
        role: "user" as const,
        content: `${query}
      Here are validated search results: ${JSON.stringify(validatedResults)}.
      Now find their GitHub repos and write a report.`,
      },
    ],
    stopWhen: isLoopFinished(),
  });

  for await (const text of result.textStream) {
    console.log(text);
  }
};

main();
