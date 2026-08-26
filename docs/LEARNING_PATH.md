# Learning Path

This is the curriculum. Each milestone pairs concepts to study with a real MindLog feature the student builds. A milestone is complete only when its Definition of Done is met and the student can explain every design decision.

**Active milestone: 5**

Milestones 1–4 are complete (journal API + UI + mood tracking). Next: AI-generated summaries, with the OpenAI client behind a testable boundary.

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

## Milestone 4 — Testing depth — DONE

**Feature: mood tracking (mood on each entry, mood history view).**

Shipped:

- Prisma `Mood` enum (`GREAT | GOOD | OKAY | LOW | BAD`), nullable on `JournalEntry`; migration applied to the schema
- POST/PUT: `mood` optional; omit or `null` → stored `null`; invalid value → `400` + `Invalid request body`
- PUT is **full replace** — handler passes `mood ?? null` so Prisma does not skip the field
- `GET /api/moods?from=&to=` (optional ISO, `from <= to`): oldest first, skip null moods, `{ data: [{ id, createdAt, mood }] }`
- UI: mood picker on create/edit (`""` in the `<select>`, `null` in JSON); detail shows mood or `N/A`; list does **not** show mood; `MoodHistoryPage` at `/moods`
- Frontend PUT always sends current `mood` so a title-only edit cannot wipe it
- Tests: backend CRUD + history filters; frontend create/edit/keep/clear mood, detail, list absence, history empty/loading/error

Concepts practiced: TDD as API design, test doubles (fetch stub vs in-memory fake), unit vs integration (Supertest + Neon vs RTL + stubbed `fetch`), per-test isolation (no shared mutable fixtures).

Definition of Done: README checklist + student can explain picker → RTK Query → Zod/Prisma → history query, and why omitted PUT `mood` is `null` while the client must still send the field.

Known polish deferred to [README — After original milestones](../README.md#after-original-milestones): duplicated Mood unions, no history date-range UI, raw enum/ISO copy.

---

## Milestone 5 — AI integration done right — ACTIVE

**Feature: AI-generated entry summaries and weekly insights.**

- Secrets management: `.env`, never committing keys, key rotation thinking
- Designing around a third-party API: timeouts, retries, failure modes, cost awareness
- Prompt design: system prompts, structured output (JSON mode), temperature
- Testing code that calls an LLM: injecting the client, mocking responses, contract boundaries
- Streaming responses to the browser (optional stretch)

Exercise: `POST /api/entries/:id/summarize` and a weekly insights endpoint, with the OpenAI client wrapped behind an interface the tests can fake. Reuse the existing journal + mood model — do not invent a second mood type or rebuild the history page. Mood-over-time charts belong on the post-curriculum list unless this milestone’s insights UI needs a window (then use `GET /api/moods?from=&to=`).

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
- [ ] I can explain the difference between omitting a JSON field, sending `null`, and Prisma `undefined` (skip vs set)
