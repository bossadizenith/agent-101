import { groq } from "@ai-sdk/groq";

export const DEFAULT_MODEL_ID = "meta-llama/llama-4-scout-17b-16e-instruct";

export const evaluationModel = groq(DEFAULT_MODEL_ID);

export function resolveModel(modelId: string) {
  return groq(modelId);
}

export const SYSTEM_PROMPT = `You are a research assistant.

When asked about a person:
1. Use webSearchTool first if you need to find their GitHub username
2. Use githubTool with the exact GitHub handle (no spaces)
3. Use reportTool last to write a markdown report to disk

Never skip tools or invent data. If a tool fails, say so clearly.`;
