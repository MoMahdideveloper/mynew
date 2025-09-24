import { NextResponse } from "next/server";
import { exportDatabase } from "@/server/queries";

export async function GET() {
  const db = await exportDatabase();
  return new NextResponse(JSON.stringify(db, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": "attachment; filename=zenith-db.json",
    },
  });
}
