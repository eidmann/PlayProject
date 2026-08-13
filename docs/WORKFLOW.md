# The Daily Workflow

The same loop for every feature, every time. Consistency is what makes quality sustainable — the process should be boring so the code can be interesting.

## The loop

```
plan → branch → red → green → refactor → self-review → mentor review → commit → merge
```

### 1. Plan before code

Before touching the keyboard, write down (a sentence or two each):

- What is the feature, from the user's point of view?
- What is the API shape / component structure / data model change?
- What are the edge cases and failure modes?
- What tests will prove it works?

For anything non-trivial, do this in Cursor's **Plan mode** and interrogate the plan before accepting it.

### 2. Branch

```bash
git checkout -b feat/entry-crud      # or fix/..., chore/..., refactor/...
```

Small branches. One feature or fix per branch. If a branch lives longer than a couple of days, it's too big.

### 3. Red — write the failing test first

Write the test that describes the behavior you want. Run it. **Watch it fail** — a test you've never seen fail proves nothing.

```bash
npm test -- --watch    # keep tests running while you work
```

### 4. Green — make it pass

Write the simplest code that makes the test pass. Resist gold-plating.

### 5. Refactor

With green tests as a safety net: improve names, remove duplication, simplify. Run tests after every change.

### 6. Self-review

Before asking for review, review your own diff:

```bash
git add -p       # stage hunk by hunk, reading each one
git diff --staged
```

Ask yourself: would I approve this if a colleague sent it? Run the full gate locally:

```bash
npm run lint && npm run typecheck && npm test
```

### 7. Mentor review

Ask the AI mentor to review the diff. The mentor will point out issues and ask questions — **the student fixes the findings, the mentor does not**. Repeat until clean.

### 8. Commit

Small commits, imperative mood, explain _why_ in the body when it isn't obvious:

```
feat(entries): validate entry body with zod

Unvalidated input reached Prisma and produced confusing 500s.
Zod parse at the boundary turns bad input into a clear 400.
```

The Husky pre-commit hook runs lint + format check + related tests. **Never bypass it with `--no-verify`.** If the hook fails, the code isn't ready.

### 9. Merge

CI (GitHub Actions) must be green. Then merge to `main`. `main` is always releasable.

## Rules that keep us honest

- No code without a failing test first (spikes/experiments are fine, but they get deleted or rewritten test-first).
- No `--no-verify`, no skipped tests committed, no `.only` left behind.
- If you don't understand a piece of code — yours or AI-generated — stop and understand it before moving on. That's the whole point of this project.
- When AI writes anything, review it hunk by hunk with `git add -p` like it came from an intern: smart, fast, occasionally confidently wrong.
- Backend tests hit a Neon **test** branch (`TEST_*` env vars). If `prisma.$connect()` fails, wake the branch in the Neon console and retry — do not point tests at the development database.
