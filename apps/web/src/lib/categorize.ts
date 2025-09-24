const PAYEE_CATEGORY_MAP: Record<string, string[]> = {
  "pret a manger": ["Dining Out", "Coffee"],
  starbucks: ["Dining Out", "Coffee"],
  tesco: ["Groceries"],
  spotify: ["Subscriptions", "Entertainment"],
  netflix: ["Subscriptions"],
  uber: ["Transport", "Travel"],
  payroll: ["Salary"],
};

export function suggestCategories(payee: string, current?: string): string[] {
  if (!payee) return [];
  const normalized = payee.toLowerCase().trim();
  const candidates = PAYEE_CATEGORY_MAP[normalized] ?? [];
  const unique = candidates.filter(
    (category, index) => candidates.indexOf(category) === index,
  );
  return unique.filter((category) => !current || category !== current).slice(0, 3);
}

export function teachCategory(payee: string, category: string) {
  if (!payee || !category) return;
  const normalized = payee.toLowerCase().trim();
  const list = PAYEE_CATEGORY_MAP[normalized] ?? [];
  if (!list.includes(category)) {
    PAYEE_CATEGORY_MAP[normalized] = [category, ...list].slice(0, 5);
  }
}

export function getPayeeCategoryMap() {
  return PAYEE_CATEGORY_MAP;
}
