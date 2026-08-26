import { NextRequest, NextResponse } from "next/server";
import { regenerateReportShareToken } from "@/services/reportService";
import { getAuthenticatedUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let user;
    try {
      user = await getAuthenticatedUser(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { id } = await params;
    if (!id || id.trim() === "" || id === "invalid") {
      return NextResponse.json({ error: "Invalid report ID" }, { status: 400 });
    }

    const report = await regenerateReportShareToken(id, user.email);
    return NextResponse.json({ success: true, shareToken: report.shareToken });
  } catch (error: unknown) {
    const errObj = error as Error;
    console.error("Report share token regeneration API error:", error);
    return NextResponse.json({ error: errObj?.message || "Failed to regenerate share token" }, { status: 500 });
  }
}
