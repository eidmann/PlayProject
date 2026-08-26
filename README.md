# MindLog

A daily journal application with AI-generated summaries, mood tracking, and insights over time.

This repository is also a **structured learning project**. Read this entire file before doing anything — especially if you are an AI agent.

---

## Context for AI agents (read this first)

This project exists for two reasons, in this order:

1. **To rebuild the human developer's hands-on programming skill.** The developer (the "student") has experience but has leaned heavily on AI-assisted coding and wants to regain deep understanding of code. The AI acts as a **mentor**, not a code generator.
2. To produce a genuinely professional, production-quality application.

### The working agreement — non-negotiable

- **The student is the primary author of all feature code.** AI agents guide, review, explain, and ask questions. AI agents do NOT write feature code unless the student explicitly asks for it in that specific instance.
- **AI may write**: configuration, boilerplate, tooling setup, and worked examples when explicitly teaching a new pattern (clearly labeled as such).
- **Teach Socratically.** When the student is stuck, give a hint or ask a leading question before giving the answer. Explain the _why_, not just the _what_.
- **Review critically.** When reviewing the student's code, point out real issues honestly: bugs, missing tests, unclear naming, missed edge cases. Do not rubber-stamp. Do not fix the issues yourself — describe them and let the student fix them.
- **No shortcuts, ever.** This codebase must be of the utmost professional quality. If a task is done in a lazy or hacky way, it is not done.

### Definition of Done — every feature

- [ ] Tests written and passing (unit tests at minimum; integration tests where behavior crosses boundaries)
- [ ] TypeScript strict mode passes with no `any`, no `@ts-ignore`, no type assertions used to silence errors
- [ ] Lint and format checks pass (`npm run lint`, `npm run format:check`)
- [ ] Errors are handled deliberately — no swallowed exceptions, no unhandled promise rejections
- [ ] Input validated at system boundaries (API request bodies, external API responses)
- [ ] No commented-out code, no dead code, no TODO left without an issue/plan
- [ ] Commit messages explain _why_, in imperative mood, small reviewable commits
- [ ] The student can explain every line they committed

---

## Tech stack

| Layer    | Choice                                                                  |
| -------- | ----------------------------------------------------------------------- |
| Frontend | React 19, Vite, TypeScript, Redux Toolkit, React Router                 |
| Backend  | Node.js, Express, TypeScript, Zod (validation)                          |
| Database | PostgreSQL (Neon cloud, free tier) via Prisma ORM                       |
| AI       | OpenAI API (summaries, mood analysis, insights)                         |
| Testing  | Vitest + React Testing Library (frontend), Vitest + Supertest (backend) |
| Quality  | ESLint, Prettier, Husky pre-commit hooks, GitHub Actions CI             |

## Repository layout

```
.
├── README.md              ← you are here
├── docs/
│   ├── LEARNING_PATH.md   ← the student's curriculum, milestone by milestone
│   ├── WORKFLOW.md        ← the daily development loop (branch → TDD → review → commit)
│   └── CURSOR_GUIDE.md    ← how to use Cursor professionally in this repo
├── .cursor/rules/         ← rules that enforce the mentor behavior and code standards
├── .github/workflows/     ← CI: lint, typecheck, test on every push
├── frontend/              ← React app (npm workspace)
└── backend/               ← Express API (npm workspace)
    └── prisma/            ← schema and migrations
```

## Getting started

```bash
# 0. Use the right Node version (22, pinned in .nvmrc)
nvm use

# 1. Install all dependencies (root, frontend, backend — npm workspaces)
npm install

# 2. Create a free PostgreSQL project at https://neon.tech
#    - Main branch → DATABASE_URL (pooled) + DIRECT_URL (direct)
#    - Separate Neon branch for tests → TEST_DATABASE_URL + TEST_DIRECT_URL
#    (backend tests wipe journal entries; never point TEST_* at the dev DB)

# 3. Set up backend environment
cp backend/.env.example backend/.env   # then paste all four Neon URLs

# 4. Apply migrations to both DBs
npm run db:migrate
# then: DATABASE_URL=$TEST_DATABASE_URL DIRECT_URL=$TEST_DIRECT_URL npx -w backend prisma migrate deploy

# 5. Run everything
npm run dev          # starts backend (:3001) and frontend (:5173) together
```

