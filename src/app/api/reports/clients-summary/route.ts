import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getClientsReportsSummary } from "@/services/reportService";

export async function GET(req: NextRequest) {
  try {
    try {
      await getAuthenticatedUser(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const archived = searchParams.get("archived") === "true";

    const summaries = await getClientsReportsSummary(search, archived);
    return NextResponse.json({ clients: summaries });
  } catch (error: unknown) {
    const errObj = error as Error;
    console.error("Clients reports summary error:", error);
    return NextResponse.json({ error: errObj?.message || "Internal server error" }, { status: 500 });
  }
}
