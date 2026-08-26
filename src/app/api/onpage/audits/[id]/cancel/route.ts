import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { cancelAudit, getAuditById } from "@/services/seoAuditService";

export async function POST(
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
    if (!id || id.trim() === "" || id === "invalid") {
      return NextResponse.json({ error: "Invalid audit ID" }, { status: 400 });
    }

    const audit = await getAuditById(id);
    if (!audit) {
      return NextResponse.json({ error: "SEO audit not found" }, { status: 404 });
    }

    await cancelAudit(id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errObj = error as Error;
    console.error("SEO Audit cancel error:", error);
    return NextResponse.json({ error: "Failed to cancel SEO audit" }, { status: 500 });
  }
}
