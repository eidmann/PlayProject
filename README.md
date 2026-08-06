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
| Frontend | React 18, Vite, TypeScript, Redux Toolkit, React Router                 |
| Backend  | Node.js, Express, TypeScript, Zod (validation)                          |
| Database | PostgreSQL (Docker Compose) via Prisma ORM                              |
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
├── docker-compose.yml     ← local PostgreSQL
├── .github/workflows/     ← CI: lint, typecheck, test on every push
├── frontend/              ← React app (npm workspace)
└── backend/               ← Express API (npm workspace)
    └── prisma/            ← schema and migrations
```

## Getting started

```bash
# 1. Install all dependencies (root, frontend, backend — npm workspaces)
npm install

# 2. Start PostgreSQL
docker compose up -d

# 3. Set up backend environment
cp backend/.env.example backend/.env   # then fill in values

# 4. Apply database migrations
npm run db:migrate

# 5. Run everything
npm run dev          # starts backend (:3001) and frontend (:5173) together
```

## Commands (run from repo root)

| Command                | What it does                                 |
| ---------------------- | -------------------------------------------- |
| `npm run dev`          | Start backend and frontend dev servers       |
| `npm test`             | Run all tests (backend + frontend)           |
| `npm run lint`         | Lint all code                                |
| `npm run typecheck`    | TypeScript strict check, both packages       |
| `npm run format`       | Format all code with Prettier                |
| `npm run format:check` | Verify formatting without writing            |
| `npm run db:migrate`   | Run Prisma migrations against local Postgres |
| `npm run db:studio`    | Open Prisma Studio to browse the database    |

## Current state

See [docs/LEARNING_PATH.md](docs/LEARNING_PATH.md) for which milestone is active. The scaffold ships with exactly one backend endpoint (`GET /api/health`) and an empty frontend shell — everything else is built by the student, milestone by milestone.
