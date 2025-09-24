export const BASE_CATEGORY_HINTS: Record<string, string[]> = {
  "pret a manger": ["Dining Out", "Coffee"],
  starbucks: ["Dining Out", "Coffee"],
  tesco: ["Groceries"],
  spotify: ["Subscriptions", "Entertainment"],
  netflix: ["Subscriptions"],
  uber: ["Transport", "Travel"],
  payroll: ["Salary"],
};

export interface CategorySuggestionSources {
  learned?: Record<string, string[]>;
  historical?: Record<string, string[]>;
}

export function normalizePayee(payee: string) {
  return payee.toLowerCase().trim();
}

function pushUnique(list: string[], value: string | undefined) {
  if (!value) return;
  if (!list.includes(value)) {
    list.push(value);
  }
}

export function suggestCategories(
  payee: string,
  current?: string,
  sources: CategorySuggestionSources = {},
): string[] {
  if (!payee) return [];
  const normalized = normalizePayee(payee);
  const learned = sources.learned?.[normalized] ?? [];
  const historical = sources.historical?.[normalized] ?? [];
  const base = BASE_CATEGORY_HINTS[normalized] ?? [];
  const combined: string[] = [];
  learned.forEach((category) => pushUnique(combined, category));
  historical.forEach((category) => pushUnique(combined, category));
  base.forEach((category) => pushUnique(combined, category));
  return combined
    .filter((category) => !current || category !== current)
    .slice(0, 3);
}
