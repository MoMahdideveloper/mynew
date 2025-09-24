import { NextResponse } from "next/server";
import { getTransactions, readThrough } from "@/server/queries";
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
  const path = `/api/transactions${url.search}`;
  const data = await readThrough(path, () => getTransactions(filters));
  return NextResponse.json(data);
}
