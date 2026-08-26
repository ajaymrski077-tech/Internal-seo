import { NextRequest, NextResponse } from "next/server";
import { getDashboardData } from "@/services/dashboardService";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await getAuthenticatedUser(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  
  const search = searchParams.get("search") || "";
  const range = searchParams.get("range") || "30d";
  const showArchived = searchParams.get("showArchived") === "true";
  const sort = searchParams.get("sort") || "name_asc";

  try {
    const data = await getDashboardData(search, range, showArchived, sort);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const errObj = error as Error;
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: errObj?.message || "Failed to load dashboard data" }, { status: 500 });
  }
}
