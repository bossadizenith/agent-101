import { tool } from "ai";
import { z } from "zod";
import { tavily } from "@tavily/core";

const tvly = tavily({
  apiKey: process.env.TAVILY_API_KEY,
});

export const webSearchTool = tool({
  description:
    "Search the web to identify a person and find their GitHub username. Use before githubTool when the username is unknown.",
  inputSchema: z.object({
    query: z.string().describe("The query to search the web for"),
  }),
  execute: async ({ query }) => {
    return await tvly.search(query);
  },
});
