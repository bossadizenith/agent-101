import { config } from "dotenv";
config();

import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

const result = streamText({
  model: openai("gpt-4.1-mini"),
  prompt: "Invent a new holiday and describe its traditions.",
});

for await (const textPart of result.textStream) {
  console.log(textPart);
}
