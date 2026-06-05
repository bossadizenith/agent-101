import "dotenv/config";

import { langchainAi } from "./ai/langchain-ai";
import { search } from "./tools/search";
import { vercelAi } from "./ai/vercel-ai";

search("John Doe");
