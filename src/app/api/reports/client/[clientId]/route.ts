import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getClientReportsWorkspace } from "@/services/reportService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    try {
      await getAuthenticatedUser(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { clientId } = await params;
    if (!clientId || clientId.trim() === "") {
      return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
    }

    const workspace = await getClientReportsWorkspace(clientId);
    return NextResponse.json(workspace);
  } catch (error: unknown) {
    const errObj = error as Error;
    console.error("Client reports workspace error:", error);
    return NextResponse.json({ error: errObj?.message || "Internal server error" }, { status: 500 });
  }
}
