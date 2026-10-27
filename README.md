# SAMU Frontend

Solektra Agent Monitoring Utility — Next.js App Router UI.

The UI talks to the SAMU backend over HTTP (httpOnly cookie auth). API clients live under `src/lib/api/*`; there is no demo store or mock data.

Modules still waiting for a backend API show a "Coming soon" page: sensitization, training, meetings, action items, exports, and the agent portal. See `/DOCs/SAMU-Frontend-Integration-Phases.md`.

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

### With the backend

The API must be running first (hosted Postgres/Redis/storage are configured through `backend/.env`).

```bash
# terminal 1 — API
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run db:seed        # demo users + sample data
npm run dev            # http://localhost:4000

# terminal 2 — UI
cd frontend
npm run dev            # http://localhost:3000
```

The UI reads the API origin from `NEXT_PUBLIC_API_URL` (default `http://localhost:4000`). Backend README: `../backend/README.md`.

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
  src/
    app/                # Next.js routes
    components/         # UI kit + shell
    features/           # Feature modules (COAP, visits, reports, …)
    lib/
      api/              # HTTP clients, one file per backend module
      auth/             # Session context
      hooks/            # Shared hooks (async data, filters, …)
      http/             # fetch client + mutation helpers
    types/              # Shared domain types
```

## Design tokens

Tokens live in `src/app/globals.css` (`--samu-*`). Dark mode uses the `.dark` class via `next-themes`. Status colors always pair with a text label.

## Seeded accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@solektra.rw` | `Samu@Admin1` |
| Operations | `ops@solektra.rw` | `Samu@Ops1` |
| MD Viewer | `md@solektra.rw` | `Samu@Md1` |
| TC (Kigali) | `tc.kigali@solektra.rw` | `Samu@Tc1` |
| TC (South) | `tc.south@solektra.rw` | `Samu@Tc2` |
| Agent (stub) | `agent.demo@solektra.rw` | `Samu@Agent1` |

Created by `npm run db:seed` in the backend. Self-registration creates a pending account that cannot sign in until Head Office activates it.

## Docs

- UI plan: `../DOCs/SAMU-Frontend-UI-Implementation-Plan.md`
- Backend architecture: `../DOCs/SAMU-Backend-Architecture.md`
- Backend phases: `../DOCs/SAMU-Backend-Implementation-Phases.md`
