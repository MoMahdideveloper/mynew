import { NextResponse } from "next/server";
import Papa from "papaparse";
import { getBudgets } from "@/server/queries";

export async function GET() {
  const budgets = await getBudgets();
  const rows = budgets.map((budget) => ({
    id: budget.id,
    category: budget.category,
    period: budget.period,
    spent: budget.spent,
    limit: budget.limit,
    currency: budget.currency,
    startDate: budget.startDate,
    endDate: budget.endDate,
  }));
  const csv = Papa.unparse(rows, {
    quotes: true,
    delimiter: ",",
  });
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=budgets.csv",
    },
  });
}
