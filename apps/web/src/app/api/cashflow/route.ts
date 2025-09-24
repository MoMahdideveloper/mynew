import { NextResponse } from "next/server";
import { getCashflow, readThrough } from "@/server/queries";

export async function GET() {
  const data = await readThrough("/api/cashflow", getCashflow);
  return NextResponse.json(data);
}
