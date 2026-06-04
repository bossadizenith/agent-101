import { tool } from "ai";
import { z } from "zod";
import type { Repo } from "../types";

export const githubTool = tool({
  description:
    "Fetch public GitHub repos for a known username. Call after webSearchTool has confirmed the username.",
  inputSchema: z.object({
    username: z.string().describe("The github username of the user"),
  }),
  execute: async ({ username }) => {
    const response = await fetch(
      `https://api.github.com/users/${username}/repos`,
    );
    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Invalid response from GitHub API");
    }

    return data.map((repo: Repo) => ({
      name: repo.name,
      url: repo.html_url,
      stars: repo.stargazers_count,
    }));
  },
});
