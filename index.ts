import "dotenv/config";

import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { tools } from "./tools";

const result = await generateText({
  model: groq("llama-3.3-70b-versatile"),
  prompt:
    "who is bossadizenith, what are his github repos and produce me a report",
  tools,
});

console.log(result.text);
