import { NextRequest, NextResponse } from "next/server";
import { getReportsList, createReport, generateReportSnapshot } from "@/services/reportService";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    try {
      await getAuthenticatedUser(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const clientIdStr = searchParams.get("clientId");
    const status = searchParams.get("status") || "ALL";
    const archivedStr = searchParams.get("archived");
    const sort = searchParams.get("sort") || "newest";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);

    const clientId = clientIdStr && clientIdStr !== "ALL" ? clientIdStr : undefined;
    const isArchived = archivedStr === "true";

    const payload = await getReportsList({
      search,
      clientId,
      status,
      isArchived,
      sort,
      page,
      pageSize,
    });

    return NextResponse.json(payload);
  } catch (error: unknown) {
    const errObj = error as Error;
    console.error("Reports API load error:", error);
    return NextResponse.json({ error: errObj?.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    let user;
    try {
      user = await getAuthenticatedUser(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const { clientId, propertyId, name, dateRange, startDate, endDate, comparisonRange, sections } = body;

    if (!clientId || !name || !dateRange || !comparisonRange || !sections || !Array.isArray(sections)) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    // 1. Create Report config
    const report = await createReport({
      clientId: clientId.toString(),
      propertyId: propertyId ? propertyId.toString() : null,
      name,
      dateRange,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      comparisonRange,
      sections,
    }, user.email);

    // 2. Immediately trigger snapshot generation in the background/sync
    try {
      await generateReportSnapshot(report.id, user.email);
    } catch (genError: unknown) {
      console.error("Auto snapshot generation failed:", genError);
      // Even if generation failed, the config record was created, so return the record
    }

    return NextResponse.json({ success: true, reportId: report.id });
  } catch (error: unknown) {
    const errObj = error as Error;
    console.error("Report creation API error:", error);
    return NextResponse.json({ error: errObj?.message || "Failed to create report" }, { status: 500 });
  }
}
