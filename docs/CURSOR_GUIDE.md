# Using Cursor Professionally

How to get the most out of Cursor while staying in control and continuing to learn. The theme of everything below: **you are the engineer, Cursor is the power tool.**

## The modes and when to use each

| Mode                   | What it's for                                       | When to reach for it                                                       |
| ---------------------- | --------------------------------------------------- | -------------------------------------------------------------------------- |
| **Ask**                | Questions, explanations, exploring code — read-only | "How does this middleware work?", "Where is X handled?", learning concepts |
| **Plan**               | Designing an approach before any code is written    | Any feature touching multiple files, anything with trade-offs              |
| **Agent**              | Making changes                                      | Only after you know what you want changed                                  |
| **Tab (autocomplete)** | Line-level completions as you type                  | Always on — but read every completion before accepting                     |

The professional pattern: **Ask → Plan → Agent**, in that order, with your judgment between each step. Skipping straight to Agent with a vague prompt is vibe coding — exactly the habit this project is meant to break.

In this repository, remember the working agreement in the README: for feature code, prefer Ask mode (understanding) over Agent mode (generation). The `.cursor/rules` enforce this for any agent working here.

## Giving the AI good context

- `@file` / `@folder` — point the AI at exactly the code that matters instead of hoping it finds it
- `@Past Chats` — reference an earlier session's context
- Paste error messages and test output verbatim — don't paraphrase them
- State constraints explicitly: "without adding a dependency", "must keep the existing API contract", "test-first"
- Give acceptance criteria: "done when X returns 400 for a missing title"

A good prompt looks like a good ticket: context, goal, constraints, definition of done.

## Rules (`.cursor/rules/`)

Rules are persistent instructions attached to every AI conversation in this repo. Ours:

- `mentor.mdc` — enforces the master/student dynamic (always applied)
- `code-standards.mdc` — the engineering bar: strict TS, testing, error handling (always applied)

When you notice the AI repeatedly making the same mistake or needing the same instruction, that's a signal to add it to a rule. Rules are how teams encode their conventions once instead of repeating them in every prompt.

## Reviewing AI output (the core skill)

Treat every AI-generated change like a PR from a talented junior:

1. Read the diff hunk by hunk. Never accept a wall of changes wholesale.
2. Ask "why" about anything surprising — Cursor will explain its own changes if you ask.
3. Check the tests: do they actually assert meaningful behavior, or just that the code runs?
4. Look for the classic AI failure modes: hallucinated APIs, over-engineering, swallowed errors, subtly wrong edge cases, duplicated logic that already exists elsewhere in the repo.
5. If you can't explain the change, don't accept it. Ask questions until you can.

## Tips and tricks

- **Cmd+K** in the editor: small, scoped inline edits — better than Agent for one-liners because you stay in the code
- **Cmd+L**: open chat with the current selection as context
- Keep chats **focused and short-lived**: one task per chat. Long meandering chats degrade quality.
- Use **checkpoints/restore** in chat if an agent goes down a bad path — reverting beats patching a bad direction
- Let the agent run tests itself ("run the tests and fix the failures") — but read what it changed afterward
- Ask for explanations at the level you need: "explain like I know JS but not Redux"
- When learning, ask "quiz me on the code you just explained" — retrieval beats rereading
- Use plan files as documentation: a good plan you approved is a record of _why_ the code looks the way it does

## Anti-patterns to avoid

- Accepting code you haven't read (the #1 skill-killer)
- Prompting again and again with small variations hoping for magic instead of stopping to understand the problem
- Letting the AI both write the code _and_ the tests for that code without your scrutiny of at least one side
- Using AI for the parts you're trying to learn (do those manually; use AI for the parts you've already mastered)
- Trusting AI on security-sensitive code (auth, crypto, input handling) without extra-careful review
