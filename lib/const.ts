import { groq } from "@ai-sdk/groq";

export const SYSTEM_PROMPT = `You are a research agent.
1. Use webSearchTool to find information and identify the GitHub username.
2. Use githubTool with that username.
3. Use reportTool to write a markdown report file.
4. Briefly confirm what you wrote.`;

export const model = groq("meta-llama/llama-4-scout-17b-16e-instruct");
