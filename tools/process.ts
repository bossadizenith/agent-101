import { tool } from "ai";
import { z } from "zod";
import { generateText, generateObject } from "ai";
import { search } from "./search";
import type { SearchResult } from "../types";
import { groq } from "@ai-sdk/groq";

const model = groq("llama-3.3-70b-versatile");

export const searchTool = async (query: string) => {
  const pendingSearchResults: SearchResult[] = [];
  const finalSearchResults: SearchResult[] = [];
  await generateText({
    model,
    prompt: `Search the web for information about the following query: ${query}`,
    system:
      "You are a researcher. For each query, search the web and then evaluate if the results are relevant and will help answer the following query",
    tools: {
      searchWeb: tool({
        description: "Search the web for information about a given query",
        inputSchema: z.object({
          query: z.string().min(1),
        }),
        execute: async ({ query }) => {
          const results = await search(query);
          pendingSearchResults.push(
            ...results.map((result) => ({
              title: result.title,
              url: result.url,
              content: result.content,
            })),
          );
          return results;
        },
      }),
      evaluate: tool({
        description: "Evaluate the search results",
        inputSchema: z.object({}),
        execute: async () => {
          const pendingResult = pendingSearchResults.pop()!;
          const { object: evaluation } = await generateObject({
            model,
            prompt: `Evaluate whether the search results are relevant and will help answer the following query: ${query}. If the page already exists in the existing results, mark it as irrelevant.

            <search_results>
            ${JSON.stringify(pendingResult)}
            </search_results>
            `,
            output: "enum",
            enum: ["relevant", "irrelevant"],
          });
          if (evaluation === "relevant") {
            finalSearchResults.push(pendingResult);
          }
          console.log("Found:", pendingResult.url);
          console.log("Evaluation completed:", evaluation);
          return evaluation === "irrelevant"
            ? "Search results are irrelevant. Please search again with a more specific query."
            : "Search results are relevant. End research for this query.";
        },
      }),
    },
  });
  return finalSearchResults;
};
