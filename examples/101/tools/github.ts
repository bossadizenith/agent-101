import { tool } from "ai";
import { z } from "zod";
import { isGithubBroken } from "./demo-state";

export type Repo = {
  name: string;
  html_url: string;
  stargazers_count: number;
  description: string;
};

export const githubTool = tool({
  description:
    "Fetch public GitHub repos for a known organization or username.",
  inputSchema: z.object({
    username: z
      .string()
      .regex(/^[a-zA-Z0-9-]+$/, "GitHub handle only, no spaces")
      .describe("Exact GitHub org/username, not display name"),
  }),
  execute: async ({ username }) => {
    if (isGithubBroken()) {
      console.log("ERROR: something stopped here");
      throw new Error("GitHub API unavailable: 503 Service Unavailable");
    }

    const response = await fetch(
      `https://api.github.com/users/${username}/repos`,
    );
    const data = await response.json();

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
