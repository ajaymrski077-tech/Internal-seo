import { NextRequest, NextResponse } from "next/server";
import { regenerateShareTokenRecord } from "@/services/clientService";
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
    const clientId = parseInt(id, 10);

    if (isNaN(clientId)) {
      return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
    }

    const client = await regenerateShareTokenRecord(user.email, clientId);

    return NextResponse.json({ shareToken: client.shareToken });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Server error" }, { status: 400 });
  }
}
