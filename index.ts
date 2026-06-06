import "dotenv/config";

import { groq } from "@ai-sdk/groq";
import { isLoopFinished, streamText } from "ai";
import { tools } from "./tools";
import { logToolCallStart, logToolCallFinish } from "./lib/logger";

const main = () =>
  streamText({
    model: groq("llama-3.3-70b-versatile"),
    prompt:
      "Search for the top AI agent frameworks in 2025, then look at the public GitHub repos of bossadi zenith to see if they've worked with any of them, then write a full report to output.md",
    tools,
    stopWhen: isLoopFinished(),
    experimental_onToolCallStart: logToolCallStart,
    experimental_onToolCallFinish: logToolCallFinish,
  });

main();
