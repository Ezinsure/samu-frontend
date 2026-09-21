# SAMU Frontend

Solektra Agent Monitoring Utility — Next.js App Router UI (demo-first with dummy data).

## Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS v4 + SAMU design tokens (light / dark)
- Inter font
- `next-themes` for theme switching
- `sonner` for toasts
- Lucide icons

## Prerequisites

- Node.js 20+ (22 recommended)
- npm 10+

## Getting started

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Project structure

```text
frontend/
  data/                 # Dummy datasets (Phase 2+). Swap for real APIs later.
  src/
    app/                # Next.js routes
    components/
      providers/        # Theme + toast providers
      theme/            # Theme toggle
      ui/               # Shared primitives (Phase 1+)
      layout/           # App shell (Phase 1+)
    features/           # Feature modules
    lib/
      api/              # Typed data adapters (only layer that reads /data)
      auth/             # Demo session helpers
      utils.ts
    types/              # Shared domain types
```

## Design tokens

Tokens live in `src/app/globals.css` (`--samu-*` variables, bridged into Tailwind utilities).

- Light mode is the default.
- Dark mode uses the `.dark` class via `next-themes`.
- Status colors: success / warning / danger / info — always pair with a text label.

## Implementation phases

See `../DOCs/SAMU-Frontend-UI-Implementation-Plan.md`.

| Phase | Status |
| --- | --- |
| 0 — Foundation & tokens | Complete |
| 1 — UI kit & app shell | Complete |
| 2 — Dummy data + auth | Next |

## Demo auth notes (later phases)

- Register form will be shown for product mirroring.
- Login authenticates only seeded dummy users in code.
- Mutations that affect dashboards/stats persist in `localStorage` where agreed.
- Visit GPS uses browser geolocation (fail closed if denied / inaccurate).
