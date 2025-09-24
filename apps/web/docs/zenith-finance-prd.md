# Zenith Finance Web MVP – Product Requirements Document

## 1. Overview
- **Product name:** Zenith Finance Web MVP
- **Primary persona:** Individuals managing personal finances who need clarity on cash flow, budgets, and draft transactions.
- **Secondary persona:** Accountant-style reviewer exporting data for reconciliation.
- **Platforms:** Web only, responsive desktop-first experience.
- **Tech stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS v4, local JSON datastore with optional read-through to external backend.
- **Status:** MVP shipping with deterministic local data but designed for backend integration via environment toggles.

## 2. Problem Statement
Users struggle to reconcile day-to-day spending, plan guardrails, and promote drafts into confirmed transactions without manual spreadsheets. Zenith Finance centralizes these workflows so they can:
1. Audit transactions quickly with context and filters.
2. Track budgets with insight into future burn and scenarios.
3. Promote ingestion drafts into the ledger while keeping budgets in sync.
4. Export/import data for portability and compliance.

## 3. Goals & Non-goals
### 3.1 Goals
1. Provide a unified dashboard summarizing balances, budgets, drafts, and sync status.
2. Offer robust transactions tooling (filters, CRUD, CSV export, category suggestions).
3. Deliver budgets guardrails with templates, scenarios, and predictive nudges.
4. Manage ingestion pipelines with confirm/ignore actions that mutate the datastore.
5. Preserve multi-currency context with USD conversions and export portability.
6. Expose JSON and CSV endpoints for interoperability and backups.
7. Keep configuration simple via environment variables, enabling backend read-through.

### 3.2 Non-goals (MVP)
- Real bank integrations, OAuth, or institution APIs.
- Auth beyond displaying a configured user name; no multi-tenant support.
- Production-grade FX provider or historical rates.
- Native mobile apps, push notifications, or advanced alerting.

## 4. User Journeys
### 4.1 Dashboard
1. Land on `/dashboard` to view balances, budget health, drafts queue count, and quick actions.
2. Observe sync badge reflecting `NEXT_PUBLIC_SYNC_PAUSED` flag.
3. Click through to budgets, transactions, or ingestion flows via AppShell navigation.

### 4.2 Transactions
1. Visit `/transactions` and filter by type, text query, or inclusive date range.
2. Review "This month" metrics recalculated against active filters.
3. Edit or delete a transaction inline; category suggestions appear for known payees.
4. Add a new transaction via server action; USD conversion auto-computes.
5. Export filtered CSV for audit review.

### 4.3 Budgets
1. Browse active guardrails with spend vs. limit status indicators.
2. Recalculate a single budget or all budgets; USD guardrails auto-calc from transactions.
3. Create or edit budgets via the form, optionally applying template presets.
4. Manage templates (create/delete) for repeated guardrails.
5. Explore scenario planning cards comparing before/after monthly burn, including delta.
6. View predictive nudges highlighting top overspend risks.

### 4.4 Ingestion Queue
1. Inspect available pipelines (email/upload/webhook).
2. Promote or ignore drafts in `/ingestion/queue`; confirm all to empty queue.
3. Confirmed drafts convert to transactions and trigger relevant budget recalculations.

### 4.5 Alerts & Settings
- Alerts show static rules plus dynamic budget at-risk/exceeded badges.
- Settings enumerates preferences, security posture, and data controls (static for MVP).

## 5. Functional Requirements
### 5.1 Transactions
- Filters support type (All/Expense/Income), text query across payee/category, and `from`/`to` dates (inclusive).
- Metrics derive from filtered dataset scoped to the current month.
- CRUD server actions validate inputs, persist to `apps/web/.data/db.json`, and revalidate relevant routes.
- Deletion triggers full budget recalculation; updates trigger targeted recalculation when possible.
- Category suggestions surface up to three recommended categories, excluding the current assignment.
- CSV export endpoint respects active filters and quotes values containing commas or newlines.

### 5.2 Budgets
- Guardrails store `category`, `period`, `start/end` dates, `limit`, and `spent` values with currency code.
- Recalculation derives USD spend from transactions within period bounds.
- Predictive nudges compute top three projected overruns using `getPredictiveNudges` heuristic.
- Templates support quick apply during creation; scenarios store before/after monthly burn deltas.
- Export endpoint streams budgets to CSV including metadata and spent percentages.

### 5.3 Ingestion
- Pipelines use mock data but highlight entry points for ingest.
- Draft queue actions move entries into transactions array or remove them, then revalidate dashboards/budgets.
- Confirmed drafts parse amount/currency from detail and set default category heuristically.

### 5.4 Data Portability
- `/api/export/db` returns JSON snapshot (transactions, budgets, templates, scenarios, drafts).
- `/api/import/db` accepts partial payloads, merging transactions/drafts while preserving existing guardrails when omitted.
- CSV exports for transactions and budgets accessible via GET endpoints with query parameters.

## 6. Non-functional Requirements
- **Performance:** Data volumes small; all interactions synchronous via filesystem reads/writes.
- **Reliability:** Server actions guard against invalid input via zod validation and convert/currency helpers.
- **Security:** No sensitive credentials stored. Import endpoint validates array payloads before writing.
- **Accessibility:** Focusable controls, high-contrast status badges, semantic headings and tables.
- **Internationalization:** USD primary, with EUR/GBP/JPY supported in forms and conversion table.

## 7. Technical Architecture
- File-based datastore managed by `src/server/fsdb.ts` with JSON persistence under `.data/db.json`.
- Queries in `src/server/queries.ts` optionally read-through to backend based on `BACKEND_URL` env var.
- Server actions in `src/server/actions.ts` mutate datastore and call `revalidatePath`.
- Components use Tailwind utility classes defined in `globals.css` for theming.
- CSV exports use `papaparse` for serialization.

## 8. Open Questions & Future Enhancements
1. Should alert rules become editable (CRUD) post-MVP?
2. Do transactions need pagination or virtualization for large datasets?
3. Can category suggestions leverage historical user edits or AI enrichment?
4. Should ingestion support file uploads beyond mocked pipelines?
5. Future addition of Playwright smoke suite expansion (current coverage focuses on transactions filters).

## 9. Milestones
1. **M1:** Transactions filters/CRUD/export + datastore wiring.
2. **M2:** Budgets guardrails, recalculation, export, predictive nudges.
3. **M3:** Ingestion pipelines + queue actions syncing budgets.
4. **M4:** Templates, scenarios, alerts, settings polish.
5. **M5:** Import/export JSON, documentation, and automated regression coverage ramp (starting with Playwright skeleton).

## 10. Analytics & Telemetry (Future)
- Log server action invocation counts and failure rates.
- Track CSV export usage per section.
- Measure time-to-confirm drafts for ingestion funnel tuning.

## 11. Acceptance Criteria Summary
- All scoped routes render without runtime errors.
- Transactions filters apply inclusive date bounds and update metrics accordingly.
- Budgets recalculation reflects transaction changes deterministically.
- Ingestion confirm/ignore actions mutate datastore and revalidate pages.
- Export endpoints deliver correctly formatted CSV/JSON payloads.
- Accessibility and configuration requirements met as listed above.

