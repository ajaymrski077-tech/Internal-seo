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

    const clientId = clientIdStr ? parseInt(clientIdStr, 10) : undefined;
    const propertyId = propertyIdStr ? parseInt(propertyIdStr, 10) : undefined;
    const daysRange = parseInt(daysRangeStr, 10);

    if (clientIdStr && isNaN(clientId!)) {
      return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
    }
    if (propertyIdStr && isNaN(propertyId!)) {
      return NextResponse.json({ error: "Invalid property ID" }, { status: 400 });
    }

    const overview = await getRankingsOverview(clientId, propertyId, isNaN(daysRange) ? 30 : daysRange);
    return NextResponse.json(overview);
  } catch (error: any) {
    console.error("Rankings overview load error:", error);
    return NextResponse.json({ error: "Failed to load rankings overview" }, { status: 500 });
  }
}
