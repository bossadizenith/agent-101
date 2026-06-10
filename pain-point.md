some of the issues i face while working with these models as i'm learning through how to build agents.

- context passing from one tool to another is not that simple(especially if your tools are not in the same file)
- tools don't talk to each other directly, models do
- multi-step loops need right defaults and stream consumption
  Early on, repos didn’t show because streamText defaults to one step (stepCountIs(1)), so the model called GitHub but never got a follow-up turn to summarize.

- no built-in "why did it pick this tool?"

- Tool execution order is controlled via prompt engineering
  — fragile, breaks if prompt wording changes
  — no guarantee the model follows it
  — no error if it skips a step
  — not enforceable in code

- CRITICAL: Agent continued after tool failure and
  hallucinated the missing data in the final output
  — user received a confident report with fabricated content
  — no indication that githubTool had failed
  — no way to mark a tool as "critical — stop if this fails"
  — this is a production data integrity problem

- Retry alone is not enough — need to distinguish
  between "retry and continue" vs "retry and abort"
  No concept of tool criticality in current agent SDKs

- Tool failures return empty errors — impossible to debug
  SOLVED: withToolLogging + serializeError

- Agent passed malformed input to a tool with no validation
  (passed "bossadi zenith" instead of "bossadizenith")
  SOLVED: input sanitization in githubTool

- Evaluation logic implemented as a tool — model can skip it
  SOLVED: moved to middleware, runs before agent sees results

- Agent behavior is extremely prompt-sensitive
  — small wording changes produce completely different
  tool call sequences

- Tools that use structured outputs break silently
  on models that don't support json_schema

- Retry without stop condition is incomplete
  SOLVED: withToolCritical aborts run after exhausted retries

- System prompts are doing the runtime's job
  — execution order, validation, retry logic all in plain English
  — not enforceable, breaks with different models
  SOLUTION DIRECTION: replace prompt instructions with code guarantees
