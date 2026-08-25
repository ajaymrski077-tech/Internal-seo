import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getAuditIssues, getAuditById } from "@/services/seoAuditService";

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
    if (!id || id.trim() === "" || id === "invalid") {
      return NextResponse.json({ error: "Invalid audit ID" }, { status: 400 });
    }

    const audit = await getAuditById(id);
    if (!audit) {
      return NextResponse.json({ error: "SEO audit not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const severity = searchParams.get("severity") || undefined;
    const type = searchParams.get("type") || undefined;

    const data = await getAuditIssues(id, { page, limit, severity, type });
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("SEO Audit issues load error:", error);
    return NextResponse.json({ error: "Failed to load audit issues" }, { status: 500 });
  }
}
