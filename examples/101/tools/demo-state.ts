/** Deliberately break githubTool after webSearchTool succeeds. */
let githubBroken = false;

export function armGithubFailure() {
  githubBroken = true;
}

export function disarmGithubFailure() {
  githubBroken = false;
}

export function isGithubBroken() {
  return githubBroken;
}
