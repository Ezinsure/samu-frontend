# SAMU Frontend

Solektra Agent Monitoring Utility (SAMU) — web application for Solektra’s field-operations platform.

Territory Coordinators and Head Office use this UI to manage agents, capture GPS-validated field visits, run the Community Opportunity (COAP) pipeline, review fraud flags, and submit monthly reports and scorecards. The app talks only to the live **samu-backend** API (httpOnly cookie auth). There is no mock or offline demo data store.

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js (App Router) + React + TypeScript |
| Styling | Tailwind CSS + SAMU design tokens (light / dark) |
| Theming | `next-themes` |
| Charts | Recharts |
| Maps | MapLibre GL + `react-map-gl` |
| Toasts | Sonner |
| Icons | Lucide |

## Prerequisites

- Node.js **20+** (22 recommended) and npm **10+**
- A running **samu-backend** instance (local or hosted)

## Quick start

### 1. Clone and install

```bash
git clone <your-repo-url> samu-frontend
cd samu-frontend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` if the API is not on the default local URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 3. Start the UI

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`predev` / `prebuild` copy the MapLibre worker into `public/maplibre/` automatically — no extra map setup.

## Environment variables

Create `.env.local` from `.env.example`. **Do not commit** `.env.local`.

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | No* | `http://localhost:4000` | Base URL of the SAMU API. **No trailing slash** and **no** `/api/v1` suffix. Example: `https://api.example.com` |

\*Required in practice for any non-local deployment: set it to the public API origin at **build time** (Next.js inlines `NEXT_PUBLIC_*` values into the client bundle).

### Backend settings that must match this app

On **samu-backend**, configure:

| Backend variable | Must be |
| --- | --- |
| `FRONTEND_ORIGIN` | Exact origin of this UI (e.g. `http://localhost:3000` or `https://samu.example.com`) |
| `APP_URL` | Public URL of the API |

Cookies are httpOnly and sent with `credentials: "include"`. If `FRONTEND_ORIGIN` does not match the browser origin, login will fail (CORS / cookie).

### Production checklist

- [ ] `NEXT_PUBLIC_API_URL` points at the HTTPS API
- [ ] Backend `FRONTEND_ORIGIN` matches this site’s HTTPS origin
- [ ] Rebuild/redeploy after changing any `NEXT_PUBLIC_*` value

## Working with the backend

1. Start infrastructure and the API (see **samu-backend** README): Docker, migrate, seed, `npm run dev` → http://localhost:4000  
2. Start this app → http://localhost:3000  
3. Sign in with a seeded account (below)

Health check: open http://localhost:4000/health in the browser or with curl before debugging UI login issues.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server (copies MapLibre worker first) |
| `npm run build` | Production build (copies MapLibre worker first) |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint |

## Seeded demo accounts

These users are created by `npm run db:seed` on the **backend**. Use them only for local / shared demo environments.

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@solektra.rw` | `Samu@Admin1` |
| Operations | `ops@solektra.rw` | `Samu@Ops1` |
| MD Viewer | `md@solektra.rw` | `Samu@Md1` |
| TC (Kigali) | `tc.kigali@solektra.rw` | `Samu@Tc1` |
| TC (South) | `tc.south@solektra.rw` | `Samu@Tc2` |
| Agent (stub) | `agent.demo@solektra.rw` | `Samu@Agent1` |

Self-registration creates a **pending** agent account that cannot sign in until Head Office activates it.

## Project structure

```text
frontend/
  scripts/             # MapLibre worker copy for Next.js / Turbopack
  src/
    app/               # Next.js routes
    components/        # UI kit + shell
    features/          # Feature modules (COAP, visits, reports, maps, …)
    lib/
      api/             # HTTP clients (one file per backend module)
      auth/            # Session context
      hooks/           # Shared data/filter hooks
      http/            # fetch client + mutation helpers
    types/             # Shared domain types
```

Design tokens live in `src/app/globals.css` (`--samu-*`). Dark mode uses the `.dark` class via `next-themes`.

## Notes

- Modules without a backend API yet show a **Coming soon** page (e.g. sensitization, training, meetings, action items, exports, full agent portal).
- Seed COAP sample dates are often concentrated in a past demo month (e.g. `2026-09`). If the dashboard looks empty for “this month,” pick that period in the UI filters when exploring seed data.

## Related

- **samu-backend** — Express / Prisma API this app depends on
