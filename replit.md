# Personal AI Trainer - Git & GitHub Learning Platform

## Overview

A hackathon-winning interactive Git & GitHub learning platform with AI coaching and a unique "Human In The Loop" feature. Teaches users from beginner to advanced Git/GitHub concepts with an immersive, dark terminal-aesthetic UI.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS
- **Animation**: Framer Motion
- **Icons**: Lucide React

## Key Features

### Human In The Loop
Every AI explanation shows a confidence badge (High/Medium/Low) with session-aware reasoning like "Confidence: Medium — based on 3 sessions". Users can correct the AI inline, and the AI adapts its explanation within the same session.

### Interactive Git Tree Visualizer
SVG-based visualization showing git branches (main in blue, feature/login in green) as nodes and lines — updates as users practice commands.

### Terminal Simulator
A VS Code-style terminal where users type real git commands, get simulated output, and feedback from the AI trainer.

### Lesson Curriculum (18 lessons)
- **Beginner**: What is Git, git init, git add, git commit, git status/log, Connecting to GitHub
- **Intermediate**: git branch, git checkout/switch, git merge, git pull/push, Merge Conflicts, git stash
- **Advanced**: git rebase, git cherry-pick, Interactive Rebase, git bisect, Git Hooks, GitHub Actions

### XP & Gamification
Level badge, XP bar, streak counter, progress tracking per lesson.

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   │   └── src/routes/
│   │       ├── health.ts   # Health check
│   │       ├── lessons.ts  # Lesson CRUD + seeding
│   │       ├── progress.ts # User progress tracking
│   │       └── ai.ts       # AI explanations, corrections, study plans, command validation
│   └── git-trainer/        # React + Vite frontend (previewPath: /)
│       └── src/
│           ├── components/
│           │   ├── ai-trainer.tsx      # AI chat + Human In The Loop UI
│           │   ├── git-tree.tsx        # SVG Git tree visualizer
│           │   ├── terminal.tsx        # Terminal simulator
│           │   ├── sidebar.tsx         # Lesson list sidebar
│           │   └── ui/
│           │       └── confidence-badge.tsx  # Confidence indicator component
│           ├── pages/home.tsx
│           ├── store/use-app-state.ts
│           └── hooks/use-session.ts
├── lib/
│   ├── api-spec/openapi.yaml  # OpenAPI contract (18 endpoints)
│   ├── api-client-react/      # Generated React Query hooks
│   ├── api-zod/               # Generated Zod schemas
│   └── db/src/schema/
│       ├── lessons.ts          # Lessons table
│       └── progress.ts         # User progress table
└── scripts/
```

## API Endpoints

- `GET /api/lessons` — All 18 lessons
- `GET /api/lessons/:id` — Lesson detail with steps
- `GET /api/progress?sessionId=xxx` — User progress
- `POST /api/progress/complete` — Mark lesson complete (+XP)
- `POST /api/ai/explain` — AI explanation with confidence score
- `POST /api/ai/correct` — User corrects AI (Human In The Loop)
- `POST /api/ai/study-plan` — Personalized study plan
- `POST /api/ai/validate-command` — Terminal command validation

## Development

- `pnpm --filter @workspace/api-server run dev` — API server
- `pnpm --filter @workspace/git-trainer run dev` — Frontend
- `pnpm --filter @workspace/db run push` — Push DB schema
- `pnpm --filter @workspace/api-spec run codegen` — Regenerate API client
