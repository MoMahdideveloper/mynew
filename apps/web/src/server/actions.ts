"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  confirmAllDrafts,
  confirmDraft,
  createTransaction,
  deleteTransaction,
  ignoreDraft,
  readDatabase,
  removeBudget,
  updateTransaction,
  upsertBudget,
  writeDatabase,
} from "@/server/fsdb";
import {
  importDatabase,
  revalidateFinancePaths,
  recalcAllBudgets,
  recalcBudgetSpending,
  getBudgets,
} from "@/server/queries";
import { Budget, BudgetScenario, BudgetTemplate, Database } from "@/types";
import { parseAmountInput } from "@/lib/fx";

const currencyEnum = z.enum(["USD", "EUR", "GBP", "JPY"]);

const transactionSchema = z.object({
  payee: z.string().min(1),
  category: z.string().min(1),
  account: z.string().min(1),
  type: z.enum(["Expense", "Income"]),
  amount: z.string().min(1),
  currency: currencyEnum,
  date: z.string().min(1),
  notes: z.string().optional().nullable(),
});

const transactionUpdateSchema = z.object({
  id: z.string().min(1),
  payee: z.string().optional(),
  category: z.string().optional(),
  account: z.string().optional(),
  type: z.enum(["Expense", "Income"]).optional(),
  amount: z.string().optional(),
  currency: currencyEnum.optional(),
  date: z.string().optional(),
  notes: z.string().optional().nullable(),
});

const budgetSchema = z.object({
  id: z.string().optional(),
  category: z.string().min(1),
  period: z.enum(["weekly", "monthly", "quarterly", "yearly"] as const),
  limit: z.string().min(1),
  currency: currencyEnum,
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  autoCalculated: z.coerce.boolean().optional(),
});

const templateFormSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  period: z.enum(["weekly", "monthly", "quarterly", "yearly"] as const),
  limit: z.string().min(1),
  currency: currencyEnum,
});

const budgetLimitSchema = z.object({
  id: z.string().min(1),
  limit: z.string().min(1),
});

const scenarioAdjustmentsSchema = z.object({
  id: z.string().min(1),
  adjustments: z
    .string()
    .transform((value) => {
      let parsed: Array<{ budgetId: string; delta: number }>;
      try {
        parsed = JSON.parse(value) as Array<{ budgetId: string; delta: number }>;
      } catch {
        throw new Error("Invalid adjustments payload");
      }
      if (!Array.isArray(parsed)) {
        throw new Error("Adjustments must be an array");
      }
      return parsed.map((item) => ({
        budgetId: String(item.budgetId),
        delta: Number.isNaN(Number(item.delta)) ? 0 : Number(item.delta),
      }));
    }),
});

function parseAmount(value: string, currency: string) {
  const parsed = parseAmountInput(value);
  if (parsed === null) {
    throw new Error("Invalid amount");
  }
  return parsed;
}

export async function createTransactionAction(formData: FormData) {
  const values = transactionSchema.parse(Object.fromEntries(formData.entries()));
  const amount = parseAmount(values.amount, values.currency);
  await createTransaction({
    payee: values.payee,
    category: values.category,
    account: values.account,
    type: values.type,
    amount,
    currency: values.currency,
    date: values.date,
    notes: values.notes ?? undefined,
  });
  await recalcAllBudgets();
  await revalidateFinancePaths();
}

export async function updateBudgetLimitAction(formData: FormData) {
  const values = budgetLimitSchema.parse(Object.fromEntries(formData.entries()));
  const db = await readDatabase();
  const index = db.budgets.findIndex((budget) => budget.id === values.id);
  if (index === -1) {
    throw new Error("Budget not found");
  }
  const budget = db.budgets[index];
  const limit = parseAmount(values.limit, budget.currency);
  db.budgets[index] = {
    ...budget,
    limit,
    lastRecalculated: new Date().toISOString(),
  };
  await writeDatabase(db);
  await revalidateFinancePaths();
}

export async function updateTransactionAction(formData: FormData) {
  const values = transactionUpdateSchema.parse(
    Object.fromEntries(formData.entries()),
  );
  const patch: Record<string, unknown> = { ...values };
  if (values.amount !== undefined) {
    patch.amount = parseAmount(values.amount, values.currency ?? "USD");
  }
  delete patch.id;
  await updateTransaction(values.id, patch);
  await recalcAllBudgets();
  await revalidateFinancePaths();
}

export async function deleteTransactionAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Transaction id required");
  await deleteTransaction(id);
  await recalcAllBudgets();
  await revalidateFinancePaths();
}

export async function confirmDraftAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Draft id required");
  await confirmDraft(id);
  await recalcAllBudgets();
  await revalidateFinancePaths();
}

export async function confirmAllDraftsAction() {
  await confirmAllDrafts();
  await recalcAllBudgets();
  await revalidateFinancePaths();
}

