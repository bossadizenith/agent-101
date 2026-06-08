import { tavily } from "@tavily/core";
import { generateObject, tool } from "ai";
import { z } from "zod";
import { model } from "../lib/const";
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

export const evaluateSearchTool = async ({
  query,
  searchResults,
}: {
  query: string;
  searchResults: SearchResult[];
}) => {
  const { object: evaluation } = await generateObject({
    model,
    prompt: `Evaluate whether the search results are relevant and will help answer the following query: ${query}. If the page already exists in the existing results, mark it as irrelevant.

      <search_results>
      ${JSON.stringify(searchResults)}
      </search_results>
      `,
    output: "enum",
    enum: ["relevant", "irrelevant"],
  });
  return evaluation;
};

export const search = async (query: string) => {
  const result = await tvly.search(query, { searchDepth: "advanced" });
  return result.results.map((result) => ({
    title: result.title,
    url: result.url,
    content: result.content,
  })) as SearchResult[];
};

export async function searchWithEvaluation(
  query: string,
  maxRetries = 3,
): Promise<SearchResult[]> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const results = await search(query);
    const evaluation = await evaluateSearchTool({
      query,
      searchResults: results,
    });
    if (evaluation === "relevant") {
      console.log(`Search passed evaluation on attempt ${attempt}`);
      return results;
    }
    console.log(`Attempt ${attempt} irrelevant, retrying...`);
  }
  throw new Error(`Search failed evaluation after ${maxRetries} attempts`);
}
