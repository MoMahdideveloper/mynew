import { NextResponse } from "next/server";
import { getAccounts, readThrough } from "@/server/queries";

export async function GET() {
  const data = await readThrough("/api/accounts", getAccounts);
  return NextResponse.json(data);
}
