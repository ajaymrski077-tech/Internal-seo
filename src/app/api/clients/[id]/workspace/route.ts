import { NextRequest, NextResponse } from "next/server";
import { getClientWorkspaceData } from "@/services/dashboardService";
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
    const clientId = parseInt(id, 10);
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "30d";

    if (isNaN(clientId)) {
      return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
    }

    const payload = await getClientWorkspaceData(clientId, range);
    if (!payload) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json(payload);
  } catch (error: any) {
    console.error("Workspace endpoint load error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
