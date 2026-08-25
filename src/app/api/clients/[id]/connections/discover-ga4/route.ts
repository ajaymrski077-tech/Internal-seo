import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";
import { listGa4Properties } from "@/services/googleApiService";

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
      return NextResponse.json({ properties: [], error: "No property configured" });
    }

    const connection = await prisma.integrationConnection.findFirst({
      where: { propertyId: property.id, provider: "GA4" },
    });

    if (!connection) {
      return NextResponse.json({ properties: [], error: "GA4 not connected" });
    }

    const properties = await listGa4Properties(connection.id);
    return NextResponse.json({ properties });
  } catch (error: any) {
    console.error("Discover GA4 Properties Error:", error);
    return NextResponse.json(
      { properties: [], error: error.message || "Failed to list GA4 properties" },
      { status: 500 }
    );
  }
}
