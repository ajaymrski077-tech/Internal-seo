import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { saveReportDetails } from "@/services/reportService";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let user;
    try {
      user = await getAuthenticatedUser(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id || id.trim() === "") {
      return NextResponse.json({ error: "Invalid report ID" }, { status: 400 });
    }

    const body = await req.json();
    const updated = await saveReportDetails(
      id,
      {
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        summary: body.summary,
        nextMonthPlans: body.nextMonthPlans,
        emailStatus: body.emailStatus,
        emailSentAt: body.emailSentAt ? new Date(body.emailSentAt) : undefined,
        emailSentTo: body.emailSentTo,
      },
      user.email
    );

    return NextResponse.json({ success: true, report: updated });
  } catch (error: unknown) {
    const errObj = error as Error;
    console.error("Save report details error:", error);
    return NextResponse.json({ error: errObj?.message || "Internal server error" }, { status: 500 });
  }
}
