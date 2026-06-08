some of the issues i face while working with these models as i'm learning through how to build agents.

- context passing from one tool to another is not that simple(especially if your tools are not in the same file)
- tools don't talk to each other directly, models do
- multi-step loops need right defaults and stream consumption
  Early on, repos didn’t show because streamText defaults to one step (stepCountIs(1)), so the model called GitHub but never got a follow-up turn to summarize.

- no built-in "why did it pick this tool?"
