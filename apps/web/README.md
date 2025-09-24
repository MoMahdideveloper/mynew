Zenith Finance is a web-only MVP for reviewing transactions, managing budgets, ingesting drafts, and surfacing actionable insights with multi-currency support. The app runs on Next.js 15, React 19, and Tailwind CSS v4 using the App Router.

## Getting started

Install dependencies:

```bash
npm install
```

Run the local development server:

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the dashboard. Server actions mutate the local JSON database in `.data/db.json` and revalidate affected routes automatically.

Build for production:

```bash
npm run build
npm run start
```

## Environment configuration

- `NEXT_PUBLIC_USER_NAME` – greeting displayed in the sidebar.
- `NEXT_PUBLIC_SYNC_PAUSED=1` – toggles the dashboard sync badge to paused.
- `BACKEND_URL` or `NEXT_PUBLIC_BACKEND_URL` – optional read-through API for summary data. When unreachable the app falls back to the local store and mocks.

## Data portability

- `GET /api/export/transactions` – CSV export honoring filters (`type`, `q`, `from`, `to`).
- `GET /api/export/budgets` – CSV export of guardrail configuration.
- `GET /api/export/db` – JSON export of the entire local database as `zenith-db.json`.
- `POST /api/import/db` – import JSON payload with optional `drafts`, `transactions`, `budgets`, `templates`, and `scenarios` arrays. Missing keys leave existing records untouched.

## Feature map

- **Dashboard** – unified view of balances, active budgets, drafts, and predictive nudges.
- **Transactions** – filtering, CRUD, category suggestions, monthly metrics, and CSV export.
- **Budgets** – guardrail CRUD, per/all recalc, templates, scenario planning, and nudges.
- **Ingestion** – pipelines overview and draft queue with confirm/ignore/confirm all.
- **Alerts** – budget status badges alongside static rule definitions and channels.
- **Settings** – static preferences, security badges, and data control placeholders.

## Testing

Add end-to-end coverage under `apps/web/tests` (Playwright recommended). Example areas: transaction filters/CSV export, budget recalculation flows, draft ingestion actions, and scenario planning deltas.
