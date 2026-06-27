import { tool } from "ai";
import { z } from "zod";
import fs from "node:fs/promises";
import path from "node:path";

export const reportTool = tool({
  description:
    "Write the final markdown report to disk. Call last, after web search and GitHub data are collected.",
  inputSchema: z.object({
    path: z.string().describe("The path to the file to write"),
    content: z.string().describe("The content to write to the file"),
  }),
  execute: async ({ path: filePath, content }) => {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content);
    return {
      path: filePath,
      summary: content.slice(0, 200),
    };
  },
});