export async function ignoreDraftAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Draft id required");
  await ignoreDraft(id);
  await revalidateFinancePaths();
}

export async function saveBudgetAction(formData: FormData) {
  const values = budgetSchema.parse(Object.fromEntries(formData.entries()));
  const limit = parseAmount(values.limit, values.currency);
  const budget: Budget = {
    id: values.id ?? crypto.randomUUID(),
    category: values.category,
    period: values.period,
    spent: 0,
    limit,
    currency: values.currency,
    startDate: values.startDate,
    endDate: values.endDate,
    autoCalculated: values.autoCalculated ?? values.currency === "USD",
    lastRecalculated: new Date().toISOString(),
  };
  await upsertBudget(budget);
  await recalcAllBudgets();
  await revalidateFinancePaths();
}

export async function deleteBudgetAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Budget id required");
  await removeBudget(id);
  await recalcAllBudgets();
  await revalidateFinancePaths();
}

export async function recalcBudgetAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Budget id required");
  const db = await readDatabase();
  const index = db.budgets.findIndex((budget) => budget.id === id);
  if (index === -1) {
    throw new Error("Budget not found");
  }
  const updated = await recalcBudgetSpending({ ...db.budgets[index] }, db);
  db.budgets[index] = updated;
  await writeDatabase(db);
  await revalidateFinancePaths();
}

export async function recalcAllBudgetsAction() {
  await recalcAllBudgets();
  await revalidateFinancePaths();
}

export async function importDatabaseAction(payload: Partial<Database>) {
  await importDatabase(payload);
}

export async function addTemplateAction(formData: FormData) {
  const values = templateFormSchema.parse(Object.fromEntries(formData.entries()));
  const limit = parseAmount(values.limit, values.currency);
  const db = await readDatabase();
  db.templates.push({
    id: crypto.randomUUID(),
    name: values.name,
    category: values.category,
    period: values.period,
    limit,
    currency: values.currency,
  });
  await writeDatabase(db);
  await revalidatePath("/budgets");
}

export async function deleteTemplateAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Template id required");
  const db = await readDatabase();
  db.templates = db.templates.filter((template) => template.id !== id);
  await writeDatabase(db);
  await revalidatePath("/budgets");
}

const scenarioFormSchema = z.object({
  name: z.string().min(1),
});

export async function createScenarioAction(formData: FormData) {
  const values = scenarioFormSchema.parse(Object.fromEntries(formData.entries()));
  const db = await readDatabase();
  db.scenarios.push({
    id: crypto.randomUUID(),
    name: values.name,
    adjustments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "draft",
  });
  await writeDatabase(db);
  await revalidatePath("/budgets");
}

export async function cloneScenarioAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Scenario id required");
  const db = await readDatabase();
  const source = db.scenarios.find((scenario) => scenario.id === id);
  if (!source) throw new Error("Scenario not found");
  const now = new Date().toISOString();
  const clone: BudgetScenario = {
    ...source,
    id: crypto.randomUUID(),
    name: source.name.includes("Draft") ? source.name : `${source.name} Draft`,
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };
  db.scenarios.push(clone);
  await writeDatabase(db);
  await revalidatePath("/budgets");
}

const scenarioRenameSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
});

export async function renameScenarioAction(formData: FormData) {
  const values = scenarioRenameSchema.parse(Object.fromEntries(formData.entries()));
  const db = await readDatabase();
  db.scenarios = db.scenarios.map((scenario) =>
    scenario.id === values.id
      ? { ...scenario, name: values.name, updatedAt: new Date().toISOString() }
      : scenario,
  );
  await writeDatabase(db);
  await revalidatePath("/budgets");
}

export async function saveScenarioAdjustmentsAction(formData: FormData) {
  const values = scenarioAdjustmentsSchema.parse(Object.fromEntries(formData.entries()));
  const db = await readDatabase();
  db.scenarios = db.scenarios.map((scenario) => {
    if (scenario.id !== values.id) return scenario;
    return {
      ...scenario,
      adjustments: values.adjustments.map((adjustment) => ({
        budgetId: adjustment.budgetId,
        delta: adjustment.delta,
      })),
      updatedAt: new Date().toISOString(),
    };
  });
  await writeDatabase(db);
  await revalidatePath("/budgets");
}

export async function promoteScenarioAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Scenario id required");
  const db = await readDatabase();
  db.scenarios = db.scenarios.map((scenario) =>
    scenario.id === id
      ? { ...scenario, status: "active", updatedAt: new Date().toISOString() }
      : scenario,
  );
  await writeDatabase(db);
  await revalidatePath("/budgets");
}

export async function deleteScenarioAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Scenario id required");
  const db = await readDatabase();
  db.scenarios = db.scenarios.filter((scenario) => scenario.id !== id);
  await writeDatabase(db);
  await revalidatePath("/budgets");
}
