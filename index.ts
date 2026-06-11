import "dotenv/config";

import { isLoopFinished, streamText } from "ai";
import { model, SYSTEM_PROMPT } from "./lib/const";
import { tools } from "./tools";
import { searchWithEvaluation } from "./tools/search";

export const query =
  "who's bossadi zenith, github repos and gimme a report of what you found";

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
