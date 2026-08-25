import { NextRequest, NextResponse } from "next/server";
import { generateReportSnapshot } from "@/services/reportService";
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
    const reportId = parseInt(id, 10);
    if (isNaN(reportId)) {
      return NextResponse.json({ error: "Invalid report ID" }, { status: 400 });
    }

    const snapshot = await generateReportSnapshot(reportId, user.email);
    return NextResponse.json({ success: true, snapshotId: snapshot.id });
  } catch (error: any) {
    console.error("Report snapshot regeneration API error:", error);
    return NextResponse.json({ error: error.message || "Failed to regenerate report snapshot" }, { status: 500 });
  }
}
