import { NextRequest, NextResponse } from "next/server";
import { getReportDetails, updateReportConfig, archiveReport } from "@/services/reportService";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    try {
      await getAuthenticatedUser(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { id } = await params;
    const reportId = parseInt(id, 10);
    if (isNaN(reportId)) {
      return NextResponse.json({ error: "Invalid report ID" }, { status: 400 });
    }

    const report = await getReportDetails(reportId);
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json(report);
  } catch (error: any) {
    console.error("Report details API error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
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

    const body = await req.json();
    const { name, dateRange, startDate, endDate, comparisonRange, sections, propertyId } = body;

    const report = await updateReportConfig(reportId, {
      name,
      dateRange,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      comparisonRange,
      sections,
      propertyId: propertyId !== undefined ? (propertyId ? parseInt(propertyId, 10) : null) : undefined,
    }, user.email);

    return NextResponse.json(report);
  } catch (error: any) {
    console.error("Report update API error:", error);
    return NextResponse.json({ error: error.message || "Failed to update report settings" }, { status: 500 });
  }
}

export async function DELETE(
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

    await archiveReport(reportId, user.email);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Report delete API error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete report" }, { status: 500 });
  }
}
