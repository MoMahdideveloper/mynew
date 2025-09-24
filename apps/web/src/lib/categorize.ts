import { isBefore, parseISO, subDays } from "date-fns";
import { Transaction } from "@/types";

const MAX_SUGGESTIONS = 3;
const MAX_TRACKED_PER_PAYEE = 5;
const DEFAULT_LOOKBACK_DAYS = 90;

export const DEFAULT_CATEGORY_HINTS: Record<string, string[]> = {
  "pret a manger": ["Dining Out", "Coffee"],
  starbucks: ["Dining Out", "Coffee"],
  tesco: ["Groceries"],
  spotify: ["Subscriptions", "Entertainment"],
  netflix: ["Subscriptions"],
  uber: ["Transport", "Travel"],
  payroll: ["Salary"],
};

function normalizePayee(payee: string) {
  return payee.toLowerCase().trim();
}

function uniqueOrder(values: string[], current?: string) {
  const seen = new Set<string>();
  const filtered: string[] = [];
  for (const value of values) {
    if (!value) continue;
    if (current && value === current) continue;
    if (seen.has(value)) continue;
    seen.add(value);
    filtered.push(value);
  }
  return filtered;
}

function getHistoricalCategories(
  normalizedPayee: string,
  history: Transaction[] = [],
  lookbackDays = DEFAULT_LOOKBACK_DAYS,
) {
  if (!history.length) return [];
  const cutoff = subDays(new Date(), lookbackDays);
  const inWindow = history.filter((txn) => {
    if (normalizePayee(txn.payee) !== normalizedPayee) return false;
    const date = parseISO(txn.date);
    return !isBefore(date, cutoff);
  });
  const relevant = inWindow.length
    ? inWindow
    : history.filter((txn) => normalizePayee(txn.payee) === normalizedPayee);
  const counts = new Map<string, number>();
  for (const txn of relevant) {
    counts.set(txn.category, (counts.get(txn.category) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    })
    .map(([category]) => category);
}

export interface SuggestCategoriesOptions {
  current?: string;
  learned?: Record<string, string[]>;
  history?: Transaction[];
  lookbackDays?: number;
}

export function suggestCategories(
  payee: string,
  options: SuggestCategoriesOptions = {},
): string[] {
  if (!payee) return [];
  const normalized = normalizePayee(payee);
  const lookbackDays = options.lookbackDays ?? DEFAULT_LOOKBACK_DAYS;
  const learned = options.learned?.[normalized] ?? [];
  const historical = getHistoricalCategories(
    normalized,
    options.history,
    lookbackDays,
  );
  const staticHints = DEFAULT_CATEGORY_HINTS[normalized] ?? [];
  const combined = [...learned, ...historical, ...staticHints];
  return uniqueOrder(combined, options.current).slice(0, MAX_SUGGESTIONS);
}

export function rememberCategory(
  hints: Record<string, string[]>,
  payee: string,
  category: string,
) {
  if (!payee || !category) return hints;
  const normalized = normalizePayee(payee);
  const existing = hints[normalized] ?? [];
  if (existing.includes(category)) {
    return { ...hints, [normalized]: existing };
  }
  return {
    ...hints,
    [normalized]: [category, ...existing].slice(0, MAX_TRACKED_PER_PAYEE),
  };
}
