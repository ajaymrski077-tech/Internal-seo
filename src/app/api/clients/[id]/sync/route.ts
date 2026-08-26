import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";
import { syncPropertyData } from "@/services/analyticsService";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 1. Authenticate user
    try {
      await getAuthenticatedUser(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { id } = await params;
    if (!id || id.trim() === "" || id === "invalid-id") {
      return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
    }

    // 2. Fetch the primary property for the client
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        properties: true
      }
    });

    if (!client || client.properties.length === 0) {
      return NextResponse.json({ error: "No property configured for this client." }, { status: 400 });
    }

    const primaryProperty = client.properties[0];

    // 3. Trigger sync
    try {
      await syncPropertyData(primaryProperty.id);
      return NextResponse.json({ success: true, message: "Sync completed successfully." });
    } catch (syncError: unknown) {
      const syncErrObj = syncError as Error;
      console.error("Manual sync error:", syncError);
      return NextResponse.json({ error: syncErrObj?.message || "Failed to sync data." }, { status: 500 });
    }

  } catch (error) {
    console.error("Sync API Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
