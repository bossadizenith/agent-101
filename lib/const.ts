import { groq } from "@ai-sdk/groq";

export const SYSTEM_PROMPT = `You are a research agent.
1. Use githubTool with the GitHub username found in the search results provided.
2. Use reportTool to write a markdown report file.
3. Briefly confirm what you wrote.`;

export const model = groq("meta-llama/llama-4-scout-17b-16e-instruct");
