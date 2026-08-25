import { NextResponse } from "next/server";
import { getClientDashboardByShareToken } from "@/services/dashboardService";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  try {
    const { shareToken } = await params;
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "30d";

    if (!shareToken) {
      return NextResponse.json({ error: "Share token is required" }, { status: 400 });
    }

    const payload = await getClientDashboardByShareToken(shareToken, range);
    if (!payload) {
      return NextResponse.json({ error: "Invalid share link or access revoked" }, { status: 404 });
    }

    return NextResponse.json(payload);
  } catch (error: any) {
    console.error("Failed to fetch share dashboard stats:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
