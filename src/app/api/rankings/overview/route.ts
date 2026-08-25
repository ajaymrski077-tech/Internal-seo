import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getRankingsOverview } from "@/services/rankingsService";

export async function GET(req: NextRequest) {
  try {
    try {
      await getAuthenticatedUser(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clientIdStr = searchParams.get("clientId");
    const propertyIdStr = searchParams.get("propertyId");
    const daysRangeStr = searchParams.get("days") || "30";

    const clientId = clientIdStr && clientIdStr !== "All" ? clientIdStr : undefined;
    const propertyId = propertyIdStr && propertyIdStr !== "All" ? propertyIdStr : undefined;
    const daysRange = parseInt(daysRangeStr, 10);

    const overview = await getRankingsOverview(clientId, propertyId, isNaN(daysRange) ? 30 : daysRange);
    return NextResponse.json(overview);
  } catch (error: any) {
    console.error("Rankings overview load error:", error);
    return NextResponse.json({ error: "Failed to load rankings overview" }, { status: 500 });
  }
}
