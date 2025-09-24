import { NextResponse } from "next/server";
import { getBudgets, readThrough } from "@/server/queries";

export async function GET() {
  const data = await readThrough("/api/budgets", getBudgets);
  return NextResponse.json(data);
}
