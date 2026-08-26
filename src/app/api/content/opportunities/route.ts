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
    const propertyId = searchParams.get("propertyId");

    if (!propertyId || propertyId.trim() === "") {
      return NextResponse.json({ error: "Invalid property ID" }, { status: 400 });
    }

    const opportunities = await scanContentOpportunities(propertyId);

    return NextResponse.json({ opportunities });
  } catch (error: unknown) {
    const errObj = error as Error;
    console.error("Content Opportunities API Error:", error);
    return NextResponse.json({ error: "Failed to load content opportunities" }, { status: 500 });
  }
}
