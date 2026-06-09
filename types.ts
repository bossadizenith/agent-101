import type { ToolExecuteFunction } from "ai";

export type Repo = {
  name: string;
  html_url: string;
  stargazers_count: number;
};

export type SearchResult = {
  title: string;
  url: string;
  content: string;
};

export type ToolMiddlewareFunction<INPUT, OUTPUT> = (
  next: ToolExecuteFunction<INPUT, OUTPUT>,
) => ToolExecuteFunction<INPUT, OUTPUT>;
