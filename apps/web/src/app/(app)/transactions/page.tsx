import Link from "next/link";
import { createTransactionAction, deleteTransactionAction, updateTransactionAction } from "@/server/actions";
import { getTransactions, summarizeTransactions } from "@/server/queries";
import { TransactionType } from "@/types";
import { formatCurrency } from "@/lib/fx";
import { suggestCategories } from "@/lib/categorize";

const TYPE_OPTIONS: (TransactionType | "All")[] = ["All", "Expense", "Income"];
export default async function TransactionsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const typeParam =
    typeof resolvedParams?.type === "string" ? resolvedParams?.type : undefined;
  const filters = {
    type: (typeParam as TransactionType | "All" | undefined) ?? "All",
    q: typeof resolvedParams?.q === "string" ? resolvedParams?.q : undefined,
    from: typeof resolvedParams?.from === "string" ? resolvedParams?.from : undefined,
    to: typeof resolvedParams?.to === "string" ? resolvedParams?.to : undefined,
  };
  const [transactions, metrics] = await Promise.all([
    getTransactions({
      type: filters.type === "All" ? undefined : filters.type,
      q: filters.q,
      from: filters.from,
      to: filters.to,
    }),
    summarizeTransactions({
      type: filters.type === "All" ? undefined : filters.type,
      q: filters.q,
      from: filters.from,
      to: filters.to,
    }),
  ]);
  const search = new URLSearchParams();
  if (filters.type && filters.type !== "All") search.set("type", filters.type);
  if (filters.q) search.set("q", filters.q);
  if (filters.from) search.set("from", filters.from);
  if (filters.to) search.set("to", filters.to);
  const exportHref = `/api/export/transactions${search.toString() ? `?${search.toString()}` : ""}`;

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-ink">Transactions</h1>
        <p className="text-ink-subtle max-w-2xl">
          Filter activity, add or adjust entries, and export audit-ready CSV snapshots with inclusive date boundaries.
        </p>
      </header>

      <section className="rounded-2xl border border-border/60 bg-panel p-4 shadow-sm">
        <form className="grid gap-4 md:grid-cols-5" method="get">
          <label className="text-sm text-ink-subtle">
            <span className="block text-xs uppercase tracking-[0.2em]">Type</span>
            <select
              name="type"
              defaultValue={filters.type}
              className="mt-1 w-full rounded-lg border border-border/60 bg-panel-muted px-3 py-2 text-sm"
            >
              {TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-ink-subtle md:col-span-2">
            <span className="block text-xs uppercase tracking-[0.2em]">Search</span>
            <input
              type="search"
              name="q"
              defaultValue={filters.q}
              placeholder="Payee or category"
              className="mt-1 w-full rounded-lg border border-border/60 bg-panel-muted px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-ink-subtle">
            <span className="block text-xs uppercase tracking-[0.2em]">From</span>
            <input
              type="date"
              name="from"
              defaultValue={filters.from}
              className="mt-1 w-full rounded-lg border border-border/60 bg-panel-muted px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-ink-subtle">
            <span className="block text-xs uppercase tracking-[0.2em]">To</span>
            <input
              type="date"
              name="to"
              defaultValue={filters.to}
              className="mt-1 w-full rounded-lg border border-border/60 bg-panel-muted px-3 py-2 text-sm"
            />
          </label>
          <div className="flex items-end justify-end gap-3 md:col-span-5">
            <Link
              href="/transactions"
              className="text-sm font-medium text-ink-subtle underline-offset-2 hover:underline"
            >
              Reset
            </Link>
            <button
              type="submit"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow"
            >
              Apply filters
            </button>
            <a
              className="rounded-lg border border-border/60 px-4 py-2 text-sm font-semibold text-ink"
              href={exportHref}
            >
              Export CSV
            </a>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-border/60 bg-panel p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">This month metrics</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">Count</p>
            <p className="mt-2 text-lg font-semibold text-ink">{metrics.count}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">Inflow</p>
            <p className="mt-2 text-lg font-semibold text-ink">
              {formatCurrency(metrics.inflow, "USD")}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">Outflow</p>
            <p className="mt-2 text-lg font-semibold text-ink">
              {formatCurrency(metrics.outflow, "USD")}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="rounded-2xl border border-border/60 bg-panel shadow-sm">
          <table className="w-full min-w-full divide-y divide-border/60 text-left">
            <thead className="text-xs uppercase tracking-[0.2em] text-ink-muted">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Payee</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Converted</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-sm">
              {transactions.map((txn) => {
                const suggestions = suggestCategories(txn.payee, txn.category);
                return (
                  <tr key={txn.id} className="align-top">
                    <td className="px-4 py-3 text-ink-subtle">
                      {new Date(txn.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-ink font-medium">{txn.payee}</td>
                    <td className="px-4 py-3 text-ink-subtle">{txn.category}</td>
                    <td className="px-4 py-3 text-ink">
                      {formatCurrency(txn.amount, txn.currency)}
                    </td>
                    <td className="px-4 py-3 text-ink">
                      {formatCurrency(txn.converted, "USD")}
                    </td>
                    <td className="px-4 py-3 text-ink">
                      <details className="rounded-lg border border-border/60 bg-panel-muted p-3">
                        <summary className="cursor-pointer text-sm font-medium text-accent">
                          Adjust
                        </summary>
                        <form
                          action={updateTransactionAction}
                          className="mt-3 space-y-3"
                        >
                          <input type="hidden" name="id" value={txn.id} />
                          <div className="grid gap-3 sm:grid-cols-2">
                            <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
                              Payee
                              <input
                                className="mt-1 w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm"
                                name="payee"
                                defaultValue={txn.payee}
                              />
                            </label>
                            <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
                              Account
                              <input
                                className="mt-1 w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm"
                                name="account"
                                defaultValue={txn.account}
                              />
                            </label>
                            <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
                              Category
                              <input
                                className="mt-1 w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm"
                                name="category"
                                defaultValue={txn.category}
                              />
                            </label>
                            <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
                              Type
                              <select
                                className="mt-1 w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm"
                                name="type"
                                defaultValue={txn.type}
                              >
                                <option value="Expense">Expense</option>
                                <option value="Income">Income</option>
                              </select>
                            </label>
                            <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
                              Amount
                              <input
                                className="mt-1 w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm"
                                name="amount"
                                defaultValue={String(txn.amount)}
                              />
                            </label>
                            <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
                              Currency
                              <select
                                className="mt-1 w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm"
                                name="currency"
                                defaultValue={txn.currency}
                              >
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                                <option value="GBP">GBP</option>
                                <option value="JPY">JPY</option>
                              </select>
                            </label>
                            <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
                              Date
                              <input
                                className="mt-1 w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm"
                                name="date"
                                type="date"
                                defaultValue={txn.date.slice(0, 10)}
                              />
                            </label>
                          </div>
                          {suggestions.length ? (
                            <p className="text-xs text-ink-subtle">
                              Category suggestions: {suggestions.join(", ")}
                            </p>
                          ) : null}
                          <div className="flex items-center justify-between gap-2 pt-2">
                            <button
                              type="submit"
                              className="rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white"
                            >
                              Update transaction
                            </button>
                            <button
                              form={`delete-${txn.id}`}
                              type="submit"
                              className="rounded-lg border border-negative/50 px-3 py-2 text-xs font-semibold text-negative"
                            >
                              Delete
                            </button>
                          </div>
                        </form>
                        <form
                          id={`delete-${txn.id}`}
                          action={deleteTransactionAction}
                          className="hidden"
                        >
                          <input type="hidden" name="id" value={txn.id} />
                        </form>
                      </details>
                    </td>
                  </tr>
                );
              })}
              {transactions.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-ink-subtle" colSpan={6}>
                    No transactions match the current filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="rounded-2xl border border-dashed border-border/60 bg-panel-muted p-6">
          <h3 className="text-lg font-semibold text-ink">Add transaction</h3>
          <p className="text-sm text-ink-subtle">
            Amounts validate currency formatting and USD conversions apply automatically via the rate table.
          </p>
          <form action={createTransactionAction} className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
              Payee
              <input
                className="mt-1 w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm"
                name="payee"
                required
              />
            </label>
            <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
              Account
              <input
                className="mt-1 w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm"
                name="account"
                required
              />
            </label>
            <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
              Category
              <input
                className="mt-1 w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm"
                name="category"
                required
              />
            </label>
            <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
              Type
              <select
                className="mt-1 w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm"
                name="type"
              >
                <option value="Expense">Expense</option>
                <option value="Income">Income</option>
              </select>
            </label>
            <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
              Amount
              <input
                className="mt-1 w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm"
                name="amount"
                placeholder="120.00"
                required
              />
            </label>
            <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
              Currency
              <select
                className="mt-1 w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm"
                name="currency"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="JPY">JPY</option>
              </select>
            </label>
            <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
              Date
              <input
                className="mt-1 w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm"
                type="date"
                name="date"
                required
              />
            </label>
            <label className="text-xs uppercase tracking-[0.2em] text-ink-muted md:col-span-2">
              Notes
              <textarea
                className="mt-1 w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm"
                name="notes"
                rows={2}
              />
            </label>
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white shadow"
              >
                Add transaction
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
