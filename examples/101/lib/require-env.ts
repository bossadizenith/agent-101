export function requireDemoEnv() {
  const missing: string[] = [];

  if (!process.env.GROQ_API_KEY) missing.push("GROQ_API_KEY");
  if (!process.env.TAVILY_API_KEY) missing.push("TAVILY_API_KEY");

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }
}
