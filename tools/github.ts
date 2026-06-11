import { tool } from "ai";
import { z } from "zod";
import type { Repo } from "../types";

export const githubTool = tool({
  description: "Fetch public GitHub repos for a known username.",
  inputSchema: z.object({
    username: z
      .string()
      .regex(/^[a-zA-Z0-9-]+$/, "GitHub handle only, no spaces")
      .describe("Exact GitHub username/handle, not display name"),
  }),
  execute: async ({ username }) => {
    const response = await fetch(
      `https://api.github.com/users/${username}/repos`,
    );
    const data = await response.json();

    // throw new Error("test error");

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    if (!Array.isArray(data)) {
      throw new Error("Invalid response from GitHub API");
    }

    return data.map((repo: Repo) => ({
      name: repo.name,
      url: repo.html_url,
      stars: repo.stargazers_count,
      description: repo.description,
    }));
  },
});
