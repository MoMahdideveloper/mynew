import { NextResponse } from "next/server";
import { getCategoryBreakdown, readThrough } from "@/server/queries";

export async function GET() {
  const data = await readThrough("/api/category-breakdown", getCategoryBreakdown);
  return NextResponse.json(data);
}
