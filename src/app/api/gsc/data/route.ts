import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";
import { getGscClient, getDecryptedCredentials } from "@/services/googleApiService";

export async function GET(req: NextRequest) {
  try {
    try {
      await getAuthenticatedUser(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const propertyIdStr = searchParams.get("propertyId");
    
    if (!propertyIdStr || propertyIdStr === "invalid") {
      return NextResponse.json({ error: "Missing propertyId parameter" }, { status: 400 });
    }

    // Fetch the property and its GSC connection
    const property = await prisma.websiteProperty.findUnique({
      where: { id: propertyIdStr },
      include: {
        connections: {
          where: { provider: "GSC", status: "CONNECTED" }
        }
      }
    });

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const gscConn = property.connections[0];
    if (!gscConn || !gscConn.externalId) {
      return NextResponse.json({ error: "Google Search Console is not connected for this property." }, { status: 400 });
    }

    // Set up date range (Last 30 Days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);
    
    const startStr = startDate.toISOString().split("T")[0];
    const endStr = endDate.toISOString().split("T")[0];

    try {
      const { accessToken, refreshToken } = await getDecryptedCredentials(gscConn.id);
      if (!accessToken) {
        return NextResponse.json({ error: "GSC credentials not found." }, { status: 400 });
      }
      const gscClient = getGscClient(gscConn.id, accessToken, refreshToken || undefined);
      
      const response = await gscClient.searchanalytics.query({
        siteUrl: gscConn.externalId,
        requestBody: {
          startDate: startStr,
          endDate: endStr,
          dimensions: ["query"],
          rowLimit: 100, // Hard limit to ensure speed for UI
        }
      });

      const rows = response.data.rows || [];
      const data = rows.map((row) => ({
        query: row.keys?.[0] || "Unknown",
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: (row.ctr || 0) * 100, // Convert to percentage
        position: row.position || 0,
      }));

      return NextResponse.json({ data });
    } catch (apiError: unknown) {
      console.error("GSC API Fetch Error:", apiError);
      return NextResponse.json({ error: "Failed to fetch data from Google Search Console. Check permissions." }, { status: 502 });
    }
  } catch (error: unknown) {
    const errObj = error as Error;
    console.error("GSC Route Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
