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

    if (!propertyIdStr || propertyIdStr === "invalid") {
      return NextResponse.json({ error: "Website Property ID is required." }, { status: 400 });
    }

    const days = parseInt(daysStr, 10);

    const keywords = await discoverKeywords(propertyIdStr, isNaN(days) ? 30 : days);
    return NextResponse.json({ keywords });
  } catch (error: unknown) {
    const errObj = error as Error;
    console.error("Discover keywords route error:", error);
    return NextResponse.json({ error: errObj?.message || "Failed to discover keywords" }, { status: 500 });
  }
}
