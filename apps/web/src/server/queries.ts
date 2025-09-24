import { revalidatePath } from "next/cache";
import { endOfDay, isAfter, isBefore, isWithinInterval, parseISO, startOfDay } from "date-fns";
import {
  mockAccounts,
  mockAlertRules,
  mockPipelines,
  mockSummary,
  periodOrder,
} from "@/data/mock-data";
import {
  Budget,
  BudgetPeriod,
  BudgetScenario,
  BudgetTemplate,
  BlogPost,
  Database,
  IngestionDraft,
  Transaction,
  TransactionType,
  User,
} from "@/types";
import { convertToUSD, formatCurrency } from "@/lib/fx";
import { readDatabase, writeDatabase } from "@/server/fsdb";
import {
  fetchStrapiPost,
  fetchStrapiPosts,
  isStrapiConfigured,
} from "@/lib/strapi";

const BACKEND_URL = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL;

export async function readThrough<T>(
  path: string,
  fallback: () => Promise<T> | T,
) {
  if (!BACKEND_URL) {
    return await fallback();
  }
  try {
    const response = await fetch(`${BACKEND_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 30 },
    });
    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }
    return (await response.json()) as T;
  } catch (error) {
    console.warn("Falling back to local data for", path, error);
    return await fallback();
  }
}

export interface TransactionFilterParams {
  type?: TransactionType | "All";
  q?: string;
  from?: string;
  to?: string;
}

function matchesFilter(txn: Transaction, filters: TransactionFilterParams) {
  const typeMatch =
    !filters.type || filters.type === "All" || txn.type === filters.type;
  const query = filters.q?.trim().toLowerCase();
  const queryMatch =
    !query ||
    txn.payee.toLowerCase().includes(query) ||
    txn.category.toLowerCase().includes(query);

  const fromDate = filters.from ? startOfDay(parseISO(filters.from)) : null;
  const toDate = filters.to ? endOfDay(parseISO(filters.to)) : null;

  const date = parseISO(txn.date);
  const afterMatch = !fromDate || !isBefore(date, fromDate);
  const beforeMatch = !toDate || !isAfter(date, toDate);

  return typeMatch && queryMatch && afterMatch && beforeMatch;
}

export async function getTransactions(filters: TransactionFilterParams = {}) {
  const db = await readDatabase();
  const filtered = db.transactions.filter((txn) => matchesFilter(txn, filters));
  return filtered;
}

export async function getCategoryHintContext() {
  const db = await readDatabase();
  return {
    hints: db.categoryHints,
    transactions: db.transactions,
  };
}

export async function getSummary() {
  const db = await readDatabase();
  if (!db.transactions.length) {
    return mockSummary();
  }
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const inMonth = db.transactions.filter((txn) => {
    const date = parseISO(txn.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });
  const monthlyInflow = inMonth
    .filter((txn) => txn.type === "Income")
    .reduce((acc, txn) => acc + txn.converted, 0);
  const monthlyOutflow = inMonth
    .filter((txn) => txn.type === "Expense")
    .reduce((acc, txn) => acc + txn.converted, 0);
  const balance = db.transactions.reduce((acc, txn) => {
    const sign = txn.type === "Income" ? 1 : -1;
    return acc + txn.converted * sign;
  }, 0);
  return {
    metrics: [balance, monthlyInflow, monthlyOutflow],
  };
}

export async function getBudgets() {
  const db = await readDatabase();
  return db.budgets;
}

export async function getCategoryBreakdown() {
  const db = await readDatabase();
  const totals = new Map<string, number>();
  db.transactions.forEach((txn) => {
    if (txn.type !== "Expense") return;
    totals.set(txn.category, (totals.get(txn.category) ?? 0) + txn.converted);
  });
  return Array.from(totals.entries()).map(([category, amount]) => ({
    category,
    amount,
  }));
}

export async function getCashflow() {
  const db = await readDatabase();
  const groups = new Map<string, { inflow: number; outflow: number }>();
  db.transactions.forEach((txn) => {
    const date = new Date(txn.date);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    const entry = groups.get(key) ?? { inflow: 0, outflow: 0 };
    if (txn.type === "Income") {
      entry.inflow += txn.converted;
    } else {
      entry.outflow += txn.converted;
    }
    groups.set(key, entry);
  });
  return Array.from(groups.entries())
    .map(([period, { inflow, outflow }]) => ({ period, inflow, outflow }))
    .sort((a, b) => (a.period > b.period ? 1 : -1));
}

export async function getDrafts(): Promise<IngestionDraft[]> {
  const db = await readDatabase();
  return db.drafts;
}

export async function getPipelines() {
  return mockPipelines;
}

function sortPosts(posts: BlogPost[]) {
  return [...posts].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

async function readLocalPosts() {
  const db = await readDatabase();
  return sortPosts(db.posts ?? []);
}

export async function getLatestPosts(limit = 3) {
  const [strapiPosts, localPosts] = await Promise.all([
    fetchStrapiPosts(limit),
    readLocalPosts(),
  ]);
  if (strapiPosts?.length) {
    const localFallback = localPosts.filter(
      (post) => !strapiPosts.some((item) => item.slug === post.slug),
    );
    return [...strapiPosts, ...localFallback].slice(0, limit);
  }
  return localPosts.slice(0, limit);
}

export async function getAllPosts() {
  const [strapiPosts, localPosts] = await Promise.all([
    fetchStrapiPosts(50),
    readLocalPosts(),
  ]);
  if (strapiPosts?.length) {
    const fallback = localPosts.filter(
      (post) => !strapiPosts.some((item) => item.slug === post.slug),
    );
    return [...strapiPosts, ...fallback];
  }
  return localPosts;
}

export async function getPostBySlug(slug: string) {
  const [strapiPost, localPosts] = await Promise.all([
    fetchStrapiPost(slug),
    readLocalPosts(),
  ]);
  if (strapiPost) return strapiPost;
  return localPosts.find((post) => post.slug === slug) ?? null;
}

export async function getUsers(): Promise<User[]> {
  const db = await readDatabase();
  return db.users;
}

export async function getTemplates(): Promise<BudgetTemplate[]> {
  const db = await readDatabase();
  return db.templates;
}

export async function getScenarios(): Promise<BudgetScenario[]> {
  const db = await readDatabase();
  return db.scenarios;
}

export async function getAccounts() {
  const db = await readDatabase();
  if (!db.transactions.length) return mockAccounts;
  const groups = new Map<string, number>();
  db.transactions.forEach((txn) => {
    const current = groups.get(txn.account) ?? 0;
    const sign = txn.type === "Income" ? 1 : -1;
    groups.set(txn.account, current + txn.converted * sign);
  });
  return Array.from(groups.entries()).map(([name, balance], index) => ({
    id: `acct-${index}`,
    name,
    balance,
    currency: "USD" as const,
  }));
}

export async function getAlertRules() {
  const db = await readDatabase();
  if (!db.budgets.length) return mockAlertRules;
  return mockAlertRules;
}

export async function getSecuritySettings() {
  return [
    { id: "sec-1", title: "Encryption", description: "Data encrypted at rest" },
    { id: "sec-2", title: "Backups", description: "Nightly encrypted backups" },
    { id: "sec-3", title: "Audit log", description: "Local audit log retained" },
  ];
}

export async function recalcBudgetSpending(budget: Budget, db?: Database) {
  const state = db ?? (await readDatabase());
  const filtered = state.transactions.filter((txn) =>
    isWithinInterval(parseISO(txn.date), {
      start: parseISO(budget.startDate),
      end: parseISO(budget.endDate),
    }),
  );
  const spent = filtered
    .filter((txn) => txn.type === "Expense")
    .reduce((acc, txn) => acc + txn.converted, 0);
  budget.spent = Math.round(spent * 100) / 100;
  budget.lastRecalculated = new Date().toISOString();
  return budget;
}

export async function recalcAllBudgets() {
  const db = await readDatabase();
  db.budgets = await Promise.all(
    db.budgets.map((budget) => recalcBudgetSpending({ ...budget }, db)),
  );
  await writeDatabase(db);
  return db.budgets;
}

export function getBudgetStatus(budget: Budget) {
  const ratio = budget.limit === 0 ? 0 : budget.spent / budget.limit;
  if (ratio >= 1) return "exceeded" as const;
  if (ratio >= 0.8) return "at-risk" as const;
  return "on-track" as const;
}

const MONTHLY_FACTOR: Record<BudgetPeriod, number> = {
  weekly: 52 / 12,
  monthly: 1,
  quarterly: 4 / 12,
  yearly: 1 / 12,
};

export function getPredictiveNudges(budgets: Budget[]) {
  const projections = budgets.map((budget) => {
    const ratio = budget.limit === 0 ? 0 : budget.spent / budget.limit;
    const projectedMonthly = budget.spent * (MONTHLY_FACTOR[budget.period] ?? 1);
    const status = getBudgetStatus(budget);
    return {
      budget,
      ratio,
      projectedMonthly,
      status,
    };
  });
  return projections
    .filter((item) => item.status !== "on-track")
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 3);
}

export async function revalidateFinancePaths() {
  const paths = [
    "/dashboard",
    "/transactions",
    "/budgets",
    "/ingestion",
    "/ingestion/queue",
    "/alerts",
  ];
  for (const path of paths) {
    revalidatePath(path);
  }
}

export async function revalidateContentPaths(slug?: string) {
  const paths = ["/", "/blog"];
  for (const path of paths) {
    revalidatePath(path);
  }
  if (slug) {
    revalidatePath(`/blog/${slug}`);
  }
}

export async function exportDatabase() {
  const db = await readDatabase();
  return db;
}

export async function importDatabase(payload: Partial<Database>) {
  const db = await readDatabase();
  const merged: Database = {
    ...db,
    transactions: payload.transactions ?? db.transactions,
    budgets: payload.budgets ?? db.budgets,
    drafts: payload.drafts ?? db.drafts,
    templates: payload.templates ?? db.templates,
    scenarios: payload.scenarios ?? db.scenarios,
    categoryHints: payload.categoryHints ?? db.categoryHints,
    meta: {
      lastUpdated: new Date().toISOString(),
    },
  };
  await writeDatabase(merged);
  await revalidateFinancePaths();
  return merged;
}

export async function summarizeTransactions(filters: TransactionFilterParams) {
  const transactions = await getTransactions(filters);
  const count = transactions.length;
  const inflow = transactions
    .filter((txn) => txn.type === "Income")
    .reduce((acc, txn) => acc + txn.converted, 0);
  const outflow = transactions
    .filter((txn) => txn.type === "Expense")
    .reduce((acc, txn) => acc + txn.converted, 0);
  return { count, inflow, outflow };
}

export function formatBudgetRange(budget: Budget) {
  const start = new Date(budget.startDate);
  const end = new Date(budget.endDate);
  return `${start.toLocaleDateString()} – ${end.toLocaleDateString()}`;
}

export function sortBudgets(budgets: Budget[]) {
  return [...budgets].sort((a, b) => {
    const periodDiff =
      periodOrder.indexOf(a.period) - periodOrder.indexOf(b.period);
    if (periodDiff !== 0) return periodDiff;
    return a.category.localeCompare(b.category);
  });
}
