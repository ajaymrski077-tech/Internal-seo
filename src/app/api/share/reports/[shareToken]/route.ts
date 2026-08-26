import { NextRequest, NextResponse } from "next/server";
import { getSharedReportDetails } from "@/services/reportService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  try {
    const { shareToken } = await params;
    if (!shareToken) {
      return NextResponse.json({ error: "Share token is required" }, { status: 400 });
    }

    const report = await getSharedReportDetails(shareToken);
    if (!report) {
      return NextResponse.json({ error: "Report not found or archived" }, { status: 404 });
    }

    return NextResponse.json(report);
  } catch (error: unknown) {
    const errObj = error as Error;
    console.error("Shared report load error:", error);
    return NextResponse.json({ error: errObj?.message || "Internal server error" }, { status: 500 });
  }
}
