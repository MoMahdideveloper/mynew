import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { importDatabase } from "@/server/queries";

const currencyEnum = z.enum(["USD", "EUR", "GBP", "JPY"]);

const transactionSchema = z.object({
  id: z.string(),
  payee: z.string(),
  category: z.string(),
  account: z.string(),
  type: z.enum(["Expense", "Income"]),
  amount: z.number(),
  converted: z.number(),
  currency: currencyEnum,
  date: z.string(),
  ingestionId: z.string().optional().nullable(),
  status: z.enum(["confirmed", "draft"]).optional(),
  notes: z.string().optional().nullable(),
});

const draftSchema = z.object({
  id: z.string(),
  source: z.string(),
  detail: z.string(),
  receivedAt: z.string(),
});

const budgetSchema = z.object({
  id: z.string(),
  category: z.string(),
  period: z.enum(["weekly", "monthly", "quarterly", "yearly"] as const),
  spent: z.number(),
  limit: z.number(),
  currency: currencyEnum,
  startDate: z.string(),
  endDate: z.string(),
  autoCalculated: z.boolean().optional(),
  lastRecalculated: z.string().optional(),
});

const templateSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  period: z.enum(["weekly", "monthly", "quarterly", "yearly"] as const),
  limit: z.number(),
  currency: currencyEnum,
});

const scenarioSchema = z.object({
  id: z.string(),
  name: z.string(),
  adjustments: z.array(
    z.object({
      budgetId: z.string(),
      delta: z.number(),
    }),
  ),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const payloadSchema = z.object({
  transactions: z.array(transactionSchema).optional(),
  drafts: z.array(draftSchema).optional(),
  budgets: z.array(budgetSchema).optional(),
  templates: z.array(templateSchema).optional(),
  scenarios: z.array(scenarioSchema).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const payload = payloadSchema.parse(json);
    const normalized = {
      ...payload,
      transactions: payload.transactions?.map((txn) => ({
        ...txn,
        notes: txn.notes ?? undefined,
      })),
    };
    const updated = await importDatabase(normalized);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Import failed", error);
    return NextResponse.json(
      { error: "Invalid import payload" },
      { status: 400 },
    );
  }
}
