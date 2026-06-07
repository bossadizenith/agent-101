import { groq } from "@ai-sdk/groq";
import { tavily } from "@tavily/core";
import { generateObject, tool } from "ai";
import { z } from "zod";
import type { SearchResult } from "../types";

const tvly = tavily({
  apiKey: process.env.TAVILY_API_KEY,
});

export const webSearchTool = tool({
  description:
    "Search the web to identify a person and find their GitHub username. Use before githubTool when the username is unknown.",
  inputSchema: z.object({
    query: z.string().describe("The query to search the web for"),
  }),
  execute: async ({ query }) => await search(query),
});

export const evaluateSearchTool = tool({
  description: "Evaluate the search results",
  inputSchema: z.object({
    query: z.string().describe("The same query used in webSearchTool"),
    searchResults: z
      .array(
        z.object({
          title: z.string(),
          url: z.string(),
          content: z.string().describe("The content of the search result"),
        }),
      )
      .describe("The search results to evaluate"),
  }),
  execute: async ({ query, searchResults }) => {
    const { object: evaluation } = await generateObject({
      model: groq("llama-3.3-70b-versatile"),
      prompt: `Evaluate whether the search results are relevant and will help answer the following query: ${query}. If the page already exists in the existing results, mark it as irrelevant.

      <search_results>
      ${JSON.stringify(searchResults)}
      </search_results>
      `,
      output: "enum",
      enum: ["relevant", "irrelevant"],
    });
    return evaluation;
  },
});

export const search = async (query: string) => {
  const result = await tvly.search(query, { searchDepth: "advanced" });
  return result.results.map((result) => ({
    title: result.title,
    url: result.url,
    content: result.content,
  })) as SearchResult[];
};
