import { config } from "dotenv";
config();

import { stdin as input, stdout as output } from "node:process";
import * as readline from "node:readline/promises";
import fs from "node:fs/promises";

import { google } from "@ai-sdk/google";
import { isLoopFinished, streamText, tool } from "ai";
import { z } from "zod";
import { tavily } from "@tavily/core";
import type { Repo } from "./types";

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

const SYSTEM_PROMPT = `You are a research agent. For identity + GitHub + report requests:
1. Use webSearchTool to identify the person and their GitHub username.
2. Use githubTool with that exact GitHub username (not display name).
3. Use summary to write a markdown report file.
4. Then briefly confirm what you wrote.`;

const tvly = tavily({
  apiKey: TAVILY_API_KEY,
});

const main = async () => {
  const rl = readline.createInterface({ input, output });
  const prompt = await rl.question("What do you want to search for?: ");

  const result = streamText({
    model: google("gemini-2.0-flash"),
    system: SYSTEM_PROMPT,
    prompt,
    tools: { githubTool, webSearchTool, summary },
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

const webSearchTool = tool({
  description:
    "Search the web to identify a person and find their GitHub username. Use before githubTool when the username is unknown.",
  inputSchema: z.object({
    query: z.string().describe("The query to search the web for"),
  }),
  execute: async ({ query }) => {
    return await tvly.search(query);
  },
});

const summary = tool({
  description:
    "Write the final markdown report to disk. Call last, after web search and GitHub data are collected.",
  inputSchema: z.object({
    path: z.string().describe("The path to the file to write"),
    content: z.string().describe("The content to write to the file"),
  }),
  execute: async ({ path, content }) => {
    await fs.writeFile(path, content);
    return {
      path,
      summary: content,
    };
  },
});

main();
