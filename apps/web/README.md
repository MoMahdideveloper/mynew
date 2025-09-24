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

Visit [http://localhost:3000](http://localhost:3000) to explore the marketing home, blog feed, and application console. Server actions mutate the local JSON database in `.data/db.json` and revalidate affected routes automatically.

Build for production:

```bash
npm run build
npm run start
```

## Product context

- Full MVP scope, personas, and milestones are captured in [`docs/zenith-finance-prd.md`](docs/zenith-finance-prd.md) for easy sharing with stakeholders.

## Environment configuration

- `NEXT_PUBLIC_USER_NAME` – fallback greeting displayed in the sidebar and landing page.
- `NEXT_PUBLIC_SYNC_PAUSED=1` – toggles the dashboard sync badge to paused.
- `BACKEND_URL` or `NEXT_PUBLIC_BACKEND_URL` – optional read-through API for summary data. When unreachable the app falls back to the local store and mocks.
- `STRAPI_URL` / `NEXT_PUBLIC_STRAPI_URL` – optional Strapi CMS base URL for syncing blog content.
- `STRAPI_API_TOKEN` / `NEXT_PUBLIC_STRAPI_API_TOKEN` – optional Strapi access token used for create/update/delete operations when the admin console syncs posts to Strapi. When absent, the app persists posts locally only.

## Authentication & roles

- The landing page now offers **sign up**, **sign in**, and **guest** access. All financial tooling remains available for guests.
- A default admin user seeds the database: `admin@zenith.local` / `admin123!`. Use the admin console (`/admin`) to publish posts, edit copy, and update member roles.
- Sessions are stored in an HTTP-only cookie (`zenith_session`). Use the sign-out button in the sidebar to clear credentials.

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
- **Blog** – marketing home highlights the latest posts with fallback to local data when Strapi is unavailable.
- **Admin console** – manage blog posts (with optional Strapi sync) and promote members to admin without leaving the app shell.

## Testing

- Run the smoke E2E suite (requires Playwright browsers – install via `npx playwright install` if not already available):

  ```bash
  npm run test:e2e
  ```

- Extend tests under `apps/web/tests`. Current coverage focuses on transactions filters; future scenarios should include CSV exports, budget recalculation flows, draft ingestion actions, and predictive nudges.
