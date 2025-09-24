import { NextResponse } from "next/server";
import Papa from "papaparse";
import { getTransactions } from "@/server/queries";
import { TransactionType } from "@/types";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const search = url.searchParams;
  const filters = {
    type: (search.get("type") as TransactionType | "All" | null) ?? undefined,
    q: search.get("q") ?? undefined,
    from: search.get("from") ?? undefined,
    to: search.get("to") ?? undefined,
  };
  const transactions = await getTransactions(filters);
  const rows = transactions.map((txn) => ({
    id: txn.id,
    date: txn.date,
    payee: txn.payee,
    category: txn.category,
    account: txn.account,
    type: txn.type,
    amount: txn.amount,
    currency: txn.currency,
    converted: txn.converted,
  }));
  const csv = Papa.unparse(rows, {
    quotes: true,
    delimiter: ",",
  });
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=transactions.csv",
    },
  });
}