## Commands (run from repo root)

| Command                | What it does                               |
| ---------------------- | ------------------------------------------ |
| `npm run dev`          | Start backend and frontend dev servers     |
| `npm test`             | Run all tests (backend + frontend)         |
| `npm run lint`         | Lint all code                              |
| `npm run typecheck`    | TypeScript strict check, both packages     |
| `npm run format`       | Format all code with Prettier              |
| `npm run format:check` | Verify formatting without writing          |
| `npm run db:migrate`   | Run Prisma migrations against the database |
| `npm run db:studio`    | Open Prisma Studio to browse the database  |

## Current state (handoff for agents)

**Active milestone: 5** — AI-generated summaries and weekly insights. See [docs/LEARNING_PATH.md](docs/LEARNING_PATH.md). Do not rebuild the journal UI or mood tracking.

| Area                 | Status                                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Backend journal CRUD | Done: `POST/GET/PUT/DELETE /api/entries`, paginated `GET /api/entries`, central JSON 500 middleware                 |
| Backend tests        | Vitest + Supertest in `backend/src/test/`; setup switches Prisma to Neon **test** branch                            |
| Frontend journal UI  | Done: list, detail, create, edit, delete via RTK Query + React Router; RTL tests in `frontend/src/pages/*.test.tsx` |
| Mood tracking        | Done: nullable `Mood` enum on entries, `GET /api/moods`, form picker, detail, history page (`/moods`)               |
| Auth / OpenAI        | Not started (milestones 5–6)                                                                                        |

Vite still proxies `/api` → backend `:3001`. Routes live in `frontend/src/App.tsx` (`/` list, `/entries/new`, `/entries/:id/edit` **before** `/entries/:id`, `/moods` history).

### Conventions established in milestones 1–2 (do not reinvent)

- **Zod at boundaries:** separate schemas for request body, query params, and (in tests) HTTP response shapes. Never Zod-parse Prisma `Date` objects with a JSON response schema.
- **Query params are strings** until `z.coerce.number()` (etc.). Defaults live on the query schema.
- **Errors:** `400` + `{ error: 'Invalid request body' }` or `'Invalid query parameters'` (optional `fields`); `404` + `{ error: 'Entry not found' }`; unexpected → middleware `500` + `{ error: 'Internal server error' }`.
- **Prisma `P2025`** (update/delete missing row) → map to 404; rethrow anything else into the error middleware.
- **Mass assignment:** input schemas allow only client-owned fields (`title`, `content`, `mood`); never accept `id` / timestamps from the client.
- **List pagination:** `{ data, pagination: { page, limit, total, totalPages } }`; defaults `page=1`, `limit=10`, max limit 100; sort `createdAt desc`, `id desc`; empty DB → `totalPages: 0`; page past end → `200` + `data: []` with real `total`/`totalPages`.
- **Tests:** resource-focused file `journalEntries.test.ts`; assert status before parsing body; restore Vitest mocks in `afterEach`; Neon may need waking if `$connect` fails.

### Conventions established in milestone 3 (do not reinvent)

- **Server vs client state:** RTK Query owns fetched journal data (`frontend/src/api/entriesApi.ts`, `baseUrl: '/api'`). Form drafts stay in local `useState` (`EntryFormFields`). Do not add a `createSlice` for entries.
- **Cache tags:** list `providesTags: ['Entry']`; detail `{ type: 'Entry', id }`. Create invalidates `'Entry'`; update/delete invalidate both the specific id and `'Entry'`.
- **DELETE is 204:** empty body — treat success as `!('error' in result)`, not `result.data`.
- **Edit form prefill:** do not mount `EntryFormFields` until GET has data, or `initialTitle`/`initialContent`/`initialMood` never update (local state is initialized once).
- **Tests:** `renderWithProviders` (fresh store + `MemoryRouter`). Stub `globalThis.fetch`; RTK passes a `Request`, so use `getFetchUrl` / `getRequestBody` — do not assume the first argument is a string. Spy `window.confirm` **before** the click (happy-dom has no `confirm`). Keep in-memory entry state **outside** the `vi.fn` so PUT then GET sees updates.
- **`useParams` in tests:** the rendered tree must include a matching `<Route>`, and `initialEntries` must be a real URL (`/entries/abc/edit`), not the pattern `/entries/:id/edit`.

