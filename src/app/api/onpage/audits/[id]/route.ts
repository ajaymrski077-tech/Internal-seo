import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getAuditById, deleteAudit } from "@/services/seoAuditService";

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

    return NextResponse.json({ audit });
  } catch (error: any) {
    console.error("SEO Audit detail load error:", error);
    return NextResponse.json({ error: "Failed to load SEO audit details" }, { status: 500 });
  }
}

export async function DELETE(
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

    await deleteAudit(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("SEO Audit delete error:", error);
    return NextResponse.json({ error: "Failed to delete SEO audit" }, { status: 500 });
  }
}
