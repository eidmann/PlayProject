# Learning Path

This is the curriculum. Each milestone pairs concepts to study with a real MindLog feature the student builds. A milestone is complete only when its Definition of Done is met and the student can explain every design decision.

**Active milestone: 4**

Milestones 1–3 are complete (journal entry API + journal UI with RTK Query). Next: mood tracking, test-first.

---

## Milestone 1 — Foundations refresh — DONE

**Feature: `POST /api/entries` — create a journal entry.**

Shipped: Zod body validation, Prisma create, Supertest coverage (201 / 400 / mass-assignment), test cleanup patterns.

---

## Milestone 2 — Backend craft — DONE

**Feature: full CRUD for journal entries.**

Shipped:

- `GET /api/entries/:id`, `PUT /api/entries/:id`, `DELETE /api/entries/:id`
- Paginated `GET /api/entries` with Zod query schema
- Central Express error middleware (4-arg, registered last)
- Dedicated Neon test database via `backend/src/test/setup.ts`

Layering (route → service) was deferred; `app.ts` still holds all routes. Extract when it starts to hurt (likely during milestone 6). See README “After original milestones”.

---

## Milestone 3 — Frontend + Redux — DONE

**Feature: journal UI — entry list, entry editor, entry detail.**

Shipped:

- List (`EntryListPage`): paginated titles, empty/loading/error, link to create
- Detail (`EntryDetailPage`): content, API errors, Edit/Back, delete with `window.confirm`
- Create + edit (`EntryFormPage` + `EntryFormFields`): POST/PUT, 400 field errors, prefill on edit, navigate to detail
- RTK Query `entriesApi` (`baseUrl: '/api'`), cache tags, invalidation on mutations
- React Router in `App.tsx`: `/`, `/entries/new`, `/entries/:id/edit` before `/entries/:id`
- RTL tests via `renderWithProviders`; fetch helpers in `frontend/src/test/`

API consumed (already live):

| Method | Path               | Notes                                         |
| ------ | ------------------ | --------------------------------------------- |
| GET    | `/api/entries`     | Paginated list; Vite proxies `/api` → `:3001` |
| GET    | `/api/entries/:id` | Single entry                                  |
| POST   | `/api/entries`     | Create `{ title, content }`                   |
| PUT    | `/api/entries/:id` | Full replace of title/content                 |
| DELETE | `/api/entries/:id` | 204 empty body                                |

Definition of Done: README checklist + student can explain data flow from click → RTK Query → API → Redux cache → UI.

Known polish deferred to [README — After original milestones](../README.md#after-original-milestones): no Zod on frontend JSON; list error copy is hardcoded.

---

## Milestone 4 — Testing depth — ACTIVE

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
