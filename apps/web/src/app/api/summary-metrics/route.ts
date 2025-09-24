import { NextResponse } from "next/server";
import { getSummary, readThrough } from "@/server/queries";

export async function GET() {
  const data = await readThrough("/api/summary-metrics", getSummary);
  return NextResponse.json(data);
}