### Conventions established in milestone 4 (do not reinvent)

- **Mood is a Prisma enum on `JournalEntry`, not a table:** `GREAT | GOOD | OKAY | LOW | BAD`, nullable. No `UNDEFINED` sentinel. Migration lives under `backend/prisma/migrations/`.
- **`schema.prisma` `url` / `directUrl` stay `DATABASE_URL` / `DIRECT_URL`.** Tests switch via `backend/src/test/setup.ts`. Never point the schema at `TEST_*`.
- **PUT is full replace.** Omitted `mood` becomes `null`. Prisma `undefined` **skips** the field, so the handler must pass `mood ?? null` (same on POST). Invalid mood → `400` + `Invalid request body`.
- **History:** `GET /api/moods?from=&to=` (optional ISO datetimes, `from <= to`). Oldest first (`createdAt`/`id` asc). Skip null moods. Shape `{ data: [{ id, createdAt, mood }] }` — not a bare array. Frontend `getMoodHistory` `providesTags: ['Entry']` so create/update/delete refetch it.
- **UI surfaces:** mood on **form + detail + history**, **not** on the list (list links to `/moods`). Detail shows `N/A` when mood is null.
- **Select vs JSON:** `<select value="">` for “No mood”; React/API use `null`. Never `value="null"` (that is the string `"null"`). Narrow with a switch/`parseMood`, not `as Mood`.
- **Client must always send `mood` on PUT.** Title-only edits that omit the field wipe the stored mood. Cover this with a frontend test; the backend test that omitted mood becomes `null` is a different contract.
- **Test isolation:** do not share a mutable in-memory `entry` across tests — PUT mutates it and the next test prefills leftover state. Keep fixtures inside each test (or reset in `afterEach`). A plain `<li>` has **no accessible name** from its text; query history by text (or `aria-label`), not `getByRole('listitem', { name: /GOOD/ })`.
- **Prisma + TypeScript 7:** `PrismaClientKnownRequestError` is imported from `@prisma/client/runtime/library.js` (not a `Prisma.` namespace) because of `verbatimModuleSyntax`. If the editor shows implicit `any` on Prisma callbacks but `npm run typecheck` is clean, the IDE is on a different TypeScript than `backend` (pin `typescript.tsdk` to `backend/node_modules/typescript/lib`).

### After original milestones

Known gaps to pick up after milestones 5–7, unless a later milestone forces them sooner:

**Architecture**

- **No Zod on frontend JSON.** `entriesApi` types trust the network. Parse responses (and optionally mutation bodies) with Zod at the RTK Query boundary so untrusted JSON is not passed through as typed data.
- **Mood enum is copied in five places.** Prisma `enum Mood`, Zod `.enum([...])`, `frontend/src/types/moodType.ts`, `parseMood` in `EntryFormFields`, and `MOOD_VALUES` in `fetchTestUtils`. One source of truth (shared module or generated from Prisma) so adding a value cannot drift.
- **Backend routes still live in `app.ts`.** Extract route → service when it starts to hurt (likely around auth in milestone 6).

**Product / UI**

- **List errors are hardcoded.** `EntryListPage` shows `"Error loading entries"`; detail/form use `getApiErrorMessage`. Use the API message (with a fallback) on the list too.
- **UI is unstyled.** Tailwind is installed; pages are functional, not laid out. Polish after the product features exist.
- **Mood history has no date-range UI.** `GET /api/moods` already accepts `from` / `to`; the page fetches the full list. Add a filter once insights/charts need a window.
- **Raw enum and ISO timestamps.** Detail and history show `GOOD` and `2026-01-01T00:00:00.000Z`. Friendlier labels (“Good”) and formatted dates belong in polish, not another data-model change.
- **History list items have no accessible name.** Fine with `getByText`; add `aria-label` if we want `getByRole('listitem', { name })` or a screen-reader-friendly summary.

**Tests / cleanup**

- **POST `{ mood: null }` is equivalent to omitting the key** (`mood ?? null`) but only omit is asserted on the backend. Optional extra case, not a product hole.
- **`GET /api/moods` filters after `mood: { not: null }`.** Runtime is redundant; the `.filter` exists to narrow Prisma’s `Mood | null`. A type predicate would make that intent obvious.
