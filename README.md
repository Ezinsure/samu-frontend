# SAMU Frontend

Solektra Agent Monitoring Utility — Next.js App Router UI.

COAP programme workflows (leads, activities, onboarding, sales, feedback) ship against a local demo store today. Backend APIs replace adapters under `src/lib/api/*` **one phase at a time** (see `/DOCs/SAMU-Backend-Implementation-Phases.md`).

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS v4 + SAMU design tokens (light / dark) |
| Theming | `next-themes` |
| Charts | Recharts |
| Maps | MapLibre GL + `react-map-gl` |
| Toasts | Sonner |
| Icons | Lucide |

## Prerequisites

- Node.js 20+ (22 recommended)
- npm 10+

## How to run

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### With the backend (from Phase B0+)

```bash
# terminal 1 — infra (repo root)
docker compose up -d

# terminal 2 — API
cd backend
cp .env.example .env   # first time only
npm install
npx prisma generate
npx prisma migrate deploy
npm run db:seed        # all-role users (Phase B1)
npm run dev            # http://localhost:4000

# terminal 3 — UI
cd frontend
npm run dev            # http://localhost:3000
```

Backend README: `../backend/README.md`.

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
  data/                 # Demo seed datasets (adapters only)
  src/
    app/                # Next.js routes
    components/         # UI kit + shell
    features/           # Feature modules (COAP, visits, …)
    lib/
      api/              # Data adapters → demo store or HTTP
      auth/             # Session helpers
      store/            # localStorage demo store
    types/              # Shared domain types
```

## Design tokens

Tokens live in `src/app/globals.css` (`--samu-*`). Dark mode uses the `.dark` class via `next-themes`. Status colors always pair with a text label.

## Demo accounts (local)

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@solektra.rw` | `Samu@Admin1` |
| Operations | `ops@solektra.rw` | `Samu@Ops1` |
| MD Viewer | `md@solektra.rw` | `Samu@Md1` |
| TC (Kigali) | `tc.kigali@solektra.rw` | `Samu@Tc1` |
| TC (South) | `tc.south@solektra.rw` | `Samu@Tc2` |
| Agent (stub) | `agent.demo@solektra.rw` | `Samu@Agent1` |

Register UI exists for product mirroring; only seeded/active users can sign in. Backend auth (`/api/v1/auth`) is live (B1); the UI still uses the demo store until the auth adapter is wired.

## Docs

- UI plan: `../DOCs/SAMU-Frontend-UI-Implementation-Plan.md`
- Backend architecture: `../DOCs/SAMU-Backend-Architecture.md`
- Backend phases: `../DOCs/SAMU-Backend-Implementation-Phases.md`
