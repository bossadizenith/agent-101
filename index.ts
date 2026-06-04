import { config } from "dotenv";
config();

import { stdin as input, stdout as output } from "node:process";
import * as readline from "node:readline/promises";

import { google } from "@ai-sdk/google";
import { isLoopFinished, streamText, tool } from "ai";
import { z } from "zod";
import { tools } from "./tools";
import type { Repo } from "./types";

const SYSTEM_PROMPT = `You are a research agent. For identity + GitHub + report requests:
1. Use webSearchTool to identify the person and their GitHub username.
2. Use githubTool with that exact GitHub username (not display name).
3. Use summary to write a markdown report file.
4. Then briefly confirm what you wrote.`;

const main = async () => {
  const rl = readline.createInterface({ input, output });
  const prompt = await rl.question("What do you want to search for?: ");

  const result = streamText({
    model: google("gemini-2.0-flash"),
    system: SYSTEM_PROMPT,
    prompt,
    tools: tools,
    stopWhen: isLoopFinished(),
    onStepFinish: ({ usage, stepNumber, toolCalls }) => {
      console.log(`Step ${stepNumber} finished: ${usage.totalTokens}`);
    },
    experimental_onToolCallStart: ({ toolCall }) => {
      console.log(`Calling tool: ${toolCall.toolName}`);
    },
  });

  for await (const textPart of result.textStream) {
    console.log(textPart);
  }

  //   const steps = (await result.steps).flatMap((step) => step.toolCalls);
  //   console.log({ steps });

  rl.close();
};

const githubTool = tool({
  description:
    "Fetch public GitHub repos for a known username. Call after webSearchTool has confirmed the username.",
  inputSchema: z.object({
    username: z.string().describe("The github username of the user"),
  }),
  execute: async ({ username }) => {
    const response = await fetch(
      `https://api.github.com/users/${username}/repos`,
    );
    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Invalid response from GitHub API");
    }

    return data.map((repo: Repo) => ({
      name: repo.name,
      url: repo.html_url,
      stars: repo.stargazers_count,
    }));
  },
});

main();
