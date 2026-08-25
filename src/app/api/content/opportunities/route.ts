import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { scanContentOpportunities } from "@/services/contentService";

export async function GET(req: NextRequest) {
  try {
    try {
      await getAuthenticatedUser(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const propertyIdStr = searchParams.get("propertyId");

    if (!propertyIdStr || isNaN(parseInt(propertyIdStr, 10))) {
      return NextResponse.json({ error: "Invalid property ID" }, { status: 400 });
    }

    const propertyId = parseInt(propertyIdStr, 10);
    const opportunities = await scanContentOpportunities(propertyId);

    return NextResponse.json({ opportunities });
  } catch (error: any) {
    console.error("Content Opportunities API Error:", error);
    return NextResponse.json({ error: "Failed to load content opportunities" }, { status: 500 });
  }
}
