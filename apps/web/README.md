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

## Product context

- Full MVP scope, personas, and milestones are captured in [`docs/zenith-finance-prd.md`](docs/zenith-finance-prd.md) for easy sharing with stakeholders.

## Environment configuration

- `NEXT_PUBLIC_USER_NAME` – greeting displayed in the sidebar.
- `NEXT_PUBLIC_SYNC_PAUSED=1` – toggles the dashboard sync badge to paused.
- `BACKEND_URL` or `NEXT_PUBLIC_BACKEND_URL` – optional read-through API for summary data. When unreachable the app falls back to the local store and mocks.
- `STRAPI_URL` – base URL for the Strapi CMS powering the blog and admin CRUD.
- `STRAPI_API_TOKEN` – (optional) service token used for elevated Strapi requests when fetching or mutating content without a user session.

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
- **Blog** – Strapi-backed article list with local mock fallback.
- **Admin** – authenticated Strapi CRUD for posts and user role management (guest users see onboarding guidance).

## Strapi integration & authentication

- The home page now surfaces the latest blog posts and an authentication panel for signing up, signing in, or continuing as a guest. Guest mode keeps all financial tooling unlocked.
- Server actions proxy Strapi’s `/auth/local` and `/auth/local/register` endpoints; successful responses are stored in an HTTP-only cookie.
- When Strapi is not configured, the UI falls back to seeded mock posts and keeps auth forms disabled while continuing to offer guest access.
- The `/admin` route requires an admin session and provides CRUD helpers for posts plus a lightweight user role management form. All interactions go through Strapi’s REST API.

## Testing

- Run the smoke E2E suite (requires Playwright browsers – install via `npx playwright install` if not already available):

  ```bash
  npm run test:e2e
  ```

- Extend tests under `apps/web/tests`. Current coverage focuses on transactions filters; future scenarios should include CSV exports, budget recalculation flows, draft ingestion actions, and predictive nudges.
