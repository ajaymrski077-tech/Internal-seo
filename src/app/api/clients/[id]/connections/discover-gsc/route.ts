import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";
import { listGscSites } from "@/services/googleApiService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    try {
      await getAuthenticatedUser(req);
    } catch {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { id } = await params;
    const clientId = parseInt(id, 10);
    if (isNaN(clientId)) {
      return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
    }

    const property = await prisma.websiteProperty.findFirst({
      where: { clientId },
    });

    if (!property) {
      return NextResponse.json({ sites: [], error: "No property configured" });
    }

    const connection = await prisma.integrationConnection.findFirst({
      where: { propertyId: property.id, provider: "GSC" },
    });

    if (!connection) {
      return NextResponse.json({ sites: [], error: "GSC not connected" });
    }

    const sites = await listGscSites(connection.id);
    return NextResponse.json({ sites });
  } catch (error: any) {
    console.error("Discover GSC Sites Error:", error);
    return NextResponse.json(
      { sites: [], error: error.message || "Failed to list GSC sites" },
      { status: 500 }
    );
  }
}
