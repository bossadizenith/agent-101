import { config } from "dotenv";
config();

import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { stepCountIs, streamText, tool } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const main = async () => {
  const rl = readline.createInterface({ input, output });
  const prompt = await rl.question(
    "Who's public repositories do you want to see?: ",
  );

  const result = streamText({
    model: google("gemini-3.5-flash"),
    prompt: `List the public repositories of ${prompt}`,
    tools: { githubTool },
    stopWhen: stepCountIs(5),
    experimental_onToolCallStart: ({ toolCall }) => {
      console.log(`Calling tool: ${toolCall.toolName}`);
    },
  });

  for await (const textPart of result.textStream) {
    console.log(textPart);
  }

  rl.close();
};

const githubTool = tool({
  description: "A tool for users public repositories",
  inputSchema: z.object({
    username: z.string().describe("The github username of the user"),
  }),
  execute: async ({ username }) => {
    const response = await fetch(
      `https://api.github.com/users/${username}/repos`,
    );
    const data = await response.json();
    return data;
  },
});

main();
