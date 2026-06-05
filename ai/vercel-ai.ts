import { config } from "dotenv";
config();

import { stdin as input, stdout as output } from "node:process";
import * as readline from "node:readline/promises";

import { google } from "@ai-sdk/google";
import { isLoopFinished, streamText } from "ai";
import { SYSTEM_PROMPT } from "../lib/const";
import { tools } from "../tools";

export const vercelAi = async () => {
  const rl = readline.createInterface({ input, output });
  const prompt = await rl.question("What do you want to search for?: ");

  const result = streamText({
    model: google("gemini-2.0-flash"),
    system: SYSTEM_PROMPT,
    prompt,
    tools,
    stopWhen: isLoopFinished(),
    // onStepFinish: ({ usage, stepNumber, toolCalls }) => {
    //   console.log(`Step ${stepNumber} finished: ${usage.totalTokens}`);
    // },
    experimental_onToolCallStart: ({ toolCall }) => {
      console.log(`Calling tool: ${toolCall.toolName}`);
    },
  });

  for await (const textPart of result.textStream) {
    console.log(textPart);
  }

  rl.close();
};
