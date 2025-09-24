import { NextResponse } from "next/server";
import { getAlertRules, readThrough } from "@/server/queries";

export async function GET() {
  const data = await readThrough("/api/alert-rules", getAlertRules);
  return NextResponse.json(data);
}
