import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { discoverKeywords } from "@/services/rankingsService";

export async function GET(req: NextRequest) {
  try {
    try {
      await getAuthenticatedUser(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const propertyIdStr = searchParams.get("propertyId");
    const daysStr = searchParams.get("days") || "30";

    if (!propertyIdStr) {
      return NextResponse.json({ error: "Website Property ID is required." }, { status: 400 });
    }

    const propertyId = parseInt(propertyIdStr, 10);
    const days = parseInt(daysStr, 10);

    if (isNaN(propertyId)) {
      return NextResponse.json({ error: "Invalid property ID" }, { status: 400 });
    }

    const keywords = await discoverKeywords(propertyId, isNaN(days) ? 30 : days);
    return NextResponse.json({ keywords });
  } catch (error: any) {
    console.error("Discover keywords route error:", error);
    return NextResponse.json({ error: error.message || "Failed to discover keywords" }, { status: 500 });
  }
}
