import { groq } from "@ai-sdk/groq";

export const DEFAULT_MODEL_ID = "meta-llama/llama-4-scout-17b-16e-instruct";

export const SYSTEM_PROMPT = `You are a research agent.
1. Use webSearchTool to find information and identify the GitHub username.
2. Use githubTool with that username.
3. Use reportTool to write a markdown report file.
4. Briefly confirm what you wrote.`;

export const model = resolveModel(DEFAULT_MODEL_ID);

export function resolveModel(modelId: string) {
  return groq(modelId);
}
