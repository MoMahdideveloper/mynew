import { NextResponse } from "next/server";
import { getSecuritySettings, readThrough } from "@/server/queries";

export async function GET() {
  const data = await readThrough("/api/security-settings", getSecuritySettings);
  return NextResponse.json(data);
}
