# Learning Path

This is the curriculum. Each milestone pairs concepts to study with a real MindLog feature the student builds. A milestone is complete only when its Definition of Done is met and the student can explain every design decision.

**Active milestone: 1**

---

## Milestone 1 — Foundations refresh

**Feature: `POST /api/entries` — create a journal entry.**

Concepts to study before/while building:

- TypeScript strict mode: what `strict` actually enables, why `any` defeats the purpose, `unknown` vs `any`
- The anatomy of an Express route: middleware, request/response lifecycle, async error handling
- Reading a failing test: red → green → refactor
- Zod: parsing untrusted input at the boundary, inferring TS types from schemas

Exercise:

1. Read the existing `GET /api/health` endpoint and its test. Understand every line.
2. Write a failing Supertest test for `POST /api/entries` first (valid body → 201 with the created entry; invalid body → 400 with a useful error).
3. Implement the route with Zod validation and Prisma, making the test pass.
4. Request a mentor review. Fix findings yourself.

Definition of Done: README checklist + student can explain what happens between the HTTP request arriving and the row appearing in Postgres.

---

## Milestone 2 — Backend craft

**Feature: full CRUD for journal entries.**

- REST resource design: URLs, verbs, status codes, when to return what
- Prisma migrations: how schema changes flow to the database, why migrations are code
- Layering: route → service → data access, and when that separation earns its keep
- Central error handling in Express; error types vs stringly-typed errors
- Pagination and sorting for the list endpoint

Exercise: `GET /api/entries` (paginated), `GET /api/entries/:id`, `PUT /api/entries/:id`, `DELETE /api/entries/:id` — all test-first.

---

## Milestone 3 — Frontend + Redux

**Feature: journal UI — entry list, entry editor, entry detail.**

- React mental model: rendering, state, props, when a component re-renders
- Hooks: `useState`, `useEffect` (and why you need it less than you think), custom hooks
- Redux Toolkit: store, slices, `createSlice`, when Redux is worth it vs local state
- RTK Query: data fetching, caching, invalidation — replacing hand-rolled `useEffect` fetching
- React Router: routes, params, navigation

Exercise: build the journal list page and editor form, wired to the real API via RTK Query. Component tests with React Testing Library (test behavior, not implementation).

---

## Milestone 4 — Testing depth

**Feature: mood tracking (mood on each entry, mood history view).**

- TDD as a design tool: letting the test shape the API
- Test doubles: mock, stub, fake, spy — and when each is a smell
- Unit vs integration tests: what each is for, the testing trophy
- Testing the database layer: test database strategy, per-test isolation

Exercise: build mood tracking end-to-end (schema migration, API, UI) strictly test-first. The mentor reviews the tests before the implementation.

---

## Milestone 5 — AI integration done right

**Feature: AI-generated entry summaries and weekly insights.**

- Secrets management: `.env`, never committing keys, key rotation thinking
- Designing around a third-party API: timeouts, retries, failure modes, cost awareness
- Prompt design: system prompts, structured output (JSON mode), temperature
- Testing code that calls an LLM: injecting the client, mocking responses, contract boundaries
- Streaming responses to the browser (optional stretch)

Exercise: `POST /api/entries/:id/summarize` and a weekly insights endpoint, with the OpenAI client wrapped behind an interface the tests can fake.

---

## Milestone 6 — Professional polish

**Feature: user accounts and authentication.**

- Password hashing (bcrypt), JWT: what problems they solve, what they don't
- Auth middleware, protecting routes, ownership checks (users only see their entries)
- CI/CD: what the GitHub Actions pipeline does and why every step exists
- Code review skills: reviewing a diff you didn't write, asking the right questions

Exercise: signup, login, auth middleware, scoping all entry queries to the logged-in user. Migration of existing data considered and handled.

---

## Milestone 7 — AI-assisted workflow mastery

**Feature: student's choice (tags, search, export, reminders...).**

This milestone is about the meta-skill: using AI heavily _without_ losing understanding.

- When to use Cursor's Plan mode vs Agent mode vs Ask mode (see CURSOR_GUIDE.md)
- Writing prompts that get good results: context, constraints, acceptance criteria
- Reviewing AI output like a senior reviewing a junior's PR: never merge what you can't explain
- Safe delegation: letting AI write tests for your code (or code for your tests), refactors with test coverage as the safety net
- Knowing when NOT to use AI: novel design decisions, security-sensitive code, anything you're trying to learn

Exercise: build the chosen feature with AI writing a significant portion — but the student writes the plan, reviews every change, and must defend the result in a mentor-led "PR review" at the end.

---

## Skills checklist (revisit monthly)

- [ ] I can read unfamiliar code and build a mental model without AI
- [ ] I write the test first more often than not
- [ ] I can explain every line I commit
- [ ] I catch AI mistakes during review (log examples when it happens)
- [ ] I know the _why_ behind each tool in the stack, not just the how
- [ ] I can design a small feature (API shape, data model, UI state) on paper before coding
