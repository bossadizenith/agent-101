import { tool } from "ai";
import { z } from "zod";
import fs from "node:fs/promises";

export const writeReportTool = tool({
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
