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

**Active milestone: 3** — see [docs/LEARNING_PATH.md](docs/LEARNING_PATH.md).

| Area                 | Status                                                                                              |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| Backend journal CRUD | Done: `POST/GET/PUT/DELETE /api/entries`, paginated `GET /api/entries`, central JSON 500 middleware |
| Backend tests        | Vitest + Supertest in `backend/src/test/`; setup switches Prisma to Neon **test** branch            |
| Frontend             | Vite + React + Tailwind + empty Redux store shell; Tailwind installed; no journal UI yet            |
| Auth / OpenAI / mood | Not started (milestones 4–6)                                                                        |

### Conventions established in milestones 1–2 (do not reinvent)

- **Zod at boundaries:** separate schemas for request body, query params, and (in tests) HTTP response shapes. Never Zod-parse Prisma `Date` objects with a JSON response schema.
- **Query params are strings** until `z.coerce.number()` (etc.). Defaults live on the query schema.
- **Errors:** `400` + `{ error: 'Invalid request body' }` or `'Invalid query parameters'` (optional `fields`); `404` + `{ error: 'Entry not found' }`; unexpected → middleware `500` + `{ error: 'Internal server error' }`.
- **Prisma `P2025`** (update/delete missing row) → map to 404; rethrow anything else into the error middleware.
- **Mass assignment:** input schemas allow only client-owned fields (`title`, `content`); never accept `id` / timestamps from the client.
- **List pagination:** `{ data, pagination: { page, limit, total, totalPages } }`; defaults `page=1`, `limit=10`, max limit 100; sort `createdAt desc`, `id desc`; empty DB → `totalPages: 0`; page past end → `200` + `data: []` with real `total`/`totalPages`.
- **Tests:** resource-focused file `journalEntries.test.ts`; assert status before parsing body; restore Vitest mocks in `afterEach`; Neon may need waking if `$connect` fails.
