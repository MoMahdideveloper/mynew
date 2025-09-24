# Zenith Finance Web MVP PRD

## Overview
- **Product name:** Zenith Finance Web MVP
- **Platform:** Next.js 15 App Router (Web only)
- **Purpose:** Personal finance application that lets users review transactions, manage budgets, process ingestion drafts, and surface insights with multi-currency support.
- **Primary users:**
  - Individuals tracking personal finances and budgets.
  - Accountant-style reviewers exporting CSV data for reconciliation.

## Objectives & Success Criteria
1. Deliver a unified dashboard summarising balances, budgets, drafts, and insights.
2. Enable robust transaction management with filtering, CRUD operations, and CSV export.
3. Provide budget guardrails across multiple cadences with templates, scenarios, recalculation, and predictive nudges.
4. Support ingestion of draft transactions with confirm/ignore workflows that sync budgets.
5. Maintain multi-currency awareness with stored originals, USD conversions, and a basic rate table.
6. Ensure reliable data portability through JSON import/export and CSV exports.
7. Offer straightforward configuration via environment variables and page revalidation after server actions.

### Non-goals
- Bank integrations, OAuth, and full authentication beyond a display name.
- Advanced FX providers, historical rate lookups, or per-account time series analysis.
- Mobile apps, push notifications, RBAC, or alerting workflows beyond static read-only views.

## Scope by Surface Area
### Dashboard (`/dashboard`)
- Show summary metrics, active budgets with status badges, drafts queue snapshot, and account balances.
- Respect `NEXT_PUBLIC_SYNC_PAUSED` for sync badge state.
- Highlight budgets that are at-risk (≥80% spent) with "View alerts" affordances.

### Transactions (`/transactions`)
- Provide filters for type (Expense/Income/All), free-text query across payee & category, and date range pickers (inclusive end-of-day bounds).
- Display "This month" metrics based on the filtered set: count, inflow, and outflow.
- CRUD flows via server actions with validation and USD conversion helpers.
- Category suggestions using transaction history heuristics.
- CSV export endpoint reflecting current filters.

### Budgets (`/budgets`)
- Create, edit, delete budgets in USD, EUR, GBP, or JPY with default monthly cadence.
- Allow recalculation of individual or all budgets (USD auto-calculated) from underlying transactions.
- Support templates (create, delete, apply) and scenario planning (create, rename, delete) with burn-rate deltas.
- Show predictive nudges from projected overspend categories.

### Draft Ingestion (`/ingestion` & `/ingestion/queue`)
- List pipelines (email/upload/webhook) and present the draft queue for confirm/ignore actions.
- Confirming drafts creates transactions and revalidates related views; ignoring removes drafts.
- "Confirm all" bulk action clears the queue and syncs budgets.

### Alerts (`/alerts`)
- Read-only list of alert rules, channels, and live budget status indicating at-risk/exceeded states.

### Settings (`/settings`)
- Present preference, security, and data control stubs for future expansion.

## Data Model
Defined in `src/types/index.ts`:
- **Transaction:** id, payee, category, account, type, amount, converted amount (USD), date, ingestion metadata, status.
- **Budget:** id, category, period, spent, limit, currency.
- **IngestionDraft:** id, source, detail payload, receivedAt timestamp.
- **Templates & Scenarios:** support naming, base budgets, adjustments, and monthly burn-rate projections.

## Architecture Notes
- App Router with server components by default and server actions performing mutations against the filesystem-backed JSON database (`.data/db.json`).
- Read-through fetching toggled by `BACKEND_URL`/`NEXT_PUBLIC_BACKEND_URL` environment variables with fallback mocks.
- Currency utilities for formatting and conversion in `src/lib/fx.ts`.
- Revalidation via `revalidatePath` after all mutating actions.

## APIs & Integrations
- REST endpoints under `/api` for summary metrics, accounts, transactions, budgets, category breakdown, cashflow, alert rules, and security settings.
- Export endpoints for transactions, budgets, and entire DB; import endpoint for JSON payload containing drafts and transactions.

## Performance & Reliability
- Dataset intentionally small (no pagination) but CSV generation must remain efficient.
- Server actions validate inputs, recalc budgets deterministically, and avoid hard failures on malformed data.

## Accessibility & UX
- Maintain keyboard navigation and high-contrast status labels.
- Date inputs rely on native `<input type="date">` elements.
- Use `aria-live` regions where counts change dynamically (e.g., queue lists).

## Testing Strategy
- **Unit:** category suggestion quality, currency conversion edge cases, budget calculations, predictive nudges.
- **API:** CSV export filter combinations, import validation, response headers.
- **E2E (Playwright):**
  - Transactions filters and metrics updates.
  - Transactions CRUD with budget recalculation.
  - Ingestion confirm/ignore/all flows.
  - Budgets templates, scenarios, predictive nudges.

## Milestones
1. Transactions table, filters, CRUD, CSV export, and base metrics.
2. Budgets CRUD with recalculation, category suggestions.
3. Ingestion pipelines and queue actions.
4. Templates, scenarios, predictive nudges, and alerts surface.
5. Import/export tooling, settings polish, automated tests.

## Open Questions
- Should alert rule editing be considered for MVP or remain read-only?
- Is pagination needed for large transaction volumes post-MVP?
- Can category suggestions learn from manual overrides for personalization?

