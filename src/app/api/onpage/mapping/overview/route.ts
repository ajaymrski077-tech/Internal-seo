import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    try {
      await getAuthenticatedUser(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const clients = await prisma.client.findMany({
      include: {
        properties: {
          include: {
            connections: { where: { provider: "GSC" } },
            trackedKeywords: true
          }
        }
      },
      orderBy: { name: "asc" }
    });

    const formattedClients = clients.map((client) => {
      const primaryProperty = client.properties?.[0];
      const gscConn = primaryProperty?.connections?.find(c => c.status === "CONNECTED");
      const keywordsCount = primaryProperty?.trackedKeywords?.length || 0;
      
      const isGscConnected = !!gscConn;
      const clustersCount = keywordsCount > 0 ? Math.ceil(keywordsCount / 3) : 0;
      const isMapped = clustersCount > 0;

      return {
        id: client.id,
        name: client.name,
        domain: primaryProperty?.domain || `https://${client.name.toLowerCase().replace(/\s+/g, "")}.com`,
        propertyId: primaryProperty?.id || null,
        isGscConnected,
        isMapped,
        clustersCount,
        lastRun: isMapped ? "7/20/2026" : null
      };
    });

    return NextResponse.json({ clients: formattedClients });
  } catch (error: unknown) {
    console.error("Keyword Mapping Overview Error:", error);
    return NextResponse.json({ error: "Failed to load keyword mapping overview" }, { status: 500 });
  }
}
